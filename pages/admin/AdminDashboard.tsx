import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import {
  Room, Booking, Driver, CabLocation, SiteSettings,
  PaymentStatus, PricingRule, GalleryItem, Review
} from '../../types';
import {
  Plus, Trash2, Save, Download, MessageCircle, Loader,
  LogOut, X, DollarSign, Activity, Clock, TrendingUp
} from 'lucide-react';
import ImageUploader from '../../components/ui/ImageUploader';

const { useNavigate } = ReactRouterDOM as any;

const AdminDashboard = () => {
  const navigate = useNavigate();

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

  /* ================= MANUAL BOOKING ================= */
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    roomId: '',
    guestName: '',
    guestPhone: '',
    checkIn: '',
    checkOut: ''
  });
  /* ================================================== */

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const isAuth = sessionStorage.getItem('vv_admin_auth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
    } else {
      setAuthLoading(false);
      loadTab('bookings');
    }
  }, [navigate]);

  const loadTab = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'bookings') setBookings(await api.bookings.getAll());
      if (tab === 'rooms') setRooms(await api.rooms.getAll());
      if (tab === 'drivers') setDrivers(await api.drivers.getAll());
      if (tab === 'locations') setLocations(await api.locations.getAll());
      if (tab === 'pricing') setPricingRules(await api.pricing.getAll());
      if (tab === 'gallery') setGallery(await api.gallery.getAll());
      if (tab === 'reviews') setReviews(await api.reviews.getAll());
      if (tab === 'settings') setSettings(await api.settings.get());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadTab(activeTab);
  }, [activeTab, authLoading]);

  const handleLogout = () => {
    sessionStorage.removeItem('vv_admin_auth');
    navigate('/');
  };

  /* ================= MANUAL BOOKING LOGIC ================= */
  const createManualBooking = async () => {
    if (!manualBooking.roomId || !manualBooking.guestName || !manualBooking.checkIn || !manualBooking.checkOut) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(manualBooking.checkIn) >= new Date(manualBooking.checkOut)) {
      alert("Check-out must be after check-in");
      return;
    }

    const booking: Booking = {
      id: Date.now().toString(),
      roomId: manualBooking.roomId,
      guestName: manualBooking.guestName,
      guestPhone: manualBooking.guestPhone,
      checkIn: manualBooking.checkIn,
      checkOut: manualBooking.checkOut,
      totalAmount: 0,
      status: PaymentStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    await api.bookings.add(booking);
    setBookings(await api.bookings.getAll());
    setShowManualBooking(false);
    setManualBooking({ roomId: '', guestName: '', guestPhone: '', checkIn: '', checkOut: '' });
  };
  /* ======================================================= */

  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    await api.bookings.updateStatus(id, status);
  };

  const downloadBookingsCSV = () => {
    const headers = ["Guest", "Phone", "Room", "CheckIn", "CheckOut", "Amount", "Status"];
    const rows = bookings.map(b => [
      b.guestName, b.guestPhone, b.roomId,
      b.checkIn, b.checkOut, b.totalAmount, b.status
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bookings.csv";
    link.click();
  };

  /* ================= BOOKINGS TAB ================= */
  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Guest Reservations</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualBooking(true)}
            className="bg-nature-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={16} /> Add Manual Booking
          </button>
          <button
            onClick={downloadBookingsCSV}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Guest</th>
            <th className="p-3 text-left">Dates</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-t">
              <td className="p-3">
                <div className="font-semibold">{b.guestName}</div>
                <div className="text-sm text-gray-500">{b.guestPhone}</div>
              </td>
              <td className="p-3">{b.checkIn} → {b.checkOut}</td>
              <td className="p-3 font-bold">₹{b.totalAmount}</td>
              <td className="p-3">
                <select
                  value={b.status}
                  onChange={(e) => updateBookingStatus(b.id, e.target.value as PaymentStatus)}
                  className="border rounded px-2 py-1"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
              </td>
              <td className="p-3">
                <a
                  href={`https://wa.me/${b.guestPhone}`}
                  className="text-green-600 flex items-center gap-1"
                >
                  <MessageCircle size={16} /> Chat
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  /* ================================================= */

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-nature-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl">Admin Panel</div>
        {['bookings', 'rooms', 'drivers', 'locations', 'pricing', 'gallery', 'reviews', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-left hover:bg-nature-800 ${activeTab === tab ? 'bg-nature-800' : ''}`}
          >
            {tab}
          </button>
        ))}
        <button onClick={handleLogout} className="mt-auto p-6 text-red-300 flex items-center gap-2">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex-grow p-8 overflow-auto">
        {loading ? <Loader className="animate-spin" /> : (
          <>
            {activeTab === 'bookings' && renderBookings()}
            {/* Other tabs remain unchanged */}
          </>
        )}
      </div>

      {/* ================= MANUAL BOOKING MODAL ================= */}
      {showManualBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Manual / WhatsApp Booking</h3>

            <div className="space-y-3">
              <select
                className="w-full border p-2 rounded"
                value={manualBooking.roomId}
                onChange={(e) => setManualBooking({ ...manualBooking, roomId: e.target.value })}
              >
                <option value="">Select Room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <input
                className="w-full border p-2 rounded"
                placeholder="Guest Name"
                value={manualBooking.guestName}
                onChange={(e) => setManualBooking({ ...manualBooking, guestName: e.target.value })}
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Phone (optional)"
                value={manualBooking.guestPhone}
                onChange={(e) => setManualBooking({ ...manualBooking, guestPhone: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="border p-2 rounded"
                  value={manualBooking.checkIn}
                  onChange={(e) => setManualBooking({ ...manualBooking, checkIn: e.target.value })}
                />
                <input type="date" className="border p-2 rounded"
                  value={manualBooking.checkOut}
                  onChange={(e) => setManualBooking({ ...manualBooking, checkOut: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowManualBooking(false)} className="border px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={createManualBooking} className="bg-nature-600 text-white px-4 py-2 rounded">
                Reserve
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================= */}
    </div>
  );
};

export default AdminDashboard;
