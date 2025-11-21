
# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## ⚠️ CRITICAL LIMITATION

**Current Mode:** Demo / Single-User
**Data Storage:** Local Browser Storage

This means if a customer books on their phone, YOU WILL NOT SEE IT on your computer. Data is not shared between devices.
To fix this, a developer must connect this code to a cloud database (Firebase/SQL).

---

## 1. HOSTING GUIDE

### Option A: Hosting on Cloud (Render.com) - Recommended
1. Create a GitHub account.
2. Upload this code to a new repository.
3. Go to Render.com -> New Static Site -> Connect Repo.
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Click Create. Done!

### Option B: Hosting on GitHub Pages (Free)
1. On your PC, run command: `npm run build`
2. This creates a 'dist' folder.
3. Create a NEW repository on GitHub (e.g., 'my-website').
4. Upload ONLY the files inside the 'dist' folder to this repo.
5. Go to Repo Settings -> Pages -> Source: 'main' branch -> Save.

### Option C: Hosting on Home PC (Standalone)
1. Install Node.js from nodejs.org (LTS version).
2. Open the folder containing this code.
3. Right-click inside the folder -> "Open in Terminal" (or Command Prompt).
4. Type: `npm install` (and press Enter).
5. Type: `npm run dev` (and press Enter).
6. Open your browser to: `http://localhost:5173`

---

## 2. DATABASE SETUP

**Current Status:** This website uses a "Local Database" (LocalStorage). 
**Action Required:** NONE. It works out of the box!

**Future Upgrade (SQL Script):**
If you hire a developer to move this to a real server (MySQL/PostgreSQL), give them this script to create the tables:

```sql
-- 1. ROOMS
CREATE TABLE rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    base_price DECIMAL(10,2),
    capacity INT,
    amenities JSON,
    images JSON
);

-- 2. BOOKINGS
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    room_id VARCHAR(50),
    guest_name VARCHAR(100),
    guest_phone VARCHAR(20),
    check_in DATE,
    check_out DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20), -- PENDING, PAID, FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DRIVERS
CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    vehicle_info VARCHAR(100)
);

-- 4. CAB LOCATIONS
CREATE TABLE cab_locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    driver_id VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

-- 5. REVIEWS
CREATE TABLE reviews (
    id VARCHAR(50) PRIMARY KEY,
    guest_name VARCHAR(100),
    location VARCHAR(100),
    rating INT,
    comment TEXT,
    date DATE,
    show_on_home BOOLEAN DEFAULT FALSE
);
```

---

## 3. OWNER'S MANUAL

### Exporting Data
- Go to Admin -> Bookings.
- Click the **Export CSV Report** button (top right).
- This downloads an Excel-compatible file of all guests.

### Messaging Guests
- Go to Admin -> Bookings.
- Click the **Chat** button next to any guest row.
- It opens WhatsApp with a pre-filled message.

### Login
- URL: /admin
- Default Password: admin123

### Managing Prices
- Go to "Pricing Rules" in Admin.
- Add rules for seasons (e.g., Dec 20 - Jan 5, Multiplier 1.5x).

### Managing Cabs
- Go to "Cabs" tab to add locations.
- Go to "Drivers" tab to add driver details.
- Assign drivers to specific locations or use default.
