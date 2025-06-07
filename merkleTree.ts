import {createHash} from 'crypto';

function taggedHash(tag: string, message: Buffer): Buffer {
    const tagHash = createHash('sha256')
        .update(tag)
        .digest();
    const hash = createHash('sha256');
    hash.update(tagHash);
    hash.update(tagHash);
    hash.update(message);
    return hash.digest();
}

function serializeData(data: string[]): Buffer[] {
    return data.map(item => Buffer.from(item, 'utf8'));
}

export function computeMerkleRoot(
    data: string[],
    leafTag: string,
    branchTag: string
): string {
    if (data.length === 0) {
        return Buffer.alloc(32).toString('hex');
    }

    let leaves = serializeData(data).map(item => taggedHash(leafTag, item));

    while (leaves.length > 1) {
        const newLeaves: Buffer[] = [];

        for (let i = 0; i < leaves.length; i += 2) {
            const left = leaves[i];
            const right = i + 1 < leaves.length ? leaves[i + 1] : left;
            const combined = Buffer.concat([left, right]);
            newLeaves.push(taggedHash(branchTag, combined));
        }

        leaves = newLeaves;
    }

    return leaves[0].toString('hex');
}

// Example usage
if (require.main === module) {
    const data = ['aaa', 'bbb', 'ccc', 'ddd', 'eee'];
    const leafTag = 'Bitcoin_Transaction';
    const branchTag = 'Bitcoin_Transaction';
    const root = computeMerkleRoot(data, leafTag, branchTag);
    console.log('Merkle Root:', root);
}
