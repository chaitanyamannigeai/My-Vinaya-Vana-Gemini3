import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Book, Code, Settings, Key, Map, Users, ArrowLeft, Globe, Rocket, AlertTriangle, Lock, Download, Database, Monitor, Github, ServerCrash, Layers } from 'lucide-react';
import { api } from '../../services/api'; // Use real API

const { Link } = ReactRouterDOM as any;

const Docs = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sqlScript, setSqlScript] = useState(''); // State to hold SQL script content

  useEffect(() => {
    // Check if already logged in as admin or docs viewer
    const adminAuth = localStorage.getItem('vv_admin_auth');
    const docsAuth = sessionStorage.getItem('vv_docs_auth');
    
    if (adminAuth === 'true' || docsAuth === 'true') {
      setIsAuthenticated(true);
      // Fetch SQL script as it's needed for display
      api.docs.getSqlScript().then(setSqlScript).catch(console.error);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.auth.login(password); // Use real API for login
      setIsAuthenticated(true);
      sessionStorage.setItem('vv_docs_auth', 'true');
      // Fetch SQL script on successful login
      api.docs.getSqlScript().then(setSqlScript).catch(console.error);
    } catch (err: any) {
      console.error("Docs login error:", err);
      if (err.message.includes('401')) {
        setError('Incorrect password');
      } else {
        setError('Could not connect to server.');
      }
    }
  };

  const handleDownload = () => {
      if (!sqlScript) {
          alert("SQL script not loaded yet. Please try again.");
          return;
      }
      const element = document.createElement("a");
      const file = new Blob([sqlScript], {type: 'text/plain'}); // Use fetched script
      element.href = URL.createObjectURL(file);
      element.download = "Vinaya_Vana_Database_Schema.sql"; // More specific name
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nature-900 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4 text-nature-700 shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Protected Document</h2>
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
                    <Download size={18} /> Download SQL Script
                </button>
            </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
            
             {/* Terminology Section */}
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Layers size={32} />
                    <h2 className="text-2xl font-serif font-bold">1. Important Terminology</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-2">Static Website</h3>
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">What you have right now</div>
                        <p className="text-sm text-gray-600 mb-3">A simple "Brochure". It runs only in the browser. Data is saved in the browser (LocalStorage).</p>
                        <div className="text-xs font-mono bg-white p-2 rounded border">Render: "Static Site"</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-bold text-blue-900 mb-2">Dynamic Web App</h3>
                        <div className="text-xs text-blue-500 mb-2 uppercase tracking-wider font-semibold">With Database Connected</div>
                        <p className="text-sm text-blue-800 mb-3">A "Smart System". It runs on a server (`server.js`). Data is saved in a real Database.</p>
                        <div className="text-xs font-mono bg-white p-2 rounded border text-blue-800">Render: "Web Service"</div>
                    </div>
                </div>
            </div>

            {/* CLOUD HOSTING */}
            <section id="hosting-guide" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100 border-l-4 border-l-nature-600">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Rocket size={32} />
                    <h2 className="text-2xl font-serif font-bold">2. Hosting Guides</h2>
                </div>
                
                <div className="space-y-10">
                    
                    {/* PATH A */}
                    <div>
                        <div className="bg-gray-100 p-3 rounded-lg text-gray-800 text-sm mb-4 inline-block font-bold">
                            Path A: Static Hosting (Demo Mode)
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">Use this if you just want to show the design. <strong>Data will not be synced between users.</strong></p>
                        <div className="space-y-4 text-gray-700 pl-4 border-l-2 border-gray-100">
                             <div>
                                <h3 className="font-bold text-md mb-1">Hosting on Render</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                                    <li>Create New &rarr; <strong>Static Site</strong>.</li>
                                    <li>Build Command: <code>npm install && npm run build</code></li>
                                    <li>Publish Directory: <code>dist</code></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* PATH B */}
                    <div>
                        <div className="bg-blue-600 p-3 rounded-lg text-white text-sm mb-4 inline-flex items-center gap-2 font-bold shadow-md">
                            <Database size={16} /> Path B: Dynamic Hosting (Real Database)
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">Use this if you want to take real bookings. <strong>Requires `database.sql` setup.</strong></p>
                        <div className="space-y-4 text-gray-700 pl-4 border-l-2 border-blue-100">
                            <div>
                                <h3 className="font-bold text-md mb-1">1. Create Database</h3>
                                <p className="text-sm">Create a MySQL database (e.g., free on Aiven).</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-md mb-1">2. Create Web Service</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                                    <li>Go to Render &rarr; Create New &rarr; <strong>Web Service</strong>.</li>
                                    <li><strong>Build Command:</strong> <code>npm install && npm run build</code></li>
                                    <li><strong>Start Command:</strong> <code>node server.js</code></li>
                                    <li><strong>Environment Variables:</strong> Add <code>DATABASE_URL</code> with your Aiven connection string.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* HOME PC HOSTING */}
            <section id="home-hosting" className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100 border-l-4 border-l-purple-600">
                <div className="flex items-center gap-3 mb-6 text-purple-800">
                    <Monitor size={32} />
                    <h2 className="text-2xl font-serif font-bold">3. Host on Home PC</h2>
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
                            <li>Open that folder. Right-click in empty space &rarr; <strong>"Open in Terminal"</strong> (or Command Prompt).</li>
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
                    <h2 className="text-2xl font-serif font-bold">4. Database Schema</h2>
                </div>
                
                <p className="text-gray-700 mb-4">
                    Use the code below (or the file <code>database.sql</code>) to create your tables in your Aiven MySQL database.
                </p>

                <div className="bg-gray-800 text-gray-200 p-4 rounded-lg font-mono text-xs overflow-x-auto h-64 overflow-y-auto">
<pre>{`SET NAMES utf8mb4;

-- 1. ROOMS
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    capacity INT NOT NULL DEFAULT 2,
    amenities LONGTEXT, 
    images LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    room_id VARCHAR(50),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    check_in DATE,
    check_out DATE,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    vehicle_info VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CAB LOCATIONS
CREATE TABLE IF NOT EXISTS cab_locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    image_url LONGTEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    driver_id VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(50) PRIMARY KEY,
    guest_name VARCHAR(255),
    location VARCHAR(255),
    rating INT DEFAULT 5,
    comment TEXT,
    date DATE,
    show_on_home BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GALLERY
CREATE TABLE IF NOT EXISTS gallery (
    id VARCHAR(50) PRIMARY KEY,
    url LONGTEXT,
    category VARCHAR(100),
    caption TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRICING RULES
CREATE TABLE IF NOT EXISTS pricing_rules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    multiplier DECIMAL(3,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`}</pre>
                </div>
            </section>

            {/* OWNER MANUAL */}
            <section id="owner-manual" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Users size={32} />
                    <h2 className="text-2xl font-serif font-bold">5. Owner's Manual</h2>
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