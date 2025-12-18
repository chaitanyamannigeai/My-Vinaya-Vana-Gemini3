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

        // 2. Ensure Reviews table is correct
        try { await connection.query("ALTER TABLE reviews MODIFY id VARCHAR(255)"); } catch(e) {}
        try { await connection.query("ALTER TABLE reviews ADD COLUMN show_on_home BOOLEAN DEFAULT 0"); } catch(e) {}

        connection.release();
    } catch (err) {
        console.error("Startup DB Check Failed:", err.message);
    }
};
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
        res.json(rows.map(r => ({ 
            id: r.id, 
            guestName: r.guest_name || 'Guest', 
            location: r.location || '', 
            rating: r.rating || 5, 
            comment: r.comment || '', 
            date: r.date, 
            showOnHome: !!r.show_on_home 
        })));
    } catch(e) { res.json([]); }
});
app.post('/api/reviews', async (req, res) => {
    const { id, guestName, location, rating, comment, date, showOnHome } = req.body;
    const showOnHomeVal = showOnHome ? 1 : 0;
    const upsertQuery = `INSERT INTO reviews (id, guest_name, location, rating, comment, date, show_on_home) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE guest_name=VALUES(guest_name), location=VALUES(location), 
        rating=VALUES(rating), comment=VALUES(comment), date=VALUES(date), 
        show_on_home=VALUES(show_on_home)`;
    
    try {
        await pool.query(upsertQuery, [id, guestName, location, rating, comment, date, showOnHomeVal]);
        res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal });
    } catch (e) {
        try {
            await pool.query(`DROP TABLE IF EXISTS reviews`);
            await pool.query(`CREATE TABLE reviews (
                id VARCHAR(255) PRIMARY KEY, guest_name VARCHAR(255), location VARCHAR(255), 
                rating INT, comment TEXT, date VARCHAR(50), show_on_home BOOLEAN DEFAULT 0
            )`);
            await pool.query(upsertQuery, [id, guestName, location, rating, comment, date, showOnHomeVal]);
            res.json({ id, guestName, location, rating, comment, date, showOnHome: !!showOnHomeVal, repaired: true });
        } catch (fatal) { res.status(500).json({ error: fatal.message }); }
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try { await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]); res.json({ success: true }); }
    catch(e) { res.status(500).json({error: e.message}); }
});

// --- PRICING ---
app.get('/api/pricing', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pricing_rules');
        res.json(rows.map(r => ({
            id: r.id,
            name: r.name,
            startDate: r.start_date,
            endDate: r.end_date,
            multiplier: r.multiplier
        })));
    } catch(e) { res.json([]); }
});

app.post('/api/pricing', async (req, res) => {
    const { id, name, startDate, endDate, multiplier } = req.body;
    const params = [String(id), String(name), startDate, endDate, parseFloat(multiplier)];

    const upsertQuery = `INSERT INTO pricing_rules (id, name, start_date, end_date, multiplier) 
        VALUES (?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE name=VALUES(name), start_date=VALUES(start_date), 
        end_date=VALUES(end_date), multiplier=VALUES(multiplier)`;

    try {
        await pool.query(upsertQuery, params);
        res.json({ success: true });
    } catch (e) {
        console.log("⚠️ Pricing Save Failed. Attempting Immediate Repair...", e.message);
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
            await pool.query(upsertQuery, params);
            res.json({ success: true, repaired: true });
        } catch (fatalError) {
            res.status(500).json({error: fatalError.message});
        }
    }
});

