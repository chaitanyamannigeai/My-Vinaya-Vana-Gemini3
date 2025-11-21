
# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## 📂 WHERE ARE THE SCRIPTS?

I have created the following files in your **Main Project Folder**:

1.  **`database.sql`**: The SQL code to create your database tables (Rooms, Bookings, Drivers, Cabs, Gallery, Settings, etc.).
2.  **`server.js`**: The complete backend server code handling ALL features.
3.  **`package.json`**: Configuration file that tells Render how to run your site.
4.  **`.env`**: A template file for your database password.

---

## ⚠️ TERMINOLOGY: STATIC VS DYNAMIC

**Static Website (What you have currently with Mock Data)**
- Runs entirely in the browser.
- Data saved in LocalStorage.
- Hosting Type: **Render Static Site** or **GitHub Pages**.

**Dynamic Web App (What you get with the Database)**
- Runs on a server using `node server.js`.
- Data saved in PostgreSQL Database.
- Hosting Type: **Render Web Service**.

---

## 1. HOSTING GUIDE (Choose ONE Path)

### Path A: Static Demo (Easiest, but no data sync)
1. Create a GitHub account & upload code.
2. Go to Render -> New **Static Site**.
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. Done.

### Path B: Real Business App (With Database)
1. Create a PostgreSQL Database (e.g., on Render or Neon.tech).
2. Run the scripts in `database.sql` to create tables.
3. Go to Render -> New **Web Service** (NOT Static Site).
4. Connect Repo.
5. **Build Command:** `npm install && npm run build`
6. **Start Command:** `node server.js`
7. **Environment Variables:** Add `DATABASE_URL` = [Your Connection String].

---

## 2. DATABASE SETUP (For Path B)

1. Create a PostgreSQL database.
2. Copy the contents of **`database.sql`**.
3. Run that SQL in your database console to create the tables.

---

## 3. OWNER'S MANUAL

### Exporting Data
- Go to Admin -> Bookings.
- Click the **Export CSV Report** button (top right).

### Messaging Guests
- Go to Admin -> Bookings.
- Click the **Chat** button next to any guest row.

### Login
- URL: /admin
- Default Password: admin123
