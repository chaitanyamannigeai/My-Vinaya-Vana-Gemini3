import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';
import compression from 'compression'; 
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Northflank provides the port automatically
const PORT = process.env.PORT || 3000;

// Setup for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 

// --- THE SAFETY AIRBAG (Database Connection) ---
// This function tries to connect, but if it fails, it returns NULL instead of crashing.
const createSafePool = () => {
    const dbUrlString = process.env.DATABASE_URL;
    
    if (!dbUrlString) {
        console.warn("⚠️  WARNING: DATABASE_URL is missing. Server starting in Offline Mode.");
        return null; 
    }

    try {
        // We manually break down the URL to make sure Aiven accepts it
        const dbUrl = new URL(dbUrlString);
        console.log(`🔌 Attempting to connect to host: ${dbUrl.hostname}`);
        
        return mysql.createPool({
            host: dbUrl.hostname,
            user: dbUrl.username,
            password: dbUrl.password,
            database: dbUrl.pathname.split('/')[1],
            port: dbUrl.port || 3306,
            ssl: { rejectUnauthorized: false }, // REQUIRED for Aiven to work
            waitForConnections: true,
            connectionLimit: 5,
            connectTimeout: 10000 // Give up after 10 seconds
        });
    } catch (error) {
        console.error("❌ CRITICAL ERROR: Could not read the Database URL.");
        console.error(error.message);
        return null; // Don't crash!
    }
};

const pool = createSafePool();

// --- TEST THE CONNECTION (Quietly) ---
if (pool) {
    pool.getConnection()
        .then(conn => {
            console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
            conn.release();
        })
        .catch(err => {
            console.error("❌ DATABASE CONNECTION FAILED (But server is staying alive!)");
            console.error("Error details:", err.message);
        });
}

// --- API ROUTES ---
// 1. Health Check - Used by Northflank to see if we are alive
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is Online', 
        database: pool ? 'Attempting Connection' : 'Offline Mode' 
    });
});

// ... (You can keep your other API routes here if you want) ...

// --- SERVING THE FRONTEND WEBSITE ---
const distPath = path.join(__dirname, 'dist');

// Check if the website files exist
if (fs.existsSync(distPath)) {
    console.log("✅ Frontend 'dist' folder found. Serving website...");
    app.use(express.static(distPath));
    // This handles the "Catch-All" so your React pages load
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    console.warn("⚠️ 'dist' folder NOT found. Serving basic message.");
    // Fallback message if the build failed
    app.get('*', (req, res) => res.send('<h1>Backend is Running!</h1><p>But the frontend website files (dist folder) are missing.</p>'));
}

// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server is officially running on port ${PORT}`);
    console.log(`👉 The 'No Healthy Upstream' error should be GONE now.`);
});