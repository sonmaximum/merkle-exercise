import { computeMerkleRoot, computeMerkleProof, taggedHash, verifyMerkleProof } from '../src/merkle';

describe('Merkle Tree Implementation', () => {
    describe('taggedHash function', () => {
        it('produces correct output of hex hash', () => {
            const tag = 'TestTag';
            const message = Buffer.from('TestMessage');
            const result = taggedHash(tag, message);
            expect(result.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('produces consistent hashes for same input', () => {
            const tag = 'TestTag';
            const message = Buffer.from('TestMessage');
            const result1 = taggedHash(tag, message);
            const result2 = taggedHash(tag, message);
            expect(result1).toEqual(result2);
        });

        it('produces different hashes for different tags', () => {
            const message = Buffer.from('TestMessage');
            const result1 = taggedHash('Tag1', message);
            const result2 = taggedHash('Tag2', message);
            expect(result1).not.toEqual(result2);
        });

        it('handles empty message', () => {
            const tag = 'TestTag';
            const message = Buffer.from('');
            const result = taggedHash(tag, message);
            expect(result.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('handles large messages', () => {
            const tag = 'TestTag';
            const message = Buffer.from('x'.repeat(10000));
            const result = taggedHash(tag, message);
            expect(result.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('computeMerkleRoot function', () => {
        it('returns zero hash for empty data', () => {
            const root = computeMerkleRoot([], 'LeafTag', 'BranchTag');
            expect(root).toEqual(Buffer.alloc(32, 0));
            expect(root.toString('hex')).toBe('0'.repeat(64));
        });

        it('returns tagged hash for single item', () => {
            const data = [Buffer.from('SingleItem')];
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            const expectedHash = taggedHash('LeafTag', data[0]);
            expect(root).toEqual(expectedHash);
        });

        it('computes correct root for sample data', () => {
            const data = ['aaa', 'bbb', 'ccc', 'ddd', 'eee'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'Bitcoin_Transaction', 'Bitcoin_Transaction');
            expect(root.toString('hex')).toBe('4aa906745f72053498ecc74f79813370a4fe04f85e09421df2d5ef760dfa94b5');
        });

        it('handles odd number of items', () => {
            const data = ['aaa', 'bbb', 'ccc'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('produces consistent roots for same input', () => {
            const data = ['aaa', 'bbb', 'ccc', 'ddd'].map(item => Buffer.from(item));
            const root1 = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            const root2 = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root1).toEqual(root2);
        });

        it('produces different roots for different leaf tags', () => {
            const data = ['aaa', 'bbb'].map(item => Buffer.from(item));
            const root1 = computeMerkleRoot(data, 'Tag1', 'BranchTag');
            const root2 = computeMerkleRoot(data, 'Tag2', 'BranchTag');
            expect(root1).not.toEqual(root2);
        });

        it('produces different roots for different branch tags', () => {
            const data = ['aaa', 'bbb'].map(item => Buffer.from(item));
            const root1 = computeMerkleRoot(data, 'LeafTag', 'Tag1');
            const root2 = computeMerkleRoot(data, 'LeafTag', 'Tag2');
            expect(root1).not.toEqual(root2);
        });

        it('handles large number of items', () => {
            const data = Array(1000).fill(null).map((_, i) => Buffer.from(`item${i}`));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('maintains tree structure for different item counts', () => {
            const testCases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            testCases.forEach(count => {
                const data = Array(count).fill(null).map((_, i) => Buffer.from(`item${i}`));
                const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
                expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
            });
        });

        it('handles duplicate items', () => {
            const data = ['aaa', 'aaa', 'aaa'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('handles items with same hash', () => {
            const data = ['aaa', 'bbb', 'aaa'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });

        it('handles items with different lengths', () => {
            const data = ['a', 'bb', 'ccc', 'dddd'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            expect(root.toString('hex')).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('computeMerkleProof function', () => {
        it('returns empty array for invalid inputs', () => {
            const data = ['aaa', 'bbb', 'ccc'].map(item => Buffer.from(item));
            expect(computeMerkleProof(data, -1, 'LeafTag', 'BranchTag')).toEqual([]);
            expect(computeMerkleProof(data, 3, 'LeafTag', 'BranchTag')).toEqual([]);
            expect(computeMerkleProof([], 0, 'LeafTag', 'BranchTag')).toEqual([]);
        });

        it('returns empty array for single item', () => {
            const data = [Buffer.from('SingleItem')];
            const proof = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            expect(proof).toEqual([]);
        });

        it('generates correct proof for two items', () => {
            const data = ['aaa', 'bbb'].map(item => Buffer.from(item));
            const proof = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            expect(proof).toHaveLength(1);
            expect(proof[0].position).toBe(1); // Right sibling
            expect(proof[0].hash).toEqual(taggedHash('LeafTag', Buffer.from('bbb')));
        });

        it('generates correct proof for three items', () => {
            const data = ['aaa', 'bbb', 'ccc'].map(item => Buffer.from(item));
            const proof = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            expect(proof).toHaveLength(2);

            // First level: right sibling
            expect(proof[0].position).toBe(1);
            expect(proof[0].hash).toEqual(taggedHash('LeafTag', Buffer.from('bbb')));

            // Second level: right sibling (hash of 'ccc')
            expect(proof[1].position).toBe(1);
            const h_ccc = taggedHash('LeafTag', Buffer.from('ccc'));
            const branch_right = taggedHash('BranchTag', Buffer.concat([h_ccc, h_ccc]));
            expect(proof[1].hash).toEqual(branch_right);
        });

        it('generates consistent proofs for same input', () => {
            const data = ['aaa', 'bbb', 'ccc', 'ddd'].map(item => Buffer.from(item));
            const proof1 = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            const proof2 = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            expect(proof1).toEqual(proof2);
        });

        it('generates different proofs for different positions', () => {
            const data = ['aaa', 'bbb', 'ccc', 'ddd'].map(item => Buffer.from(item));
            const proof1 = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');
            const proof2 = computeMerkleProof(data, 1, 'LeafTag', 'BranchTag');
            expect(proof1).not.toEqual(proof2);
        });

        it('verifies proof against root', () => {
            const data = ['aaa', 'bbb', 'ccc', 'ddd'].map(item => Buffer.from(item));
            const root = computeMerkleRoot(data, 'LeafTag', 'BranchTag');
            const proof = computeMerkleProof(data, 0, 'LeafTag', 'BranchTag');

            // Verify the proof by reconstructing the root
            let currentHash = taggedHash('LeafTag', data[0]);
            for (const node of proof) {
                const [left, right] = node.position === 0
                    ? [node.hash, currentHash]
                    : [currentHash, node.hash];
                currentHash = taggedHash('BranchTag', Buffer.concat([left, right]));
            }

            expect(currentHash).toEqual(root);
        });
    });
});

describe('Merkle proof verification from API response', () => {
  it('verifies the proof for user 1 against the returned Merkle root', () => {
    const apiProof: [string, number][] = [
      ["04bd4a356d675cc13ea5b0fc83e0736a3fbf3067980de9e8e0553c934f5906b8", 1],
      ["d185af244042b0fecba7ee16c9933d73b10c5482104538274dd777b6b120eae1", 1],
      ["9d7f79fa8e788d4a32c9c674b67dcfaf0885f539ac2699129e3c4d88c11c76e7", 1]
    ];

    const expectedMerkleRoot = "b1231de33da17c23cebd80c104b88198e0914b0463d0e14db163605b904a7ba3";

    const proof = apiProof.map(([hashHex, position]) => ({
      hash: Buffer.from(hashHex, 'hex'),
      position
    }));

    const serializedUser = Buffer.from("(1,1111)", 'utf8');
    const result = verifyMerkleProof(
      serializedUser,
      proof,
      "ProofOfReserve_Leaf",
      "ProofOfReserve_Branch"
    );

    expect(result.toString('hex')).toBe(expectedMerkleRoot);
  });
});
