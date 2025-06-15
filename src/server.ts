import express from 'express';
import {
    computeReserveRoot,
    generateReserveProof,
    // getAllUsers,
} from './proof-of-reserve';
import { uptime } from 'process';


const app = express();
const PORT = process.env.PORT || 3000;


app.get('/health', (_, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// app.get('/users', (_, res) => {
//     try {
//         res.json(getAllUsers());
//     } catch (error) {
//         console.error('Error fetching users:', error);
//         res.status(500).json({ error: 'Failed to fetch users' });
//     }
// });


app.get('/merkle-root', async (_, res) => {
    try {
        const root = await computeReserveRoot();
        res.json({ merkleRoot: root });
    } catch (error) {
        console.error('Error computing Merkle root:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to compute Merkle root' });
        }
    }
});

app.get('/merkle-proof/:userId', async (req, res) => {
    // Strict validation: must be a string of digits only
    if (!/^\d+$/.test(req.params.userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
    }

    const userId = parseInt(req.params.userId, 10);

    // Additional validation for positive numbers
    if (userId <= 0) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
    }

    try {
        const proof = await generateReserveProof(userId);
        if (!proof) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(proof);
    } catch (error) {
        console.error('Error generating Merkle proof:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate Merkle proof' });
        }
    }
});


app.get('/', (_, res) => {
    res.send('Proof of Reserve API is running. Use /merkle-root to get the Merkle root or /merkle-proof/:userId to get the proof for a specific user.');
});


// Start the server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Proof of Reserve API server started on http://localhost:${PORT}`);
    });
}

export default app;

