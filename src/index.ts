
import app from './server';

console.log('Starting Proof of Reserve API server...');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Proof of Reserve API server started on http://localhost:${PORT}`);
});
