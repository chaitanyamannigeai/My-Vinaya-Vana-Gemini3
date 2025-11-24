
import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios'; // Import axios for HTTP requests

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

// --- DATABASE AUTO-REPAIR SCRIPT ---
// This runs on startup to fix column sizes for existing databases
const fixDatabaseSchema = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🔧 Checking database schema...');
        
        // Force upgrade columns to hold Large Images (LONGTEXT = 4GB limit)
        // Using separate try-catches so one failure doesn't stop the others
        try { await connection.query("ALTER TABLE gallery MODIFY url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE cab_locations MODIFY image_url LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY images LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE rooms MODIFY amenities LONGTEXT"); } catch(e) {}
        try { await connection.query("ALTER TABLE site_settings MODIFY value LONGTEXT"); } catch(e) {}

        console.log('✅ Database schema auto-corrected for large images.');
        connection.release();
    } catch (err) {
        console.log('ℹ️ Schema check skipped (Database might not be ready yet).');
    }
};

// --- DATABASE CONNECTION TEST ---
const testDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('----------------------------------------');
        console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
        console.log('----------------------------------------');
        connection.release();
        
        // Run the auto-fix
        await fixDatabaseSchema();
        
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

// --- AUTH API (New for Faster Login) ---
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        // Fetch only settings to check password on server side
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let adminPassword = 'admin123'; // Default
        
        if (rows.length > 0) {
            const settings = parseJSON(rows[0].value);
            if (settings && settings.adminPasswordHash) {
                adminPassword = settings.adminPasswordHash;
            }
        }

        if (password === adminPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: 'Internal server error checking password' });
    }
});


