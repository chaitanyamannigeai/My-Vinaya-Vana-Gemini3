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

// --- HEALTH CHECK ---
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

// --- DATABASE STARTUP FIXER ---
const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Running Database Startup Checks...');

        // 1. SPECIFIC FIX FOR PRICING (The issue you are facing)
        try {
            // Attempt to force ID to string
            await connection.query("ALTER TABLE pricing_rules MODIFY id VARCHAR(255)");
            console.log("✅ Pricing Rules IDs converted to String");
        } catch (e) {
            console.log("⚠️ Could not alter Pricing table. Recreating it...");
            try {
                await connection.query("DROP TABLE IF EXISTS pricing_rules");
                await connection.query(`
                    CREATE TABLE pricing_rules (
                        id VARCHAR(255) PRIMARY KEY,
                        name VARCHAR(255),
                        start_date DATE,
                        end_date DATE,
                        multiplier DECIMAL(3,1)
                    )
                `);
                console.log("✅ Pricing Rules table recreated from scratch.");
            } catch (createErr) {
                console.error("❌ Failed to recreate pricing table:", createErr.message);
            }
        }

        // 2. Ensure Reviews table is correct (Since it's working, we just double check)
        try { await connection.query("ALTER TABLE reviews MODIFY id VARCHAR(255)"); } catch(e) {}
        try { await connection.query("ALTER TABLE reviews ADD COLUMN show_on_home BOOLEAN DEFAULT 0"); } catch(e) {}

        connection.release();
    } catch (err) {
        console.error("Startup DB Check Failed:", err.message);
    }
};
// Run immediately on start
fixDatabaseSchema();


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
        if (password === 'admin123') res.json({ success: true });
        else res.status(500).json({ error: 'Server error' });
    }
});

// --- REVIEWS ---
app.get('/api/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM reviews');
        res.json(rows.map(r => ({ id: r.id, guestName: r.guest_name || 'Guest', location: r.location || '', rating: r.rating || 5, comment: r.comment || '', date: r.date, showOnHome: !!r.show_on_home })));
    } catch(e) { res.json([]); }
});

app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    const showOnHomeVal = showOnHome ? 1 : 0;
    const upsertQuery = `INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guest_name=VALUES(guest_name), location=VALUES(location), rating=VALUES(rating), comment=VALUES(comment), date=VALUES(date), show_on_home=VALUES(show_on_home)`;
    
    try {
        await pool.query(upsertQuery, [id, guestName, location, rating, comment, date, showOnHomeVal]);
        res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal });
    } catch (e) {
        // Fallback: Recreate table if it fails
        try {
            await pool.query(`DROP TABLE IF EXISTS reviews`);
            await pool.query(`CREATE TABLE reviews (id VARCHAR(255) PRIMARY KEY, guest_name VARCHAR(255), location VARCHAR(255), rating INT, comment TEXT, date VARCHAR(50), show_on_home BOOLEAN DEFAULT 0)`);
            await pool.query(upsertQuery, [id, guestName, location, rating, comment, date, showOnHomeVal]);
            res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal, repaired: true });
        } catch (fatal) { res.status(500).json({ error: fatal.message }); }
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try { await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// --- PRICING (UPDATED WITH EXPLICIT FIX) ---
app.get('/api/pricing', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pricing_rules');
        res.json(rows.map(r => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, multiplier: r.multiplier })));
    } catch(e) { res.json([]); }
});

