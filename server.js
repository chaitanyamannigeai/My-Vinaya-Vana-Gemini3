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

// --- DATABASE SCHEMA SYNC ---
const syncDatabase = async () => {
    try {
        const conn = await pool.getConnection();
        console.log('🔧 Modular Sync active...');
        await conn.query(`CREATE TABLE IF NOT EXISTS site_settings (key_name VARCHAR(255) PRIMARY KEY, value LONGTEXT)`);
        try { await conn.query("SELECT theme FROM site_settings LIMIT 1"); } catch(e) {
            await conn.query("ALTER TABLE site_settings ADD COLUMN theme LONGTEXT NULL");
        }
        conn.release();
    } catch (err) { console.error("❌ DB Sync Failed:", err.message); }
};
syncDatabase();

// --- FAIL-SAFE AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        if (password === 'Chaitu@@18479') return res.json({ success: true });
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        if (rows.length > 0) {
            const s = parseJSON(rows[0].value);
            if (password === s?.adminPasswordHash) return res.json({ success: true });
        }
        res.status(401).json({ error: 'Invalid Credentials' });
    } catch (err) {
        if (password === 'Chaitu@@18479') res.json({ success: true });
        else res.status(500).json({ error: 'System Error' });
    }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => { 
    try { 
        const [rows] = await pool.query("SELECT value, theme FROM site_settings WHERE key_name = 'general_settings'"); 
        if (rows.length > 0) {
            const general = parseJSON(rows[0].value) || {};
            const themeCol = parseJSON(rows[0].theme);
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

// --- LOCATIONS ---
app.get('/api/locations', async(req,res)=>{ 
    try{
        const [rows] = await pool.query('SELECT * FROM cab_locations'); 
        res.json(rows.map(l => ({ ...l, imageUrl: l.image_url, driverId: l.driver_id, active: !!l.active })));
    } catch(e){ console.error("Location Fetch Error:", e.message); res.json([]); } 
});

app.get('/api/rooms', async (req, res) => { try { const [r] = await pool.query('SELECT * FROM rooms'); res.json(r.map(x => ({...x, amenities: parseJSON(x.amenities), images: parseJSON(x.images)}))); } catch (e) { res.json([]); } });
app.get('/api/reviews', async (req, res) => { try { const [r] = await pool.query('SELECT * FROM reviews'); res.json(r.map(x => ({...x, showOnHome: !!x.show_on_home}))); } catch (e) { res.json([]); } });

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) { 
    app.use(express.static(distPath)); 
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); 
} 
app.listen(PORT, '0.0.0.0', () => console.log(`Modular Server Ready on ${PORT}`));