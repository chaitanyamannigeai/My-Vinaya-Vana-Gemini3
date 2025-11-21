
import express from 'express';
import path from 'path';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Pool } = pg;

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

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper to parse JSON from DB text columns
const parseJSON = (text) => {
    try { return JSON.parse(text); } catch (e) { return text; }
};

// --- 1. ROOMS API ---
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms');
    const rooms = result.rows.map(r => ({
        ...r,
        amenities: parseJSON(r.amenities),
        images: parseJSON(r.images)
    }));
    res.json(rooms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/rooms', async (req, res) => {
  const { id, name, description, basePrice, capacity, amenities, images } = req.body;
  try {
    await pool.query(
      'INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name=$2, description=$3, base_price=$4, capacity=$5, amenities=$6, images=$7',
      [id, name, description, basePrice, capacity, JSON.stringify(amenities), JSON.stringify(images)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/rooms/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 2. BOOKINGS API ---
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
  const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/bookings/:id', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 3. DRIVERS API ---
app.get('/api/drivers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM drivers');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/drivers', async (req, res) => {
    const { id, name, phone, whatsapp, isDefault, active, vehicleInfo } = req.body;
    try {
        if (isDefault) {
            // Ensure only one default driver exists
            await pool.query('UPDATE drivers SET is_default = false');
        }
        await pool.query(
            'INSERT INTO drivers (id, name, phone, whatsapp, is_default, active, vehicle_info) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name=$2, phone=$3, whatsapp=$4, is_default=$5, active=$6, vehicle_info=$7',
            [id, name, phone, whatsapp, isDefault, active, vehicleInfo]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/drivers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM drivers WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. LOCATIONS API ---
app.get('/api/locations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cab_locations');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/locations', async (req, res) => {
    const { id, name, description, imageUrl, price, driverId, active } = req.body;
    try {
        await pool.query(
            'INSERT INTO cab_locations (id, name, description, image_url, price, driver_id, active) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name=$2, description=$3, image_url=$4, price=$5, driver_id=$6, active=$7',
            [id, name, description, imageUrl, price, driverId, active]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cab_locations WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. SETTINGS API ---
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        if (result.rows.length > 0) {
            res.json(JSON.parse(result.rows[0].value));
        } else {
            res.json({}); // Should seed default
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
        await pool.query(
            "INSERT INTO site_settings (key_name, value) VALUES ('general_settings', $1) ON CONFLICT (key_name) DO UPDATE SET value=$1",
            [JSON.stringify(settings)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. GALLERY API ---
app.get('/api/gallery', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gallery');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gallery', async (req, res) => {
    const { id, url, category, caption } = req.body;
    try {
        await pool.query(
            'INSERT INTO gallery (id, url, category, caption) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET url=$2, category=$3, caption=$4',
            [id, url, category, caption]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 7. REVIEWS API ---
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    try {
        await pool.query(
            'INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET guest_name=$2, location=$3, rating=$4, comment=$5, date=$6, show_on_home=$7',
            [id, guestName, location, rating, comment, date, showOnHome]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 8. PRICING API ---
app.get('/api/pricing', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pricing_rules');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    try {
        await pool.query(
            'INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name=$2, start_date=$3, end_date=$4, multiplier=$5',
            [id, name, startDate, endDate, multiplier]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM pricing_rules WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVE REACT APP ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
