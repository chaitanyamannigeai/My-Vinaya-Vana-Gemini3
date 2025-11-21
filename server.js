import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Database Connection Pool (MySQL)
const pool = mysql.createPool(process.env.DATABASE_URL || '');

// --- DATABASE CONNECTION TEST ---
const testDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('----------------------------------------');
        console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
        console.log('----------------------------------------');
        connection.release();
    } catch (err) {
        console.error('----------------------------------------');
        console.error('❌ DATABASE CONNECTION FAILED');
        console.error(err.message);
        console.error('----------------------------------------');
    }
};
testDbConnection();

// --- HEALTH CHECK ENDPOINT ---
app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', database: 'Disconnected', error: err.message });
    }
});

// Helper to parse JSON from DB text columns
const parseJSON = (data) => {
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch (e) { return data; }
    }
    return data;
};

// --- 1. ROOMS API ---
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms');
    const rooms = rows.map(r => ({
        ...r,
        amenities: parseJSON(r.amenities),
        images: parseJSON(r.images)
    }));
    res.json(rooms);
  } catch (err) { 
      console.error('Error fetching rooms:', err);
      res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/rooms', async (req, res) => {
  const { id, name, description, basePrice, capacity, amenities, images } = req.body;
  try {
    // MySQL 8 compatible syntax: AS new_vals
    const sql = `INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 AS new_vals 
                 ON DUPLICATE KEY UPDATE 
                 name=new_vals.name, description=new_vals.description, base_price=new_vals.base_price, 
                 capacity=new_vals.capacity, amenities=new_vals.amenities, images=new_vals.images`;
    
    await pool.query(sql, [id, name, description, basePrice, capacity, JSON.stringify(amenities), JSON.stringify(images)]);
    res.json({ success: true });
  } catch (err) { 
      console.error('Error saving room:', err);
      res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 2. BOOKINGS API ---
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
  const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body;
  try {
    const sql = `INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/bookings/:id', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 3. DRIVERS API ---
app.get('/api/drivers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM drivers');
        const drivers = rows.map(d => ({ ...d, isDefault: !!d.is_default, active: !!d.active }));
        res.json(drivers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/drivers', async (req, res) => {
    const { id, name, phone, whatsapp, isDefault, active, vehicleInfo } = req.body;
    try {
        if (isDefault) {
            await pool.query('UPDATE drivers SET is_default = 0');
        }
        const sql = `INSERT INTO drivers (id, name, phone, whatsapp, is_default, active, vehicle_info) 
                     VALUES (?, ?, ?, ?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE 
                     name=new_vals.name, phone=new_vals.phone, whatsapp=new_vals.whatsapp, 
                     is_default=new_vals.is_default, active=new_vals.active, vehicle_info=new_vals.vehicle_info`;
        await pool.query(sql, [id, name, phone, whatsapp, isDefault, active, vehicleInfo]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/drivers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. LOCATIONS API ---
app.get('/api/locations', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cab_locations');
        const locs = rows.map(l => ({...l, active: !!l.active}));
        res.json(locs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/locations', async (req, res) => {
    const { id, name, description, imageUrl, price, driverId, active } = req.body;
    try {
        const sql = `INSERT INTO cab_locations (id, name, description, image_url, price, driver_id, active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE 
                     name=new_vals.name, description=new_vals.description, image_url=new_vals.image_url, 
                     price=new_vals.price, driver_id=new_vals.driver_id, active=new_vals.active`;
        await pool.query(sql, [id, name, description, imageUrl, price, driverId, active]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cab_locations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. SETTINGS API ---
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        if (rows.length > 0) {
            res.json(JSON.parse(rows[0].value));
        } else {
            res.json({}); 
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
        // For settings, we just overwrite the JSON value
        const sql = "INSERT INTO site_settings (key_name, value) VALUES ('general_settings', ?) AS new_vals ON DUPLICATE KEY UPDATE value=new_vals.value";
        await pool.query(sql, [JSON.stringify(settings)]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. GALLERY API ---
app.get('/api/gallery', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gallery');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gallery', async (req, res) => {
    const { id, url, category, caption } = req.body;
    try {
        const sql = `INSERT INTO gallery (id, url, category, caption) 
                     VALUES (?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE url=new_vals.url, category=new_vals.category, caption=new_vals.caption`;
        await pool.query(sql, [id, url, category, caption]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 7. REVIEWS API ---
app.get('/api/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM reviews');
        const reviews = rows.map(r => ({...r, showOnHome: !!r.show_on_home}));
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    try {
        const sql = `INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) 
                     VALUES (?, ?, ?, ?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE 
                     guest_name=new_vals.guest_name, location=new_vals.location, rating=new_vals.rating, 
                     comment=new_vals.comment, date=new_vals.date, show_on_home=new_vals.show_on_home`;
        await pool.query(sql, [id, guestName, location, rating, comment, date, showOnHome]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 8. PRICING API ---
app.get('/api/pricing', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pricing_rules');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    try {
        const sql = `INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) 
                     VALUES (?, ?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE 
                     name=new_vals.name, start_date=new_vals.start_date, end_date=new_vals.end_date, multiplier=new_vals.multiplier`;
        await pool.query(sql, [id, name, startDate, endDate, multiplier]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Handle 404 for API routes explicitly ---
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- SERVE REACT APP ---
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.warn('WARNING: "dist" folder not found. Frontend will not be served. Please run "npm run build".');
    app.get('/', (req, res) => {
        res.send('<h1>Backend Running</h1><p>Frontend not built. Please run <code>npm run build</code> to generate the dist folder.</p>');
    });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});