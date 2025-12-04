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

app.use(cors());
app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 

const pool = mysql.createPool(process.env.DATABASE_URL || '');

// --- DB REPAIR FUNCTION ---
const runDatabaseRepair = async () => {
    let connection;
    let logs = [];
    const log = (msg) => { console.log(msg); logs.push(msg); };

    try {
        connection = await pool.getConnection();
        log('🔧 Starting Database Repair...');

        // 1. Try to Disable Foreign Keys (Might fail on some clouds, so we try/catch)
        try { await connection.query('SET FOREIGN_KEY_CHECKS=0'); } catch(e) { log('⚠️ FK Check Disable Failed (Continuing anyway...)'); }

        // 2. Fix Tables: Convert IDs to VARCHAR and Remove Auto-Increment
        const tables = ['reviews', 'pricing_rules', 'gallery', 'cab_locations', 'drivers', 'rooms', 'bookings'];
        
        for (const table of tables) {
            try {
                // Check if table exists
                const [check] = await connection.query(`SHOW TABLES LIKE '${table}'`);
                if (check.length === 0) continue;

                // A. Strip Auto-Increment (Critical Step)
                try { await connection.query(`ALTER TABLE ${table} MODIFY id INT NOT NULL`); } catch(e) {}

                // B. Drop Primary Key (Needed to change type)
                try { await connection.query(`ALTER TABLE ${table} DROP PRIMARY KEY`); } catch(e) {}

                // C. Convert to VARCHAR (Text ID)
                await connection.query(`ALTER TABLE ${table} MODIFY id VARCHAR(255) NOT NULL`);

                // D. Re-add Primary Key
                try { await connection.query(`ALTER TABLE ${table} ADD PRIMARY KEY (id)`); } catch(e) {}

                log(`✅ ${table}: Converted to String IDs.`);
            } catch (err) {
                log(`ℹ️ ${table} repair skipped/error: ${err.message}`);
            }
        }

        // 3. Add Missing Columns
        try { 
            await connection.query("ALTER TABLE reviews ADD COLUMN show_on_home BOOLEAN DEFAULT 0"); 
            log("✅ Added 'show_on_home' to reviews.");
        } catch(e) { log("ℹ️ Reviews column likely exists."); }

        try { await connection.query("ALTER TABLE gallery MODIFY url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE cab_locations MODIFY image_url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY images LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY amenities LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE site_settings MODIFY value LONGTEXT"); } catch(e) {}

        // 4. Ensure Pricing Table Exists
        try {
            await connection.query(`CREATE TABLE IF NOT EXISTS pricing_rules (
                id VARCHAR(255) PRIMARY KEY, 
                name VARCHAR(255), 
                start_date DATE, 
                end_date DATE, 
                multiplier DECIMAL(3,1)
            )`);
            log("✅ Pricing Rules table checked.");
        } catch(e) {}

        // 5. Re-enable FK
        try { await connection.query('SET FOREIGN_KEY_CHECKS=1'); } catch(e) {}

        log('🎉 Repair Process Finished.');
        return { success: true, logs };
    } catch (err) {
        log(`❌ FATAL ERROR: ${err.message}`);
        return { success: false, logs };
    } finally {
        if (connection) connection.release();
    }
};

// Run silently on startup
runDatabaseRepair();

// --- NEW DEBUG ROUTE: CLICK THIS TO FIX DB ---
app.get('/api/debug/fix-db', async (req, res) => {
    const result = await runDatabaseRepair();
    res.json(result);
});

// ... [API ROUTES START HERE] ...
app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        res.json({ status: 'OK', database: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', error: err.message });
    }
});

const parseJSON = (data) => {
    if (typeof data === 'string') {
        try { 
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'object' && parsed !== null) return parsed;
            return data;
        } catch (e) { return data; }
    }
    return data;
};

// --- AUTH ---
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
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ANALYTICS ---
app.post('/api/analytics/track-hit', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let settings = rows.length > 0 ? parseJSON(rows[0].value) : {};
        settings.websiteHits = (settings.websiteHits || 0) + 1;
        
        const [existing] = await pool.query("SELECT key_name FROM site_settings WHERE key_name = 'general_settings'");
        if (existing.length > 0) {
            await pool.query("UPDATE site_settings SET value = ? WHERE key_name = 'general_settings'", [JSON.stringify(settings)]);
        } else {
            await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?)", [JSON.stringify(settings)]);
        }

        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /mobile/i.test(userAgent);
        const deviceType = isMobile ? 'Mobile' : 'Desktop';

        await pool.query('INSERT INTO visit_logs (ip_address, device_type) VALUES (?, ?)', 
            [req.ip || '0.0.0.0', deviceType]);

        res.json({ success: true, newHits: settings.websiteHits });
    } catch (err) { res.json({ success: false }); }
});

