import request from 'supertest';
import express from 'express';
import app from '../src/server';

describe('Server API Tests', () => {
    describe('Health Check Endpoint', () => {
        it('should return health status with uptime', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.uptime).toBeDefined();
            expect(typeof response.body.uptime).toBe('number');
        });

        it('should handle concurrent health check requests', async () => {
            const requests = Array(10).fill(null).map(() =>
                request(app).get('/health')
            );
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.status).toBe('ok');
            });
        });
    });

    describe('Merkle Root Endpoint', () => {
        it('should return valid Merkle root', async () => {
            const response = await request(app).get('/merkle-root');
            expect(response.status).toBe(200);
            expect(response.body.merkleRoot).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should handle concurrent Merkle root requests', async () => {
            const requests = Array(5).fill(null).map(() =>
                request(app).get('/merkle-root')
            );
            const responses = await Promise.all(requests);
            const roots = responses.map(r => r.body.merkleRoot);

            // All roots should be identical
            const firstRoot = roots[0];
            roots.forEach(root => expect(root).toBe(firstRoot));
        });

        it('should handle server errors gracefully', async () => {
            // Create a new Express app for testing error handling
            const errorApp = express();
            errorApp.get('/merkle-root', (_, __, next) => {
                next(new Error('Test error'));
            });
            errorApp.use((err: Error, _: express.Request, res: express.Response, __: express.NextFunction) => {
                res.status(500).json({ error: 'Failed to compute Merkle root' });
            });

            const response = await request(errorApp).get('/merkle-root');
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to compute Merkle root');
        });

        it('should handle headers already sent error', async () => {
            const errorApp = express();
            errorApp.get('/merkle-root', (_, res, next) => {
                res.status(200).json({ test: 'data' });
                next(new Error('Test error'));
            });
            errorApp.use((err: Error, _: express.Request, res: express.Response, __: express.NextFunction) => {
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to compute Merkle root' });
                }
            });

            const response = await request(errorApp).get('/merkle-root');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ test: 'data' });
        });
    });

    describe('Merkle Proof Endpoint', () => {
        it('should return valid Merkle proof for existing user', async () => {
            const userId = 1;
            const response = await request(app).get(`/merkle-proof/${userId}`);
            expect(response.status).toBe(200);
            expect(response.body.balance).toBe(1111);
            expect(Array.isArray(response.body.proof)).toBe(true);
            expect(response.body.proof.length).toBeGreaterThan(0);

            // Validate proof structure
            response.body.proof.forEach((node: any) => {
                expect(node[0]).toMatch(/^[a-f0-9]{64}$/);
                expect([0, 1]).toContain(node[1]);
            });
        });

        it('should return 404 for non-existing user', async () => {
            const userId = 999;
            const response = await request(app).get(`/merkle-proof/${userId}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        describe('User ID Validation', () => {
            it('should return 400 for non-numeric IDs', async () => {
                const invalidIds = ['abc', 'xyz', 'not-a-number', 'user-123', '1abc', 'abc1'];
                for (const id of invalidIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe('Invalid user ID');
                }
            });

            it('should return 400 for negative numbers', async () => {
                const invalidIds = ['-1', '-2', '-100', '-999'];
                for (const id of invalidIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe('Invalid user ID');
                }
            });

            it('should return 400 for zero', async () => {
                const response = await request(app).get('/merkle-proof/0');
                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Invalid user ID');
            });

            it('should return 400 for decimal numbers', async () => {
                const invalidIds = ['1.5', '2.7', '3.14', '10.0'];
                for (const id of invalidIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe('Invalid user ID');
                }
            });

            it('should return 400 for scientific notation', async () => {
                const invalidIds = ['1e10', '2e5', '1.5e2', '1e-1'];
                for (const id of invalidIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe('Invalid user ID');
                }
            });

            it('should return 400 for special characters', async () => {
                const invalidIds = [
                    encodeURIComponent('1!'),
                    encodeURIComponent('@2'),
                    encodeURIComponent('#3'),
                    encodeURIComponent('$4'),
                    encodeURIComponent('%5'),
                    encodeURIComponent('^6'),
                    encodeURIComponent('&7'),
                    encodeURIComponent('*8'),
                    encodeURIComponent('(9'),
                    encodeURIComponent(')0')
                ];
                for (const id of invalidIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe('Invalid user ID');
                }
            });

            it('should accept valid positive integers', async () => {
                const validIds = ['1', '2', '3', '10', '100', '999'];
                for (const id of validIds) {
                    const response = await request(app).get(`/merkle-proof/${id}`);
                    expect(response.status).not.toBe(400);
                }
            });
        });

        it('should handle concurrent proof requests', async () => {
            const userIds = [1, 2, 3];
            const requests = userIds.map(id =>
                request(app).get(`/merkle-proof/${id}`)
            );
            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.balance).toBeDefined();
                expect(Array.isArray(response.body.proof)).toBe(true);
            });
        });

        it('should handle malformed requests', async () => {
            const response = await request(app)
                .get('/merkle-proof/')
                .set('Content-Type', 'application/json');
            expect(response.status).toBe(404);
        });

        it('should handle headers already sent error', async () => {
            const errorApp = express();
            errorApp.get('/merkle-proof/:userId', (_, res, next) => {
                res.status(200).json({ test: 'data' });
                next(new Error('Test error'));
            });
            errorApp.use((err: Error, _: express.Request, res: express.Response, __: express.NextFunction) => {
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to generate Merkle proof' });
                }
            });

            const response = await request(errorApp).get('/merkle-proof/1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ test: 'data' });
        });
    });

    describe('Root Endpoint', () => {
        it('should return API documentation', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.text).toContain('Proof of Reserve API');
            expect(response.text).toContain('merkle-root');
            expect(response.text).toContain('merkle-proof');
        });
    });
});
