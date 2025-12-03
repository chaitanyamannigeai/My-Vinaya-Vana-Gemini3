import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- MINIMAL SERVER SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Simple Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bare Bones Server is ONLINE!' });
});

// 2. Serve the Website (Frontend)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log("📂 Serving website from 'dist' folder...");
    app.use(express.static(distPath));
    
    // Catch-All Route (For React)
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Fallback if the build failed
    console.log("⚠️ 'dist' folder missing.");
    app.get('*', (req, res) => {
        res.send('<h1>It Works!</h1><p>The server is running perfectly.</p>');
    });
}

// 3. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});