app.get('/api/analytics/traffic', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT DATE_FORMAT(visit_date, '%b %y') as month, COUNT(*) as count FROM visit_logs WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), month ORDER BY DATE_FORMAT(visit_date, '%Y-%m') ASC`);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/analytics/devices', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT device_type, COUNT(*) as count FROM visit_logs GROUP BY device_type`);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- ENTITIES (Reviews, Pricing, etc) ---

// REVIEWS
app.get('/api/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM reviews');
        res.json(rows.map(r => ({ id: r.id, guestName: r.guest_name || 'Guest', location: r.location || '', rating: r.rating || 5, comment: r.comment || '', date: r.date, showOnHome: !!r.show_on_home })));
    } catch(e) { res.status(500).json({error: e.message}); }
});
app.post('/api/reviews', async (req, res) => {
    try {
        const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
        const showOnHomeVal = showOnHome ? 1 : 0;
        
        const [exists] = await pool.query("SELECT id FROM reviews WHERE id = ?", [id]);
        if (exists.length > 0) {
            await pool.query("UPDATE reviews SET guest_name=?, location=?, rating=?, comment=?, date=?, show_on_home=? WHERE id=?", 
            [guestName, location, rating, comment, date, showOnHomeVal, id]);
        } else {
            await pool.query("INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [id, guestName, location, rating, comment, date, showOnHomeVal]);
        }
        res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal });
    } catch(e) { 
        console.error("Review Save Error:", e);
        res.status(500).json({error: e.message}); 
    }
});
app.delete('/api/reviews/:id', async (req, res) => {
    try { await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// PRICING
app.get('/api/pricing', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pricing_rules');
        res.json(rows.map(r => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, multiplier: r.multiplier })));
    } catch(e) { res.status(500).json({error: e.message}); }
});
app.post('/api/pricing', async (req, res) => {
    try {
        const { id, name, startDate, endDate, multiplier } = req.body;
        const [exists] = await pool.query("SELECT id FROM pricing_rules WHERE id = ?", [id]);
        if (exists.length > 0) {
            await pool.query("UPDATE pricing_rules SET name=?, start_date=?, end_date=?, multiplier=? WHERE id=?", [name, startDate, endDate, multiplier, id]);
        } else {
            await pool.query("INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) VALUES (?, ?, ?, ?, ?)", [id, name, startDate, endDate, multiplier]);
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/pricing/:id', async (req, res) => {
    try { await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// ROOMS
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms');
    res.json(rows.map(r => ({id: r.id, name: r.name, description: r.description, basePrice: r.base_price, capacity: r.capacity, amenities: parseJSON(r.amenities), images: parseJSON(r.images)})));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/rooms', async (req, res) => {
  try {
      const { id, name, description, capacity, basePrice } = req.body;
      const amenities = JSON.stringify(req.body.amenities || []);
      const images = JSON.stringify(req.body.images || []);
      const [exists] = await pool.query("SELECT id FROM rooms WHERE id = ?", [id]);
      if(exists.length>0) await pool.query("UPDATE rooms SET name=?, description=?, base_price=?, capacity=?, amenities=?, images=? WHERE id=?", [name, description, basePrice, capacity, amenities, images, id]);
      else await pool.query("INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, name, description, basePrice, capacity, amenities, images]);
      res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/rooms/:id', async (req, res) => {
    try { await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})}
});

// DRIVERS & LOCATIONS & GALLERY & BOOKINGS (Full handlers to ensure no cutoff)
app.get('/api/drivers', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM drivers'); res.json(r.map(d=>({id:d.id, name:d.name, phone:d.phone, whatsapp:d.whatsapp, isDefault:!!d.is_default, active:!!d.active, vehicleInfo:d.vehicle_info})));}catch(e){res.status(500).json({error:e.message})} });
app.post('/api/drivers', async(req,res)=>{ try{ const {id,name,phone,whatsapp,isDefault,active,vehicleInfo}=req.body; if(isDefault) await pool.query('UPDATE drivers SET is_default=0'); const[ex]=await pool.query("SELECT id FROM drivers WHERE id=?",[id]); if(ex.length>0) await pool.query("UPDATE drivers SET name=?, phone=?, whatsapp=?, is_default=?, active=?, vehicle_info=? WHERE id=?",[name,phone,whatsapp,isDefault,active,vehicleInfo,id]); else await pool.query("INSERT INTO drivers (id,name,phone,whatsapp,is_default,active,vehicle_info) VALUES (?,?,?,?,?,?,?)",[id,name,phone,whatsapp,isDefault,active,vehicleInfo]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/drivers/:id', async (req, res) => { try { await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

app.get('/api/locations', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM cab_locations'); res.json(r.map(l=>({id:l.id, name:l.name, description:l.description, imageUrl:l.image_url, price:l.price, driverId:l.driver_id, active:!!l.active})));}catch(e){res.status(500).json({error:e.message})} });
app.post('/api/locations', async(req,res)=>{ try{ const {id,name,description,imageUrl,price,driverId,active}=req.body; const[ex]=await pool.query("SELECT id FROM cab_locations WHERE id=?",[id]); if(ex.length>0) await pool.query("UPDATE cab_locations SET name=?, description=?, image_url=?, price=?, driver_id=?, active=? WHERE id=?",[name,description,imageUrl,price,driverId,active,id]); else await pool.query("INSERT INTO cab_locations (id,name,description,image_url,price,driver_id,active) VALUES (?,?,?,?,?,?,?)",[id,name,description,imageUrl,price,driverId,active]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/locations/:id', async (req, res) => { try { await pool.query('DELETE FROM cab_locations WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

app.get('/api/gallery', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM gallery'); res.json(r);}catch(e){res.status(500).json({error:e.message})} });
app.post('/api/gallery', async(req,res)=>{ try{ const {id,url,category,caption}=req.body; const[ex]=await pool.query("SELECT id FROM gallery WHERE id=?",[id]); if(ex.length>0) await pool.query("UPDATE gallery SET url=?, category=?, caption=? WHERE id=?",[url,category,caption,id]); else await pool.query("INSERT INTO gallery (id,url,category,caption) VALUES (?,?,?,?)",[id,url,category,caption]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/gallery/:id', async (req, res) => { try { await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

app.get('/api/bookings', async (req, res) => { try{ const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC'); res.json(rows.map(b => ({ id: b.id, roomId: b.room_id, guestName: b.guest_name, guestPhone: b.guest_phone, checkIn: b.check_in, checkOut: b.check_out, totalAmount: b.total_amount, status: b.status, createdAt: b.created_at }))); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/bookings', async (req, res) => { try { const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body; const [exists] = await pool.query("SELECT id FROM bookings WHERE id = ?", [id]); if (exists.length === 0) { await pool.query(`INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]); } res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });
app.put('/api/bookings/:id', async (req, res) => { try { await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id]); res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });

// --- SETTINGS & WEATHER ---
app.get('/api/settings', async (req, res) => { try { const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); res.json(rows.length > 0 ? parseJSON(rows[0].value) : {}); } catch(e) { res.status(500).json({error: e.message}); } });
app.post('/api/settings', async (req, res) => { try { const [exists] = await pool.query("SELECT key_name FROM site_settings WHERE key_name = 'general_settings'"); if (exists.length > 0) { await pool.query("UPDATE site_settings SET value=? WHERE key_name='general_settings'", [JSON.stringify(req.body)]); } else { await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?)", [JSON.stringify(req.body)]); } res.json({ success: true }); } catch(e) { res.status(500).json({error: e.message}); } });
app.get('/api/weather', async (req, res) => { try { const [settingsRows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); if (settingsRows.length === 0) return res.status(400).json({ error: "Weather API Key not configured." }); const settings = parseJSON(settingsRows[0].value); const apiKey = settings.weatherApiKey; if (!apiKey) return res.status(400).json({ error: "OpenWeatherMap API Key is missing." }); const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${req.query.location || 'Gokarna'}&appid=${apiKey}&units=metric`; const weatherResponse = await axios.get(weatherUrl); res.json({ temp: weatherResponse.data.main.temp, feelsLike: weatherResponse.data.main.feels_like, humidity: weatherResponse.data.main.humidity, windSpeed: weatherResponse.data.wind.speed, description: weatherResponse.data.weather[0].description, icon: weatherResponse.data.weather[0].icon, }); } catch (err) { console.error("Weather error:", err.message); res.status(500).json({ error: "Weather fetch failed" }); } });

// --- FALLBACKS ---
app.use('/api/*', (req, res) => res.status(404).json({ error: `API endpoint not found` }));
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) { app.use(express.static(distPath)); app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); } 
else { app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend not built.</p>')); }

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));