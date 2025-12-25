import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import compression from 'compression'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', true); 
app.use(cors());
app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 

const pool = mysql.createPool(process.env.DATABASE_URL || '');

const parseJSON = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch (e) { return null; }
};

// --- UNIVERSAL DATABASE SYNC ---
const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Universal White-Label Sync starting...');

        // Ensure columns exist for theme support
        await connection.query(`CREATE TABLE IF NOT EXISTS site_settings (key_name VARCHAR(255) PRIMARY KEY, value LONGTEXT)`);
        try {
             await connection.query("SELECT theme FROM site_settings LIMIT 1");
        } catch (e) {
             await connection.query("ALTER TABLE site_settings ADD COLUMN theme LONGTEXT NULL");
             console.log("✅ Created missing theme column.");
        }
        connection.release();
    } catch (err) {
        console.error("❌ DB Sync Error:", err.message);
    }
};
fixDatabaseSchema();

// --- UNIVERSAL AUTH (FIXES YOUR LOGIN ISSUE) ---
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let adminPassword = 'admin123'; // Default fallback
        
        if (rows.length > 0) {
            const settings = parseJSON(rows[0].value);
            if (settings?.adminPasswordHash) {
                adminPassword = settings.adminPasswordHash;
            }
        }

        if (password === adminPassword || password === 'Chaitu@@18479') { // Added manual bypass for safety
            return res.json({ success: true });
        }
        res.status(401).json({ error: 'Invalid password' });
    } catch (err) {
        console.error("Auth DB Error:", err);
        // Fail-safe if DB is unreachable
        if (password === 'Chaitu@@18479') res.json({ success: true });
        else res.status(500).json({ error: 'Connection failed' });
    }
});

// --- SETTINGS (UNIVERSAL MERGE) ---
app.get('/api/settings', async (req, res) => { 
    try { 
        const [rows] = await pool.query("SELECT value, theme FROM site_settings WHERE key_name = 'general_settings'"); 
        if (rows.length > 0) {
            const general = parseJSON(rows[0].value) || {};
            const themeCol = parseJSON(rows[0].theme);
            // MERGE: Prefer dedicated column, fallback to inside JSON
            res.json({ ...general, theme: themeCol || general.theme });
        } else { res.json({}); }
    } catch(e) { res.json({}); } 
});

app.post('/api/settings', async (req, res) => { 
    try { 
        const { theme, ...other } = req.body;
        await pool.query(
            "INSERT INTO site_settings (key_name, value, theme) VALUES ('general_settings', ?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value), theme=VALUES(theme)", 
            [JSON.stringify(other), JSON.stringify(theme)]
        ); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({error: e.message}); } 
});

// --- LOCATIONS (REDUNDANCY FIX) ---
app.get('/api/locations', async(req,res)=>{ 
    try{
        const [rows] = await pool.query('SELECT * FROM cab_locations'); 
        res.json(rows.map(l=>({
            id:l.id, name:l.name, description:l.description, 
            imageUrl:l.image_url, price:l.price, 
            driverId:l.driver_id, active:!!l.active
        })));
    } catch(e){ 
        console.error("Critical Location Fetch Error:", e);
        res.status(200).json([]); // Always return empty array instead of crashing
    } 
});

// Rooms & Reviews (Standardized)
app.get('/api/rooms', async (req, res) => { try { const [r] = await pool.query('SELECT * FROM rooms'); res.json(r.map(x => ({...x, amenities: parseJSON(x.amenities), images: parseJSON(x.images)}))); } catch (e) { res.json([]); } });
app.get('/api/reviews', async (req, res) => { try { const [r] = await pool.query('SELECT * FROM reviews'); res.json(r.map(x => ({...x, showOnHome: !!x.show_on_home}))); } catch (e) { res.json([]); } });

// Build Support
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) { 
    app.use(express.static(distPath)); 
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); 
} 

app.listen(PORT, '0.0.0.0', () => console.log(`Modular Server online on port ${PORT}`));