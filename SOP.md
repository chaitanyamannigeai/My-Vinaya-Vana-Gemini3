
# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## 📂 WHERE ARE THE SCRIPTS?

I have created the following files in your **Main Project Folder**:

1.  **`database.sql`**: The SQL code to create your tables in **MySQL** (Aiven).
2.  **`server.js`**: The backend server code updated to support MySQL.
3.  **`package.json`**: Updated dependencies (mysql2).
4.  **`.env`**: A template file for your database password.

---

## ⚠️ TERMINOLOGY: STATIC VS DYNAMIC

**Static Website (Demo Mode)**
- Runs entirely in the browser.
- Data saved in LocalStorage.
- Hosting Type: **Render Static Site** or **GitHub Pages**.

**Dynamic Web App (Real Business Mode)**
- Runs on a server using `node server.js`.
- Data saved in MySQL Database (Aiven).
- Hosting Type: **Render Web Service**.

---

## 1. HOSTING GUIDE: MySQL (Aiven) + Render

### Step 1: Create Database on Aiven
1. Create a free MySQL service on Aiven.
2. Copy the **Service URI** (starts with `mysql://...`).
3. Use a tool like **DBeaver** or **MySQL Workbench** to connect to Aiven.
4. Copy code from `database.sql` and run it in the tool to create tables.

### Step 2: Deploy on Render
1. Go to Render -> New **Web Service**.
2. Connect your GitHub Repo.
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `node server.js`
5. **Environment Variables:**
   - Key: `DATABASE_URL`
   - Value: [Paste your Aiven Service URI here]

---

## 2. OWNER'S MANUAL

### Exporting Data
- Go to Admin -> Bookings.
- Click the **Export CSV Report** button (top right).

### Messaging Guests
- Go to Admin -> Bookings.
- Click the **Chat** button next to any guest row.

### Login
- URL: /admin
- Default Password: admin123