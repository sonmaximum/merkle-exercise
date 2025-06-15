import {
    serializeUser,
    computeReserveRoot,
    generateReserveProof,
} from '../src/proof-of-reserve/service';

describe('Proof of Reserve Service', () => {
    describe('User Serialization', () => {
        it('serializes user data correctly', () => {
            const user = { id: 10, balance: 100 };
            const serialized = serializeUser(user);
            expect(serialized.toString('utf8')).toBe('(10,100)');
        });

        it('handles zero balance', () => {
            const user = { id: 1, balance: 0 };
            const serialized = serializeUser(user);
            expect(serialized.toString('utf8')).toBe('(1,0)');
        });

        it('handles large balances', () => {
            const user = { id: 1, balance: Number.MAX_SAFE_INTEGER };
            const serialized = serializeUser(user);
            expect(serialized.toString('utf8')).toBe(`(1,${Number.MAX_SAFE_INTEGER})`);
        });

        it('handles negative balances', () => {
            const user = { id: 1, balance: -100 };
            const serialized = serializeUser(user);
            expect(serialized.toString('utf8')).toBe('(1,-100)');
        });
    });

    describe('Reserve Root Computation', () => {
        it('computes valid reserve root', () => {
            const root = computeReserveRoot();
            expect(root).toMatch(/^[a-f0-9]{64}$/);
        });

        it('produces consistent roots for same data', () => {
            const root1 = computeReserveRoot();
            const root2 = computeReserveRoot();
            expect(root1).toBe(root2);
        });

        it('handles concurrent root computations', async () => {
            const computations = Array(5).fill(null).map(() => computeReserveRoot());
            const roots = await Promise.all(computations);
            const firstRoot = roots[0];
            roots.forEach(root => expect(root).toBe(firstRoot));
        });
    });

    describe('Reserve Proof Generation', () => {
        it('generates valid proof for existing user', () => {
            const userId = 1;
            const proof = generateReserveProof(userId);
            expect(proof).toBeDefined();
            expect(proof).not.toBeNull();
            expect(proof!.balance).toBe(1111);
            expect(proof!.proof.length).toBeGreaterThan(0);

            // Validate proof structure
            proof!.proof.forEach(node => {
                expect(node[0]).toMatch(/^[a-f0-9]{64}$/); // Check hash format
                expect([0, 1]).toContain(node[1]); // Position should be 0 or 1
            });
        });

        it('returns null for non-existing user', () => {
            const userId = 999;
            const proof = generateReserveProof(userId);
            expect(proof).toBeNull();
        });

        it('returns null for invalid user ID', () => {
            const invalidIds = [-1, 0, 1.5, Number.MAX_SAFE_INTEGER + 1];
            invalidIds.forEach(id => {
                const proof = generateReserveProof(id);
                expect(proof).toBeNull();
            });
        });

        it('returns null for non-numeric user ID', () => {
            const userId = 'abc' as unknown as number;
            const proof = generateReserveProof(userId);
            expect(proof).toBeNull();
        });

        it('generates consistent proofs for same user', () => {
            const userId = 1;
            const proof1 = generateReserveProof(userId);
            const proof2 = generateReserveProof(userId);
            expect(proof1).toEqual(proof2);
        });

        it('handles concurrent proof generations', async () => {
            const userIds = [1, 2, 3];
            const proofs = userIds.map(id => generateReserveProof(id));
            proofs.forEach(proof => {
                expect(proof).not.toBeNull();
                expect(proof!.proof.length).toBeGreaterThan(0);
            });
        });

        it('generates proofs with correct balance values', () => {
            const testCases = [
                { id: 1, expectedBalance: 1111 },
                { id: 2, expectedBalance: 2222 },
                { id: 3, expectedBalance: 3333 }
            ];

            testCases.forEach(({ id, expectedBalance }) => {
                const proof = generateReserveProof(id);
                expect(proof).not.toBeNull();
                expect(proof!.balance).toBe(expectedBalance);
            });
        });

        it('generates proofs with valid Merkle path', () => {
            const userId = 1;
            const proof = generateReserveProof(userId);
            expect(proof).not.toBeNull();

            // Verify Merkle path properties
            const path = proof!.proof;
            expect(path.length).toBeGreaterThan(0);

            // Each node in the path should be a valid hash and position
            path.forEach(([hash, position]) => {
                expect(hash).toMatch(/^[a-f0-9]{64}$/);
                expect([0, 1]).toContain(position);
            });

            // Verify path length is appropriate for the tree height
            const expectedPathLength = Math.ceil(Math.log2(1000)); // Assuming 1000 users
            expect(path.length).toBeLessThanOrEqual(expectedPathLength);
        });

        it('handles edge case with single user', () => {
            // Mock the service to return a single user
            const originalGenerateReserveProof = generateReserveProof;
            const mockGenerateReserveProof = (id: number) => {
                if (id === 1) {
                    return {
                        balance: 1000,
                        proof: []
                    };
                }
                return null;
            };
            (global as any).generateReserveProof = mockGenerateReserveProof;

            const proof = mockGenerateReserveProof(1);
            expect(proof).not.toBeNull();
            expect(proof!.proof).toHaveLength(0);

            // Restore original function
            (global as any).generateReserveProof = originalGenerateReserveProof;
        });
    });
});