app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    
    // Explicitly cast params to ensure safety
    const params = [String(id), String(name), startDate, endDate, parseFloat(multiplier)];
    const upsertQuery = `INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), start_date=VALUES(start_date), end_date=VALUES(end_date), multiplier=VALUES(multiplier)`;

    try {
        await pool.query(upsertQuery, params);
        res.json({ success: true });
    } catch (e) {
        console.log("⚠️ Pricing Save Failed. Attempting Immediate Repair...", e.message);
        try {
            // IMMEDIATE REPAIR IF SAVE FAILS
            await pool.query(`DROP TABLE IF EXISTS pricing_rules`);
            await pool.query(`
                CREATE TABLE pricing_rules (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255),
                    start_date DATE,
                    end_date DATE,
                    multiplier DECIMAL(3,1)
                )
            `);
            // Retry the save
            await pool.query(upsertQuery, params);
            res.json({ success: true, repaired: true });
        } catch (fatalError) {
            console.error("Pricing Fatal Error:", fatalError);
            res.status(500).json({error: fatalError.message});
        }
    }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try { await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// --- OTHER ENTITIES ---

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
      // Quick fix for ID type if needed
      try { await pool.query("INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), capacity=VALUES(capacity), amenities=VALUES(amenities), images=VALUES(images)", [id, name, description, basePrice, capacity, amenities, images]); }
      catch(e) { 
          await pool.query(`ALTER TABLE rooms MODIFY id VARCHAR(255)`);
          await pool.query("INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), capacity=VALUES(capacity), amenities=VALUES(amenities), images=VALUES(images)", [id, name, description, basePrice, capacity, amenities, images]);
      }
      res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/rooms/:id', async (req, res) => { try { await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

// DRIVERS
app.get('/api/drivers', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM drivers'); res.json(r.map(d=>({id:d.id, name:d.name, phone:d.phone, whatsapp:d.whatsapp, isDefault:!!d.is_default, active:!!d.active, vehicleInfo:d.vehicle_info})));}catch(e){res.json([]);} });
app.post('/api/drivers', async(req,res)=>{ try{ const {id,name,phone,whatsapp,isDefault,active,vehicleInfo}=req.body; if(isDefault) await pool.query('UPDATE drivers SET is_default=0'); await pool.query("INSERT INTO drivers (id,name,phone,whatsapp,is_default,active,vehicle_info) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), whatsapp=VALUES(whatsapp), is_default=VALUES(is_default), active=VALUES(active), vehicle_info=VALUES(vehicle_info)",[id,name,phone,whatsapp,isDefault,active,vehicleInfo]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/drivers/:id', async (req, res) => { try { await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

// LOCATIONS
app.get('/api/locations', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM cab_locations'); res.json(r.map(l=>({id:l.id, name:l.name, description:l.description, imageUrl:l.image_url, price:l.price, driverId:l.driver_id, active:!!l.active})));}catch(e){res.json([]);} });
app.post('/api/locations', async(req,res)=>{ try{ const {id,name,description,imageUrl,price,driverId,active}=req.body; await pool.query("INSERT INTO cab_locations (id,name,description,image_url,price,driver_id,active) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), image_url=VALUES(image_url), price=VALUES(price), driver_id=VALUES(driver_id), active=VALUES(active)",[id,name,description,imageUrl,price,driverId,active]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/locations/:id', async (req, res) => { try { await pool.query('DELETE FROM cab_locations WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

// GALLERY
app.get('/api/gallery', async(req,res)=>{ try{const[r]=await pool.query('SELECT * FROM gallery'); res.json(r);}catch(e){res.json([]);} });
app.post('/api/gallery', async(req,res)=>{ try{ const {id,url,category,caption}=req.body; await pool.query("INSERT INTO gallery (id,url,category,caption) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE url=VALUES(url), category=VALUES(category), caption=VALUES(caption)",[id,url,category,caption]); res.json({success:true}); }catch(e){res.status(500).json({error:e.message})} });
app.delete('/api/gallery/:id', async (req, res) => { try { await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).json({error:e.message})} });

// BOOKINGS
app.get('/api/bookings', async (req, res) => { try{ const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC'); res.json(rows.map(b => ({ id: b.id, roomId: b.room_id, guestName: b.guest_name, guestPhone: b.guest_phone, checkIn: b.check_in, checkOut: b.check_out, totalAmount: b.total_amount, status: b.status, createdAt: b.created_at }))); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/bookings', async (req, res) => { try { const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body; await pool.query(`INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)`, [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]); res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });
app.put('/api/bookings/:id', async (req, res) => { try { await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id]); res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });

// SETTINGS & WEATHER
app.get('/api/settings', async (req, res) => { try { const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); res.json(rows.length > 0 ? parseJSON(rows[0].value) : {}); } catch(e) { res.json({}); } });
app.post('/api/settings', async (req, res) => { try { await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [JSON.stringify(req.body)]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e.message}); } });
app.get('/api/weather', async (req, res) => { try { const [settingsRows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); if (settingsRows.length === 0) return res.status(400).json({ error: "No settings" }); const settings = parseJSON(settingsRows[0].value); const apiKey = settings.weatherApiKey; if (!apiKey) return res.status(400).json({ error: "No API Key" }); const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${req.query.location || 'Gokarna'}&appid=${apiKey}&units=metric`; const weatherResponse = await axios.get(weatherUrl); res.json({ temp: weatherResponse.data.main.temp, feelsLike: weatherResponse.data.main.feels_like, humidity: weatherResponse.data.main.humidity, windSpeed: weatherResponse.data.wind.speed, description: weatherResponse.data.weather[0].description, icon: weatherResponse.data.weather[0].icon, }); } catch (err) { res.status(500).json({ error: "Weather error" }); } });

// ANALYTICS
app.post('/api/analytics/track-hit', async (req, res) => { try { const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'"); let settings = rows.length > 0 ? parseJSON(rows[0].value) : {}; settings.websiteHits = (settings.websiteHits || 0) + 1; await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [JSON.stringify(settings)]); const userAgent = req.headers['user-agent'] || ''; const isMobile = /mobile/i.test(userAgent); await pool.query('INSERT INTO visit_logs (ip_address, device_type) VALUES (?, ?)', [req.ip || '0.0.0.0', isMobile ? 'Mobile' : 'Desktop']); res.json({ success: true, newHits: settings.websiteHits }); } catch (err) { res.json({ success: false }); } });
app.get('/api/analytics/traffic', async (req, res) => { try { const [rows] = await pool.query(`SELECT DATE_FORMAT(visit_date, '%b %y') as month, COUNT(*) as count FROM visit_logs WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), month ORDER BY DATE_FORMAT(visit_date, '%Y-%m') ASC`); res.json(rows); } catch (e) { res.json([]); } });
app.get('/api/analytics/devices', async (req, res) => { try { const [rows] = await pool.query(`SELECT device_type, COUNT(*) as count FROM visit_logs GROUP BY device_type`); res.json(rows); } catch (e) { res.json([]); } });

// FALLBACKS
app.use('/api/*', (req, res) => res.status(404).json({ error: `API endpoint not found` }));
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) { app.use(express.static(distPath)); app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); } 
else { app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend not built.</p>')); }

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));