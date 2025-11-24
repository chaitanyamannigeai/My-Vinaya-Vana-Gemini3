import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate, FileText, Percent, Download, MessageCircle, CheckCircle, BarChart2, Activity } from 'lucide-react'; // Added Activity icon
import ImageUploader from '../../components/ui/ImageUploader';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  
  // State for all entities
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // Initial Data Load
  useEffect(() => {
    const isAuth = localStorage.getItem('vv_admin_auth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    try {
        const [b, r, d, l, p, g, rev, s] = await Promise.all([
            api.bookings.getAll(),
            api.rooms.getAll(),
            api.drivers.getAll(),
            api.locations.getAll(),
            api.pricing.getAll(),
            api.gallery.getAll(),
            api.reviews.getAll(),
            api.settings.get()
        ]);
        setBookings(b);
        setRooms(r);
        setDrivers(d);
        setLocations(l);
        setPricingRules(p);
        setGallery(g);
        setReviews(rev);
        setSettings(s);
    } catch (e) {
        console.error("Failed to load data", e);
        alert("Failed to load data from server. Ensure backend is running.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  // --- BOOKINGS LOGIC ---
  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    try {
        await api.bookings.updateStatus(id, status);
    } catch (e) {
        alert("Failed to update status on server");
        loadAllData(); // Revert on fail
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

  // --- ROOMS LOGIC (Local Edit Pattern) ---
  const addRoomLocal = () => {
    const newRoom: Room = {
        id: `r${Date.now()}`,
        name: 'New Room',
        description: 'Description here...',
        basePrice: 3000,
        capacity: 2,
        amenities: ['Wifi', 'AC'],
        images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800']
    };
    setRooms([newRoom, ...rooms]);
  };

  const updateRoomLocal = (id: string, field: keyof Room, value: any) => {
      setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateRoomAmenitiesLocal = (id: string, val: string) => {
      setRooms(prev => prev.map(r => r.id === id ? { ...r, amenities: val.split(',').map(s => s.trim()) } : r));
  };

  const saveRoom = async (id: string) => {
      const room = rooms.find(r => r.id === id);
      if (!room) return;
      try {
          await api.rooms.save(room);
          alert("Room Saved Successfully!");
      } catch (e) {
          alert("Error saving room");
          console.error(e);
      }
  };

  const deleteRoom = async (id: string) => {
      if (!window.confirm("Delete this room?")) return;
      try {
          await api.rooms.delete(id);
          setRooms(prev => prev.filter(r => r.id !== id));
      } catch (e) { alert("Error deleting room"); }
  };

  // --- DRIVERS LOGIC ---
  const addDriverLocal = () => {
      const newDriver: Driver = {
          id: Date.now().toString(),
          name: 'New Driver',
          phone: '',
          whatsapp: '',
          isDefault: false,
          active: true,
          vehicleInfo: ''
      };
      setDrivers([newDriver, ...drivers]);
  };

  const updateDriverLocal = (id: string, field: keyof Driver, value: any) => {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const saveDriver = async (id: string) => {
      const driver = drivers.find(d => d.id === id);
      if (!driver) return;
      try {
          await api.drivers.save(driver);
          // If this driver is default, update local state to reflect others are not default
          if (driver.isDefault) {
              setDrivers(prev => prev.map(d => d.id === id ? d : { ...d, isDefault: false }));
          }
          alert("Driver Saved!");
      } catch (e) { alert("Error saving driver"); }
  };

  const deleteDriver = async (id: string) => {
      if (!window.confirm("Delete this driver?")) return;
      try {
          await api.drivers.delete(id);
          setDrivers(prev => prev.filter(d => d.id !== id));
      } catch (e) { alert("Error deleting driver"); }
  };

  // --- LOCATIONS LOGIC ---
  const addLocationLocal = () => {
      const newLoc: CabLocation = {
          id: Date.now().toString(),
          name: 'New Location',
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1590664095612-2d4e5e0a8d7a?auto=format&fit=crop&q=80&w=400',
          active: true,
          driverId: null,
          price: 0 // Initialize with 0 to allow proper database saving
      };
      setLocations([newLoc, ...locations]);
  };

  const updateLocationLocal = (id: string, field: keyof CabLocation, value: any) => {
      setLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const saveLocation = async (id: string) => {
      const loc = locations.find(l => l.id === id);
      if (loc) {
          try {
              await api.locations.save(loc);
              alert("Location Saved!");
          } catch (e) { 
            console.error(e);
            alert("Error saving location"); 
          }
      }
  };

  const deleteLocation = async (id: string) => {
      if (!window.confirm("Delete location?")) return;
      try {
          await api.locations.delete(id);
          setLocations(prev => prev.filter(l => l.id !== id));
      } catch (e) { alert("Error deleting location"); }
  };

  // --- PRICING LOGIC ---
  const addPricingRuleLocal = () => {
      const newRule: PricingRule = {
          id: `pr${Date.now()}`,
          name: 'New Season',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          multiplier: 1.2
      };
      setPricingRules([newRule, ...pricingRules]);
  };

  const updatePricingRuleLocal = (id: string, field: keyof PricingRule, value: any) => {
      setPricingRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const savePricingRule = async (id: string) => {
      const rule = pricingRules.find(r => r.id === id);
      if (rule) {
          try {
              await api.pricing.save(rule);
              alert("Pricing Rule Saved!");
          } catch (e) { alert("Error saving rule"); }
      }
  };

  const deletePricingRule = async (id: string) => {
      if (!window.confirm("Delete rule?")) return;
      try {
          await api.pricing.delete(id);
          setPricingRules(prev => prev.filter(r => r.id !== id));
      } catch (e) { alert("Error deleting rule"); }
  };

  // --- GALLERY LOGIC ---
  const addGalleryItemLocal = () => {
      const newItem: GalleryItem = {
          id: `g${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800',
          category: 'Property',
          caption: ''
      };
      setGallery([newItem, ...gallery]);
  };

  const updateGalleryItemLocal = (id: string, field: keyof GalleryItem, value: any) => {
      setGallery(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const saveGalleryItem = async (id: string) => {
      const item = gallery.find(g => g.id === id);
      if (item) {
          try {
              await api.gallery.save(item);
              alert("Image Saved!");
          } catch (e) { 
              console.error(e);
              alert("Error saving image"); 
          }
      }
  };

  const deleteGalleryItem = async (id: string) => {
      if (!window.confirm("Delete image?")) return;
      try {
          await api.gallery.delete(id);
          setGallery(prev => prev.filter(g => g.id !== id));
      } catch (e) { alert("Error deleting image"); }
  };

  // --- REVIEWS LOGIC ---
  const addReviewLocal = () => {
      const newReview: Review = {
          id: `rev${Date.now()}`,
          guestName: 'Guest Name',
          location: 'Location',
          rating: 5,
          comment: 'Review comment...',
          date: new Date().toISOString().split('T')[0],
          showOnHome: false
      };
      setReviews([newReview, ...reviews]);
  };

  const updateReviewLocal = (id: string, field: keyof Review, value: any) => {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveReview = async (id: string) => {
      const review = reviews.find(r => r.id === id);
      if (review) {
          try {
              await api.reviews.save(review);
              alert("Review Saved!");
          } catch (e) { alert("Error saving review"); }
      }
  };

  const deleteReview = async (id: string) => {
      if (!window.confirm("Delete review?")) return;
      try {
          await api.reviews.delete(id);
          setReviews(prev => prev.filter(r => r.id !== id));
      } catch (e) { alert("Error deleting review"); }
  };

  // --- SETTINGS ---
  const saveSettings = async () => {
      try {
          await api.settings.save(settings);
          alert("Settings Saved!");
      } catch (e) { alert("Error saving settings"); }
  };


  // --- RENDER HELPERS ---
  const renderBookings = () => (
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
        <div className="bg-nature-50 p-6 rounded-lg border border-nature-200 flex items-center gap-4">
            <div className="bg-nature-100 p-3 rounded-full text-nature-600">
                <Activity size={32} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-nature-900">Website Traffic</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-nature-700">{settings.websiteHits || 0}</span>
                    <span className="text-sm text-gray-500">total visits</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Counts unique visits to public pages.</p>
            </div>
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

  const renderRooms = () => (
    <div className="space-y-6">
      <button onClick={addRoomLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
        <Plus size={18} /> Add Room
      </button>
      {rooms.map(room => (
        <div key={room.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="block text-xs text-gray-500">Room Name</label>
                  <input type="text" value={room.name} onChange={(e) => updateRoomLocal(room.id, 'name', e.target.value)} className="w-full border p-2 rounded"/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs text-gray-500">Base Price (₹)</label>
                    <input type="number" value={room.basePrice} onChange={(e) => updateRoomLocal(room.id, 'basePrice', e.target.value)} className="w-full border p-2 rounded"/>
                 </div>
                 <div>
                    <label className="block text-xs text-gray-500">Capacity</label>
                    <input type="number" value={room.capacity} onChange={(e) => updateRoomLocal(room.id, 'capacity', e.target.value)} className="w-full border p-2 rounded"/>
                 </div>
               </div>
               <div>
                  <label className="block text-xs text-gray-500">Description</label>
                  <textarea value={room.description} onChange={(e) => updateRoomLocal(room.id, 'description', e.target.value)} className="w-full border p-2 rounded h-20"/>
               </div>
               <div>
                  <label className="block text-xs text-gray-500">Amenities (comma separated)</label>
                  <input type="text" value={room.amenities.join(', ')} onChange={(e) => updateRoomAmenitiesLocal(room.id, e.target.value)} className="w-full border p-2 rounded"/>
               </div>
            </div>
            <div className="space-y-4">
                <ImageUploader 
                    label="Main Room Image"
                    value={room.images[0] || ''} 
                    onChange={(val) => {
                        const newImages = [...room.images];
                        newImages[0] = val;
                        updateRoomLocal(room.id, 'images', newImages);
                    }}
                />
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={() => deleteRoom(room.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                    <button onClick={() => saveRoom(room.id)} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700"><Save size={18}/> Save</button>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-6">
       <button onClick={addDriverLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
        <Plus size={18} /> Add Driver
      </button>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {drivers.map(driver => (
                    <tr key={driver.id}>
                        <td className="px-6 py-4">
                            <input type="text" value={driver.name} onChange={(e) => updateDriverLocal(driver.id, 'name', e.target.value)} className="border p-1 rounded w-full mb-1" placeholder="Name"/>
                        </td>
                         <td className="px-6 py-4">
                            <input type="text" value={driver.phone} onChange={(e) => updateDriverLocal(driver.id, 'phone', e.target.value)} className="border p-1 rounded w-full mb-1 text-xs" placeholder="Phone"/>
                            <input type="text" value={driver.whatsapp} onChange={(e) => updateDriverLocal(driver.id, 'whatsapp', e.target.value)} className="border p-1 rounded w-full text-xs" placeholder="WhatsApp"/>
                        </td>
                        <td className="px-6 py-4">
                             <input type="text" value={driver.vehicleInfo || ''} onChange={(e) => updateDriverLocal(driver.id, 'vehicleInfo', e.target.value)} className="border p-1 rounded w-full text-sm" placeholder="Car Model"/>
                        </td>
                        <td className="px-6 py-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={driver.active} onChange={(e) => updateDriverLocal(driver.id, 'active', e.target.checked)} />
                                <span className="text-sm">Active</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" checked={driver.isDefault} onChange={(e) => updateDriverLocal(driver.id, 'isDefault', e.target.checked)} />
                                <span className="text-sm">Default</span>
                            </div>
                        </td>
                         <td className="px-6 py-4">
                            <div className="flex gap-2">
                                <button onClick={() => saveDriver(driver.id)} className="text-nature-600 hover:text-nature-800"><Save size={18}/></button>
                                <button onClick={() => deleteDriver(driver.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
       <button onClick={addLocationLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
        <Plus size={18} /> Add Location
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
            <div key={loc.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4">
                <ImageUploader value={loc.imageUrl} onChange={(val) => updateLocationLocal(loc.id, 'imageUrl', val)} />
                <input type="text" value={loc.name} onChange={(e) => updateLocationLocal(loc.id, 'name', e.target.value)} className="border p-2 rounded font-bold" placeholder="Location Name"/>
                <textarea value={loc.description} onChange={(e) => updateLocationLocal(loc.id, 'description', e.target.value)} className="border p-2 rounded text-sm h-20" placeholder="Description"/>
                <div className="flex gap-2">
                    <input type="number" value={loc.price || ''} onChange={(e) => updateLocationLocal(loc.id, 'price', e.target.value)} className="border p-2 rounded w-1/2" placeholder="Price (Optional)"/>
                    <select 
                        value={loc.driverId || ''} 
                        onChange={(e) => updateLocationLocal(loc.id, 'driverId', e.target.value || null)}
                        className="border p-2 rounded w-1/2 text-sm"
                    >
                        <option value="">Default Driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center justify-between mt-auto pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={loc.active} onChange={(e) => updateLocationLocal(loc.id, 'active', e.target.checked)}/>
                        <span className="text-sm text-gray-500">Active</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => saveLocation(loc.id)} className="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100"><Save size={18}/></button>
                        <button onClick={() => deleteLocation(loc.id)} className="bg-red-50 text-red-500 p-2 rounded hover:bg-red-100"><Trash2 size={18}/></button>
                    </div>
                 </div>
            </div>
        ))}
      </div>
    </div>
  );

  const renderPricing = () => (
      <div className="space-y-6">
        <button onClick={addPricingRuleLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
            <Plus size={18} /> Add Seasonal Rule
        </button>
        <div className="bg-white rounded-lg shadow overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Multiplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {pricingRules.map(rule => (
                        <tr key={rule.id}>
                            <td className="px-6 py-4"><input type="text" value={rule.name} onChange={(e) => updatePricingRuleLocal(rule.id, 'name', e.target.value)} className="border p-1 rounded w-full"/></td>
                            <td className="px-6 py-4"><input type="date" value={rule.startDate} onChange={(e) => updatePricingRuleLocal(rule.id, 'startDate', e.target.value)} className="border p-1 rounded w-full"/></td>
                            <td className="px-6 py-4"><input type="date" value={rule.endDate} onChange={(e) => updatePricingRuleLocal(rule.id, 'endDate', e.target.value)} className="border p-1 rounded w-full"/></td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <input type="number" step="0.1" value={rule.multiplier} onChange={(e) => updatePricingRuleLocal(rule.id, 'multiplier', e.target.value)} className="border p-1 rounded w-20"/>
                                    <span className="text-xs text-gray-500">x Base Price</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-2">
                                    <button onClick={() => savePricingRule(rule.id)} className="text-nature-600 hover:text-nature-800"><Save size={18}/></button>
                                    <button onClick={() => deletePricingRule(rule.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
      </div>
  );

  const renderGallery = () => (
      <div className="space-y-6">
        <button onClick={addGalleryItemLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
            <Plus size={18} /> Add Image
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                     <ImageUploader value={item.url} onChange={(val) => updateGalleryItemLocal(item.id, 'url', val)} />
                     <input type="text" value={item.category} onChange={(e) => updateGalleryItemLocal(item.id, 'category', e.target.value)} className="border p-2 rounded text-sm" placeholder="Category (e.g. Rooms)"/>
                     <input type="text" value={item.caption || ''} onChange={(e) => updateGalleryItemLocal(item.id, 'caption', e.target.value)} className="border p-2 rounded text-sm" placeholder="Caption (Optional)"/>
                     <div className="flex gap-2 mt-auto pt-2 border-t">
                        <button onClick={() => saveGalleryItem(item.id)} className="flex-1 bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100 flex justify-center"><Save size={18}/></button>
                        <button onClick={() => deleteGalleryItem(item.id)} className="flex-1 bg-red-50 text-red-500 p-2 rounded hover:bg-red-100 flex justify-center"><Trash2 size={18}/></button>
                     </div>
                </div>
            ))}
        </div>
      </div>
  );

  const renderReviews = () => (
      <div className="space-y-6">
         <button onClick={addReviewLocal} className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-nature-700">
            <Plus size={18} /> Add Manual Review
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                         <div className="space-y-2 w-full mr-4">
                            <input type="text" value={review.guestName} onChange={(e) => updateReviewLocal(review.id, 'guestName', e.target.value)} className="border p-1 rounded w-full font-bold" placeholder="Guest Name"/>
                            <input type="text" value={review.location} onChange={(e) => updateReviewLocal(review.id, 'location', e.target.value)} className="border p-1 rounded w-full text-sm text-gray-500" placeholder="Location"/>
                         </div>
                         <input type="number" min="1" max="5" value={review.rating} onChange={(e) => updateReviewLocal(review.id, 'rating', e.target.value)} className="border p-1 rounded w-16 text-center font-bold text-yellow-500"/>
                    </div>
                    <textarea value={review.comment} onChange={(e) => updateReviewLocal(review.id, 'comment', e.target.value)} className="w-full border p-2 rounded h-24 text-sm mb-4" placeholder="Review comment..."/>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-2">
                             <input type="checkbox" checked={review.showOnHome} onChange={(e) => updateReviewLocal(review.id, 'showOnHome', e.target.checked)}/>
                             <span className="text-sm">Show on Home</span>
                        </div>
                        <input type="date" value={review.date} onChange={(e) => updateReviewLocal(review.id, 'date', e.target.value)} className="border p-1 rounded text-xs"/>
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <button onClick={() => saveReview(review.id)} className="bg-nature-600 text-white px-3 py-1 rounded text-sm hover:bg-nature-700">Save</button>
                        <button onClick={() => deleteReview(review.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-nature-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          {['bookings', 'rooms', 'locations', 'drivers', 'pricing', 'gallery', 'reviews', 'home-content', 'settings'].map(tab => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors capitalize ${activeTab === tab ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}
            >
                {tab === 'bookings' && <Calendar size={18}/>}
                {tab === 'rooms' && <Home size={18}/>}
                {tab === 'locations' && <Map size={18}/>}
                {tab === 'drivers' && <Truck size={18}/>}
                {tab === 'pricing' && <Banknote size={18}/>}
                {tab === 'gallery' && <ImageIcon size={18}/>}
                {tab === 'reviews' && <MessageSquare size={18}/>}
                {tab === 'home-content' && <LayoutTemplate size={18}/>}
                {tab === 'settings' && <Settings size={18}/>}
                {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-nature-800"><LogOut size={18}/> Logout</button>
      </div>

      <div className="flex-grow p-4 md:p-8 overflow-auto h-screen">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')}</h1>
            <button onClick={handleLogout} className="md:hidden text-red-500 text-sm font-medium">Logout</button>
        </div>
        
        <div className="animate-fade-in max-w-6xl">
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'rooms' && renderRooms()}
            {activeTab === 'home-content' && renderHomePageContent()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'locations' && renderLocations()}
            {activeTab === 'drivers' && renderDrivers()}
            {activeTab === 'gallery' && renderGallery()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;