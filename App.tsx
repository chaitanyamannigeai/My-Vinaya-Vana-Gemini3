
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
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