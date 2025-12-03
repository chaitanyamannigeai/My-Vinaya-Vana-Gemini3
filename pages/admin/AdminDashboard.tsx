import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // 1. CRITICAL SECURITY FIX: Start with authLoading = true
  const [authLoading, setAuthLoading] = useState(true); 
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // --- STRICT AUTH CHECK ---
  useEffect(() => {
    const checkAuth = () => {
        const isAuth = localStorage.getItem('vv_admin_auth');
        if (isAuth !== 'true') {
          navigate('/admin/login');
          // Do NOT set authLoading to false here. 
          // Keep it true so the UI never renders.
        } else {
          // Only reveal dashboard if auth is confirmed
          setAuthLoading(false);
          loadTab('bookings'); 
        }
    };
    checkAuth();
  }, [navigate]);

  // ... [Load Data Logic] ...
  const loadTab = async (tab: string) => {
      setLoading(true);
      try {
          if (tab === 'bookings' && bookings.length === 0) setBookings(await api.bookings.getAll());
          else if (tab === 'rooms' && rooms.length === 0) setRooms(await api.rooms.getAll());
          else if (tab === 'locations' && locations.length === 0) { setLocations(await api.locations.getAll()); if(drivers.length===0) setDrivers(await api.drivers.getAll()); }
          else if (tab === 'drivers' && drivers.length === 0) setDrivers(await api.drivers.getAll());
          else if (tab === 'pricing' && pricingRules.length === 0) setPricingRules(await api.pricing.getAll());
          else if (tab === 'gallery' && gallery.length === 0) setGallery(await api.gallery.getAll());
          else if (tab === 'reviews' && reviews.length === 0) setReviews(await api.reviews.getAll());
          else if ((tab === 'settings' || tab === 'home-content')) setSettings(await api.settings.get());
      } catch (e) { console.error("Failed to load tab data", e); } 
      finally { setLoading(false); }
  };

  useEffect(() => { if (!authLoading) loadTab(activeTab); }, [activeTab, authLoading]);

  const handleLogout = () => {
    localStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  // --- 2. REVENUE GRAPH FIX ---
  const calculateAnalytics = () => {
      const totalRevenue = bookings.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (parseFloat(b.totalAmount as any) || 0), 0);
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

      // Last 6 Months Keys (e.g. "Dec 25", "Nov 25")
      const monthlyRevenue: Record<string, number> = {};
      const months = [];
      const today = new Date();
      
      for(let i=5; i>=0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          // Force English locale for consistency
          const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' }); 
          monthlyRevenue[key] = 0;
          months.push(key);
      }

      bookings.forEach(b => {
          if (b.status === 'PAID') {
              const d = new Date(b.createdAt);
              if (!isNaN(d.getTime())) {
                  // Match the exact format used above
                  const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                  if (monthlyRevenue[key] !== undefined) {
                      monthlyRevenue[key] += (parseFloat(b.totalAmount as any) || 0);
                  }
              }
          }
      });

      return { totalRevenue, totalBookings, pendingBookings, monthlyRevenue, months };
  };

  const analytics = calculateAnalytics();

  // ... [Helper Functions: updateBookingStatus, downloadBookingsCSV, etc.] ...
  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    try { await api.bookings.updateStatus(id, status); } catch (e) { alert("Failed"); loadTab('bookings'); }
  };
  const downloadBookingsCSV = () => {
    if (bookings.length === 0) { alert("No bookings."); return; }
    const headers = ["ID", "Guest", "Phone", "Room", "In", "Out", "Amount", "Status", "Date"];
    const rows = bookings.map(b => [b.id, `"${b.guestName}"`, `"${b.guestPhone}"`, b.roomId, b.checkIn, b.checkOut, b.totalAmount, b.status, b.createdAt.split('T')[0]]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `VinayaVana_Bookings.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ... [Local Edit Helpers: addRoomLocal, saveRoom, etc. - keep existing] ...
  // (I am omitting them here for brevity, but you should keep them in your file)
  const addRoomLocal = () => { const newRoom: Room = { id: `r${Date.now()}`, name: 'New Room', description: 'Desc...', basePrice: 3000, capacity: 2, amenities: ['Wifi'], images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'] }; setRooms([newRoom, ...rooms]); };
  const updateRoomLocal = (id: string, field: keyof Room, value: any) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  const updateRoomAmenitiesLocal = (id: string, val: string) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, amenities: val.split(',').map(s => s.trim()) } : r)); };
  const saveRoom = async (id: string) => { const room = rooms.find(r => r.id === id); if (room) { try { await api.rooms.save(room); alert("Saved!"); } catch(e) { alert("Error"); } } };
  const deleteRoom = async (id: string) => { if (window.confirm("Delete?")) { try { await api.rooms.delete(id); setRooms(prev => prev.filter(r => r.id !== id)); } catch(e) { alert("Error"); } } };

  const addDriverLocal = () => { const d: Driver = { id: Date.now().toString(), name: 'New', phone: '', whatsapp: '', isDefault: false, active: true, vehicleInfo: '' }; setDrivers([d, ...drivers]); };
  const updateDriverLocal = (id: string, f: keyof Driver, v: any) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, [f]: v } : d));
  const saveDriver = async (id: string) => { const d = drivers.find(d => d.id === id); if(d) { await api.drivers.save(d); alert("Saved"); } };
  const deleteDriver = async (id: string) => { if(confirm("Delete?")) { await api.drivers.delete(id); setDrivers(prev => prev.filter(d => d.id !== id)); } };

  const addLocationLocal = () => { const l: CabLocation = { id: Date.now().toString(), name: 'New', description: '', imageUrl: '', active: true, price: 0 }; setLocations([l, ...locations]); };
  const updateLocationLocal = (id: string, f: keyof CabLocation, v: any) => setLocations(prev => prev.map(l => l.id === id ? { ...l, [f]: v } : l));
  const saveLocation = async (id: string) => { const l = locations.find(l => l.id === id); if(l) { await api.locations.save(l); alert("Saved"); } };
  const deleteLocation = async (id: string) => { if(confirm("Delete?")) { await api.locations.delete(id); setLocations(prev => prev.filter(l => l.id !== id)); } };
  
  // ... [Repeat for Pricing, Gallery, Reviews, Settings helpers - keep existing] ...
  const saveSettings = async () => { try { await api.settings.save(settings); alert("Saved!"); } catch(e) { alert("Error"); } };
  const addPricingRuleLocal = () => { setPricingRules([{ id: `pr${Date.now()}`, name: 'New', startDate: '', endDate: '', multiplier: 1.0 }, ...pricingRules]); };
  const updatePricingRuleLocal = (id: string, f: keyof PricingRule, v: any) => setPricingRules(prev => prev.map(r => r.id === id ? { ...r, [f]: v } : r));
  const savePricingRule = async (id: string) => { const r = pricingRules.find(r => r.id === id); if(r) { await api.pricing.save(r); alert("Saved"); } };
  const deletePricingRule = async (id: string) => { if(confirm("Delete?")) { await api.pricing.delete(id); setPricingRules(prev => prev.filter(r => r.id !== id)); } };

  const addGalleryItemLocal = () => { setGallery([{ id: `g${Date.now()}`, url: '', category: 'General', caption: '' }, ...gallery]); };
  const updateGalleryItemLocal = (id: string, f: keyof GalleryItem, v: any) => setGallery(prev => prev.map(g => g.id === id ? { ...g, [f]: v } : g));
  const saveGalleryItem = async (id: string) => { const g = gallery.find(g => g.id === id); if(g) { await api.gallery.save(g); alert("Saved"); } };
  const deleteGalleryItem = async (id: string) => { if(confirm("Delete?")) { await api.gallery.delete(id); setGallery(prev => prev.filter(g => g.id !== id)); } };

  const addReviewLocal = () => { setReviews([{ id: `rev${Date.now()}`, guestName: 'Guest', location: '', rating: 5, comment: '', date: '', showOnHome: false }, ...reviews]); };
  const updateReviewLocal = (id: string, f: keyof Review, v: any) => setReviews(prev => prev.map(r => r.id === id ? { ...r, [f]: v } : r));
  const saveReview = async (id: string) => { const r = reviews.find(r => r.id === id); if(r) { await api.reviews.save(r); alert("Saved"); } };
  const deleteReview = async (id: string) => { if(confirm("Delete?")) { await api.reviews.delete(id); setReviews(prev => prev.filter(r => r.id !== id)); } };


  // --- RENDER FUNCTIONS (Simplified for brevity, assumes you have the full UI code) ---
  // IMPORTANT: Ensure your renderBookings has the Chart section!
  const renderBookings = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-green-600">₹{analytics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-blue-600">{analytics.totalBookings}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Pending</p>
                <h3 className="text-2xl font-bold text-yellow-600">{analytics.pendingBookings}</h3>
            </div>
        </div>

        {/* CHART FIX: Ensure height calculation is safe */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp size={20}/> Monthly Revenue</h3>
            <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-200 px-4">
                {analytics.months.map(month => {
                    const value = analytics.monthlyRevenue[month] || 0;
                    const maxVal = Math.max(...Object.values(analytics.monthlyRevenue), 1000); 
                    const heightPercent = Math.max((value / maxVal) * 100, 2); 
                    return (
                        <div key={month} className="flex flex-col items-center gap-2 w-full group relative">
                             {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded transition-opacity">
                                ₹{value.toLocaleString()}
                            </div>
                            <div 
                                className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${value > 0 ? 'bg-nature-500 hover:bg-nature-600' : 'bg-gray-100'}`}
                                style={{ height: `${heightPercent}%` }}
                            ></div>
                            <span className="text-xs text-gray-500">{month}</span>
                        </div>
                    )
                })}
            </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
             <div className="p-4 flex justify-end"><button onClick={downloadBookingsCSV} className="bg-green-600 text-white px-4 py-2 rounded flex gap-2"><Download size={16}/> CSV</button></div>
             <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Guest</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th></tr></thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                     {bookings.map(b => (
                         <tr key={b.id}>
                             <td className="px-6 py-4"><div>{b.guestName}</div><div className="text-xs text-gray-500">{b.guestPhone}</div></td>
                             <td className="px-6 py-4 font-bold">₹{b.totalAmount}</td>
                             <td className="px-6 py-4">
                                 <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)} className="text-sm border rounded p-1">
                                     <option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option>
                                 </select>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    </div>
  );

  // [Keep renderRooms, renderDrivers, etc. from your existing file or copy them from my previous long block]
  // For this snippet to work, you must ensure the other render functions (renderRooms, etc.) are defined below this point.

  // 3. CRITICAL SECURITY CHECK
  if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <Loader className="animate-spin text-nature-600" size={40} />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
       {/* ... Sidebar ... */}
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
         {/* ... Sidebar content ... */}
         <div className="p-6 font-bold text-xl">Admin</div>
         <nav className="flex-grow py-4">
             {['bookings', 'rooms', 'locations', 'drivers', 'pricing', 'gallery', 'reviews', 'home-content', 'settings'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-6 py-3 capitalize ${activeTab===tab ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}>{tab.replace('-', ' ')}</button>
             ))}
         </nav>
         <button onClick={handleLogout} className="p-6 text-red-300">Logout</button>
      </div>

      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-8">{activeTab.replace('-', ' ')}</h1>
        {loading ? <div className="flex justify-center p-12"><Loader className="animate-spin text-nature-600" size={40} /></div> : (
            <div className="animate-fade-in max-w-6xl">
                {activeTab === 'bookings' && renderBookings()}
                {/* Ensure you have the other render functions here */}
                {/* {activeTab === 'rooms' && renderRooms()} */}
                {/* ... */}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;