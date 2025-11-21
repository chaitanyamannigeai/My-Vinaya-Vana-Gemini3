import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Room, Booking, Driver, CabLocation, SiteSettings, PaymentStatus, PricingRule, GalleryItem, Review } from '../../types';
import { Settings, Calendar, Truck, Map, User, Home, LogOut, Plus, Trash2, Save, Banknote, X, Image as ImageIcon, MessageSquare, LayoutTemplate } from 'lucide-react';
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
  const [settings, setSettings] = useState<SiteSettings>(db.settings.get());

  // Refresh data
  const refreshData = () => {
    setBookings(db.bookings.getAll().reverse());
    setRooms(db.rooms.getAll());
    setDrivers(db.drivers.getAll());
    setLocations(db.locations.getAll());
    setPricingRules(db.pricing.getAll());
    setGallery(db.gallery.getAll());
    setReviews(db.reviews.getAll());
    setSettings(db.settings.get());
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('vv_admin_auth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
      return;
    }
    refreshData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  // --- Handlers ---
  
  const updateBookingStatus = (id: string, status: PaymentStatus) => {
    db.bookings.updateStatus(id, status);
    refreshData();
  };

  // Room Handlers
  const addRoom = () => {
    const newRoom: Room = {
        id: `r${Date.now()}`,
        name: 'New Room',
        description: 'Description here...',
        basePrice: 3000,
        capacity: 2,
        amenities: ['Wifi', 'AC'],
        images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800']
    };
    db.rooms.save([...rooms, newRoom]);
    refreshData();
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
      const updated = rooms.map(r => r.id === id ? { ...r, [field]: value } : r);
      db.rooms.save(updated);
      refreshData();
  };

  const updateRoomAmenities = (id: string, amenitiesStr: string) => {
      const arr = amenitiesStr.split(',').map(s => s.trim());
      updateRoom(id, 'amenities', arr);
  };

  const deleteRoom = (id: string) => {
      if(window.confirm("Are you sure you want to delete this room?")) {
          const updated = rooms.filter(r => r.id !== id);
          db.rooms.save(updated);
          refreshData();
      }
  }

  // Driver Handlers
  const addDriver = () => {
    const newDriver: Driver = {
      id: Date.now().toString(),
      name: 'New Driver',
      phone: '',
      whatsapp: '',
      isDefault: false,
      active: true,
      vehicleInfo: ''
    };
    db.drivers.save([...drivers, newDriver]);
    refreshData();
  };

  const updateDriver = (id: string, field: keyof Driver, value: any) => {
    const updated = drivers.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      if (field === 'isDefault' && value === true && d.id !== id) {
        return { ...d, isDefault: false };
      }
      return d;
    });
    db.drivers.save(updated);
    refreshData();
  };

  // Location Handlers
  const addLocation = () => {
     const newLoc: CabLocation = {
         id: Date.now().toString(),
         name: 'New Location',
         description: '',
         imageUrl: 'https://images.unsplash.com/photo-1590664095612-2d4e5e0a8d7a?auto=format&fit=crop&q=80&w=400',
         active: true,
         driverId: null
     };
     db.locations.save([...locations, newLoc]);
     refreshData();
  };

  const updateLocation = (id: string, field: keyof CabLocation, value: any) => {
    const updated = locations.map(l => l.id === id ? { ...l, [field]: value } : l);
    db.locations.save(updated);
    refreshData();
  };

  // Pricing Rules Handlers
  const addPricingRule = () => {
      const newRule: PricingRule = {
          id: `pr${Date.now()}`,
          name: 'New Season',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          multiplier: 1.2
      };
      db.pricing.save([...pricingRules, newRule]);
      refreshData();
  };

  const updatePricingRule = (id: string, field: keyof PricingRule, value: any) => {
      const updated = pricingRules.map(p => p.id === id ? {...p, [field]: value} : p);
      db.pricing.save(updated);
      refreshData();
  };

  const deletePricingRule = (id: string) => {
      const updated = pricingRules.filter(p => p.id !== id);
      db.pricing.save(updated);
      refreshData();
  };

  // Gallery Handlers
  const addGalleryItem = () => {
      const newItem: GalleryItem = {
          id: `g${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800',
          category: 'Property',
          caption: ''
      };
      db.gallery.save([...gallery, newItem]);
      refreshData();
  };

  const updateGalleryItem = (id: string, field: keyof GalleryItem, value: any) => {
      const updated = gallery.map(g => g.id === id ? {...g, [field]: value} : g);
      db.gallery.save(updated);
      refreshData();
  };

  const deleteGalleryItem = (id: string) => {
      const updated = gallery.filter(g => g.id !== id);
      db.gallery.save(updated);
      refreshData();
  };

  // Review Handlers
  const addReview = () => {
    const newReview: Review = {
        id: `rev${Date.now()}`,
        guestName: 'Guest Name',
        location: 'City',
        rating: 5,
        comment: 'Great stay!',
        date: new Date().toISOString().split('T')[0],
        showOnHome: false
    };
    db.reviews.save([...reviews, newReview]);
    refreshData();
  };

  const updateReview = (id: string, field: keyof Review, value: any) => {
    const updated = reviews.map(r => r.id === id ? { ...r, [field]: value } : r);
    db.reviews.save(updated);
    refreshData();
  };

  const deleteReview = (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    db.reviews.save(updated);
    refreshData();
  }

  const saveSettings = () => {
    db.settings.save(settings);
    alert('Settings Saved!');
  };

  // --- Render Components ---

  const renderBookings = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map(b => (
            <tr key={b.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{b.guestName}</div>
                <div className="text-sm text-gray-500">{b.guestPhone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {b.checkIn} to {b.checkOut}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{b.totalAmount}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select 
                  value={b.status}
                  onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)}
                  className={`text-sm rounded-full px-3 py-1 font-semibold ${
                    b.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
              <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-6">
      <button onClick={addRoom} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
          <Plus size={16} /> Add New Room
      </button>

      {rooms.map(room => (
        <div key={room.id} className="bg-white p-6 rounded-lg shadow flex flex-col lg:flex-row gap-6 relative border border-gray-100">
            <button onClick={() => deleteRoom(room.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-white p-1 rounded-full shadow-sm z-10">
                <Trash2 size={20} />
            </button>

            <div className="lg:w-1/3">
                 <ImageUploader 
                    label="Room Main Image"
                    value={room.images[0]}
                    onChange={(val) => {
                        const newImgs = [...room.images];
                        newImgs[0] = val;
                        updateRoom(room.id, 'images', newImgs);
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
                            onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                            className="border rounded px-3 py-2 w-full font-bold"
                        />
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500">Base Price (₹)</label>
                        <input 
                            type="number" 
                            value={room.basePrice}
                            onChange={(e) => updateRoom(room.id, 'basePrice', parseInt(e.target.value))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-500">Description</label>
                    <textarea 
                        value={room.description}
                        onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                        className="border rounded px-3 py-2 w-full h-20"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs text-gray-500">Capacity</label>
                        <input 
                            type="number" 
                            value={room.capacity}
                            onChange={(e) => updateRoom(room.id, 'capacity', parseInt(e.target.value))}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Amenities (comma separated)</label>
                        <input 
                            type="text" 
                            value={room.amenities.join(', ')}
                            onChange={(e) => updateRoomAmenities(room.id, e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
      ))}
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4">
        <button onClick={addLocation} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Cab Location
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map(loc => (
                <div key={loc.id} className="bg-white p-4 rounded-lg shadow relative border border-gray-100">
                     <button 
                        onClick={() => { 
                            const filtered = locations.filter(l => l.id !== loc.id);
                            db.locations.save(filtered);
                            refreshData();
                        }} 
                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded z-10 bg-white shadow-sm"
                    >
                        <Trash2 size={16}/>
                    </button>
                    <div className="mb-4">
                        <ImageUploader 
                            label="Location Image"
                            value={loc.imageUrl}
                            onChange={(val) => updateLocation(loc.id, 'imageUrl', val)}
                        />
                    </div>
                    <div className="space-y-2">
                         <input 
                            type="text" 
                            value={loc.name}
                            onChange={(e) => updateLocation(loc.id, 'name', e.target.value)}
                            className="font-bold border w-full p-1 rounded"
                            placeholder="Location Name"
                        />
                         <textarea 
                            value={loc.description}
                            onChange={(e) => updateLocation(loc.id, 'description', e.target.value)}
                            className="text-sm border w-full p-1 rounded h-20"
                            placeholder="Description"
                        />
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="text-xs block text-gray-500">Price (Optional)</label>
                                <input type="number" value={loc.price || ''} onChange={(e) => updateLocation(loc.id, 'price', parseInt(e.target.value))} className="border w-full p-1 rounded"/>
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs block text-gray-500">Driver</label>
                                <select 
                                    value={loc.driverId || ''} 
                                    onChange={(e) => updateLocation(loc.id, 'driverId', e.target.value || null)}
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

  const renderGallery = () => (
      <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm text-green-800">
              Add images here for the Gallery page. You can paste a URL or upload a file.
          </div>

          <button onClick={addGalleryItem} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Image
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow relative group border border-gray-100">
                       <button 
                            onClick={() => deleteGalleryItem(item.id)} 
                            className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500 hover:bg-red-50 z-10 shadow-sm"
                        >
                            <Trash2 size={16}/>
                        </button>
                      <div className="mb-3">
                          <ImageUploader 
                            value={item.url}
                            onChange={(val) => updateGalleryItem(item.id, 'url', val)}
                          />
                      </div>
                      <div className="space-y-2">
                          <div>
                              <label className="text-xs text-gray-500">Category (e.g., Rooms, Nature)</label>
                              <input 
                                type="text" 
                                value={item.category} 
                                onChange={(e) => updateGalleryItem(item.id, 'category', e.target.value)}
                                className="border w-full p-1 rounded text-sm"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500">Caption (Optional)</label>
                              <input 
                                type="text" 
                                value={item.caption || ''} 
                                onChange={(e) => updateGalleryItem(item.id, 'caption', e.target.value)}
                                className="border w-full p-1 rounded text-sm"
                              />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
        <button onClick={addReview} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Guest Review
        </button>
        <div className="grid gap-4">
            {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400 relative">
                    <button onClick={() => deleteReview(rev.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                        <X size={16}/>
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-gray-500">Guest Name</label>
                            <input type="text" value={rev.guestName} onChange={(e) => updateReview(rev.id, 'guestName', e.target.value)} className="border w-full p-1 rounded font-bold"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Location</label>
                            <input type="text" value={rev.location} onChange={(e) => updateReview(rev.id, 'location', e.target.value)} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Rating (1-5)</label>
                            <input type="number" min="1" max="5" value={rev.rating} onChange={(e) => updateReview(rev.id, 'rating', parseInt(e.target.value))} className="border w-full p-1 rounded"/>
                        </div>
                    </div>
                    <div className="mb-4">
                         <label className="text-xs text-gray-500">Comment</label>
                         <textarea value={rev.comment} onChange={(e) => updateReview(rev.id, 'comment', e.target.value)} className="border w-full p-2 rounded h-20 text-sm"></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                             <label className="text-xs text-gray-500">Date</label>
                             <input type="date" value={rev.date} onChange={(e) => updateReview(rev.id, 'date', e.target.value)} className="border ml-2 p-1 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="checkbox" checked={rev.showOnHome} onChange={(e) => updateReview(rev.id, 'showOnHome', e.target.checked)} id={`home-${rev.id}`} />
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
                <p className="text-xs text-gray-500">This is the large background image shown at the top of the Home page.</p>
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
                    placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">Paste the full YouTube URL here. It will appear on the Home page.</p>
            </div>
        </div>

        <button 
            onClick={saveSettings}
            className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"
        >
            <Save size={18} /> Save Content
        </button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white p-8 rounded-lg shadow max-w-2xl space-y-8">
        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Site Configuration</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Global WhatsApp Number</label>
                    <input 
                        type="text" 
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Razorpay Key ID</label>
                    <input 
                        type="text" 
                        value={settings.razorpayKey}
                        onChange={(e) => setSettings({...settings, razorpayKey: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <input 
                        type="checkbox" 
                        checked={settings.enableOnlinePayments}
                        onChange={(e) => setSettings({...settings, enableOnlinePayments: e.target.checked})}
                        id="onlinePay"
                    />
                    <label htmlFor="onlinePay" className="text-sm font-medium text-gray-700">Enable Online Payments</label>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Admin Security</h3>
             <div>
                <label className="block text-sm font-medium text-gray-700">Update Admin Password</label>
                <input 
                    type="text" 
                    value={settings.adminPasswordHash}
                    onChange={(e) => setSettings({...settings, adminPasswordHash: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
                />
            </div>
        </div>

        <button 
            onClick={saveSettings}
            className="flex items-center gap-2 bg-nature-600 text-white px-6 py-2 rounded-md hover:bg-nature-700 w-full justify-center"
        >
            <Save size={18} /> Save Settings
        </button>
    </div>
  );

  // Drivers and Pricing are same as before, omitted for brevity but included in render switch
  const renderDrivers = () => (
    <div className="space-y-4">
        <button onClick={addDriver} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
            <Plus size={16} /> Add Driver
        </button>
        <div className="grid gap-4">
            {drivers.map(d => (
                <div key={d.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-nature-500 relative">
                    <button 
                        onClick={() => {
                            const filtered = drivers.filter(dr => dr.id !== d.id);
                            db.drivers.save(filtered);
                            refreshData();
                        }} 
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                        <X size={16}/>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-500 block">Name</label>
                            <input type="text" value={d.name} onChange={(e) => updateDriver(d.id, 'name', e.target.value)} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block">Phone</label>
                            <input type="text" value={d.phone} onChange={(e) => updateDriver(d.id, 'phone', e.target.value)} className="border w-full p-1 rounded"/>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 block">WhatsApp</label>
                             <input type="text" value={d.whatsapp} onChange={(e) => updateDriver(d.id, 'whatsapp', e.target.value)} className="border w-full p-1 rounded"/>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={d.isDefault} onChange={(e) => updateDriver(d.id, 'isDefault', e.target.checked)} /> Default
                            </label>
                             <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={d.active} onChange={(e) => updateDriver(d.id, 'active', e.target.checked)} /> Active
                            </label>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
        <button onClick={addPricingRule} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded hover:bg-nature-700">
          <Plus size={16} /> Add Seasonal Rule
        </button>
        <div className="grid gap-4">
            {pricingRules.map(rule => (
                <div key={rule.id} className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center gap-4 relative">
                      <button onClick={() => deletePricingRule(rule.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                          <X size={16}/>
                      </button>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                        <div>
                            <label className="text-xs text-gray-500">Season Name</label>
                            <input type="text" value={rule.name} onChange={(e) => updatePricingRule(rule.id, 'name', e.target.value)} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Start Date</label>
                            <input type="date" value={rule.startDate} onChange={(e) => updatePricingRule(rule.id, 'startDate', e.target.value)} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">End Date</label>
                            <input type="date" value={rule.endDate} onChange={(e) => updatePricingRule(rule.id, 'endDate', e.target.value)} className="border w-full p-2 rounded"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Multiplier</label>
                            <input type="number" step="0.1" value={rule.multiplier} onChange={(e) => updatePricingRule(rule.id, 'multiplier', parseFloat(e.target.value))} className="border w-full p-2 rounded font-bold text-nature-700"/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-nature-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-nature-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'bookings' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Calendar size={18}/> Bookings</button>
          <button onClick={() => setActiveTab('rooms')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'rooms' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Home size={18}/> Rooms</button>
          <button onClick={() => setActiveTab('home-content')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'home-content' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><LayoutTemplate size={18}/> Home Page</button>
          <button onClick={() => setActiveTab('pricing')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'pricing' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Banknote size={18}/> Pricing</button>
          <button onClick={() => setActiveTab('locations')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'locations' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Map size={18}/> Cabs</button>
          <button onClick={() => setActiveTab('drivers')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'drivers' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Truck size={18}/> Drivers</button>
          <button onClick={() => setActiveTab('gallery')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'gallery' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><ImageIcon size={18}/> Gallery</button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'reviews' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><MessageSquare size={18}/> Reviews</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-nature-800 transition-colors ${activeTab === 'settings' ? 'bg-nature-800 border-r-4 border-green-400' : ''}`}><Settings size={18}/> Settings</button>
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-nature-800"><LogOut size={18}/> Logout</button>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-nature-900 text-white z-50 flex justify-between px-4 py-2 overflow-x-auto">
          <button onClick={() => setActiveTab('bookings')} className="p-2 shrink-0"><Calendar size={20}/></button>
          <button onClick={() => setActiveTab('rooms')} className="p-2 shrink-0"><Home size={20}/></button>
          <button onClick={() => setActiveTab('home-content')} className="p-2 shrink-0"><LayoutTemplate size={20}/></button>
          <button onClick={() => setActiveTab('reviews')} className="p-2 shrink-0"><MessageSquare size={20}/></button>
          <button onClick={() => setActiveTab('settings')} className="p-2 shrink-0"><Settings size={20}/></button>
      </div>
      
      {/* Content */}
      <div className="flex-grow p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')}</h1>
            <button onClick={handleLogout} className="md:hidden text-red-500 text-sm font-medium">Logout</button>
        </div>
        
        <div className="animate-fade-in">
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