import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity, Loader } from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();
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
    const isAuth = localStorage.getItem('vv_admin_auth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Lazy Load Data based on Active Tab
  useEffect(() => {
    const loadTab = async () => {
        setLoading(true);
        try {
            if (activeTab === 'bookings' && bookings.length === 0) {
                setBookings(await api.bookings.getAll());
            } else if (activeTab === 'rooms' && rooms.length === 0) {
                setRooms(await api.rooms.getAll());
            } else if (activeTab === 'locations' && locations.length === 0) {
                setLocations(await api.locations.getAll());
                if (drivers.length === 0) setDrivers(await api.drivers.getAll()); // Need drivers for locations dropdown
            } else if (activeTab === 'drivers' && drivers.length === 0) {
                setDrivers(await api.drivers.getAll());
            } else if (activeTab === 'pricing' && pricingRules.length === 0) {
                setPricingRules(await api.pricing.getAll());
            } else if (activeTab === 'gallery' && gallery.length === 0) {
                setGallery(await api.gallery.getAll());
            } else if (activeTab === 'reviews' && reviews.length === 0) {
                setReviews(await api.reviews.getAll());
            } else if ((activeTab === 'settings' || activeTab === 'home-content')) {
                // Settings might be needed for home content too
                const s = await api.settings.get();
                setSettings(s);
            }
        } catch (e) {
            console.error("Failed to load tab data", e);
        } finally {
            setLoading(false);
        }
    };
    loadTab();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  // --- BOOKINGS LOGIC ---
  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    try { await api.bookings.updateStatus(id, status); } catch (e) { alert("Update failed"); }
  };

  const downloadBookingsCSV = () => {
    if (bookings.length === 0) { alert("No bookings."); return; }
    const headers = ["Booking ID", "Guest Name", "Phone", "Room ID", "Check In", "Check Out", "Total Amount", "Status", "Booked Date"];
    const rows = bookings.map(b => [b.id, `"${b.guestName}"`, `"${b.guestPhone}"`, b.roomId, b.checkIn, b.checkOut, b.totalAmount, b.status, b.createdAt.split('T')[0]]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `VinayaVana_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- GENERIC HANDLERS ---
  const addItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, item: T) => setter(prev => [item, ...prev]);
  
  // Explicitly typed updateItem to fix TS inference error
  const updateItem = <T extends { id: string }, K extends keyof T>(
      setter: React.Dispatch<React.SetStateAction<T[]>>, 
      id: string, 
      field: K, 
      val: T[K]
  ) => {
      setter(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const deleteItem = async <T extends { id: string }>(
      setter: React.Dispatch<React.SetStateAction<T[]>>, 
      id: string, 
      apiCall: (id: string) => Promise<any>
  ) => {
      if (!window.confirm("Delete item?")) return;
      try { await apiCall(id); setter(prev => prev.filter(i => i.id !== id)); } catch (e) { alert("Delete failed"); }
  };
  const saveItem = async <T extends { id: string }>(
      list: T[], 
      id: string, 
      apiCall: (item: T) => Promise<any>
  ) => {
      const item = list.find(i => i.id === id);
      if (item) {
          try { await apiCall(item); alert("Saved!"); } catch (e) { alert("Save failed"); }
      }
  };

  // --- RENDERERS ---
  const renderBookings = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700">Guest Reservations</h3>
          <button onClick={downloadBookingsCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm"><Download size={16} /> CSV</button>
      </div>
      <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{b.guestName}</div><div className="text-sm text-gray-500">{b.guestPhone}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.checkIn} to {b.checkOut}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{b.totalAmount}</td>
                  <td className="px-6 py-4">
                    <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)} className={`text-sm rounded-full px-3 py-1 font-semibold ${b.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      <option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4"><a href={`https://wa.me/${b.guestPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-medium"><MessageCircle size={18} /> Chat</a></td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>}
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-6">
      <button onClick={() => addItem(setRooms, { id: `r${Date.now()}`, name: 'New Room', description: '', basePrice: 3000, capacity: 2, amenities: [], images: [] })} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Room</button>
      {rooms.map(room => (
        <div key={room.id} className="bg-white p-6 rounded-lg shadow flex flex-col lg:flex-row gap-6 relative border border-gray-100">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => saveItem(rooms, room.id, api.rooms.save)} className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"><Save size={16} /></button>
                <button onClick={() => deleteItem(setRooms, room.id, api.rooms.delete)} className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200"><Trash2 size={20} /></button>
            </div>
            <div className="lg:w-1/3"><ImageUploader label="Image" value={room.images[0]} onChange={(val) => { const ni = [...room.images]; ni[0] = val; updateItem<Room, 'images'>(setRooms, room.id, 'images', ni); }} /></div>
            <div className="lg:w-2/3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={room.name} onChange={(e) => updateItem<Room, 'name'>(setRooms, room.id, 'name', e.target.value)} className="border rounded p-2 font-bold" placeholder="Room Name"/>
                    <input type="number" value={room.basePrice} onChange={(e) => updateItem<Room, 'basePrice'>(setRooms, room.id, 'basePrice', parseInt(e.target.value))} className="border rounded p-2" placeholder="Price"/>
                </div>
                <textarea value={room.description} onChange={(e) => updateItem<Room, 'description'>(setRooms, room.id, 'description', e.target.value)} className="border rounded p-2 w-full h-20" placeholder="Description"/>
                <div className="grid grid-cols-2 gap-4">
                     <input type="number" value={room.capacity} onChange={(e) => updateItem<Room, 'capacity'>(setRooms, room.id, 'capacity', parseInt(e.target.value))} className="border rounded p-2" placeholder="Capacity"/>
                     <input type="text" value={room.amenities.join(', ')} onChange={(e) => updateItem<Room, 'amenities'>(setRooms, room.id, 'amenities', e.target.value.split(',').map(s=>s.trim()))} className="border rounded p-2" placeholder="Amenities (comma sep)"/>
                </div>
            </div>
        </div>
      ))}
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
       <button onClick={() => addItem(setLocations, { id: Date.now().toString(), name: 'New Location', description: '', imageUrl: '', active: true, driverId: null, price: 0 })} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={18} /> Add Location</button>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map(loc => (
            <div key={loc.id} className="bg-white p-4 rounded-lg shadow relative border border-gray-100">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                     <button onClick={() => saveItem(locations, loc.id, api.locations.save)} className="bg-blue-50 text-blue-600 p-1 rounded"><Save size={16}/></button>
                     <button onClick={() => deleteItem(setLocations, loc.id, api.locations.delete)} className="bg-red-50 text-red-500 p-1 rounded"><Trash2 size={16}/></button>
                </div>
                <ImageUploader value={loc.imageUrl} onChange={(val) => updateItem<CabLocation, 'imageUrl'>(setLocations, loc.id, 'imageUrl', val)} />
                <div className="mt-4 space-y-2">
                     <input type="text" value={loc.name} onChange={(e) => updateItem<CabLocation, 'name'>(setLocations, loc.id, 'name', e.target.value)} className="font-bold border w-full p-1 rounded"/>
                     <textarea value={loc.description} onChange={(e) => updateItem<CabLocation, 'description'>(setLocations, loc.id, 'description', e.target.value)} className="text-sm border w-full p-1 rounded h-16"/>
                     <div className="flex gap-2">
                        <input type="number" value={loc.price || 0} onChange={(e) => updateItem<CabLocation, 'price'>(setLocations, loc.id, 'price', parseFloat(e.target.value))} className="border w-full p-1 rounded" placeholder="Price"/>
                        <select value={loc.driverId || ''} onChange={(e) => updateItem<CabLocation, 'driverId'>(setLocations, loc.id, 'driverId', e.target.value || null)} className="border w-full p-1 rounded text-sm">
                            <option value="">Default Driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                     </div>
                </div>
            </div>
        ))}
       </div>
    </div>
  );

  const renderDrivers = () => (
      <div className="space-y-4">
          <button onClick={() => addItem(setDrivers, { id: Date.now().toString(), name: 'New Driver', phone: '', whatsapp: '', isDefault: false, active: true, vehicleInfo: '' })} className="bg-nature-600 text-white px-4 py-2 rounded flex gap-2"><Plus size={16}/> Add Driver</button>
          {drivers.map(d => (
              <div key={d.id} className="bg-white p-4 rounded shadow flex gap-4 items-center relative">
                  <div className="absolute top-2 right-2 flex gap-2"><button onClick={() => saveItem(drivers, d.id, api.drivers.save)}><Save size={16} className="text-blue-600"/></button><button onClick={() => deleteItem(setDrivers, d.id, api.drivers.delete)}><Trash2 size={16} className="text-red-500"/></button></div>
                  <input value={d.name} onChange={e => updateItem<Driver, 'name'>(setDrivers, d.id, 'name', e.target.value)} className="border p-1 rounded" placeholder="Name"/>
                  <input value={d.phone} onChange={e => updateItem<Driver, 'phone'>(setDrivers, d.id, 'phone', e.target.value)} className="border p-1 rounded" placeholder="Phone"/>
                  <label className="flex gap-1 text-sm"><input type="checkbox" checked={d.isDefault} onChange={e => updateItem<Driver, 'isDefault'>(setDrivers, d.id, 'isDefault', e.target.checked)}/> Default</label>
              </div>
          ))}
      </div>
  );

  const renderPricing = () => (
      <div className="space-y-6">
        <button onClick={() => addItem(setPricingRules, { id: `pr${Date.now()}`, name: 'New Season', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], multiplier: 1.2 })} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Season</button>
        <div className="grid gap-4">
            {pricingRules.map(rule => (
                <div key={rule.id} className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center gap-4 relative">
                      <div className="absolute top-2 right-2 flex gap-2">
                          <button onClick={() => saveItem(pricingRules, rule.id, api.pricing.save)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button>
                          <button onClick={() => deleteItem(setPricingRules, rule.id, api.pricing.delete)} className="text-gray-400 hover:text-red-500 p-1 rounded"><X size={18}/></button>
                      </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-2 md:mt-0">
                        <div><label className="text-xs text-gray-500">Season Name</label><input type="text" value={rule.name} onChange={(e) => updateItem<PricingRule, 'name'>(setPricingRules, rule.id, 'name', e.target.value)} className="border w-full p-2 rounded"/></div>
                        <div><label className="text-xs text-gray-500">Start</label><input type="date" value={rule.startDate} onChange={(e) => updateItem<PricingRule, 'startDate'>(setPricingRules, rule.id, 'startDate', e.target.value)} className="border w-full p-2 rounded"/></div>
                        <div><label className="text-xs text-gray-500">End</label><input type="date" value={rule.endDate} onChange={(e) => updateItem<PricingRule, 'endDate'>(setPricingRules, rule.id, 'endDate', e.target.value)} className="border w-full p-2 rounded"/></div>
                        <div><label className="text-xs text-gray-500">Multiplier</label><input type="number" step="0.1" value={rule.multiplier} onChange={(e) => updateItem<PricingRule, 'multiplier'>(setPricingRules, rule.id, 'multiplier', parseFloat(e.target.value))} className="border w-full p-2 rounded font-bold text-nature-700"/></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  ); 

  const renderGallery = () => (
      <div className="space-y-6">
          <button onClick={() => addItem(setGallery, { id: `g${Date.now()}`, url: '', category: 'Property', caption: '' })} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Image</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow relative group border border-gray-100">
                       <div className="absolute top-2 right-2 flex gap-2 z-10">
                            <button onClick={() => saveItem(gallery, item.id, api.gallery.save)} className="bg-white p-1 rounded-full text-blue-600 hover:bg-blue-50 shadow"><Save size={16}/></button>
                            <button onClick={() => deleteItem(setGallery, item.id, api.gallery.delete)} className="bg-white p-1 rounded-full text-red-500 hover:bg-red-50 shadow"><Trash2 size={16}/></button>
                        </div>
                      <ImageUploader value={item.url} onChange={(val) => updateItem<GalleryItem, 'url'>(setGallery, item.id, 'url', val)} />
                      <div className="space-y-2 mt-2">
                          <input type="text" value={item.category} onChange={(e) => updateItem<GalleryItem, 'category'>(setGallery, item.id, 'category', e.target.value)} className="border w-full p-1 rounded text-sm" placeholder="Category"/>
                          <input type="text" value={item.caption || ''} onChange={(e) => updateItem<GalleryItem, 'caption'>(setGallery, item.id, 'caption', e.target.value)} className="border w-full p-1 rounded text-sm" placeholder="Caption"/>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
        <button onClick={() => addItem(setReviews, { id: `rev${Date.now()}`, guestName: 'New Guest', location: '', rating: 5, comment: '', date: new Date().toISOString().split('T')[0], showOnHome: false })} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700"><Plus size={16} /> Add Review</button>
        <div className="grid gap-4">
            {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => saveItem(reviews, rev.id, api.reviews.save)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Save size={18}/></button>
                        <button onClick={() => deleteItem(setReviews, rev.id, api.reviews.delete)} className="text-gray-400 hover:text-red-500 p-1"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div><label className="text-xs text-gray-500">Name</label><input type="text" value={rev.guestName} onChange={(e) => updateItem<Review, 'guestName'>(setReviews, rev.id, 'guestName', e.target.value)} className="border w-full p-1 rounded font-bold"/></div>
                        <div><label className="text-xs text-gray-500">Location</label><input type="text" value={rev.location} onChange={(e) => updateItem<Review, 'location'>(setReviews, rev.id, 'location', e.target.value)} className="border w-full p-1 rounded"/></div>
                        <div><label className="text-xs text-gray-500">Rating</label><input type="number" min="1" max="5" value={rev.rating} onChange={(e) => updateItem<Review, 'rating'>(setReviews, rev.id, 'rating', parseInt(e.target.value))} className="border w-full p-1 rounded"/></div>
                    </div>
                    <div className="mb-4"><label className="text-xs text-gray-500">Comment</label><textarea value={rev.comment} onChange={(e) => updateItem<Review, 'comment'>(setReviews, rev.id, 'comment', e.target.value)} className="border w-full p-2 rounded h-20 text-sm"></textarea></div>
                    <div className="flex items-center justify-between">
                        <input type="date" value={rev.date} onChange={(e) => updateItem<Review, 'date'>(setReviews, rev.id, 'date', e.target.value)} className="border ml-2 p-1 rounded"/>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={rev.showOnHome} onChange={(e) => updateItem<Review, 'showOnHome'>(setReviews, rev.id, 'showOnHome', e.target.checked)} id={`home-${rev.id}`} /><label htmlFor={`home-${rev.id}`} className="text-sm font-medium cursor-pointer">Show on Home Page</label></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderHomePageContent = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-3xl space-y-8">
         <div><h3 className="text-lg font-bold mb-4 border-b pb-2 flex gap-2"><LayoutTemplate size={20} /> Hero</h3><ImageUploader label="Hero Image" value={settings.heroImageUrl} onChange={(val) => setSettings({...settings, heroImageUrl: val})} /></div>
         <div><h3 className="text-lg font-bold mb-4 border-b pb-2 flex gap-2"><LayoutTemplate size={20} /> YouTube</h3><input type="text" value={settings.youtubeVideoUrl} onChange={(e) => setSettings({...settings, youtubeVideoUrl: e.target.value})} className="w-full border rounded p-2"/></div>
         <div className="bg-nature-50 p-6 rounded-lg border border-nature-200 flex items-center gap-4">
            <div className="bg-nature-100 p-3 rounded-full text-nature-600"><Activity size={32} /></div>
            <div><h3 className="text-lg font-bold text-nature-900">Traffic</h3><span className="text-3xl font-extrabold text-nature-700">{settings.websiteHits || 0}</span><span className="text-sm text-gray-500 ml-2">visits</span></div>
        </div>
        <button onClick={() => api.settings.save(settings).then(() => alert("Saved!"))} className="bg-nature-600 text-white px-6 py-2 rounded w-full flex justify-center gap-2"><Save size={18} /> Save Content</button>
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
                            <input type="checkbox" id="enableDiscount" checked={settings.longStayDiscount?.enabled ?? true} onChange={(e) => setSettings({...settings, longStayDiscount: { ...settings.longStayDiscount, enabled: e.target.checked }})}/>
                            <label htmlFor="enableDiscount" className="text-sm font-medium">Enable Long Stay Discount</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs text-gray-500">Minimum Days</label><input type="number" min="1" value={settings.longStayDiscount?.minDays ?? 5} onChange={(e) => setSettings({...settings, longStayDiscount: { ...settings.longStayDiscount, minDays: parseInt(e.target.value) }})} className="w-full border rounded p-2"/></div>
                            <div><label className="block text-xs text-gray-500">Discount (%)</label><input type="number" min="1" max="100" value={settings.longStayDiscount?.percentage ?? 20} onChange={(e) => setSettings({...settings, longStayDiscount: { ...settings.longStayDiscount, percentage: parseInt(e.target.value) }})} className="w-full border rounded p-2 font-bold text-nature-700"/></div>
                        </div>
                     </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label><textarea value={settings.houseRules} onChange={(e) => setSettings({...settings, houseRules: e.target.value})} className="w-full h-32 border border-gray-300 rounded p-3 text-sm bg-white"/></div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Site Configuration</h3>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">WhatsApp Number</label><input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Address</label><textarea value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="mt-1 block w-full border p-2 rounded h-20"/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Facebook URL</label><input type="text" value={settings.facebookUrl || ''} onChange={(e) => setSettings({...settings, facebookUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Instagram URL</label><input type="text" value={settings.instagramUrl || ''} onChange={(e) => setSettings({...settings, instagramUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 flex items-center gap-2"><Map size={16}/> Google Map Embed URL</label><input type="text" value={settings.googleMapUrl || ''} onChange={(e) => setSettings({...settings, googleMapUrl: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Razorpay Key ID</label><input type="text" value={settings.razorpayKey} onChange={(e) => setSettings({...settings, razorpayKey: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
                 <div><label className="block text-sm font-medium text-gray-700">Admin Password</label><input type="text" value={settings.adminPasswordHash} onChange={(e) => setSettings({...settings, adminPasswordHash: e.target.value})} className="mt-1 block w-full border p-2 rounded bg-gray-50"/></div>
                 <div><label className="block text-sm font-medium text-gray-700">OpenWeatherMap API Key</label><input type="text" value={settings.weatherApiKey || ''} onChange={(e) => setSettings({...settings, weatherApiKey: e.target.value})} className="mt-1 block w-full border p-2 rounded"/></div>
            </div>
        </div>
        <button onClick={() => api.settings.save(settings).then(() => alert("Saved!"))} className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"><Save size={18} /> Save Settings</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-nature-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          {['bookings', 'rooms', 'locations', 'drivers', 'pricing', 'gallery', 'reviews', 'home-content', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 capitalize ${activeTab === tab ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}>
                {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-nature-800"><LogOut size={18}/> Logout</button>
      </div>
      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-8">{activeTab.replace('-', ' ')}</h1>
        {loading ? <div className="flex justify-center p-12"><Loader className="animate-spin text-nature-600" size={40} /></div> : (
            <div className="animate-fade-in max-w-6xl">
                {activeTab === 'bookings' && renderBookings()}
                {activeTab === 'rooms' && renderRooms()}
                {activeTab === 'home-content' && renderHomePageContent()}
                {activeTab === 'locations' && renderLocations()}
                {activeTab === 'drivers' && renderDrivers()}
                {activeTab === 'pricing' && renderPricing()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'reviews' && renderReviews()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;