import { taggedHash } from './hasher';

export function computeMerkleRoot(
    data: Buffer[],
    leafTag: string,
    branchTag: string
): Buffer {
    if (data.length === 0) return Buffer.alloc(32);

    let level = data.map(item => taggedHash(leafTag, item));

    while (level.length > 1) {
        const nextLevel: Buffer[] = [];

        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            const right = i + 1 < level.length ? level[i + 1] : left;
            nextLevel.push(taggedHash(branchTag, Buffer.concat([left, right])));
        }

        level = nextLevel;
    }

    return level[0];
}

export function computeMerkleProof(
    data: Buffer[],
    leafIndex: number,
    leafTag: string,
    branchTag: string
): { hash: Buffer; position: number }[] {
    if (data.length === 0 || leafIndex < 0 || leafIndex >= data.length) return [];

    let level = data.map(item => taggedHash(leafTag, item));
    let index = leafIndex;
    const proof: { hash: Buffer; position: number }[] = [];

    while (level.length > 1) {
        const isRightNode = index % 2 === 1;
        const siblingIndex = isRightNode ? index - 1 : index + 1;

        if (siblingIndex < level.length) {
            proof.push({
                hash: level[siblingIndex],
                position: isRightNode ? 0 : 1 // 0 = sibling on left, 1 = right
            });
        }

        const nextLevel: Buffer[] = [];
        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            const right = i + 1 < level.length ? level[i + 1] : left;
            nextLevel.push(taggedHash(branchTag, Buffer.concat([left, right])));
        }

        level = nextLevel;
        index = Math.floor(index / 2);
    }

    return proof;
}


export function verifyMerkleProof(
  leaf: Buffer,
  proof: { hash: Buffer; position: number }[],
  leafTag: string,
  branchTag: string
): Buffer {
  let currentHash = taggedHash(leafTag, leaf);

  for (const { hash, position } of proof) {
    const [left, right] = position === 0
      ? [hash, currentHash]
      : [currentHash, hash];

    const combined = Buffer.concat([left, right]);
    currentHash = taggedHash(branchTag, combined);
  }

  return currentHash;
}
