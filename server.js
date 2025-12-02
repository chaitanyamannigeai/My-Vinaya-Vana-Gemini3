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
// CRITICAL: Use port provided by environment or 3000
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 

const pool = mysql.createPool(process.env.DATABASE_URL || '');

const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Checking database schema...');
        try { await connection.query("ALTER TABLE gallery MODIFY url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE cab_locations MODIFY image_url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY images LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY amenities LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE site_settings MODIFY value LONGTEXT"); } catch(e) {}
        console.log('✅ Database schema auto-corrected.');
        connection.release();
    } catch (err) {
        console.log('ℹ️ Schema check skipped.');
    }
};

const testDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
        connection.release();
        await fixDatabaseSchema();
    } catch (err) {
        console.error('❌ DATABASE CONNECTION FAILED', err.message);
    }
};
testDbConnection();

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

app.post('/api/analytics/track-hit', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let settings = rows.length > 0 ? parseJSON(rows[0].value) : {};
        settings.websiteHits = (settings.websiteHits || 0) + 1;
        await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) AS new_vals ON DUPLICATE KEY UPDATE value=new_vals.value", [JSON.stringify(settings)]);
        res.json({ success: true, newHits: settings.websiteHits });
    } catch (err) { res.json({ success: false }); }
});

// --- API ENDPOINTS ---
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms');
    const rooms = rows.map(r => ({
        id: r.id, name: r.name, description: r.description, basePrice: r.base_price || 0,
        capacity: r.capacity || 0, amenities: parseJSON(r.amenities) || [], images: parseJSON(r.images) || []
    }));
    res.json(rooms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/rooms', async (req, res) => {
  const { id, name, description, capacity } = req.body;
  let basePrice = req.body.basePrice !== undefined && !isNaN(parseFloat(req.body.basePrice)) ? parseFloat(req.body.basePrice) : 0;
  const amenities = JSON.stringify(req.body.amenities || []);
  const images = JSON.stringify(req.body.images || []);
  try {
    await pool.query(`INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE name=new_vals.name, description=new_vals.description, base_price=new_vals.base_price, capacity=new_vals.capacity, amenities=new_vals.amenities, images=new_vals.images`, 
    [id, name, description, basePrice, capacity, amenities, images]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/rooms/:id', async (req, res) => {
    await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    const bookings = rows.map(b => ({
        id: b.id, roomId: b.room_id, guestName: b.guest_name, guestPhone: b.guest_phone,
        checkIn: b.check_in, checkOut: b.check_out, totalAmount: b.total_amount, status: b.status, createdAt: b.created_at
    }));
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bookings', async (req, res) => {
  const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body;
  await pool.query(`INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
  [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]);
  res.json({ success: true });
});
app.put('/api/bookings/:id', async (req, res) => {
    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true });
});

app.get('/api/drivers', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM drivers');
    res.json(rows.map(d => ({ id: d.id, name: d.name, phone: d.phone, whatsapp: d.whatsapp, isDefault: !!d.is_default, active: !!d.active, vehicleInfo: d.vehicle_info })));
});
app.post('/api/drivers', async (req, res) => {
    const { id, name, phone, whatsapp, isDefault, active, vehicleInfo } = req.body;
    if (isDefault) await pool.query('UPDATE drivers SET is_default = 0');
    await pool.query(`INSERT INTO drivers (id, name, phone, whatsapp, is_default, active, vehicle_info) VALUES (?, ?, ?, ?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE name=new_vals.name, phone=new_vals.phone, whatsapp=new_vals.whatsapp, is_default=new_vals.is_default, active=new_vals.active, vehicle_info=new_vals.vehicle_info`, 
    [id, name, phone, whatsapp, isDefault, active, vehicleInfo]);
    res.json({ success: true });
});
app.delete('/api/drivers/:id', async (req, res) => {
    await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/locations', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM cab_locations');
    res.json(rows.map(l => ({ id: l.id, name: l.name, description: l.description, imageUrl: l.image_url, price: l.price, driverId: l.driver_id, active: !!l.active })));
});
app.post('/api/locations', async (req, res) => {
    let { id, name, description, imageUrl, price, driverId, active } = req.body;
    price = parseFloat(price); if (isNaN(price)) price = 0;
    driverId = (driverId === 'default' || !driverId) ? null : driverId;
    await pool.query(`INSERT INTO cab_locations (id, name, description, image_url, price, driver_id, active) VALUES (?, ?, ?, ?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE name=new_vals.name, description=new_vals.description, image_url=new_vals.image_url, price=new_vals.price, driver_id=new_vals.driver_id, active=new_vals.active`, 
    [id, name || 'New Location', description || '', imageUrl, price, driverId, active !== undefined ? active : true]);
    res.json({ success: true });
});
app.delete('/api/locations/:id', async (req, res) => {
    await pool.query('DELETE FROM cab_locations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/settings', async (req, res) => {
    const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
    res.json(rows.length > 0 ? parseJSON(rows[0].value) : {});
});
app.post('/api/settings', async (req, res) => {
    await pool.query("INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) AS new_vals ON DUPLICATE KEY UPDATE value=new_vals.value", [JSON.stringify(req.body)]);
    res.json({ success: true });
});

app.get('/api/weather', async (req, res) => {
    try {
        const [settingsRows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        if (settingsRows.length === 0) return res.status(400).json({ error: "Weather API Key not configured." });
        const settings = parseJSON(settingsRows[0].value);
        const apiKey = settings.weatherApiKey;
        if (!apiKey) return res.status(400).json({ error: "OpenWeatherMap API Key is missing." });

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${req.query.location || 'Gokarna'}&appid=${apiKey}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);
        res.json({
            temp: weatherResponse.data.main.temp,
            feelsLike: weatherResponse.data.main.feels_like,
            humidity: weatherResponse.data.main.humidity,
            windSpeed: weatherResponse.data.wind.speed,
            description: weatherResponse.data.weather[0].description,
            icon: weatherResponse.data.weather[0].icon,
        });
    } catch (err) { 
        // FIXED: Removed ': any' to fix Node.js crash
        console.error("Weather error:", err.message);
        res.status(500).json({ error: "Weather fetch failed" });
    }
});

app.get('/api/gallery', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM gallery');
    res.json(rows);
});
app.post('/api/gallery', async (req, res) => {
    await pool.query(`INSERT INTO gallery (id, url, category, caption) VALUES (?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE url=new_vals.url, category=new_vals.category, caption=new_vals.caption`, 
    [req.body.id, req.body.url || '', req.body.category || 'General', req.body.caption || '']);
    res.json({ success: true });
});
app.delete('/api/gallery/:id', async (req, res) => {
    await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows.map(r => ({ id: r.id, guestName: r.guest_name || 'Guest', location: r.location || '', rating: r.rating || 5, comment: r.comment || '', date: r.date, showOnHome: !!r.show_on_home })));
});
app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    await pool.query(`INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) VALUES (?, ?, ?, ?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE guest_name=new_vals.guest_name, location=new_vals.location, rating=new_vals.rating, comment=new_vals.comment, date=new_vals.date, show_on_home=new_vals.show_on_home`,
    [id, guestName, location, rating, comment, date, showOnHome]);
    res.json({ success: true });
});
app.delete('/api/reviews/:id', async (req, res) => {
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/pricing', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM pricing_rules');
    res.json(rows.map(r => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, multiplier: r.multiplier })));
});
app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    await pool.query(`INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) VALUES (?, ?, ?, ?, ?) AS new_vals ON DUPLICATE KEY UPDATE name=new_vals.name, start_date=new_vals.start_date, end_date=new_vals.end_date, multiplier=new_vals.multiplier`, 
    [id, name, startDate, endDate, multiplier]);
    res.json({ success: true });
});
app.delete('/api/pricing/:id', async (req, res) => {
    await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/docs/sql-script', (req, res) => {
    fs.readFile(path.join(__dirname, 'database.sql'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read SQL script' });
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

app.use('/api/*', (req, res) => res.status(404).json({ error: `API endpoint not found` }));

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    console.warn('WARNING: "dist" not found.');
    app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend not built.</p>'));
}

// CRITICAL FIX: Bind to 0.0.0.0 for Northflank
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));