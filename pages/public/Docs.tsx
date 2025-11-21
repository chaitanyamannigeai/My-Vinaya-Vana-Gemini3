
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Code, Settings, Key, Map, Users, ArrowLeft, Globe, Rocket, AlertTriangle, Lock, Download, Database, Monitor, Github, ServerCrash } from 'lucide-react';
import { db } from '../../services/mockDb';

const Docs = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in as admin
    const adminAuth = localStorage.getItem('vv_admin_auth');
    const docsAuth = sessionStorage.getItem('vv_docs_auth');
    
    if (adminAuth === 'true' || docsAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = db.settings.get();
    
    if (password === settings.adminPasswordHash) {
      setIsAuthenticated(true);
      sessionStorage.setItem('vv_docs_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleDownload = () => {
      const element = document.createElement("a");
      const file = new Blob([
`# VINAYA VANA FARMHOUSE - SYSTEM DOCUMENTATION

## 1. HOSTING GUIDE

### Option A: Cloud Hosting (Render.com) - Easiest & Best
1. Create a GitHub account.
2. Upload this code to a new repository.
3. Go to Render.com -> New Static Site -> Connect Repo.
4. Build Command: npm install && npm run build
5. Publish Directory: dist
6. Click Create. Done!

### Option B: GitHub Pages (Free)
1. On your PC, run command: npm run build
2. This creates a 'dist' folder.
3. Create a NEW repository on GitHub (e.g., 'my-website').
4. Upload ONLY the files inside the 'dist' folder to this repo.
5. Go to Repo Settings -> Pages -> Source: 'main' branch -> Save.

### Option C: Hosting on Home PC (Standalone)
1. Install Node.js from nodejs.org (LTS version).
2. Open the folder containing this code.
3. Right-click inside the folder -> "Open in Terminal" (or Command Prompt).
4. Type: npm install (and press Enter).
5. Type: npm run dev (and press Enter).
6. Open your browser to: http://localhost:5173

---

## 2. DATABASE SETUP

**Current Status:** This website uses a "Local Database" (LocalStorage). 
**Action Required:** NONE. It works out of the box!

**Future Upgrade (SQL Script):**
If you hire a developer to move this to a real server (MySQL/PostgreSQL), give them this script to create the tables:

\`\`\`sql
CREATE TABLE rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    base_price DECIMAL(10,2),
    capacity INT,
    amenities JSON,
    images JSON
);

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

CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    vehicle_info VARCHAR(100)
);

CREATE TABLE cab_locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    driver_id VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE reviews (
    id VARCHAR(50) PRIMARY KEY,
    guest_name VARCHAR(100),
    location VARCHAR(100),
    rating INT,
    comment TEXT,
    date DATE,
    show_on_home BOOLEAN DEFAULT FALSE
);

CREATE TABLE site_settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value TEXT -- Stores JSON config
);
\`\`\`

---

## 3. OWNER'S MANUAL

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
`
      ], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = "Vinaya_Vana_SOP.md";
      document.body.appendChild(element);
      element.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nature-900 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4 text-nature-700">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Protected Document</h2>
          <p className="text-gray-500 mb-6">Please enter the System Password to view the SOP.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500 outline-none transition-all"
              placeholder="Enter password..."
              autoFocus
            />
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-nature-700 hover:bg-nature-800 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Unlock Documentation
            </button>
          </form>
          <div className="mt-6">
             <Link to="/" className="text-sm text-gray-400 hover:text-nature-600">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
        <div className="bg-nature-900 text-white py-12">
            <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-nature-300 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Home
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">System Documentation</h1>
                    <p className="text-lg text-nature-200">Standard Operating Procedures (SOP) for Vinaya Vana</p>
                </div>
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-white/20"
                >
                    <Download size={18} /> Download SOP File
                </button>
            </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* CRITICAL WARNING */}
             <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                         <ServerCrash size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-lg mb-2">CRITICAL: System Limitations</h3>
                        <p className="text-red-800 text-sm leading-relaxed mb-3">
                            Currently, this website is running in <strong>Demo Mode (Local Storage)</strong>. 
                            This means all bookings, drivers, and settings are saved <strong>inside your browser</strong> only.
                        </p>
                        <ul className="list-disc list-inside text-red-800 text-sm space-y-1 mb-4">
                            <li>If a guest books on their Phone, <strong>you won't see it</strong> on your Admin Laptop.</li>
                            <li>If you clear your browser history, <strong>all data will be lost</strong>.</li>
                        </ul>
                        <div className="bg-white/50 p-3 rounded border border-red-200 text-xs font-medium text-red-900">
                            <strong>Solution:</strong> To use this for real customers, you must hire a developer to connect this code to a real cloud database (like Firebase, Supabase, or MySQL). The code is ready for this upgrade!
                        </div>
                    </div>
                </div>
            </div>

            {/* TROUBLESHOOTING NOTICE */}
             <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 font-bold text-orange-800 mb-1">
                    <AlertTriangle size={18} />
                    <span>Language Translation Issue?</span>
                </div>
                <p className="text-sm text-orange-800">
                    If you see "Refused to connect" when changing language, don't worry! 
                    Google Translate blocks running inside the "Preview" window. 
                    It will work perfectly once you host the website using one of the methods below.
                </p>
            </div>

            {/* CLOUD HOSTING */}
            <section id="hosting-guide" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100 border-l-4 border-l-nature-600">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Rocket size={32} />
                    <h2 className="text-2xl font-serif font-bold">1. Hosting Guides</h2>
                </div>
                
                <div className="space-y-10">
                    
                    {/* Option A */}
                    <div>
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm mb-4 inline-block font-bold">
                            Option A: Render.com (Recommended)
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">Best for simplicity. Render handles the building process for you.</p>
                        <div className="space-y-4 text-gray-700 pl-4 border-l-2 border-gray-100">
                            <div>
                                <h3 className="font-bold text-md mb-1 flex items-center gap-2">1. Get the Code</h3>
                                <p className="text-sm">Download the project code (ZIP file) and unzip it.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-md mb-1 flex items-center gap-2">2. Put it on GitHub</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                                    <li>Create a <a href="https://github.com" target="_blank" className="text-blue-600 hover:underline">GitHub account</a>.</li>
                                    <li>Create a "New Repository" named <code>vinaya-vana</code>.</li>
                                    <li>Upload all files to this repository.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-md mb-1 flex items-center gap-2">3. Connect to Render</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                                    <li>Go to <a href="https://render.com" target="_blank" className="text-blue-600 hover:underline">Render.com</a> -> Login with GitHub.</li>
                                    <li>Click "New +" -> <strong>Static Site</strong>.</li>
                                    <li>Select your <code>vinaya-vana</code> repository.</li>
                                    <li><strong>Settings (Important):</strong>
                                        <ul className="list-disc list-inside ml-6 font-mono text-xs bg-gray-100 p-2 mt-1 rounded">
                                            <li>Build Command: npm install && npm run build</li>
                                            <li>Publish Directory: dist</li>
                                        </ul>
                                    </li>
                                    <li>Click <strong>Create Static Site</strong>. Done!</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Option B */}
                    <div>
                        <div className="bg-gray-800 p-3 rounded-lg text-white text-sm mb-4 inline-flex items-center gap-2 font-bold">
                            <Github size={16} /> Option B: GitHub Pages
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">Great if you want everything on GitHub. Requires one manual step on your PC.</p>
                        <div className="space-y-4 text-gray-700 pl-4 border-l-2 border-gray-100">
                             <div>
                                <h3 className="font-bold text-md mb-1">1. Build on your PC</h3>
                                <p className="text-sm">Open terminal in project folder and run: <code className="bg-gray-100 px-1">npm run build</code></p>
                                <p className="text-sm text-gray-500 italic">This creates a new folder named <strong>dist</strong>.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-md mb-1">2. Upload 'dist' content</h3>
                                <p className="text-sm">Create a NEW GitHub repository. Upload <strong>ONLY</strong> the files inside the <code>dist</code> folder to it.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-md mb-1">3. Enable Pages</h3>
                                <p className="text-sm">Go to Repo Settings -> Pages -> Source: <strong>main</strong> branch -> Save.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* HOME PC HOSTING */}
            <section id="home-hosting" className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100 border-l-4 border-l-purple-600">
                <div className="flex items-center gap-3 mb-6 text-purple-800">
                    <Monitor size={32} />
                    <h2 className="text-2xl font-serif font-bold">2. Host on Home PC</h2>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-purple-800 text-sm mb-6">
                    <strong>Local Mode:</strong> Use this if you want to run the website on a standalone computer at home (e.g., at the reception desk) without using the internet.
                </div>

                <div className="space-y-6 text-gray-700">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Step 1: Install Node.js</h3>
                        <p>Download and install the "LTS Version" from <a href="https://nodejs.org" target="_blank" className="text-blue-600 underline">nodejs.org</a>. Click "Next" until installed.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2">Step 2: Prepare the Folder</h3>
                        <p>Unzip the website code into a folder (e.g., <code>Desktop/VinayaVana</code>).</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2">Step 3: Run the Commands</h3>
                        <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>Open that folder. Right-click in empty space -> <strong>"Open in Terminal"</strong> (or Command Prompt).</li>
                            <li>Type this exact command and press Enter:
                                <div className="bg-black text-green-400 font-mono p-2 rounded mt-1">npm install</div>
                                <span className="text-sm text-gray-500 italic">(Wait for it to finish downloading files...)</span>
                            </li>
                            <li>Type this command and press Enter:
                                <div className="bg-black text-green-400 font-mono p-2 rounded mt-1">npm run dev</div>
                            </li>
                        </ol>
                    </div>

                     <div>
                        <h3 className="font-bold text-lg mb-2">Step 4: Open Website</h3>
                        <p>Look at the black screen. It will say something like <code>Local: http://localhost:5173</code>.</p>
                        <p>Open Chrome and type <strong>http://localhost:5173</strong>.</p>
                    </div>
                </div>
            </section>
            
            {/* DATABASE SCHEMA */}
            <section id="database-setup" className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 border-l-4 border-l-green-600">
                 <div className="flex items-center gap-3 mb-6 text-green-800">
                    <Database size={32} />
                    <h2 className="text-2xl font-serif font-bold">3. Database Setup</h2>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-green-900 text-sm mb-6 font-medium">
                    ✅ GOOD NEWS: You do NOT need to set up a database for this version.
                </div>
                <p className="text-gray-700 mb-4">
                    This website uses a technology called <strong>LocalStorage</strong>. It creates a database automatically inside your browser's memory the moment you open the site.
                </p>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-bold text-gray-900 mb-2">For Future Upgrade (SQL Script)</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        If you later hire a developer to connect this to a MySQL or PostgreSQL server, give them this script to create the tables:
                    </p>
                    <div className="bg-gray-800 text-gray-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
<pre>{`-- 1. ROOMS
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
    status VARCHAR(20), -- 'PENDING', 'PAID', 'FAILED'
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
`}</pre>
                    </div>
                </div>
            </section>

            {/* OWNER MANUAL */}
            <section id="owner-manual" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Users size={32} />
                    <h2 className="text-2xl font-serif font-bold">4. Owner's Manual</h2>
                </div>
                
                <div className="space-y-6 text-gray-700">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">How to Login</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Go to the website menu and click "Admin" (or visit <code>/admin</code>).</li>
                            <li>Enter your password. Default is <strong>admin123</strong>.</li>
                            <li>Click Login.</li>
                        </ol>
                    </div>

                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">Changing Prices for Seasons</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>In Admin, click the <strong>Pricing Rules</strong> tab.</li>
                            <li>Click <strong>+ Add Seasonal Rule</strong>.</li>
                            <li>Enter the name (e.g., "Christmas"), start/end dates.</li>
                            <li>Enter the <strong>Multiplier</strong> (1.5 means 50% extra price).</li>
                        </ol>
                    </div>
                </div>
            </section>

        </div>

        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Quick Navigation</h3>
                <ul className="space-y-3">
                    <li>
                        <a href="#hosting-guide" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 hover:underline font-bold text-nature-700">
                            <Rocket size={18} /> Hosting Guides
                        </a>
                    </li>
                    <li>
                         <a href="#home-hosting" className="flex items-center gap-2 text-gray-600 hover:text-purple-600 hover:underline font-bold text-purple-700">
                            <Monitor size={18} /> Home PC Hosting
                        </a>
                    </li>
                    <li>
                        <a href="#database-setup" className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:underline font-bold text-green-700">
                            <Database size={18} /> Database Setup
                        </a>
                    </li>
                    <li>
                        <a href="#owner-manual" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 hover:underline">
                            <Users size={18} /> Owner's Manual
                        </a>
                    </li>
                </ul>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                    <Link to="/admin" className="block w-full text-center bg-nature-100 text-nature-800 py-2 rounded-lg font-medium hover:bg-nature-200">
                        Go to Admin Panel
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
