
# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## 📂 WHERE ARE THE SCRIPTS?

I have created the following files in your **Main Project Folder**:

1.  **`database.sql`**: The SQL code to create your database tables (Rooms, Bookings, Drivers, Cabs, Gallery, Settings, etc.).
2.  **`server.js`**: The complete backend server code handling ALL features.
3.  **`package.json`**: Configuration file that tells Render how to run your site.
4.  **`.env`**: A template file for your database password.

---

## ⚠️ CRITICAL LIMITATION (Current Mode)

**Current Mode:** Demo / Single-User (using `mockDb.ts`)
**Data Storage:** Local Browser Storage

The website currently runs in the browser. To make it "Real" (Multi-user), you must switch to using `server.js` and a real database.

---

## 1. HOSTING GUIDE

### Option A: Hosting on Cloud (Render.com) - Recommended
1. Create a GitHub account.
2. Upload this code to a new repository.
3. Go to Render.com -> New Web Service -> Connect Repo.
4. **Environment Variables:** You must add `DATABASE_URL` pointing to your Postgres DB.
5. **Build Command:** `npm install && npm run build`
6. **Start Command:** `node server.js`
7. Click Create. Done!

### Option B: Hosting on GitHub Pages (Free - Frontend Only)
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

**For Local Storage Mode:** No action required.

**For Real Server Mode:**
1. Create a PostgreSQL database (e.g., on Render or Neon.tech).
2. Copy the contents of **`database.sql`**.
3. Run that SQL in your database console to create the tables.
4. Paste your Database Connection URL into the `.env` file or Render Environment Variables.

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
