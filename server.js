const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large JSON for image uploads
app.use(express.static(path.join(__dirname, 'dist'))); // Serve React Frontend

// Database Connection (PostgreSQL)
// On Render, the connection string is provided in 'DATABASE_URL' env variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- API ENDPOINTS (Examples) ---

// 1. Get All Rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms');
    // Parse JSON fields if necessary
    const rooms = result.rows.map(r => ({
        ...r,
        amenities: JSON.parse(r.amenities || '[]'),
        images: JSON.parse(r.images || '[]')
    }));
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Create Booking
app.post('/api/bookings', async (req, res) => {
  const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// --- Catch-All Route for React Router ---
// This ensures that if you refresh the page on /contact, it loads index.html instead of 404
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database URL found: ${!!process.env.DATABASE_URL}`);
});
