import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath, URL } from 'url'; // Added URL import
import fs from 'fs';
import axios from 'axios';
import compression from 'compression'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- HANDLE __dirname IN ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARE ---
app.use(cors());
app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 

// --- ROBUST DATABASE CONNECTION ---
const connectToDatabase = () => {
    const dbUrlString = process.env.DATABASE_URL;
    
    if (!dbUrlString) {
        console.warn("⚠️  WARNING: DATABASE_URL is missing! App will start but DB features will fail.");
        return mysql.createPool({ host: 'localhost', user: 'root', database: 'test' }); // Dummy pool to prevent crash
    }

    try {
        // Manually parse the URL to ensure Port and Host are correct
        const dbUrl = new URL(dbUrlString);
        
        console.log(`🔌 Connecting to DB Host: ${dbUrl.hostname}`);
        
        return mysql.createPool({
            host: dbUrl.hostname,
            user: dbUrl.username,
            password: dbUrl.password,
            database: dbUrl.pathname.split('/')[1], // Removes the leading '/'
            port: dbUrl.port || 3306,
            ssl: {
                rejectUnauthorized: false // CRITICAL for Aiven/Northflank to work
            },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    } catch (error) {
        console.error("❌ Failed to parse DATABASE_URL:", error.message);
        return mysql.createPool({}); // Return empty pool to allow server start
    }
};

const pool = connectToDatabase();

// --- TEST CONNECTION ON START ---
const testDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
        connection.release();
        // Optional: Fix schema
        try { await connection.query("ALTER TABLE gallery MODIFY url LONGTEXT"); } catch(e) {}
    } catch (err) {
        console.error('❌ DATABASE CONNECTION FAILED:', err.message);
        // We do NOT exit process here, so the website still loads (even if DB is down)
    }
};
testDbConnection();


// --- API ROUTES ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        res.json(rows.length > 0 ? JSON.parse(rows[0].value) : {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ... (Keep your other API routes for rooms, drivers, etc. here) ...
// For brevity, I am not pasting all 200 lines, but YOU SHOULD KEEP THEM.
// Just ensure the 'pool' variable is created using the block above.


// --- SERVING FRONTEND (CATCH-ALL) ---
app.use('/api/*', (req, res) => res.status(404).json({ error: `API endpoint not found` }));

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    console.warn('⚠️ WARNING: "dist" folder not found.');
    app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend loading...</p>'));
}

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
