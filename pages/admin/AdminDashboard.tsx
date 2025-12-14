// [SNIPPED HEADER IMPORTS — UNCHANGED]
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import {
  Room, Booking, Driver, CabLocation, SiteSettings,
  PaymentStatus, PricingRule, GalleryItem, Review
} from '../../types';
import {
  Plus, Download, MessageCircle, Loader, LogOut,
  DollarSign, Activity, Clock, TrendingUp
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
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // ================= MANUAL BOOKING (NEW) =================
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    roomId: '',
    guestName: '',
    guestPhone: '',
    checkIn: '',
    checkOut: ''
  });
  // ========================================================

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
      if (tab === 'settings') setSettings(await api.settings.get());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadTab(activeTab);
  }, [activeTab, authLoading]);

  // ================= MANUAL BOOKING LOGIC =================
  const openManualBooking = async () => {
    if (rooms.length === 0) {
      setRooms(await api.rooms.getAll()); // ✅ critical fix
    }
    setShowManualBooking(true);
  };

  const createManualBooking = async () => {
    if (!manualBooking.roomId || !manualBooking.guestName || !manualBooking.checkIn || !manualBooking.checkOut) {
      alert("Please fill all required fields");
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
  };
  // ========================================================

  const updateBookingStatus = async (id: string, status: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    await api.bookings.updateStatus(id, status);
  };

  const downloadBookingsCSV = () => {
    const headers = ["Guest", "Phone", "Room", "CheckIn", "CheckOut", "Amount", "Status"];
    const rows = bookings.map(b => [
      b.guestName, b.guestPhone, b.roomId, b.checkIn, b.checkOut, b.totalAmount, b.status
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bookings.csv";
    link.click();
  };

  // ================= BOOKINGS RENDER =================
  const renderBookings = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Guest Reservations</h2>
        <div className="flex gap-2">
          <button
            onClick={openManualBooking}
            className="bg-nature-600 text-white px-4 py-2 rounded"
          >
            + Add Manual Booking
          </button>
          <button
            onClick={downloadBookingsCSV}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* EXISTING TABLE — UNCHANGED */}
      {/* EXISTING ANALYTICS & GRAPH — UNCHANGED */}
    </div>
  );

  // ================= MANUAL BOOKING MODAL =================
  const renderManualBookingModal = () => showManualBooking && (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Manual / WhatsApp Booking</h3>

        <select
          className="w-full border p-2 rounded mb-2"
          value={manualBooking.roomId}
          onChange={(e) => setManualBooking({ ...manualBooking, roomId: e.target.value })}
        >
          <option value="">Select Room</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="Guest Name"
          onChange={(e) => setManualBooking({ ...manualBooking, guestName: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="border p-2 rounded"
            onChange={(e) => setManualBooking({ ...manualBooking, checkIn: e.target.value })}
          />
          <input type="date" className="border p-2 rounded"
            onChange={(e) => setManualBooking({ ...manualBooking, checkOut: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setShowManualBooking(false)}>Cancel</button>
          <button onClick={createManualBooking} className="bg-nature-600 text-white px-4 py-2 rounded">
            Reserve
          </button>
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR — UNCHANGED */}
      <div className="flex-grow p-8">
        {activeTab === 'bookings' && renderBookings()}
        {renderManualBookingModal()}
      </div>
    </div>
  );
};

export default AdminDashboard;
