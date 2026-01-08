// App.tsx
import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import Accommodation from './pages/public/Accommodation';
import Availability from './pages/public/Availability'; 
import Gallery from './pages/public/Gallery';
import About from './pages/public/About'; // <--- Add this line
import Contact from './pages/public/Contact';
import Cabs from './pages/public/Cabs';
import Tariff from './pages/public/Tariff';
import Docs from './pages/public/Docs';
import Reviews from './pages/public/Reviews';
import PayBalance from './pages/public/PayBalance'; // NEW IMPORT
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/admin/Login';
import { api } from './services/api';

const { HashRouter: Router, Routes, Route, useLocation } = ReactRouterDOM as any;

const HitTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      api.analytics.trackHit().catch(e => console.warn("Analytics Error", e));
    }
  }, [location.pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
        <HitTracker />

        <Routes>
             <Route path="/admin/*" element={null} />
             <Route path="/pay-balance/*" element={null} /> {/* Hide Navbar on Pay Page */}
             <Route path="*" element={<Navbar />} />
        </Routes>
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/accommodation" element={<Accommodation />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />  {/* <--- Add this line */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/cabs" element={<Cabs />} />
            <Route path="/tariff" element={<Tariff />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/reviews" element={<Reviews />} />
            
            {/* New Payment Route */}
            <Route path="/pay-balance/:bookingId" element={<PayBalance />} />
            
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
          </Routes>
        </main>

        <Routes>
             <Route path="/admin/*" element={null} />
             <Route path="/pay-balance/*" element={null} /> {/* Hide Footer on Pay Page */}
             <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;