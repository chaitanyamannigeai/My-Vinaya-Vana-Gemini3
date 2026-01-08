// App.tsx
import React, { useEffect, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import Accommodation from './pages/public/Accommodation';
import Availability from './pages/public/Availability'; 
import Gallery from './pages/public/Gallery';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Cabs from './pages/public/Cabs';
import Tariff from './pages/public/Tariff';
import Docs from './pages/public/Docs';
import Reviews from './pages/public/Reviews';
import PayBalance from './pages/public/PayBalance';
import { api } from './services/api';
import { Loader } from 'lucide-react';

// 🚀 PHASE 1: LAZY LOAD ADMIN & AUTH
// These components will NOT be downloaded by public visitors.
// This significantly reduces the "Main Thread Work" and "Payload Size".
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Login = React.lazy(() => import('./pages/admin/Login'));

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

// Simple Loading Spinner for Admin Transitions
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <Loader className="animate-spin text-green-600" size={40} />
  </div>
);

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
            {/* PUBLIC ROUTES (Loaded Eagerly for SEO) */}
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
            
            {/* ADMIN ROUTES (Lazy Loaded for Performance) */}
            <Route 
              path="/admin/login" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              } 
            />
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