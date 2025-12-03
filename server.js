import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
// Use the port Northflank provides, or 3000
const PORT = process.env.PORT || 3000;

// Setup for "type": "module"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Basic API route to test connection
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running in Safe Mode' });
});

// Serve the React Frontend
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    // Fallback if build failed
    app.get('*', (req, res) => res.send('<h1>It Works!</h1><p>Backend is online. Frontend not found.</p>'));
}

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Simple Server running on port ${PORT}`);
});