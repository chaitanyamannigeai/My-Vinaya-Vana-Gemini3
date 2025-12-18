import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";
import compression from "compression";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));

// DB Connection
const pool = mysql.createPool(process.env.DATABASE_URL || "");

// Utility JSON parser
const parseJSON = (data) => {
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data);
      return p;
    } catch {
      return data;
    }
  }
  return data;
};

// Run DB migrations at startup
const fixDatabaseSchema = async () => {
  try {
    const c = await pool.getConnection();
    console.log("🔧 DB Startup Checks running...");

    // BOOKINGS – add partial payment columns
    await c.query(
      "ALTER TABLE bookings ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0"
    ).catch(() => {});
    await c.query(
      "ALTER TABLE bookings ADD COLUMN balance_amount DECIMAL(10,2) DEFAULT 0"
    ).catch(() => {});
    await c.query(
      "ALTER TABLE bookings MODIFY status VARCHAR(50)"
    ).catch(() => {});

    // REVIEWS – fix ID type + home flag
    await c.query("ALTER TABLE reviews MODIFY id VARCHAR(255)").catch(() => {});
    await c
      .query(
        "ALTER TABLE reviews ADD COLUMN show_on_home BOOLEAN DEFAULT 0"
      )
      .catch(() => {});

    // PRICING – ensure IDs are string
    await c
      .query("ALTER TABLE pricing_rules MODIFY id VARCHAR(255)")
      .catch(() => {});

    c.release();
    console.log("✅ DB Schema OK");
  } catch (err) {
    console.log("DB Fix Failed:", err.message);
  }
};
fixDatabaseSchema();

/* ============================================================
   AUTH
============================================================ */
app.post("/api/auth/login", async (req, res) => {
  const { password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT value FROM site_settings WHERE key_name='general_settings'"
    );

    let adminPassword = "admin123";
    if (rows.length > 0) {
      const settings = parseJSON(rows[0].value);
      if (settings.adminPasswordHash) adminPassword = settings.adminPasswordHash;
    }

    if (password === adminPassword) return res.json({ success: true });
    return res.status(401).json({ error: "Invalid password" });
  } catch {
    if (password === "admin123") return res.json({ success: true });
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   ROOMS
============================================================ */
app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rooms");
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        basePrice: r.base_price,
        capacity: r.capacity,
        amenities: parseJSON(r.amenities),
        images: parseJSON(r.images),
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/rooms", async (req, res) => {
  try {
    const { id, name, description, capacity, basePrice } = req.body;
    const amenities = JSON.stringify(req.body.amenities || []);
    const images = JSON.stringify(req.body.images || []);

    await pool.query(
      `INSERT INTO rooms (id, name, description, base_price, capacity, amenities, images)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name),
       description=VALUES(description), base_price=VALUES(base_price),
       capacity=VALUES(capacity), amenities=VALUES(amenities), images=VALUES(images)`,
      [id, name, description, basePrice, capacity, amenities, images]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   BOOKINGS  — FULL + PARTIAL PAYMENT LOGIC
============================================================ */
app.get("/api/bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM bookings ORDER BY created_at DESC"
    );
    res.json(
      rows.map((b) => ({
        id: b.id,
        roomId: b.room_id,
        guestName: b.guest_name,
        guestPhone: b.guest_phone,
        checkIn: b.check_in,
        checkOut: b.check_out,
        totalAmount: b.total_amount,
        amountPaid: b.amount_paid,
        balanceAmount: b.balance_amount,
        status: b.status,
        createdAt: b.created_at,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE BOOKING — supports partial payments
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      id,
      roomId,
      guestName,
      guestPhone,
      checkIn,
      checkOut,
      totalAmount,
      amountPaid,
      balanceAmount,
      status,
    } = req.body;

    await pool.query(
      `INSERT INTO bookings
        (id, room_id, guest_name, guest_phone, check_in, check_out,
         total_amount, amount_paid, balance_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         amount_paid=VALUES(amount_paid),
         balance_amount=VALUES(balance_amount),
         status=VALUES(status)`,
      [
        id,
        roomId,
        guestName,
        guestPhone,
        checkIn,
        checkOut,
        totalAmount,
        amountPaid,
        balanceAmount,
        status,
      ]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update booking status
app.put("/api/bookings/:id", async (req, res) => {
  try {
    await pool.query("UPDATE bookings SET status=? WHERE id=?", [
      req.body.status,
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   SETTINGS
============================================================ */
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM site_settings WHERE key_name='general_settings'"
    );
    res.json(rows.length ? parseJSON(rows[0].value) : {});
  } catch {
    res.json({});
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO site_settings (key_name, value)
       VALUES ('general_settings', ?)
       ON DUPLICATE KEY UPDATE value=VALUES(value)`,
      [JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   STATIC FRONTEND
============================================================ */
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) =>
    res.sendFile(path.join(distPath, "index.html"))
  );
} else {
  app.get("*", (req, res) =>
    res.send("<h1>Backend Running</h1><p>Frontend not built.</p>")
  );
}

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🔥 Server running on ${PORT}`)
);
