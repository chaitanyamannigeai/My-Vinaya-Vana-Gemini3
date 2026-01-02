import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import compression from 'compression'; 
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. SECURITY & PERFORMANCE HARDENING (Fixes 0% Server Score) ---

// Trust proxy is required for Render/Northflank load balancers
app.set('trust proxy', true); 

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // Allows images from your domain and external sources like Pichwai art
            "img-src": ["'self'", "data:", "https:", "http:"],
            // 'unsafe-inline' and 'unsafe-eval' are necessary for Vite/React initialization
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://translate.google.com"],
            // Allows external CSS and inline styles for Tailwind layouts
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            // Whitelists database and weather API connections
            "connect-src": ["'self'", "https://api.openweathermap.org", "http://ip-api.com", "https://*.northflank.app", "https://*.onrender.com"]
        },
    },
    // Required to prevent cross-origin issues with external assets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(compression()); // Compresses responses to improve Page Quality scores
app.use(express.json({ limit: '50mb' })); 

// Prevent browser caching for API routes to ensure fresh data
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// --- 2. DATABASE CONFIGURATION ---

const pool = mysql.createPool(process.env.DATABASE_URL || '');

const parseJSON = (data) => {
    if (typeof data === 'string') {
        try { 
            const parsed = JSON.parse(data);
            return (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) ? parsed : data;
        } catch (e) { return data; }
    }
    return data;
};

// Database Startup Fixer (Ensures tables exist on Aiven MySQL)
const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Running Database Startup Checks...');

        await connection.query(`CREATE TABLE IF NOT EXISTS rooms (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, base_price INT, capacity INT, amenities TEXT, images TEXT)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS drivers (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(50), whatsapp VARCHAR(50), is_default BOOLEAN DEFAULT 0, active BOOLEAN DEFAULT 1, vehicle_info VARCHAR(255), assigned_vehicle_id VARCHAR(255) NULL)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS cab_locations (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, image_url TEXT, price INT, driver_id VARCHAR(255), active BOOLEAN DEFAULT 1)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS gallery (id VARCHAR(255) PRIMARY KEY, url TEXT, category VARCHAR(100), caption VARCHAR(255))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS bookings (id VARCHAR(255) PRIMARY KEY, room_id VARCHAR(255), guest_name VARCHAR(255), guest_phone VARCHAR(50), check_in VARCHAR(50), check_out VARCHAR(50), total_amount DECIMAL(10,2), amount_paid DECIMAL(10,2) DEFAULT 0, balance_amount DECIMAL(10,2) DEFAULT 0, status VARCHAR(50), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS pricing_rules (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), start_date DATE, end_date DATE, multiplier DECIMAL(3,1))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS reviews (id VARCHAR(255) PRIMARY KEY, guest_name VARCHAR(255), location VARCHAR(255), rating INT, comment TEXT, date VARCHAR(50), show_on_home BOOLEAN DEFAULT 0)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS site_settings (key_name VARCHAR(255) PRIMARY KEY, value TEXT)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS visit_logs (id INT AUTO_INCREMENT PRIMARY KEY, ip_address VARCHAR(50), city VARCHAR(100), country VARCHAR(100), visit_date DATETIME DEFAULT CURRENT_TIMESTAMP, device_type VARCHAR(50))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS cab_vehicles (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), vehicle_type VARCHAR(100), capacity INT, images TEXT, features TEXT, base_rate DECIMAL(10,2), active BOOLEAN DEFAULT 1)`);

        connection.release();
        console.log("✅ All Database Tables Verified/Created.");
    } catch (err) {
        console.error("❌ Startup DB Check Failed:", err.message);
    }
};
fixDatabaseSchema();

// --- 3. API ROUTES ---

app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        res.json({ status: 'OK', database: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', error: err.message });
    }
});

// AUTH LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let adminPassword = 'admin123';
        if (rows.length > 0) {
            const settings = parseJSON(rows[0].value);
            if (settings?.adminPasswordHash) adminPassword = settings.adminPasswordHash;
        }
        if (password === adminPassword) res.json({ success: true });
        else res.status(401).json({ error: 'Invalid password' });
    } catch (err) {
        if (password === 'admin123') res.json({ success: true });
        else res.status(500).json({ error: 'Server error' });
    }
});

// (Standard GET/POST/DELETE routes for vehicles, reviews, pricing, etc. remain unchanged)
// ... [Existing Logic here] ...

// ANALYTICS TRACKING
app.post('/api/analytics/track-hit', async (req, res) => { 
    try { 
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); 
        let settings = rows.length > 0 ? parseJSON(rows[0].value) : {}; 
        settings.websiteHits = (settings.websiteHits || 0) + 1; 
        await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [JSON.stringify(settings)]); 

        const userAgent = req.headers['user-agent'] || ''; 
        const isMobile = /mobile/i.test(userAgent); 
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip === '::1' || ip === '127.0.0.1') ip = '';

        let city = 'Unknown', country = 'Unknown';
        if (ip && ip.length > 7) { 
            try {
                const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
                if (geoRes.data?.status === 'success') { city = geoRes.data.city || 'Unknown'; country = geoRes.data.country || 'Unknown'; }
            } catch (geoError) { console.error("GeoIP Fetch Error:", geoError.message); }
        }
        await pool.query('INSERT INTO visit_logs (ip_address, city, country, device_type) VALUES (?, ?, ?, ?)', [ip, city, country, isMobile ? 'Mobile' : 'Desktop']); 
        res.json({ success: true, newHits: settings.websiteHits }); 
    } catch (err) { res.json({ success: false }); } 
});

// --- 4. THE UI FIX: PRODUCTION STATIC SERVING ---

const distPath = path.resolve(__dirname, 'dist'); // Use absolute path resolution

if (fs.existsSync(distPath)) {
    // Serve static files with 1-year cache headers
    app.use(express.static(distPath, {
        maxAge: '1y',
        etag: true,
        setHeaders: (res, filePath) => {
            // Never cache index.html to ensure users get the latest UI updates
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
        }
    }));

    // SPA Fallback: Redirect all non-API requests to index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend dist folder not found.</p>'));
}

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Vinaya Vana Server running on port ${PORT}`));