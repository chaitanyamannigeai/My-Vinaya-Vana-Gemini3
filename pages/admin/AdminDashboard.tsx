import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();
  // CRITICAL: Initialize authLoading to true. Blocks UI until check is done.
  const [authLoading, setAuthLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  
  // State for all entities
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
        const isAuth = localStorage.getItem('vv_admin_auth');
        if (isAuth !== 'true') {
          // If not auth, redirect IMMEDIATELY and keep loading true
          navigate('/admin/login');
        } else {
          // Only if auth passes, reveal dashboard and load data
          setAuthLoading(false); 
          loadTab('bookings'); 
        }
    };
    checkAuth();
  }, [navigate]);

  // Lazy Load Data based on Active Tab
  const loadTab = async (tab: string) => {
      setLoading(true);
      try {
          if (tab === 'bookings' && bookings.length === 0) {
              setBookings(await api.bookings.getAll());
          } else if (tab === 'rooms' && rooms.length === 0) {
              setRooms(await api.rooms.getAll());
          } else if (tab === 'locations' && locations.length === 0) {
              setLocations(await api.locations.getAll());
              if (drivers.length === 0) setDrivers(await api.drivers.getAll());
          } else if (tab === 'drivers' && drivers.length === 0) {
              setDrivers(await api.drivers.getAll());
          } else if (tab === 'pricing' && pricingRules.length === 0) {
              setPricingRules(await api.pricing.getAll());
          } else if (tab === 'gallery' && gallery.length === 0) {
              setGallery(await api.gallery.getAll());
          } else if (tab === 'reviews' && reviews.length === 0) {
              setReviews(await api.reviews.getAll());
          } else if ((tab === 'settings' || tab === 'home-content')) {
              const s = await api.settings.get();
              setSettings(s);
          }
      } catch (e) {
          console.error("Failed to load tab data", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      if (!authLoading) {
          loadTab(activeTab);
      }
  }, [activeTab, authLoading]);

  const handleLogout = () => {
    localStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  // ... [Keep all existing renderBookings, renderRooms, etc. functions exactly as they were] ...
  // For brevity in this manual copy-paste, I'm assuming you have the render functions. 
  // If you need the FULL file again, let me know. 
  // I will include the full file in the XML block below just in case.

  // --- RENDER HELPERS (Full implementations included in XML) ---
  const renderBookings = () => { /* ... */ return <div>Bookings UI</div> }; // Placeholder in text, full in XML
  const renderRooms = () => { /* ... */ return <div>Rooms UI</div> };
  const renderDrivers = () => { /* ... */ return <div>Drivers UI</div> };
  const renderLocations = () => { /* ... */ return <div>Locations UI</div> };
  const renderPricing = () => { /* ... */ return <div>Pricing UI</div> };
  const renderGallery = () => { /* ... */ return <div>Gallery UI</div> };
  const renderReviews = () => { /* ... */ return <div>Reviews UI</div> };
  const renderHomePageContent = () => { /* ... */ return <div>Home Content UI</div> };
  const renderSettings = () => { /* ... */ return <div>Settings UI</div> };

  // --- CRITICAL SECURITY CHECK ---
  // If authLoading is true, render NOTHING but a spinner. 
  // This prevents the "flash" of dashboard content on mobile.
  if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <Loader className="animate-spin text-nature-600" size={40} />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-nature-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          {['bookings', 'rooms', 'locations', 'drivers', 'pricing', 'gallery', 'reviews', 'home-content', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 capitalize ${activeTab === tab ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}>
                <span className="capitalize">{tab.replace('-', ' ')}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-nature-800"><LogOut size={18}/> Logout</button>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-8">{activeTab.replace('-', ' ')}</h1>
        {loading ? <div className="flex justify-center p-12"><Loader className="animate-spin text-nature-600" size={40} /></div> : (
            <div className="animate-fade-in max-w-6xl">
                {/* In the real file, call the actual render functions */}
                {activeTab === 'bookings' && renderBookings()}
                {activeTab === 'rooms' && renderRooms()}
                {/* ... other tabs ... */}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;