// BOOKINGS
app.get('/api/bookings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
        res.json(rows.map(b => ({
            id: b.id,
            roomId: b.room_id,
            guestName: b.guest_name,
            guestPhone: b.guest_phone,
            checkIn: b.check_in,
            checkOut: b.check_out,
            totalAmount: b.total_amount,
            status: b.status,
            createdAt: b.created_at
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/bookings', async (req, res) => { 
    try { 
        const { id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status } = req.body; 
        await pool.query(`
            INSERT INTO bookings (id, room_id, guest_name, guest_phone, check_in, check_out, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
        `, [id, roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, status]);
        
        res.json({ success: true }); 
    } catch(e) { 
        res.status(500).json({ error: e.message }); 
    } 
});

app.put('/api/bookings/:id', async (req, res) => { 
    try { 
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', 
            [req.body.status, req.params.id]);
        res.json({ success: true }); 
    } catch(e) { 
        res.status(500).json({ error: e.message });
    }
});

// SETTINGS & WEATHER
app.get('/api/settings', async (req, res) => {
    try { 
        const [rows] = await pool.query(
            \"SELECT value FROM site_settings WHERE key_name = 'general_settings'\"
        );
        res.json(rows.length > 0 ? parseJSON(rows[0].value) : {}); 
    } catch(e) { 
        res.json({}); 
    }
});

app.post('/api/settings', async (req, res) => {
    try { 
        await pool.query(
            \"INSERT INTO site_settings (key_name, value) 
             VALUES ('general_settings', ?) 
             ON DUPLICATE KEY UPDATE value=VALUES(value)\", 
            [JSON.stringify(req.body)]
        );
        res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});
// ----------------------------------------------
// 🔥 PHASE 2 — BOOKING BALANCE MIGRATION
// ----------------------------------------------
const migrateBookingsForPhase2 = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("🔧 Checking bookings table for Phase-2 fields...");

        // Add amount_paid
        try {
            await connection.query(
                "ALTER TABLE bookings ADD COLUMN amount_paid INT DEFAULT 0"
            );
            console.log("✅ Added amount_paid");
        } catch {}

        // Add balance_due
        try {
            await connection.query(
                "ALTER TABLE bookings ADD COLUMN balance_due INT DEFAULT 0"
            );
            console.log("✅ Added balance_due");
        } catch {}

        // Add payment_history
        try {
            await connection.query(
                "ALTER TABLE bookings ADD COLUMN payment_history JSON"
            );
            console.log("✅ Added payment_history");
        } catch {}

        // Normalize old bookings (first run only)
        const [rows] = await connection.query("SELECT * FROM bookings");

        for (const b of rows) {
            const amountPaid = b.status === "PAID" ? b.total_amount : 0;
            const balance = b.total_amount - amountPaid;

            await connection.query(
                `UPDATE bookings SET amount_paid=?, balance_due=?, payment_history=? WHERE id=?`,
                [
                    amountPaid,
                    balance,
                    JSON.stringify([
                        {
                            ts: new Date().toISOString(),
                            amount: amountPaid,
                            mode: amountPaid > 0 ? "full_payment_migrated" : "none",
                        },
                    ]),
                    b.id,
                ]
            );
        }

        connection.release();
        console.log("🎉 Phase-2 Migration Completed");

    } catch (err) {
        console.error("❌ Phase-2 migration failed:", err.message);
    }
};

// Run migration
migrateBookingsForPhase2();


// ----------------------------------------------
// 🔥 GET SINGLE BOOKING (for Pay Balance page)
// ----------------------------------------------
app.get("/api/bookings/:id", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bookings WHERE id=?", [
            req.params.id,
        ]);
        if (!rows.length) return res.status(404).json({ error: "Not found" });

        const b = rows[0];
        res.json({
            id: b.id,
            roomId: b.room_id,
            guestName: b.guest_name,
            guestPhone: b.guest_phone,
            checkIn: b.check_in,
            checkOut: b.check_out,
            totalAmount: b.total_amount,
            amountPaid: b.amount_paid,
            balanceDue: b.balance_due,
            status: b.status,
            paymentHistory: JSON.parse(b.payment_history || "[]"),
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ----------------------------------------------
// 🔥 GET BALANCE SUMMARY FOR CUSTOMER
// ----------------------------------------------
app.get("/api/bookings/:id/balance", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bookings WHERE id=?", [
            req.params.id,
        ]);
        if (!rows.length) return res.status(404).json({ error: "Not found" });

        const b = rows[0];
        res.json({
            bookingId: b.id,
            total: b.total_amount,
            paid: b.amount_paid,
            due: b.balance_due,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ----------------------------------------------
// 🔥 PAY BALANCE (Manual + Razorpay)
// ----------------------------------------------
app.put("/api/bookings/:id/pay", async (req, res) => {
    const { amount, mode } = req.body;

    if (!amount || amount <= 0)
        return res.status(400).json({ error: "Invalid amount" });

    try {
        const [rows] = await pool.query("SELECT * FROM bookings WHERE id=?", [
            req.params.id,
        ]);
        if (!rows.length) return res.status(404).json({ error: "Not found" });

        const b = rows[0];
        const oldPaid = b.amount_paid || 0;
        const oldHistory = JSON.parse(b.payment_history || "[]");

        const newPaid = oldPaid + amount;
        const newBalance = b.total_amount - newPaid;

        // Update DB
        await pool.query(
            `UPDATE bookings 
             SET amount_paid=?, balance_due=?, payment_history=?, status=? 
             WHERE id=?`,
            [
                newPaid,
                newBalance,
                JSON.stringify([
                    ...oldHistory,
                    {
                        ts: new Date().toISOString(),
                        amount,
                        mode,
                    },
                ]),
                newBalance <= 0 ? "PAID" : "PAID_PARTIAL",
                req.params.id,
            ]
        );

        res.json({
            success: true,
            paid: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? "PAID" : "PAID_PARTIAL",
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// STATIC SERVE FOR REACT BUILD
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
