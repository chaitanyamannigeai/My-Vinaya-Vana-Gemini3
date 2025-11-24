import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import Accommodation from './pages/public/Accommodation';
import Gallery from './pages/public/Gallery';
import Contact from './pages/public/Contact';
import Cabs from './pages/public/Cabs';
import Tariff from './pages/public/Tariff';
import Docs from './pages/public/Docs';
import Reviews from './pages/public/Reviews';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/admin/Login';
import { api } from './services/api'; // Import api to track hits

// Component to handle hit tracking
const HitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Only track hits on public-facing routes
    if (!location.pathname.startsWith('/admin')) {
      api.analytics.trackHit().catch(console.error);
    }
  }, [location.pathname]); // Re-run when the path changes

  return null;
};


function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
        {/* Hit Tracker always active */}
        <HitTracker />

        <Routes>
             <Route path="/admin/*" element={null} />
             <Route path="*" element={<Navbar />} />
        </Routes>
        
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/accommodation" element={<Accommodation />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cabs" element={<Cabs />} />
            <Route path="/tariff" element={<Tariff />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/reviews" element={<Reviews />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        <Routes>
             <Route path="/admin/*" element={null} />
             <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;