// --- 1. ROOMS API ---
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms');
    // CRITICAL FIX: Explicitly map snake_case (DB) to camelCase (Frontend)
    const rooms = rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        basePrice: r.base_price || 0, // Fallback to 0 to avoid UI errors
        capacity: r.capacity || 0,
        amenities: parseJSON(r.amenities) || [],
        images: parseJSON(r.images) || []
    }));
    res.json(rooms);
  } catch (err) { 
      console.error('Error fetching rooms:', err);
      res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/rooms', async (req, res) => {
  // FIX: Accept both camelCase (from frontend) and snake_case (if sent manually) to prevent null errors
  const id = req.body.id;
  const name = req.body.name || 'New Room';
  const description = req.body.description || '';
  // Robust check for price
  let basePrice = req.body.basePrice !== undefined ? req.body.basePrice : (req.body.base_price !== undefined ? req.body.base_price : 0);
  if (isNaN(parseFloat(basePrice))) basePrice = 0;
  
  const capacity = req.body.capacity || 1;
  const amenities = JSON.stringify(req.body.amenities || []);
  const images = JSON.stringify(req.body.images || []);

  try {
    // MySQL 8 compatible syntax: AS new_vals
    const sql = `INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 AS new_vals 
                 ON DUPLICATE KEY UPDATE 
                 name=new_vals.name, description=new_vals.description, base_price=new_vals.base_price, 
                 capacity=new_vals.capacity, amenities=new_vals.amenities, images=new_vals.images`;
    
    await pool.query(sql, [id, name, description, basePrice, capacity, amenities, images]);
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
    // Map snake_case DB columns to camelCase frontend properties
    const bookings = rows.map(b => ({
        id: b.id,
        roomId: b.room_id,
        guestName: b.guest_name,
        guestPhone: b.guest_phone,
        checkIn: b.check_in,
        checkOut: b.check_out,
        totalAmount: b.total_amount,
        status: b.status,
        createdAt: b.created_at
    }));
    res.json(bookings);
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
        const drivers = rows.map(d => ({ 
            id: d.id,
            name: d.name,
            phone: d.phone,
            whatsapp: d.whatsapp,
            isDefault: !!d.is_default, 
            active: !!d.active,
            vehicleInfo: d.vehicle_info 
        }));
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
        const locs = rows.map(l => ({
            id: l.id,
            name: l.name,
            description: l.description,
            imageUrl: l.image_url,
            price: l.price,
            driverId: l.driver_id,
            active: !!l.active
        }));
        res.json(locs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/locations', async (req, res) => {
    let { id, name, description, imageUrl, price, driverId, active } = req.body;
    
    // Sanitization: Convert undefined/null/empty/NaN to 0 for price (safer for DB)
    price = parseFloat(price);
    if (isNaN(price)) price = 0;
    
    // Driver ID: use null if empty string or 'default'
    driverId = (driverId === 'default' || driverId === '' || driverId === undefined) ? null : driverId;
    
    // Active: Default to true
    active = active === undefined ? true : active;

    // Name/Desc fallback
    name = name || 'New Location';
    description = description || '';

    try {
        const sql = `INSERT INTO cab_locations (id, name, description, image_url, price, driver_id, active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE 
                     name=new_vals.name, description=new_vals.description, image_url=new_vals.image_url, 
                     price=new_vals.price, driver_id=new_vals.driver_id, active=new_vals.active`;
        await pool.query(sql, [id, name, description, imageUrl, price, driverId, active]);
        res.json({ success: true });
    } catch (err) { 
        console.error("Error saving location:", err);
        res.status(500).json({ error: err.message }); 
    }
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
            // Use helper to safely parse (handles double parsing)
            res.json(parseJSON(rows[0].value));
        } else {
            res.json({}); 
        }
    } catch (err) { 
        console.error("Settings fetch error:", err);
        res.status(500).json({ error: err.message }); 
    }
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

// --- WEATHER API ---
app.get('/api/weather', async (req, res) => {
    try {
        const [settingsRows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        if (settingsRows.length === 0) {
            return res.status(400).json({ error: "Weather API Key not configured in settings." });
        }
        const settings = parseJSON(settingsRows[0].value);
        const apiKey = settings.weatherApiKey;
        const location = req.query.location || 'Gokarna'; // Default to Gokarna

        if (!apiKey) {
            return res.status(400).json({ error: "OpenWeatherMap API Key is missing in site settings." });
        }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);

        res.json({
            temp: weatherResponse.data.main.temp,
            description: weatherResponse.data.weather[0].description,
            icon: weatherResponse.data.weather[0].icon,
        });

    } catch (err: any) {
        console.error("Weather fetch error:", err.message);
        if (err.response && err.response.status === 401) {
            return res.status(401).json({ error: "Invalid OpenWeatherMap API Key." });
        }
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ error: "Location not found in weather data." });
        }
        res.status(500).json({ error: "Failed to fetch weather data." });
    }
});


// --- 6. GALLERY API ---
app.get('/api/gallery', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gallery');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gallery', async (req, res) => {
    let { id, url, category, caption } = req.body;
    
    // Sanitization for Gallery
    category = category || 'General';
    caption = caption || '';
    url = url || '';

    try {
        const sql = `INSERT INTO gallery (id, url, category, caption) 
                     VALUES (?, ?, ?, ?) 
                     AS new_vals 
                     ON DUPLICATE KEY UPDATE url=new_vals.url, category=new_vals.category, caption=new_vals.caption`;
        await pool.query(sql, [id, url, category, caption]);
        res.json({ success: true });
    } catch (err) { 
        console.error("Error saving gallery:", err);
        res.status(500).json({ error: err.message }); 
    }
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
        // FIX: Explicitly map guest_name to guestName
        const reviews = rows.map(r => ({
            id: r.id,
            guestName: r.guest_name || 'Guest',
            location: r.location || '',
            rating: r.rating || 5,
            comment: r.comment || '',
            date: r.date,
            showOnHome: !!r.show_on_home
        }));
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
    }
    catch (err) { console.error("Error saving review:", err); res.status(500).json({ error: err.message }); }
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
        // Map snake_case to camelCase
        const rules = rows.map(r => ({
            id: r.id,
            name: r.name,
            startDate: r.start_date,
            endDate: r.end_date,
            multiplier: r.multiplier
        }));
        res.json(rules);
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
    app.get('*', (req, res) => {
        res.send('<h1>Backend Running</h1><p>Frontend not built. Please run <code>npm run build</code> to generate the dist folder.</p>');
    });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});