import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review, CabVehicle } from '../../types';
import { Settings, Calendar, Truck, Map as MapIcon, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock, Link as LinkIcon, Globe } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

// 🚀 ANALYTICS IMPORTS (Leaflet)
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [trafficStats, setTrafficStats] = useState<{month: string, count: number}[]>([]);
  const [deviceStats, setDeviceStats] = useState<{device_type: string, count: number}[]>([]);
  const [vehicles, setVehicles] = useState<CabVehicle[]>([]);
  
  // 🚀 ANALYTICS STATE
  const [geoData, setGeoData] = useState<{lat: number, lng: number, city: string, country: string, visits: number}[]>([]);
  const [geoRange, setGeoRange] = useState('24h');

  // Manual Booking State
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBooking, setManualBooking] = useState({ roomId: "", guestName: "", phone: "", checkIn: "", checkOut: "", amount: "", paid: "" });

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ bookingId: '', currentBalance: 0, amountToCollect: '' });

  // Auth Check
  useEffect(() => {
    const checkAuth = () => {
        const isAuth = sessionStorage.getItem('vv_admin_auth');
        if (isAuth !== 'true') navigate('/admin/login');
        else { setAuthLoading(false); loadTab('bookings'); }
    };
    checkAuth();
  }, [navigate]);

  // Data Loading
  const loadTab = async (tab: string) => {
      setLoading(true);
      try {
          if (tab === 'bookings') setBookings(await api.bookings.getAll());
          else if (tab === 'rooms') setRooms(await api.rooms.getAll());
          else if (tab === 'locations') { 
              setLocations(await api.locations.getAll()); 
              setDrivers(await api.drivers.getAll()); 
              setVehicles(await api.vehicles.getAll());
          }
          else if (tab === 'fleet') setVehicles(await api.vehicles.getAll());
          else if (tab === 'drivers') {
              setDrivers(await api.drivers.getAll());
              setVehicles(await api.vehicles.getAll());
          }
          else if (tab === 'pricing') setPricingRules(await api.pricing.getAll());
          else if (tab === 'gallery') setGallery(await api.gallery.getAll());
          else if (tab === 'reviews') setReviews(await api.reviews.getAll());
          else if (tab === 'analytics-map') {
              // Initial load for map data
              fetchGeoData('24h');
          }
          else if ((tab === 'settings' || tab === 'home-content')) {
              const s = await api.settings.get();
              setSettings(s);
              if (tab === 'home-content') {
                  try {
                      const resTraffic = await fetch('/api/analytics/traffic');
                      if (resTraffic.ok) setTrafficStats(await resTraffic.json());
                      const resDevice = await fetch('/api/analytics/devices');
                      if (resDevice.ok) setDeviceStats(await resDevice.json());
                  } catch (e) {}
              }
          }
      } catch (e) { console.error("Failed to load tab data", e); } 
      finally { setLoading(false); }
  };

  const fetchGeoData = async (range: string) => {
      setGeoRange(range);
      try {
          const res = await fetch(`/api/analytics/geo?range=${range}`);
          if (res.ok) setGeoData(await res.json());
      } catch (e) { console.error("Geo fetch failed", e); }
  };

  useEffect(() => { if (!authLoading) loadTab(activeTab); }, [activeTab, authLoading]);
  const handleLogout = () => { sessionStorage.removeItem('vv_admin_auth'); navigate('/'); };

  // ... [Existing Analytics & Actions logic preserved] ... 
  // (Assuming standard functions exist here: calculateAnalytics, updateBookingStatus, createManualBooking, etc.
  //  I am keeping the file clean by only showing the modifications below, but in a real copy-paste, 
  //  ensure the original logic functions are present.)
  const calculateAnalytics = () => {
      const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat((b.amountPaid || 0) as any)), 0);
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
      const monthlyRevenue: Record<string, number> = {};
      const months = [];
      const today = new Date();
      for(let i = -3; i <= 3; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyRevenue[key] = 0;
          months.push(key);
      }
      bookings.forEach(b => {
        if (b.amountPaid && b.amountPaid > 0) {
            const bookingDate = new Date(b.checkIn);
            if (!isNaN(bookingDate.getTime())) {
                const key = bookingDate.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (monthlyRevenue.hasOwnProperty(key)) monthlyRevenue[key] += (parseFloat(b.amountPaid as any) || 0);
            }
        }
      });
      return { totalRevenue, totalBookings, pendingBookings, monthlyRevenue, months };
  };
  const analytics = calculateAnalytics();

  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    try { await api.bookings.updateStatus(id, status); loadTab('bookings'); } catch (e) { alert("Failed"); }
  };

  const createManualBooking = async () => {
      if (!manualBooking.roomId || !manualBooking.guestName || !manualBooking.checkIn || !manualBooking.checkOut) { alert("Fill all fields"); return; }
      if (new Date(manualBooking.checkIn) >= new Date(manualBooking.checkOut)) { alert("Check-out must be after check-in"); return; }
      const total = Number(manualBooking.amount);
      const paid = Number(manualBooking.paid || 0);
      const booking: Booking = {
        id: `manual-${Date.now()}`,
        roomId: manualBooking.roomId.trim(),
        guestName: manualBooking.guestName.trim(),
        guestPhone: manualBooking.phone,
        checkIn: manualBooking.checkIn,
        checkOut: manualBooking.checkOut,
        totalAmount: total,
        amountPaid: paid,
        balanceAmount: total - paid,
        status: (total - paid) <= 1 ? PaymentStatus.PAID : (paid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING),
        createdAt: new Date().toISOString()
      };
      await api.bookings.add(booking);
      setBookings(await api.bookings.getAll());
      setShowManualBooking(false);
      setManualBooking({ roomId: '', guestName: '', phone: '', checkIn: '', checkOut: '', amount: '', paid: '' });
  };

  const handleCollectPayment = async () => {
      const amount = parseFloat(paymentData.amountToCollect);
      if (!amount || amount <= 0) { alert("Please enter a valid amount"); return; }
      try {
          await api.bookings.payBalance(paymentData.bookingId, amount);
          alert("Payment Recorded Successfully!");
          setShowPaymentModal(false);
          setPaymentData({ bookingId: '', currentBalance: 0, amountToCollect: '' });
          loadTab('bookings'); 
      } catch (e: any) {
          alert("Failed to update payment.");
      }
  };

  const openPaymentModal = (booking: Booking) => {
      setPaymentData({
          bookingId: booking.id,
          currentBalance: booking.balanceAmount || 0,
          amountToCollect: ''
      });
      setShowPaymentModal(true);
  };

  const copyPaymentLink = (id: string) => {
      const link = `${window.location.origin}/#/pay-balance/${id}`;
      navigator.clipboard.writeText(link);
      alert("Payment Link Copied: " + link);
  };

  const downloadBookingsCSV = () => {
    if (bookings.length === 0) { alert("No bookings to export."); return; }
    const headers = ["Booking ID", "Guest Name", "Phone", "Room ID", "Check In", "Check Out", "Total Amount", "Paid", "Balance", "Status"];
    const rows = bookings.map(b => [
        b.id, `"${b.guestName}"`, `"${b.guestPhone}"`, b.roomId, b.checkIn, b.checkOut, b.totalAmount, b.amountPaid, b.balanceAmount, b.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `VinayaVana_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CRUD Helpers
  const getRoomName = (roomId: string) => { const r = rooms.find(room => room.id === roomId); return r ? r.name : 'Unknown Room'; };
  const addRoomLocal = () => { setRooms([{ id: `r${Date.now()}`, name: 'New Room', description: 'Description...', basePrice: 3000, capacity: 2, amenities: ['Wifi', 'AC'], images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800'] }, ...rooms]); };
  const updateRoomLocal = (id: string, field: keyof Room, value: any) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  const updateRoomAmenitiesLocal = (id: string, val: string) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, amenities: val.split(',').map(s => s.trim()) } : r)); };
  const saveRoom = async (id: string) => { try { await api.rooms.save(rooms.find(r => r.id === id)!); alert("Room Saved!"); } catch (e) { alert("Error"); } };
  const deleteRoom = async (id: string) => { if (window.confirm("Delete?")) try { await api.rooms.delete(id); setRooms(prev => prev.filter(r => r.id !== id)); } catch(e) {} };

  const addDriverLocal = () => { setDrivers([{ id: Date.now().toString(), name: 'New Driver', phone: '', whatsapp: '', isDefault: false, active: true, vehicleInfo: '' }, ...drivers]); };
  const updateDriverLocal = (id: string, field: keyof Driver, value: any) => { setDrivers(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d)); };
  const saveDriver = async (id: string) => { try { await api.drivers.save(drivers.find(d => d.id === id)!); alert("Driver Saved!"); } catch (e) { alert("Error"); } };
  const deleteDriver = async (id: string) => { if (window.confirm("Delete?")) try { await api.drivers.delete(id); setDrivers(prev => prev.filter(d => d.id !== id)); } catch(e) {} };

  const addLocationLocal = () => { setLocations([{ id: Date.now().toString(), name: 'New Location', description: '', imageUrl: '', active: true, driverId: null, price: 0 }, ...locations]); };
  const updateLocationLocal = (id: string, field: keyof CabLocation, value: any) => { setLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l)); };
  const saveLocation = async (id: string) => { try { await api.locations.save(locations.find(l => l.id === id)!); alert("Location Saved!"); } catch(e) {} };
  const deleteLocation = async (id: string) => { if (window.confirm("Delete?")) try { await api.locations.delete(id); setLocations(prev => prev.filter(l => l.id !== id)); } catch(e) {} };

  const addPricingRuleLocal = () => { const newRule: PricingRule = { id: `pr${Date.now()}`, name: 'New Season', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], multiplier: 1.2 }; setPricingRules(prev => [newRule, ...prev]); };
  const updatePricingRuleLocal = (id: string, field: keyof PricingRule, value: any) => { setPricingRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  const savePricingRule = async (id: string) => { try { await api.pricing.save(pricingRules.find(r => r.id === id)!); alert("Rule Saved!"); } catch (e) { alert("Error"); } };
  const deletePricingRule = async (id: string) => { if (window.confirm("Delete?")) try { await api.pricing.delete(id); setPricingRules(prev => prev.filter(r => r.id !== id)); } catch(e) {} };

  const addGalleryItemLocal = () => { setGallery([{ id: `g${Date.now()}`, url: '', category: 'Property', caption: '' }, ...gallery]); };
  const updateGalleryItemLocal = (id: string, field: keyof GalleryItem, value: any) => { setGallery(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g)); };
  const saveGalleryItem = async (id: string) => { try { await api.gallery.save(gallery.find(g => g.id === id)!); alert("Image Saved!"); } catch (e) { alert("Error"); } };
  const deleteGalleryItem = async (id: string) => { if (window.confirm("Delete?")) try { await api.gallery.delete(id); setGallery(prev => prev.filter(g => g.id !== id)); } catch(e) {} };

  const addReviewLocal = () => { setReviews([{ id: `rev${Date.now()}`, guestName: 'Guest', location: '', rating: 5, comment: '', date: new Date().toISOString().split('T')[0], showOnHome: false }, ...reviews]); };
  const updateReviewLocal = (id: string, field: keyof Review, value: any) => { setReviews(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  const saveReview = async (id: string) => { try { await api.reviews.save(reviews.find(r => r.id === id)!); alert("Review Saved!"); } catch (e) { alert("Error"); } };
  const deleteReview = async (id: string) => { if (window.confirm("Delete?")) try { await api.reviews.delete(id); setReviews(prev => prev.filter(r => r.id !== id)); } catch(e) {} };

  const addVehicleLocal = () => { setVehicles([{ id: `v${Date.now()}`, name: 'New Vehicle', vehicleType: 'Sedan', capacity: 4, images: [], features: ['AC', 'Music'], baseRate: 0, active: true }, ...vehicles]); };
  const updateVehicleLocal = (id: string, field: keyof CabVehicle, value: any) => { setVehicles(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v)); };
  const updateVehicleFeatures = (id: string, val: string) => { setVehicles(prev => prev.map(v => v.id === id ? { ...v, features: val.split(',').map(s => s.trim()) } : v)); };
  const addVehicleImageSlot = (id: string) => { setVehicles(prev => prev.map(v => v.id === id ? { ...v, images: [...v.images, ''] } : v)); };
  const updateVehicleImage = (id: string, index: number, val: string) => { setVehicles(prev => prev.map(v => { if (v.id !== id) return v; const newImages = [...v.images]; newImages[index] = val; return { ...v, images: newImages }; })); };
  const removeVehicleImage = (id: string, index: number) => { setVehicles(prev => prev.map(v => { if (v.id !== id) return v; return { ...v, images: v.images.filter((_, i) => i !== index) }; })); };
  const saveVehicle = async (id: string) => { try { await api.vehicles.save(vehicles.find(v => v.id === id)!); alert("Vehicle Saved!"); } catch (e) { alert("Error"); } };
  const deleteVehicle = async (id: string) => { if (window.confirm("Delete?")) try { await api.vehicles.delete(id); setVehicles(prev => prev.filter(v => v.id !== id)); } catch(e) {} };

  // --- RENDER FUNCTIONS ---
  // (Existing render functions for Bookings, Rooms, Fleet, etc. are implicitly included. 
  // I am condensing them to focus on the NEW feature below)
  
  const renderBookings = () => (
    /* ... (Same as your provided file) ... */
    <div className="space-y-8">
        {/* ... Analytics Cards & Table ... */}
        {/* For brevity, I assume the previous 'renderBookings' logic is here */}
        <div className="text-center p-8 bg-white rounded shadow text-gray-500">Bookings Component Loaded</div>
    </div>
  );
  
  // ... (Other render functions: Rooms, Locations, Fleet, Drivers, Pricing, Gallery, Reviews, HomeContent, Settings) ...
  // Please ensure you keep your existing render functions! 
  // I will just add the NEW one below:

  // 🚀 NEW: Render Website Traffic Analytics Map
  const renderTrafficAnalytics = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800"><Globe size={20} className="text-blue-500"/> Live Visitor Map</h3>
              <div className="flex gap-2">
                  {['24h', '7d', '30d', '6m'].map(range => (
                      <button 
                          key={range}
                          onClick={() => fetchGeoData(range)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors font-medium ${geoRange === range ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                          {range === '24h' ? 'Last 24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '6 Months'}
                      </button>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative" style={{ height: '500px' }}>
              {/* Leaflet Map Container */}
              <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {geoData.map((point, idx) => (
                      <CircleMarker 
                          key={idx} 
                          center={[point.lat, point.lng]} 
                          radius={Math.min(point.visits * 2 + 3, 20)} // Size based on visits
                          fillColor={point.visits > 10 ? "#ef4444" : "#3b82f6"} // Red for high traffic
                          color={point.visits > 10 ? "#b91c1c" : "#1d4ed8"}
                          weight={1}
                          opacity={0.8}
                          fillOpacity={0.6}
                      >
                          <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                              <div className="text-center p-1">
                                  <div className="font-bold text-gray-800">{point.city}, {point.country}</div>
                                  <div className="text-xs text-gray-500">{point.visits} Visits</div>
                              </div>
                          </LeafletTooltip>
                      </CircleMarker>
                  ))}
              </MapContainer>
              
              {/* Overlay Stats */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Locations</div>
                  <div className="text-2xl font-bold text-gray-800">{geoData.length}</div>
              </div>
          </div>
      </div>
  );

  // Re-linking existing render functions for the full file
  // (In your actual file, keep the full implementations you sent me)
  // I am mapping them here for the switch statement below.

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-gray-100"><Loader className="animate-spin text-nature-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-nature-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          {/* 🚀 NEW MENU ITEM ADDED */}
          {['bookings', 'rooms', 'locations', 'fleet', 'drivers', 'pricing', 'gallery', 'reviews', 'analytics-map', 'home-content', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 capitalize ${activeTab === tab ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}>
                {/* Icons for tabs */}
                {tab === 'bookings' && <Calendar size={18}/>}
                {tab === 'rooms' && <Home size={18}/>}
                {tab === 'locations' && <MapIcon size={18}/>}
                {tab === 'fleet' && <Truck size={18}/>}
                {tab === 'drivers' && <User size={18}/>}
                {tab === 'pricing' && <DollarSign size={18}/>}
                {tab === 'gallery' && <ImageIcon size={18}/>}
                {tab === 'reviews' && <MessageSquare size={18}/>}
                {tab === 'analytics-map' && <Globe size={18}/>} {/* Icon for new tab */}
                {tab === 'home-content' && <LayoutTemplate size={18}/>}
                {tab === 'settings' && <Settings size={18}/>}
                <span className="capitalize">{tab.replace('-', ' ').replace('analytics map', 'Website Traffic Analytics')}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-nature-800"><LogOut size={18}/> Logout</button>
      </div>

      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-8">{activeTab.replace('-', ' ').replace('analytics map', 'Website Traffic Analytics')}</h1>
        <div className="animate-fade-in max-w-6xl">
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'rooms' && renderRooms()}
            {activeTab === 'locations' && renderLocations()}
            {activeTab === 'fleet' && renderFleet()} 
            {activeTab === 'drivers' && renderDrivers()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'gallery' && renderGallery()}
            {activeTab === 'reviews' && renderReviews()}
            {/* 🚀 NEW TAB RENDER */}
            {activeTab === 'analytics-map' && renderTrafficAnalytics()}
            {activeTab === 'home-content' && renderHomePageContent()}
            {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {showManualBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            {/* Manual Booking Modal Content (Same as original) */}
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-3">
                <h3 className="text-lg font-bold mb-4">Manual Booking</h3>
                <select value={manualBooking.roomId} onChange={(e) => setManualBooking({ ...manualBooking, roomId: e.target.value })} className="w-full border p-2 rounded">
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input type="text" placeholder="Guest Name" value={manualBooking.guestName} onChange={(e) => setManualBooking({ ...manualBooking, guestName: e.target.value })} className="w-full border p-2 rounded"/>
                <input type="text" placeholder="Phone" value={manualBooking.phone} onChange={(e) => setManualBooking({ ...manualBooking, phone: e.target.value })} className="w-full border p-2 rounded"/>
                <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={manualBooking.checkIn} onChange={(e) => setManualBooking({ ...manualBooking, checkIn: e.target.value })} className="border p-2 rounded"/>
                    <input type="date" value={manualBooking.checkOut} onChange={(e) => setManualBooking({ ...manualBooking, checkOut: e.target.value })} className="border p-2 rounded"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Total Amount" value={manualBooking.amount} onChange={(e) => setManualBooking({ ...manualBooking, amount: e.target.value })} className="border p-2 rounded"/>
                    <input type="number" placeholder="Paid So Far" value={manualBooking.paid} onChange={(e) => setManualBooking({ ...manualBooking, paid: e.target.value })} className="border p-2 rounded"/>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowManualBooking(false)} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={createManualBooking} className="px-4 py-2 bg-nature-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            {/* Payment Modal Content (Same as original) */}
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Banknote className="text-green-600" size={24}/>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Record Payment</h3>
                <p className="text-gray-500 text-sm mb-6">Current Balance Due: <span className="font-bold text-red-500">₹{paymentData.currentBalance}</span></p>
                <input 
                    type="number" 
                    placeholder="Amount Collected (₹)" 
                    value={paymentData.amountToCollect} 
                    onChange={(e) => setPaymentData({ ...paymentData, amountToCollect: e.target.value })} 
                    className="w-full border p-3 rounded-lg mb-4 text-lg font-bold text-center"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 border rounded-lg text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleCollectPayment} className="flex-1 py-3 bg-nature-600 text-white rounded-lg font-bold hover:bg-nature-700">Confirm</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;