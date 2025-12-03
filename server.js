import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 1. Setup minimal app
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Handle file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Simple Health Check (To prove it works)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bare Bones Server is ONLINE!' });
});

// 4. Serve the Frontend Website
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log("📂 Serving website from 'dist' folder...");
    app.use(express.static(distPath));
    // Catch-All Route for React
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Fallback if build failed
    console.log("⚠️ 'dist' folder missing.");
    app.get('*', (req, res) => {
        res.send('<h1>It Works!</h1><p>The server is running perfectly. (Frontend build files missing)</p>');
    });
}

// 5. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});