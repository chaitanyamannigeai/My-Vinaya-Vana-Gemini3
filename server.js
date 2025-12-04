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

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    try {
        // Simple auth check that doesn't rely on complex tables first
        const [rows] = await pool.query("SELECT value FROM site_settings WHERE key_name = 'general_settings'");
        let adminPassword = 'admin123';
        if (rows.length > 0) {
            const settings = parseJSON(rows[0].value);
            if (settings?.adminPasswordHash) adminPassword = settings.adminPasswordHash;
        }
        if (password === adminPassword) res.json({ success: true });
        else res.status(401).json({ error: 'Invalid password' });
    } catch (err) {
        // If settings table missing, allow default login
        if (password === 'admin123') res.json({ success: true });
        else res.status(500).json({ error: 'Server error' });
    }
});

// --- REVIEWS (WITH SELF-HEALING) ---
app.get('/api/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM reviews');
        res.json(rows.map(r => ({ id: r.id, guestName: r.guest_name || 'Guest', location: r.location || '', rating: r.rating || 5, comment: r.comment || '', date: r.date, showOnHome: !!r.show_on_home })));
    } catch(e) { 
        // If table doesn't exist, return empty array instead of crashing
        res.json([]); 
    }
});

app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    const showOnHomeVal = showOnHome ? 1 : 0;

    // The SQL to run
    const upsertQuery = `INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guest_name=VALUES(guest_name), location=VALUES(location), rating=VALUES(rating), comment=VALUES(comment), date=VALUES(date), show_on_home=VALUES(show_on_home)`;
    const params = [id, guestName, location, rating, comment, date, showOnHomeVal];

    try {
        // Try to save normally
        await pool.query(upsertQuery, params);
        res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal });
    } catch (e) {
        console.log("⚠️ Reviews Table Error. Triggering Self-Healing...");
        
        try {
            // NUCLEAR OPTION: Recreate table with correct schema
            await pool.query(`DROP TABLE IF EXISTS reviews`);
            await pool.query(`
                CREATE TABLE reviews (
                    id VARCHAR(255) PRIMARY KEY,
                    guest_name VARCHAR(255),
                    location VARCHAR(255),
                    rating INT,
                    comment TEXT,
                    date VARCHAR(50),
                    show_on_home BOOLEAN DEFAULT 0
                )
            `);
            console.log("✅ Reviews Table Recreated.");
            
            // Retry Save
            await pool.query(upsertQuery, params);
            res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal, repaired: true });
        } catch (fatalError) {
            console.error(fatalError);
            res.status(500).json({ error: fatalError.message });
        }
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try { await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// --- PRICING (WITH SELF-HEALING) ---
app.get('/api/pricing', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pricing_rules');
        res.json(rows.map(r => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, multiplier: r.multiplier })));
    } catch(e) { res.json([]); }
});

app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    
    const upsertQuery = `INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), start_date=VALUES(start_date), end_date=VALUES(end_date), multiplier=VALUES(multiplier)`;
    const params = [id, name, startDate, endDate, multiplier];

    try {
        await pool.query(upsertQuery, params);
        res.json({ success: true });
    } catch (e) {
        console.log("⚠️ Pricing Table Error. Triggering Self-Healing...");
        try {
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
            console.log("✅ Pricing Table Recreated.");
            await pool.query(upsertQuery, params);
            res.json({ success: true, repaired: true });
        } catch (fatalError) {
            res.status(500).json({error: fatalError.message});
        }
    }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try { await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// --- OTHER ENTITIES (Standard) ---

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
      // Auto-fix ID type if needed
      try { await pool.query("INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), capacity=VALUES(capacity), amenities=VALUES(amenities), images=VALUES(images)", [id, name, description, basePrice, capacity, amenities, images]); }
      catch(e) { 
          // If room save fails, try one quick fix
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
app.delete('/api/drivers/:id', async (req, res) => { try { await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]); res.json({success:true});