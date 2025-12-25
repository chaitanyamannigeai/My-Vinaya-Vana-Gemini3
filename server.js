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

// Cache Prevention for API
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const pool = mysql.createPool(process.env.DATABASE_URL || '');

const parseJSON = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch (e) { return null; }
};

// --- DATABASE AUTO-FIXER ---
const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Verifying White-Label Schema...');

        // Ensure site_settings supports large objects
        await connection.query(`CREATE TABLE IF NOT EXISTS site_settings (key_name VARCHAR(255) PRIMARY KEY, value LONGTEXT)`);
        await connection.query("ALTER TABLE site_settings MODIFY value LONGTEXT");
        
        // Ensure separate theme column for faster lookup
        try {
             await connection.query("SELECT theme FROM site_settings LIMIT 1");
        } catch (e) {
             await connection.query("ALTER TABLE site_settings ADD COLUMN theme LONGTEXT NULL");
        }

        connection.release();
        console.log("✅ Schema Synced.");
    } catch (err) {
        console.error("❌ DB Check Failed:", err.message);
    }
};
fixDatabaseSchema();

// --- API ROUTES ---

// SETTINGS (GET & SAVE)
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

// LOCATIONS (With Fix for your missing data issue)
app.get('/api/locations', async(req,res)=>{ 
    try{
        const[r]=await pool.query('SELECT * FROM cab_locations'); 
        res.json(r.map(l=>({
            id:l.id, name:l.name, description:l.description, 
            imageUrl:l.image_url, price:l.price, 
            driverId:l.driver_id, active:!!l.active
        })));
    } catch(e){ 
        console.error("Location Fetch Error:", e);
        res.status(500).json([]); 
    } 
});

// Standard CRUD operations...
app.get('/api/rooms', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM rooms'); res.json(rows.map(r => ({id: r.id, name: r.name, description: r.description, basePrice: r.base_price, capacity: r.capacity, amenities: parseJSON(r.amenities), images: parseJSON(r.images)}))); } catch (e) { res.json([]); } });
app.get('/api/reviews', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM reviews'); res.json(rows.map(r => ({ id: r.id, guestName: r.guest_name, location: r.location, rating: r.rating, comment: r.comment, date: r.date, showOnHome: !!r.show_on_home }))); } catch(e) { res.json([]); } });
app.post('/api/analytics/track-hit', async (req, res) => { try { const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); let s = rows.length > 0 ? parseJSON(rows[0].value) : {}; s.websiteHits = (s.websiteHits || 0) + 1; await pool.query("UPDATE site_settings SET value = ? WHERE key_name = 'general_settings'", [JSON.stringify(s)]); res.json({ success: true }); } catch (err) { res.json({ success: false }); } });

// Static Hosting
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) { 
    app.use(express.static(distPath)); 
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); 
} 

app.listen(PORT, '0.0.0.0', () => console.log(`Modular Server running on port ${PORT}`));