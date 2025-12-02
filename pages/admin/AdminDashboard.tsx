// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import * as ReactRouterDOM from "react-router-dom";
import { api, DEFAULT_SETTINGS } from "././services/api";
import type { Booking, Room, SiteSettings } from "././types";
import { Download, Loader, LogOut, Clock, Activity, DollarSign } from "lucide-react";

const { useNavigate } = ReactRouterDOM as any;

/**
 * Stable AdminDashboard
 * - Keeps legacy vv_admin_auth flow (redirects to /admin/login if not set)
 * - Fixes revenue parsing (handles "₹", commas, spaces)
 * - Computes monthly revenue (last 6 months) with proper scaling for chart
 * - Formats currency consistently
 * - Uses your existing api.* methods (no new endpoints required)
 */

const parseAmountSafe = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === "number") return amt;
  // Remove everything except digits, dot and minus
  const s = String(amt).replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (n: number) => {
  try {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return n.toFixed(2);
  }
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // auth + ui
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms" | "settings">("bookings");

  // data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // --- Auth behavior: same as original app (vv_admin_auth flag) ---
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("vv_admin_auth");
      if (isAuth !== "true") {
        // Not authenticated — redirect to your admin login page (keeps existing behavior)
        navigate("/admin/login");
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // --- Loaders using your existing api client ---
  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.bookings.getAll();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load bookings", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await api.rooms.getAll();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load rooms", e);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await api.settings.get();
      setSettings(s || DEFAULT_SETTINGS);
    } catch (e) {
      console.error("Failed to load settings", e);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  // When auth validated, load the active tab
  useEffect(() => {
    if (authLoading) return;
    if (activeTab === "bookings") {
      loadBookings();
    } else if (activeTab === "rooms") {
      loadRooms();
    } else if (activeTab === "settings") {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authLoading]);

  const handleLogout = () => {
    localStorage.removeItem("vv_admin_auth");
    navigate("/");
  };

  // --- ANALYTICS: robust, memoized ---
  const analytics = useMemo(() => {
    // bookings summary
    const totalBookings = bookings.length;
    const paidBookingsList = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PAID");
    const pendingBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PENDING").length;
    const failedBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "FAILED").length;
    const paidBookings = paidBookingsList.length;

    const totalRevenue = paidBookingsList.reduce((s, b) => s + parseAmountSafe((b as any).totalAmount), 0);

    // last 6 months keys
    const monthlyRevenue: Record<string, number> = {};
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" }); // e.g., "Aug 25"
      months.push(key);
      monthlyRevenue[key] = 0;
    }

    // accumulate per month using createdAt or fallback to checkIn
    paidBookingsList.forEach(b => {
      const dateStr = b.createdAt || b.checkIn || null;
      if (!dateStr) return;
      const bookingDate = new Date(dateStr);
      if (isNaN(bookingDate.getTime())) return;
      const key = bookingDate.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += parseAmountSafe((b as any).totalAmount);
      }
    });

    return { totalRevenue, totalBookings, pendingBookings, failedBookings, paidBookings, monthlyRevenue, months };
  }, [bookings]);

  // --- CSV export ---
  const downloadBookingsCSV = () => {
    if (!bookings.length) {
      alert("No bookings to export");
      return;
    }
    const header = ["id", "guestName", "guestPhone", "roomId", "checkIn", "checkOut", "amount", "status", "createdAt"];
    const rows = bookings.map(b => [
      b.id || "",
      (b.guestName || "").replace(/"/g, '""'),
      (b.guestPhone || "").replace(/"/g, '""'),
      b.roomId || "",
      b.checkIn || "",
      b.checkOut || "",
      parseAmountSafe((b as any).totalAmount).toFixed(2),
      b.status || "",
      b.createdAt || ""
    ]);
    const lines = [header.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Chart subcomponent ---
  const MonthlyBarChart: React.FC<{ data: Record<string, number>, months: string[] }> = ({ data, months }) => {
    // compute values and scale once
    const values = months.map(m => data[m] || 0);
    const maxVal = Math.max(...values, 1); // avoid division by zero; 1 is minimal so small real values show
    return (
      <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-gray-200 px-4">
        {months.map(month => {
          const value = data[month] || 0;
          // scale to percent
          const rawPercent = (value / maxVal) * 100;
          // ensure tiny values are still visible; if value is zero show very faint small bar
          const heightPercent = value === 0 ? 2 : Math.max(rawPercent, 6);
          return (
            <div key={month} className="flex flex-col items-center gap-2 w-full group relative">
              <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-white shadow px-2 py-1 rounded">
                ₹{formatCurrency(value)}
              </div>
              <div
                className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 relative ${value > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-100'}`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-xs text-gray-500 font-medium">{month.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // --- Renders ---
  const renderBookingsTab = () => (
    <div className="space-y-8">
      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{formatCurrency(analytics.totalRevenue)}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.totalBookings}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Activity size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Pending Actions</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{analytics.pendingBookings}</h3>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Clock size={24} /></div>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Revenue Trend</h3>
        <MonthlyBarChart data={analytics.monthlyRevenue} months={analytics.months} />
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700">Guest Reservations</h3>
          <button onClick={downloadBookingsCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((b: any) => (
                  <tr key={b.id || Math.random()}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{b.guestName || "—"}</div>
                      <div className="text-sm text-gray-500">{b.guestPhone || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—")} to {(b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "—")}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{formatCurrency(parseAmountSafe((b as any).totalAmount))}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{b.status || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoomsTab = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rooms (read-only for now)</h2>
      {rooms.length === 0 ? <p className="text-sm text-gray-500">No rooms loaded.</p> : (
        <div className="grid gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="font-bold text-gray-800">{room.name}</h3>
              <p className="text-sm text-gray-600 mt-1">Base price: ₹{room.basePrice}</p>
              <p className="text-xs text-gray-500 mt-1">Capacity: {room.capacity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="bg-white p-6 rounded-lg shadow max-w-xl space-y-4">
      <h2 className="text-lg font-semibold mb-2">Basic Settings</h2>
      <p className="text-sm text-gray-500">These values are loaded from your existing settings API.</p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Site Title</label>
          <input className="mt-1 block w-full border p-2 rounded" value={settings.siteTitle || ""} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input className="mt-1 block w-full border p-2 rounded" value={settings.contactEmail || ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
        </div>
      </div>
      <button onClick={async () => { try { await api.settings.save(settings); alert("Settings saved."); } catch (e) { console.error(e); alert("Failed to save settings."); } }} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Save Settings</button>
    </div>
  );

  // --- initial auth loading UI ---
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  // --- main layout ---
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-emerald-950 text-white flex flex-col shrink-0">
        <div className="p-6 font-serif font-bold text-xl border-b border-emerald-800">Admin Panel</div>
        <nav className="flex-grow py-4 overflow-y-auto">
          {["bookings", "rooms", "settings"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as "bookings" | "rooms" | "settings")} className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-emerald-800 capitalize ${activeTab === tab ? "bg-emerald-800 border-r-4 border-green-400" : ""}`}>
              <span className="capitalize">{tab.replace("-", " ")}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-6 flex items-center gap-2 text-red-300 hover:text-white border-t border-emerald-800"><LogOut size={18} /> Logout</button>
      </div>

      {/* Main content */}
      <div className="flex-grow p-8 h-screen overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-6">{activeTab.replace("-", " ")}</h1>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : (
          <div className="max-w-6xl space-y-8">
            {activeTab === "bookings" && renderBookingsTab()}
            {activeTab === "rooms" && renderRoomsTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
