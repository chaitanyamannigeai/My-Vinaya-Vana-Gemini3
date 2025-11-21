
# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## 📂 WHERE ARE THE SCRIPTS?

I have created the following files in your **Main Project Folder**:

1.  **`database.sql`**: The SQL code to create your database tables.
2.  **`server.js`**: The backend server code for Render.
3.  **`package.json`**: Configuration file that tells Render how to run your site.

---

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

**Current Status:** This website uses a "Local Database" (LocalStorage). 
**Action Required:** NONE. It works out of the box!

**Future Upgrade:**
Use the `database.sql` file found in the root folder to create your tables in PostgreSQL.

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
