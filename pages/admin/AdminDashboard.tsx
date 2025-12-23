import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock, Link as LinkIcon } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';
// Ensure CabVehicle is imported from types
import { CabVehicle } from '../../types';

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
  const [vehicles, setVehicles] = useState<CabVehicle[]>([]); // ✅ NEW State


  
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
          else if (tab === 'fleet') setVehicles(await api.vehicles.getAll()); // ✅ NEW Tab Load
          else if (tab === 'rooms') setRooms(await api.rooms.getAll());
          else if (tab === 'locations') { 
              setLocations(await api.locations.getAll()); 
              setDrivers(await api.drivers.getAll()); 
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

  // --- HELPER TO GET ROOM NAME ---
  const getRoomName = (roomId: string) => {
      const r = rooms.find(room => room.id === roomId);
      return r ? r.name : 'Unknown Room';
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

  // ✅ NEW: Vehicle CRUD Helpers
  const addVehicleLocal = () => { 
      setVehicles([{ 
          id: `v${Date.now()}`, 
          name: 'New Vehicle', 
          vehicleType: 'Sedan', 
          capacity: 4, 
          images: [], 
          features: ['AC', 'Music'], 
          baseRate: 0,
          active: true 
      }, ...vehicles]); 
  };

  const updateVehicleLocal = (id: string, field: keyof CabVehicle, value: any) => { 
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v)); 
  };
  
  // Helper for comma-separated features
  const updateVehicleFeatures = (id: string, val: string) => {
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, features: val.split(',').map(s => s.trim()) } : v));
  };
  
  const saveVehicle = async (id: string) => { 
      try { await api.vehicles.save(vehicles.find(v => v.id === id)!); alert("Vehicle Saved!"); } catch (e) { alert("Error"); } 
  };
  
  const deleteVehicle = async (id: string) => { 
      if (window.confirm("Delete?")) try { await api.vehicles.delete(id); setVehicles(prev => prev.filter(v => v.id !== id)); } catch(e) {} 
  };

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest / Room</th>
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
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Home size={12}/> {getRoomName(b.roomId)}</div>
                            <div className="text-xs text-gray-400">{b.guestPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{b.checkIn}</div>
                            <div className="text-xs text-gray-400">to {b.checkOut}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="font-bold">Total: ₹{b.totalAmount}</div>
                            <div className="text-green-600 text-xs">Paid: ₹{b.amountPaid || 0}</div>
                            {/* Display Balance Amount explicitly */}
                            {(b.balanceAmount ?? 0) > 1 && <div className="text-red-500 text-xs font-bold">Due: ₹{b.balanceAmount}</div>}
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
                            {(b.balanceAmount ?? 0) > 1 && (
                                <button onClick={() => copyPaymentLink(b.id)} title="Copy Balance Payment Link" className="text-blue-600 hover:text-blue-800"><LinkIcon size={18} /></button>
                            )}
                            
                            {/* ✅ COLLECT PAYMENT BUTTON */}
                            {(b.balanceAmount ?? 0) > 1 && (
                                <button 
                                    onClick={() => openPaymentModal(b)} 
                                    className="text-nature-700 hover:text-nature-900 bg-nature-100 p-1 rounded" 
                                    title="Record Extra Payment"
                                >
                                    <Banknote size={18} />
                                </button>
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

  const renderRooms = () => (
    <div className="space-y-6">
      <button onClick={addRoomLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700 transition-all hover:scale-105"><Plus size={16} /> Add New Room</button>
      {rooms.map(room => (
        <div key={room.id} className="bg-white p-6 rounded-lg shadow flex flex-col lg:flex-row gap-6 relative border border-gray-100">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => saveRoom(room.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700" title="Save Changes"><Save size={16} /> Save</button>
                <button onClick={() => deleteRoom(room.id)} className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200" title="Delete"><Trash2 size={20} /></button>
            </div>
            <div className="lg:w-1/3"><ImageUploader label="Room Main Image" value={room.images[0]} onChange={(val) => { const newImgs = [...room.images]; newImgs[0] = val; updateRoomLocal(room.id, 'images', newImgs); }} /></div>
            <div className="lg:w-2/3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs text-gray-500">Room Name</label><input type="text" value={room.name} onChange={(e) => updateRoomLocal(room.id, 'name', e.target.value)} className="border rounded px-3 py-2 w-full font-bold"/></div>
                     <div><label className="block text-xs text-gray-500">Base Price (₹)</label><input type="number" value={room.basePrice} onChange={(e) => updateRoomLocal(room.id, 'basePrice', parseInt(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
                </div>
                <div><label className="block text-xs text-gray-500">Description</label><textarea value={room.description} onChange={(e) => updateRoomLocal(room.id, 'description', e.target.value)} className="border rounded px-3 py-2 w-full h-20"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="block text-xs text-gray-500">Capacity</label><input type="number" value={room.capacity} onChange={(e) => updateRoomLocal(room.id, 'capacity', parseInt(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
                    <div><label className="block text-xs text-gray-500">Amenities (comma separated)</label><input type="text" value={room.amenities.join(', ')} onChange={(e) => updateRoomAmenitiesLocal(room.id, e.target.value)} className="border rounded px-3 py-2 w-full"/></div>
                </div>
            </div>
        </div>
      ))}
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4">
        <button onClick={addLocationLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Cab Location</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map(loc => (
                <div key={loc.id} className="bg-white p-4 rounded-lg shadow relative border border-gray-100">
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                         <button onClick={() => saveLocation(loc.id)} className="bg-white text-blue-600 p-1 rounded shadow hover:bg-blue-50"><Save size={16}/></button>
                         <button onClick={() => deleteLocation(loc.id)} className="bg-white text-red-500 hover:bg-red-50 p-1 rounded shadow"><Trash2 size={16}/></button>
                    </div>
                    <div className="mb-4"><ImageUploader label="Location Image" value={loc.imageUrl} onChange={(val) => updateLocationLocal(loc.id, 'imageUrl', val)} /></div>
                    <div className="space-y-2">
                         <input type="text" value={loc.name} onChange={(e) => updateLocationLocal(loc.id, 'name', e.target.value)} className="font-bold border w-full p-1 rounded" placeholder="Location Name"/>
                         <textarea value={loc.description} onChange={(e) => updateLocationLocal(loc.id, 'description', e.target.value)} className="text-sm border w-full p-1 rounded h-20" placeholder="Description"/>
                        <div className="flex gap-2">
                            <div className="w-1/2"><label className="text-xs block text-gray-500">Price</label><input type="number" value={loc.price ?? ''} onChange={(e) => updateLocationLocal(loc.id, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))} className="border w-full p-1 rounded"/></div>
                            <div className="w-1/2"><label className="text-xs block text-gray-500">Driver</label><select value={loc.driverId || ''} onChange={(e) => updateLocationLocal(loc.id, 'driverId', e.target.value || null)} className="border w-full p-1 rounded text-sm"><option value="">Default Driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-4">
        <button onClick={addDriverLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Driver</button>
        <div className="grid gap-4">
            {drivers.map(d => (
                <div key={d.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-nature-500 relative">
                    <div className="absolute top-2 right-2 flex gap-2"><button onClick={() => saveDriver(d.id)} className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200"><Save size={18}/></button><button onClick={() => deleteDriver(d.id)} className="text-gray-400 hover:text-red-500 p-1"><X size={18}/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div><label className="text-xs text-gray-500 block">Name</label><input type="text" value={d.name} onChange={(e) => updateDriverLocal(d.id, 'name', e.target.value)} className="border w-full p-1 rounded"/></div>
                        <div><label className="text-xs text-gray-500 block">Phone</label><input type="text" value={d.phone} onChange={(e) => updateDriverLocal(d.id, 'phone', e.target.value)} className="border w-full p-1 rounded"/></div>
                        <div><label className="text-xs text-gray-500 block">WhatsApp</label><input type="text" value={d.whatsapp} onChange={(e) => updateDriverLocal(d.id, 'whatsapp', e.target.value)} className="border w-full p-1 rounded"/></div>
                        <div className="flex items-center gap-4 pt-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={d.isDefault} onChange={(e) => updateDriverLocal(d.id, 'isDefault', e.target.checked)} /> Default</label>
                             <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={d.active} onChange={(e) => updateDriverLocal(d.id, 'active', e.target.checked)} /> Active</label>
                        </div>
                    </div>
                    <div className="mt-2"><label className="text-xs text-gray-500 block">Vehicle Info</label><input type="text" value={d.vehicleInfo || ''} onChange={(e) => updateDriverLocal(d.id, 'vehicleInfo', e.target.value)} className="border w-full p-1 rounded" placeholder="e.g. Toyota Innova"/></div>
                </div>
            ))}
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
                        
                        <div>
                            <label className="text-xs text-gray-500">Start Date</label>
                            <input 
                                type="date" 
                                value={rule.startDate ? String(rule.startDate).split('T')[0] : ''} 
                                onChange={(e) => updatePricingRuleLocal(rule.id, 'startDate', e.target.value)} 
                                className="border w-full p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">End Date</label>
                            <input 
                                type="date" 
                                value={rule.endDate ? String(rule.endDate).split('T')[0] : ''} 
                                onChange={(e) => updatePricingRuleLocal(rule.id, 'endDate', e.target.value)} 
                                className="border w-full p-2 rounded"
                            />
                        </div>
                        
                        <div><label className="text-xs text-gray-500">Multiplier</label><input type="number" step="0.1" value={rule.multiplier} onChange={(e) => updatePricingRuleLocal(rule.id, 'multiplier', parseFloat(e.target.value))} className="border w-full p-2 rounded font-bold text-nature-700"/></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderGallery = () => (
      <div className="space-y-6">
          <button onClick={addGalleryItemLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Image</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow relative group border border-gray-100">
                       <div className="absolute top-2 right-2 flex gap-2 z-10"><button onClick={() => saveGalleryItem(item.id)} className="bg-white p-1 rounded-full text-blue-600 hover:bg-blue-50 shadow"><Save size={16}/></button><button onClick={() => deleteGalleryItem(item.id)} className="bg-white p-1 rounded-full text-red-500 hover:bg-red-50 shadow"><Trash2 size={16}/></button></div>
                      <div className="mb-3"><ImageUploader value={item.url} onChange={(val) => updateGalleryItemLocal(item.id, 'url', val)}/></div>
                      <div className="space-y-2">
                          <div><label className="text-xs text-gray-500">Category</label><input type="text" value={item.category} onChange={(e) => updateGalleryItemLocal(item.id, 'category', e.target.value)} className="border w-full p-1 rounded text-sm"/></div>
                          <div><label className="text-xs text-gray-500">Caption</label><input type="text" value={item.caption || ''} onChange={(e) => updateGalleryItemLocal(item.id, 'caption', e.target.value)} className="border w-full p-1 rounded text-sm"/></div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
        <button onClick={addReviewLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Review</button>
        <div className="grid gap-4">
            {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400 relative">
                    <div className="absolute top-2 right-2 flex gap-2"><button onClick={() => saveReview(rev.id)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button><button onClick={() => deleteReview(rev.id)} className="text-gray-400 hover:text-red-500 p-1"><X size={18}/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div><label className="text-xs text-gray-500">Guest Name</label><input type="text" value={rev.guestName} onChange={(e) => updateReviewLocal(rev.id, 'guestName', e.target.value)} className="border w-full p-1 rounded font-bold"/></div>
                        <div><label className="text-xs text-gray-500">Location</label><input type="text" value={rev.location} onChange={(e) => updateReviewLocal(rev.id, 'location', e.target.value)} className="border w-full p-1 rounded"/></div>
                        <div><label className="text-xs text-gray-500">Rating (1-5)</label><input type="number" min="1" max="5" value={rev.rating} onChange={(e) => updateReviewLocal(rev.id, 'rating', parseInt(e.target.value))} className="border w-full p-1 rounded"/></div>
                    </div>
                    <div className="mb-4"><label className="text-xs text-gray-500">Comment</label><textarea value={rev.comment} onChange={(e) => updateReviewLocal(rev.id, 'comment', e.target.value)} className="border w-full p-2 rounded h-20 text-sm"></textarea></div>
                    <div className="flex items-center justify-between">
                        <div><label className="text-xs text-gray-500">Date</label><input type="date" value={rev.date} onChange={(e) => updateReviewLocal(rev.id, 'date', e.target.value)} className="border ml-2 p-1 rounded"/></div>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={rev.showOnHome} onChange={(e) => updateReviewLocal(rev.id, 'showOnHome', e.target.checked)} id={`home-${rev.id}`} /><label htmlFor={`home-${rev.id}`} className="text-sm font-medium cursor-pointer">Show on Home Page</label></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // ... renderFunctions ...

  // ✅ NEW: Render Fleet (Vehicle Management)
  const renderFleet = () => (
    <div className="space-y-6">
        <button onClick={addVehicleLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700 transition-all hover:scale-105"><Plus size={16} /> Add Vehicle Type</button>
        <div className="grid gap-6">
            {vehicles.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-lg shadow flex flex-col lg:flex-row gap-6 relative border border-gray-100">
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button onClick={() => saveVehicle(v.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"><Save size={16} /> Save</button>
                        <button onClick={() => deleteVehicle(v.id)} className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200"><Trash2 size={20} /></button>
                    </div>
                    {/* Basic Image Upload (Main Image only for Chunk 3) */}
                    <div className="lg:w-1/3">
                        <ImageUploader 
                            label="Main Vehicle Image" 
                            value={v.images[0] || ''} 
                            onChange={(val) => { 
                                const newImgs = [...v.images]; 
                                newImgs[0] = val; 
                                updateVehicleLocal(v.id, 'images', newImgs); 
                            }} 
                        />
                    </div>
                    <div className="lg:w-2/3 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs text-gray-500">Vehicle Name</label><input type="text" value={v.name} onChange={(e) => updateVehicleLocal(v.id, 'name', e.target.value)} className="border rounded px-3 py-2 w-full font-bold" placeholder="e.g. Toyota Innova"/></div>
                            <div><label className="block text-xs text-gray-500">Vehicle Type</label><input type="text" value={v.vehicleType} onChange={(e) => updateVehicleLocal(v.id, 'vehicleType', e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="e.g. SUV"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-xs text-gray-500">Capacity</label><input type="number" value={v.capacity} onChange={(e) => updateVehicleLocal(v.id, 'capacity', parseInt(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
                            <div><label className="block text-xs text-gray-500">Display Rate (₹/km or fixed)</label><input type="number" value={v.baseRate || ''} onChange={(e) => updateVehicleLocal(v.id, 'baseRate', parseFloat(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
                            <div className="flex items-center pt-5"><label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" checked={v.active} onChange={(e) => updateVehicleLocal(v.id, 'active', e.target.checked)} /> Active / Available</label></div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Features (comma separated)</label>
                            <input type="text" value={v.features.join(', ')} onChange={(e) => updateVehicleFeatures(v.id, e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="AC, Music System, Carrier"/>
                        </div>
                    </div>
                </div>
            ))}
            {vehicles.length === 0 && <p className="text-gray-500 text-center py-8">No vehicles in fleet. Add one to get started.</p>}
        </div>
    </div>
  );

  // ... inside return statement, Sidebar Navigation ...
  // Add 'fleet' to the list
  // {['bookings', 'rooms', 'locations', 'fleet', 'drivers', ...].map(tab => ...

  // ... inside return statement, Content Area ...
  // {activeTab === 'fleet' && renderFleet()}

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

  // ✅ THIS FUNCTION WAS MISSING IN THE PREVIOUS VERSION, CAUSING THE CRASH
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

      {/* ✅ NEW: Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
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