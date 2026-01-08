import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home'; // Critical Path - Keep Eager
import { api } from './services/api';

// 🚀 LAZY LOADING: Defer loading of heavy non-critical pages
const Accommodation = lazy(() => import('./pages/public/Accommodation'));
const Availability = lazy(() => import('./pages/public/Availability'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Cabs = lazy(() => import('./pages/public/Cabs'));
const Tariff = lazy(() => import('./pages/public/Tariff'));
const Docs = lazy(() => import('./pages/public/Docs'));
const Reviews = lazy(() => import('./pages/public/Reviews'));
const PayBalance = lazy(() => import('./pages/public/PayBalance'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Login = lazy(() => import('./pages/admin/Login'));

// Minimal Loading Spinner for Route Transitions
const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="w-8 h-8 border-4 border-nature-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
             <Route path="/pay-balance/*" element={null} />
             <Route path="*" element={<Navbar />} />
        </Routes>
        
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Home is Critical - No Lazy Load */}
              <Route path="/" element={<Home />} />
              
              <Route path="/accommodation" element={<Accommodation />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cabs" element={<Cabs />} />
              <Route path="/tariff" element={<Tariff />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/pay-balance/:bookingId" element={<PayBalance />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </main>

        <Routes>
             <Route path="/admin/*" element={null} />
             <Route path="/pay-balance/*" element={null} />
             <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;