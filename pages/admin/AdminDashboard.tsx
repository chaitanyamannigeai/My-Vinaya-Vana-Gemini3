import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock, Link as LinkIcon } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

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
  
  // Manual Booking State
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBooking, setManualBooking] = useState({ roomId: "", guestName: "", phone: "", checkIn: "", checkOut: "", amount: "", paid: "" });

  // Auth Check
  useEffect(() => {
    const checkAuth = () => {
        const isAuth = sessionStorage.getItem('vv_admin_auth');
        if (isAuth !== 'true') navigate('/admin/login');
        else { setAuthLoading(false); loadTab('bookings'); }
    };
    checkAuth();
  }, [navigate]);

  // Data Loading - FIXED: Always refreshes data to prevent duplicate/stale issues
  const loadTab = async (tab: string) => {
      setLoading(true);
      try {
          if (tab === 'bookings') setBookings(await api.bookings.getAll());
          else if (tab === 'rooms') setRooms(await api.rooms.getAll());
          else if (tab === 'locations') { 
              setLocations(await api.locations.getAll()); 
              setDrivers(await api.drivers.getAll()); // Drivers needed for dropdown
          }
          else if (tab === 'drivers') setDrivers(await api.drivers.getAll());
          else if (tab === 'pricing') setPricingRules(await api.pricing.getAll());
          else if (tab === 'gallery') setGallery(await api.gallery.getAll());
          else if (tab === 'reviews') setReviews(await api.reviews.getAll());
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

  useEffect(() => { if (!authLoading) loadTab(activeTab); }, [activeTab, authLoading]);
  const handleLogout = () => { sessionStorage.removeItem('vv_admin_auth'); navigate('/'); };

  // Analytics
  const calculateAnalytics = () => {
      const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.amountPaid as any) || 0), 0);
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
        if (b.amountPaid > 0) {
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

  // Booking Actions
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
        roomId: manualBooking.roomId,
        guestName: manualBooking.guestName,
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

  // --- CRUD HELPERS ---
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

  const addPricingRuleLocal = () => { 
      // Ensure unique ID to prevent React duplicate key errors
      const newRule: PricingRule = { id: `pr${Date.now()}`, name: 'New Season', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], multiplier: 1.2 };
      setPricingRules(prev => [newRule, ...prev]); 
  };
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

  // --- RENDER FUNCTIONS ---
  const renderBookings = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div><p className="text-gray-500 text-sm font-medium">Total Revenue Collected</p><h3 className="text-2xl font-bold text-gray-800 mt-1">₹{analytics.totalRevenue.toLocaleString()}</h3></div>
                <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div><p className="text-gray-500 text-sm font-medium">Total Bookings</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.totalBookings}</h3></div>
                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Activity size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div><p className="text-gray-500 text-sm font-medium">Pending Actions</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.pendingBookings}</h3></div>
                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Clock size={24} /></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-nature-600"/> Monthly Revenue Trend</h3>
            <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-200 px-4">
                {analytics.months.map(month => {
                    const value = analytics.monthlyRevenue[month];
                    const maxVal = Math.max(...Object.values(analytics.monthlyRevenue), 1000); 
                    const heightPercent = Math.max((value / maxVal) * 100, 2); 
                    return (
                        <div key={month} className="flex flex-col items-center gap-2 w-full group relative h-full justify-end">
                            <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-white shadow px-2 py-1 rounded">₹{value.toLocaleString()}</div>
                            <div className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 relative ${value > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-100'}`} style={{ height: `${heightPercent}%` }}></div>
                            <span className="text-xs text-gray-500 font-medium">{month}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Guest Reservations</h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowManualBooking(true)} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700 shadow-sm"><Plus size={16} /> Manual</button>
                    <button onClick={downloadBookingsCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm"><Download size={16} /> Export</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financials</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map(b => (
                        <tr key={b.id}>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{b.guestName}</div>
                            <div className="text-sm text-gray-500">{b.guestPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{b.checkIn}</div>
                            <div className="text-xs text-gray-400">to {b.checkOut}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="font-bold">Total: ₹{b.totalAmount}</div>
                            <div className="text-green-600 text-xs">Paid: ₹{b.amountPaid || 0}</div>
                            {b.balanceAmount > 1 && <div className="text-red-500 text-xs font-bold">Due: ₹{b.balanceAmount}</div>}
                        </td>
                        <td className="px-6 py-4">
                            <select 
                                value={b.status}
                                onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)}
                                className={`text-xs rounded-full px-2 py-1 font-bold border-none outline-none cursor-pointer ${b.status === 'PAID' ? 'bg-green-100 text-green-800' : b.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PAID">Paid</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </td>
                        <td className="px-6 py-4 flex gap-3">
                            <a href={`https://wa.me/${b.guestPhone?.replace(/[^0-9]/g, '')}`} target="_blank" className="text-green-600 hover:text-green-800"><MessageCircle size={18} /></a>
                            {b.balanceAmount > 1 && (
                                <button onClick={() => copyPaymentLink(b.id)} title="Copy Balance Payment Link" className="text-blue-600 hover:text-blue-800"><LinkIcon size={18} /></button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
        <button onClick={addPricingRuleLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Seasonal Rule</button>
        <div className="grid gap-4">
            {pricingRules.map(rule => (
                <div key={rule.id} className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center gap-4 relative">
                      <div className="absolute top-2 right-2 flex gap-2"><button onClick={() => savePricingRule(rule.id)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button><button onClick={() => deletePricingRule(rule.id)} className="text-gray-400 hover:text-red-500 p-1 rounded"><X size={18}/></button></div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-2 md:mt-0">
                        <div><label className="text-xs text-gray-500">Season Name</label><input type="text" value={rule.name} onChange={(e) => updatePricingRuleLocal(rule.id, 'name', e.target.value)} className="border w-full p-2 rounded"/></div>
                        {/* BUG FIX 3: Added || '' to prevent reset issues */}
                        <div><label className="text-xs text-gray-500">Start Date</label><input type="date" value={rule.startDate || ''} onChange={(e) => updatePricingRuleLocal(rule.id, 'startDate', e.target.value)} className="border w-full p-2 rounded"/></div>
                        <div><label className="text-xs text-gray-500">End Date</label><input type="date" value={rule.endDate || ''} onChange={(e) => updatePricingRuleLocal(rule.id, 'endDate', e.target.value)} className="border w-full p-2 rounded"/></div>
                        <div><label className="text-xs text-gray-500">Multiplier</label><input type="number" step="0.1" value={rule.multiplier} onChange={(e) => updatePricingRuleLocal(rule.id, 'multiplier', parseFloat(e.target.value))} className="border w-full p-2 rounded font-bold text-nature-700"/></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderHomePageContent = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-3xl space-y-8">
         <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><LayoutTemplate size={20} /> Hero Section</h3>
            <div className="space-y-4"><ImageUploader label="Hero Background Image" value={settings.heroImageUrl} onChange={(val) => setSettings({...settings, heroImageUrl: val})} /></div>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><LayoutTemplate size={20} /> YouTube Video Section</h3>
            <div><label className="block text-sm font-medium text-gray-700">YouTube Video URL</label><input type="text" value={settings.youtubeVideoUrl} onChange={(e) => setSettings({...settings, youtubeVideoUrl: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/></div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-nature-900"><BarChart2 size={20}/> Website Traffic Analytics</h3>
            <div className="mb-8 bg-nature-50 p-4 rounded-lg border border-nature-200 inline-block">
                <p className="text-gray-700 text-sm">Total Historical Visits</p>
                <p className="font-bold text-nature-700 text-2xl">{settings.websiteHits?.toLocaleString() || 0}</p>
            </div>
            
            <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Monthly Unique Visits (Last 6 Months)</h4>
                <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-200 px-4">
                    {trafficStats.length > 0 ? trafficStats.map(stat => {
                        const maxVal = Math.max(...trafficStats.map(s => s.count), 10);
                        const heightPercent = Math.max((stat.count / maxVal) * 100, 2);
                        return (
                            <div key={stat.month} className="flex flex-col items-center gap-2 w-full group relative h-full justify-end">
                                <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-white shadow px-2 py-1 rounded">{stat.count.toLocaleString()}</div>
                                <div className="w-full max-w-[40px] rounded-t-md transition-all duration-500 bg-blue-500 hover:bg-blue-600 relative" style={{ height: `${heightPercent}%` }}></div>
                                <span className="text-xs text-gray-500 font-medium">{stat.month}</span>
                            </div>
                        );
                    }) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Waiting for visitor data...</div>}
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase flex items-center gap-2"><User size={16}/> Visitor Devices</h4>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    {deviceStats.length > 0 ? deviceStats.map(stat => (
                        <div key={stat.device_type} className="flex-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span>{stat.device_type}</span><span>{stat.count} visits</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${stat.device_type === 'Mobile' ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: `${(stat.count / deviceStats.reduce((a, b) => a + b.count, 0)) * 100}%` }}></div></div>
                        </div>
                    )) : <p className="text-xs text-gray-400 w-full text-center">No device data yet.</p>}
                </div>
            </div>
        </div>

        <button onClick={async () => { await api.settings.save(settings); alert("Content Saved!"); }} className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"><Save size={18} /> Save Content</button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-2xl space-y-8">
        <div className="border border-nature-200 rounded-lg p-6 bg-nature-50">
            <h3 className="text-lg font-bold mb-4 border-b border-nature-200 pb-2 flex items-center gap-2 text-nature-900"><Banknote size={20} /> Payment Configuration</h3>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (%)</label>
                         <input type="number" min="1" max="100" value={settings.advancePaymentPercentage || 20} onChange={(e) => setSettings({...settings, advancePaymentPercentage: parseInt(e.target.value)})} className="w-full border rounded p-2"/>
                         <p className="text-xs text-gray-500 mt-1">Percentage guests must pay to book.</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID</label>
                        <input type="text" value={settings.razorpayKey} onChange={(e) => setSettings({...settings, razorpayKey: e.target.value})} className="w-full border rounded p-2"/>
                    </div>
                </div>

                {/* BUG FIX 4: Added Missing Long Stay Discount Section */}
                <div className="bg-white p-4 rounded border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="enableDiscount" 
                            checked={settings.longStayDiscount?.enabled ?? true}
                            onChange={(e) => setSettings({
                                ...settings, 
                                longStayDiscount: { ...settings.longStayDiscount, enabled: e.target.checked }
                            })}
                        />
                        <label htmlFor="enableDiscount" className="text-sm font-medium flex items-center gap-2"><Percent size={16} /> Enable Long Stay Discount</label>
                    </div>
                    {settings.longStayDiscount?.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500">Minimum Days</label>
                                <input type="number" min="1" value={settings.longStayDiscount?.minDays ?? 5} onChange={(e) => setSettings({...settings, longStayDiscount: { ...settings.longStayDiscount, minDays: parseInt(e.target.value) }})} className="w-full border rounded p-2"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Discount (%)</label>
                                <input type="number" min="1" max="100" value={settings.longStayDiscount?.percentage ?? 20} onChange={(e) => setSettings({...settings, longStayDiscount: { ...settings.longStayDiscount, percentage: parseInt(e.target.value) }})} className="w-full border rounded p-2 font-bold text-nature-700"/>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><Settings size={20}/> Site Configuration</h3>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">WhatsApp</label><input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Admin Password</label><input type="text" value={settings.adminPasswordHash} onChange={(e) => setSettings({...settings, adminPasswordHash: e.target.value})} className="mt-1 block w-full border p-2 rounded bg-gray-50"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Address</label><textarea value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="mt-1 block w-full border p-2 rounded h-20"/></div>
                <div><label className="block text-sm font-medium text-gray-700 flex items-center gap-2"><Map size={16}/> Google Map Embed URL</label><input type="text" value={settings.googleMapUrl || ''} onChange={(e) => setSettings({...settings, googleMapUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">OpenWeatherMap API Key</label><input type="text" value={settings.weatherApiKey || ''} onChange={(e) => setSettings({...settings, weatherApiKey: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
            </div>
        </div>
        <button onClick={async () => { await api.settings.save(settings); alert("Settings Saved!"); }} className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"><Save size={18} /> Save Settings</button>
    </div>
  );

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-gray-100"><Loader className="animate-spin text-nature-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
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

      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-8">{activeTab.replace('-', ' ')}</h1>
        <div className="animate-fade-in max-w-6xl">
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'rooms' && renderRooms()}
            {activeTab === 'locations' && renderLocations()}
            {activeTab === 'drivers' && renderDrivers()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'gallery' && renderGallery()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'home-content' && renderHomePageContent()}
            {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {showManualBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
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
    </div>
  );
};

export default AdminDashboard;