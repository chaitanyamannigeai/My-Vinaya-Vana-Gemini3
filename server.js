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
const ROOT_DIR = process.cwd(); 
const DIST_PATH = path.join(ROOT_DIR, 'dist');

app.set('trust proxy', true); 

// ✅ PERF: Aggressive Compression
app.use(compression({
    level: 6, // Balance between CPU and Size
    threshold: 1024 // Only compress if > 1KB
}));

// ✅ SEO: Canonical Redirect
app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.slice(0, 4) === 'www.') {
    const newHost = req.headers.host.slice(4);
    return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// ✅ PERF: Smart API Caching
// Don't cache everything, but cache static-like data (Reviews, Pricing, Gallery)
const cacheMiddleware = (duration) => (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', `public, max-age=${duration}, must-revalidate`);
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
};

app.use('/api/reviews', cacheMiddleware(300)); // Cache for 5 mins
app.use('/api/gallery', cacheMiddleware(600)); // Cache for 10 mins
app.use('/api/pricing', cacheMiddleware(3600)); // Cache for 1 hour

// Default API Cache Control (No Store)
app.use('/api', (req, res, next) => {
    if (!res.getHeader('Cache-Control')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
});

// ... [KEEP ALL DB CONNECTIONS & API ROUTES EXACTLY AS THEY WERE] ...
// ... [INSERT THE MIDDLE PART OF YOUR ORIGINAL SERVER.JS HERE] ...

// --- STATIC FILE SERVING ---
if (fs.existsSync(DIST_PATH)) {
    // 🚀 ASSET CACHING: Immutable assets (hashed by Vite) get 1 year cache
    app.use('/assets', express.static(path.join(DIST_PATH, 'assets'), {
        maxAge: '1y',
        immutable: true, 
        etag: false, // Don't need ETag if immutable
    }));

    // Other static files (favicon, robots.txt) get 1 day
    app.use(express.static(DIST_PATH, {
        maxAge: '1d',
        etag: true
    }));

    app.get('*', (req, res) => {
        if (req.url.includes('.') && !req.url.includes('.html')) {
            return res.status(404).send('Not Found');
        }
        res.sendFile(path.join(DIST_PATH, 'index.html'));
    });
} else {
    app.get('*', (req, res) => res.send('<h1>Backend Running</h1><p>Frontend dist folder not found.</p>'));
}

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Vinaya Vana Server running on port ${PORT}`));