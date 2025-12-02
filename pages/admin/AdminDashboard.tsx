import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader, TrendingUp, DollarSign, Clock } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();
  // CRITICAL: Start with authLoading = TRUE. 
  // This blocks the dashboard from rendering until we verify the user.
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

  // --- STRICT AUTH CHECK ---
  useEffect(() => {
    const checkAuth = () => {
        const isAuth = localStorage.getItem('vv_admin_auth');
        if (isAuth !== 'true') {
          // If not authenticated, redirect IMMEDIATELY.
          // Do NOT set authLoading to false.
          navigate('/admin/login');
        } else {
          // Only if authenticated, allow the dashboard to load.
          setAuthLoading(false);
          loadTab('bookings'); // Load initial data
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

  // --- ANALYTICS CALCULATIONS (Fixed for Date Matching) ---
  const calculateAnalytics = () => {
      const totalRevenue = bookings
          .filter(b => b.status === 'PAID')
          .reduce((sum, b) => sum + (parseFloat(b.totalAmount as any) || 0), 0);
      
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
      const failedBookings = bookings.filter(b => b.status === 'FAILED').length;
      const paidBookings = bookings.filter(b => b.status === 'PAID').length;

      // Monthly Revenue (Last 6 Months)
      const monthlyRevenue: Record<string, number> = {};
      const months = [];
      const today = new Date();
      
      for(let i=5; i>=0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          // Format as "Jan 24" or "Dec 25" depending on year
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyRevenue[key] = 0;
          months.push(key);
      }

      bookings.forEach(b => {
          if (b.status === 'PAID') {
              const bookingDate = new Date(b.createdAt);
              if (!isNaN(bookingDate.getTime())) {
                  const key = bookingDate.toLocaleString('default', { month: 'short', year: '2-digit' });
                  // Only add if this month is in our last 6 months view
                  if (monthlyRevenue[key] !== undefined) {
                      monthlyRevenue[key] += (parseFloat(b.totalAmount as any) || 0);
                  }
              }
          }
      });

      return { totalRevenue, totalBookings, pendingBookings, failedBookings, paidBookings, monthlyRevenue, months };
  };

  const analytics = calculateAnalytics();

  // --- RENDER HELPERS ---
  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    try {
        await api.bookings.updateStatus(id, status);
    } catch (e) {
        alert("Failed to update status on server");
        loadTab('bookings'); // Revert on fail
    }
  };

  const downloadBookingsCSV = () => {
    if (bookings.length === 0) {
        alert("No bookings to export.");
        return;
    }
    const headers = ["Booking ID", "Guest Name", "Phone", "Room ID", "Check In", "Check Out", "Total Amount", "Status", "Booked Date"];
    const rows = bookings.map(b => [
        b.id, `"${b.guestName}"`, `"${b.guestPhone}"`, b.roomId, b.checkIn, b.checkOut, b.totalAmount, b.status, b.createdAt.split('T')[0]
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `VinayaVana_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderBookings = () => (
    <div className="space-y-8">
        {/* Business Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{analytics.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <DollarSign size={24} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.totalBookings}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Activity size={24} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Pending Actions</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.pendingBookings}</h3>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                    <Clock size={24} />
                </div>
            </div>
        </div>

        {/* Revenue Chart (CSS only) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-nature-600"/> Monthly Revenue Trend
            </h3>
            <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-200 px-4">
                {analytics.months.map(month => {
                    const value = analytics.monthlyRevenue[month];
                    // Dynamic scaling: find max value in data to set 100% height
                    const maxVal = Math.max(...Object.values(analytics.monthlyRevenue), 1000); 
                    const heightPercent = Math.max((value / maxVal) * 100, 2); // Min 2% height so bar is visible
                    
                    return (
                        <div key={month} className="flex flex-col items-center gap-2 w-full group relative">
                            <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-white shadow px-2 py-1 rounded">₹{value.toLocaleString()}</div>
                            <div 
                                className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 relative ${value > 0 ? 'bg-nature-500 hover:bg-nature-600' : 'bg-gray-100'}`}
                                style={{ height: `${heightPercent}%` }}
                            ></div>
                            <span className="text-xs text-gray-500 font-medium">{month}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Guest Reservations</h3>
                <button onClick={downloadBookingsCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm">
                    <Download size={16} /> Export CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map(b => (
                        <tr key={b.id}>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{b.guestName}</div>
                            <div className="text-sm text-gray-500">{b.guestPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{b.checkIn} to {b.checkOut}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{b.totalAmount}</td>
                        <td className="px-6 py-4">
                            <select 
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)}
                            className={`text-sm rounded-full px-3 py-1 font-semibold cursor-pointer border-none outline-none focus:ring-2 focus:ring-offset-1 ${
                                b.status === 'PAID' ? 'bg-green-100 text-green-800 focus:ring-green-500' : 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500'
                            }`}
                            >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="FAILED">Failed</option>
                            </select>
                        </td>
                        <td className="px-6 py-4">
                            <a 
                                href={`https://wa.me/${b.guestPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${b.guestName}, greeting from Vinaya Vana Farmhouse!`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-medium"
                            >
                                <MessageCircle size={18} /> Chat
                            </a>
                        </td>
                        </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-6">
      <button onClick={addRoomLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700 transition-all hover:scale-105">
          <Plus size={16} /> Add New Room
      </button>

      {rooms.map(room => (
        <div key={room.id} className="bg-white p-6 rounded-lg shadow flex flex-col lg:flex-row gap-6 relative border border-gray-100">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => saveRoom(room.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700" title="Save Changes">
                    <Save size={16} /> Save
                </button>
                <button onClick={() => deleteRoom(room.id)} className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200" title="Delete">
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="lg:w-1/3">
                 <ImageUploader 
                    label="Room Main Image"
                    value={room.images[0]}
                    onChange={(val) => {
                        const newImgs = [...room.images];
                        newImgs[0] = val;
                        // updateRoomLocal(room.id, 'images', newImgs); // Helper function needed inside
                        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, images: newImgs } : r));
                    }}
                 />
            </div>
            
            <div className="lg:w-2/3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500">Room Name</label>
                        <input 
                            type="text" 
                            value={room.name}
                            onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, name: e.target.value } : r))}
                            className="border rounded px-3 py-2 w-full font-bold"
                        />
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500">Base Price (₹)</label>
                        <input 
                            type="number" 
                            value={room.basePrice}
                            onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, basePrice: parseInt(e.target.value) } : r))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-500">Description</label>
                    <textarea 
                        value={room.description}
                        onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, description: e.target.value } : r))}
                        className="border rounded px-3 py-2 w-full h-20"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs text-gray-500">Capacity</label>
                        <input 
                            type="number" 
                            value={room.capacity}
                            onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, capacity: parseInt(e.target.value) } : r))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Amenities (comma separated)</label>
                        <input 
                            type="text" 
                            value={room.amenities.join(', ')}
                            onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, amenities: e.target.value.split(',').map(s => s.trim()) } : r))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
      ))}
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-4">
        <button onClick={addDriverLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Driver
        </button>
        <div className="grid gap-4">
            {drivers.map(d => (
                <div key={d.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-nature-500 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => saveDriver(d.id)} className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200"><Save size={18}/></button>
                        <button onClick={() => deleteDriver(d.id)} className="text-gray-400 hover:text-red-500 p-1"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-500 block">Name</label>
                            <input type="text" value={d.name} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, name: e.target.value } : drv))} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block">Phone</label>
                            <input type="text" value={d.phone} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, phone: e.target.value } : drv))} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 block">WhatsApp</label>
                             <input type="text" value={d.whatsapp} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, whatsapp: e.target.value } : drv))} className="border w-full p-1 rounded"/>
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={d.isDefault} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, isDefault: e.target.checked } : drv))} /> Default
                            </label>
                             <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={d.active} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, active: e.target.checked } : drv))} /> Active
                            </label>
                        </div>
                    </div>
                    <div className="mt-2">
                         <label className="text-xs text-gray-500 block">Vehicle Info</label>
                         <input type="text" value={d.vehicleInfo || ''} onChange={(e) => setDrivers(prev => prev.map(drv => drv.id === d.id ? { ...drv, vehicleInfo: e.target.value } : drv))} className="border w-full p-1 rounded" placeholder="e.g. Toyota Innova"/>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4">
        <button onClick={addLocationLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Cab Location
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map(loc => (
                <div key={loc.id} className="bg-white p-4 rounded-lg shadow relative border border-gray-100">
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                         <button onClick={() => saveLocation(loc.id)} className="bg-white text-blue-600 p-1 rounded shadow hover:bg-blue-50"><Save size={16}/></button>
                         <button onClick={() => deleteLocation(loc.id)} className="bg-white text-red-500 hover:bg-red-50 p-1 rounded shadow"><Trash2 size={16}/></button>
                    </div>
                    <div className="mb-4">
                        <ImageUploader 
                            label="Location Image"
                            value={loc.imageUrl}
                            onChange={(val) => setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, imageUrl: val } : l))}
                        />
                    </div>
                    <div className="space-y-2">
                         <input 
                            type="text" 
                            value={loc.name}
                            onChange={(e) => setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, name: e.target.value } : l))}
                            className="font-bold border w-full p-1 rounded"
                            placeholder="Location Name"
                        />
                         <textarea 
                            value={loc.description}
                            onChange={(e) => setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, description: e.target.value } : l))}
                            className="text-sm border w-full p-1 rounded h-20"
                            placeholder="Description"
                        />
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="text-xs block text-gray-500">Price</label>
                                <input 
                                    type="number" 
                                    value={loc.price ?? ''} 
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, price: val } : l));
                                    }}
                                    className="border w-full p-1 rounded"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs block text-gray-500">Driver</label>
                                <select 
                                    value={loc.driverId || ''} 
                                    onChange={(e) => setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, driverId: e.target.value || null } : l))}
                                    className="border w-full p-1 rounded text-sm"
                                >
                                    <option value="">Default Driver</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
        <button onClick={addPricingRuleLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
          <Plus size={16} /> Add Seasonal Rule
        </button>
        <div className="grid gap-4">
            {pricingRules.map(rule => (
                <div key={rule.id} className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center gap-4 relative">
                      <div className="absolute top-2 right-2 flex gap-2">
                          <button onClick={() => savePricingRule(rule.id)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button>
                          <button onClick={() => deletePricingRule(rule.id)} className="text-gray-400 hover:text-red-500 p-1 rounded"><X size={18}/></button>
                      </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-2 md:mt-0">
                        <div>
                            <label className="text-xs text-gray-500">Season Name</label>
                            <input type="text" value={rule.name} onChange={(e) => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Start Date</label>
                            <input type="date" value={rule.startDate} onChange={(e) => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, startDate: e.target.value } : r))} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">End Date</label>
                            <input type="date" value={rule.endDate} onChange={(e) => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, endDate: e.target.value } : r))} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Multiplier</label>
                            <input type="number" step="0.1" value={rule.multiplier} onChange={(e) => setPricingRules(prev => prev.map(r => r.id === rule.id ? { ...r, multiplier: parseFloat(e.target.value) } : r))} className="border w-full p-2 rounded font-bold text-nature-700"/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderGallery = () => (
      <div className="space-y-6">
          <button onClick={addGalleryItemLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Image
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow relative group border border-gray-100">
                       <div className="absolute top-2 right-2 flex gap-2 z-10">
                            <button onClick={() => saveGalleryItem(item.id)} className="bg-white p-1 rounded-full text-blue-600 hover:bg-blue-50 shadow"><Save size={16}/></button>
                            <button onClick={() => deleteGalleryItem(item.id)} className="bg-white p-1 rounded-full text-red-500 hover:bg-red-50 shadow"><Trash2 size={16}/></button>
                        </div>
                      <div className="mb-3">
                          <ImageUploader 
                            value={item.url}
                            onChange={(val) => setGallery(prev => prev.map(g => g.id === item.id ? { ...g, url: val } : g))}
                          />
                      </div>
                      <div className="space-y-2">
                          <div>
                              <label className="text-xs text-gray-500">Category</label>
                              <input type="text" value={item.category} onChange={(e) => setGallery(prev => prev.map(g => g.id === item.id ? { ...g, category: e.target.value } : g))} className="border w-full p-1 rounded text-sm"/>
                          </div>
                          <div>
                              <label className="text-xs text-gray-500">Caption</label>
                              <input type="text" value={item.caption || ''} onChange={(e) => setGallery(prev => prev.map(g => g.id === item.id ? { ...g, caption: e.target.value } : g))} className="border w-full p-1 rounded text-sm"/>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
        <button onClick={addReviewLocal} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Review
        </button>
        <div className="grid gap-4">
            {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => saveReview(rev.id)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button>
                        <button onClick={() => deleteReview(rev.id)} className="text-gray-400 hover:text-red-500 p-1"><X size={18}/></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-gray-500">Guest Name</label>
                            <input type="text" value={rev.guestName} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, guestName: e.target.value } : r))} className="border w-full p-1 rounded font-bold"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Location</label>
                            <input type="text" value={rev.location} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, location: e.target.value } : r))} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Rating (1-5)</label>
                            <input type="number" min="1" max="5" value={rev.rating} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, rating: parseInt(e.target.value) } : r))} className="border w-full p-1 rounded"/>
                        </div>
                    </div>
                    <div className="mb-4">
                         <label className="text-xs text-gray-500">Comment</label>
                         <textarea value={rev.comment} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, comment: e.target.value } : r))} className="border w-full p-2 rounded h-20 text-sm"></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                             <label className="text-xs text-gray-500">Date</label>
                             <input type="date" value={rev.date} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, date: e.target.value } : r))} className="border ml-2 p-1 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="checkbox" checked={rev.showOnHome} onChange={(e) => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, showOnHome: e.target.checked } : r))} id={`home-${rev.id}`} />
                             <label htmlFor={`home-${rev.id}`} className="text-sm font-medium cursor-pointer">Show on Home Page</label>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderHomePageContent = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-3xl space-y-8">
         <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <LayoutTemplate size={20} />
                Hero Section
            </h3>
            <div className="space-y-4">
                <ImageUploader 
                    label="Hero Background Image"
                    value={settings.heroImageUrl}
                    onChange={(val) => setSettings({...settings, heroImageUrl: val})}
                />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <LayoutTemplate size={20} />
                YouTube Video Section
            </h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">YouTube Video URL</label>
                <input 
                    type="text" 
                    value={settings.youtubeVideoUrl}
                    onChange={(e) => setSettings({...settings, youtubeVideoUrl: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
        </div>

        {/* Website Hits Counter */}
        <div className="bg-nature-50 p-4 rounded-lg border border-nature-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-nature-900">
                <BarChart2 size={20}/> Website Traffic
            </h3>
            <p className="text-gray-700">Total unique visits to public pages: <span className="font-bold text-nature-700 text-xl">{settings.websiteHits || 0}</span></p>
            <p className="text-xs text-gray-500 mt-1">This counter increments on each page load on public facing pages.</p>
        </div>


        <button onClick={saveSettings} className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center">
            <Save size={18} /> Save Content
        </button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-2xl space-y-8">
        <div className="border border-nature-200 rounded-lg p-6 bg-nature-50">
            <h3 className="text-lg font-bold mb-4 border-b border-nature-200 pb-2 flex items-center gap-2 text-nature-900"><FileText size={20} /> Booking Policies</h3>
            <div className="space-y-6">
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Percent size={16} /> Long Stay Discount</label>
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
                            <label htmlFor="enableDiscount" className="text-sm font-medium">Enable Long Stay Discount</label>
                        </div>
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
                     </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label>
                    <textarea value={settings.houseRules} onChange={(e) => setSettings({...settings, houseRules: e.target.value})} className="w-full h-32 border border-gray-300 rounded p-3 text-sm bg-white"/>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Site Configuration</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                    <input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="mt-1 block w-full border p-2 rounded h-20"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
                        <input type="text" value={settings.facebookUrl || ''} onChange={(e) => setSettings({...settings, facebookUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                        <input type="text" value={settings.instagramUrl || ''} onChange={(e) => setSettings({...settings, instagramUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 flex items-center gap-2"><Map size={16}/> Google Map Embed URL</label>
                    <input type="text" value={settings.googleMapUrl || ''} onChange={(e) => setSettings({...settings, googleMapUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Razorpay Key ID</label>
                    <input type="text" value={settings.razorpayKey} onChange={(e) => setSettings({...settings, razorpayKey: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                    <input type="text" value={settings.adminPasswordHash} onChange={(e) => setSettings({...settings, adminPasswordHash: e.target.value})} className="mt-1 block w-full border p-2 rounded bg-gray-50"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">OpenWeatherMap API Key</label>
                    <input type="text" value={settings.weatherApiKey || ''} onChange={(e) => setSettings({...settings, weatherApiKey: e.target.value})} className="mt-1 block w-full border p-2 rounded"/>
                </div>
            </div>
        </div>
        <button onClick={saveSettings} className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"><Save size={18} /> Save Settings</button>
    </div>
  );

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
                {activeTab === 'locations' && renderLocations()}
                {activeTab === 'drivers' && renderDrivers()}
                {activeTab === 'pricing' && renderPricing()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'reviews' && renderReviews()}
                {activeTab === 'home-content' && renderHomePageContent()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;