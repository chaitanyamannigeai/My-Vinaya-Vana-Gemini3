// pages/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Self-contained AdminDashboard
 * - Uses fetch('/api/...') by default (change API_BASE if needed)
 * - Falls back to window.api.* if your project exposes it
 * - Fixes revenue parsing & chart
 * - Keeps existing vv_admin_auth redirect behavior
 */

/* ========== CONFIG ========== */
// If your API is mounted at another base path, change this to e.g. '/api/v1'
const API_BASE = "/api";

/* ========== Types (light) ========== */
type Booking = {
  id?: string;
  guestName?: string;
  guestPhone?: string;
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  totalAmount?: string | number;
  status?: string;
  createdAt?: string;
  [k: string]: any;
};

type Room = {
  id?: string;
  name?: string;
  basePrice?: number | string;
  capacity?: number;
  [k: string]: any;
};

type SiteSettings = {
  siteTitle?: string;
  contactEmail?: string;
  [k: string]: any;
};

/* ========== Helpers ========== */
const parseAmountSafe = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === "number") return amt;
  // Keep only digits, dot and minus sign
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

const safeFetchJson = async (path: string) => {
  const resp = await fetch(path, { credentials: "same-origin" });
  if (!resp.ok) throw new Error(`Fetch ${path} failed: ${resp.status}`);
  return resp.json();
};

/* ========== Component ========== */
export default function AdminDashboard(): JSX.Element {
  const navigate = useNavigate();

  // auth + UI
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms" | "settings">("bookings");

  // data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});

  /* ---------- Auth: preserve legacy behavior ---------- */
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("vv_admin_auth");
      if (isAuth !== "true") {
        // redirect to original login path
        navigate("/admin/login");
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  /* ---------- Loaders: try window.api first, else fetch endpoints ---------- */
  const loadBookings = async () => {
    setLoading(true);
    try {
      // If your project exposes window.api, prefer it
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).api?.bookings?.getAll) {
        // @ts-ignore
        const data = await (window as any).api.bookings.getAll();
        setBookings(Array.isArray(data) ? data : []);
        return;
      }
      // default endpoint
      const data = await safeFetchJson(`${API_BASE}/bookings`);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadBookings error:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).api?.rooms?.getAll) {
        // @ts-ignore
        const data = await (window as any).api.rooms.getAll();
        setRooms(Array.isArray(data) ? data : []);
        return;
      }
      const data = await safeFetchJson(`${API_BASE}/rooms`);
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadRooms error:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).api?.settings?.get) {
        // @ts-ignore
        const s = await (window as any).api.settings.get();
        setSettings(s || {});
        return;
      }
      const s = await safeFetchJson(`${API_BASE}/settings`);
      setSettings(s || {});
    } catch (err) {
      console.error("loadSettings error:", err);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  // load when tab or after auth
  useEffect(() => {
    if (authLoading) return;
    if (activeTab === "bookings") loadBookings();
    else if (activeTab === "rooms") loadRooms();
    else if (activeTab === "settings") loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authLoading]);

  const logout = () => {
    localStorage.removeItem("vv_admin_auth");
    navigate("/");
  };

  /* ---------- Analytics (memoized) ---------- */
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const paidBookingsList = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PAID");
    const pendingBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PENDING").length;
    const failedBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "FAILED").length;
    const paidBookings = paidBookingsList.length;

    const totalRevenue = paidBookingsList.reduce((sum, b) => sum + parseAmountSafe((b as any).totalAmount), 0);

    // last 6 months
    const monthlyRevenue: Record<string, number> = {};
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      months.push(key);
      monthlyRevenue[key] = 0;
    }

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

  /* ---------- CSV export ---------- */
  const downloadBookingsCSV = () => {
    if (!bookings || bookings.length === 0) {
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
    a.download = `bookings_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Chart component ---------- */
  const MonthlyBarChart: React.FC<{ data: Record<string, number>, months: string[] }> = ({ data, months }) => {
    const values = months.map(m => data[m] || 0);
    const maxVal = Math.max(...values, 1); // fallback 1 to avoid division by zero but small enough not to hide values

    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 192, gap: 8, padding: "12px 8px", borderBottom: "1px solid #e5e7eb" }}>
        {months.map((month) => {
          const value = data[month] || 0;
          const rawPercent = (value / maxVal) * 100;
          const heightPercent = value === 0 ? 6 : Math.max(rawPercent, 6); // ensure tiny bars visible
          return (
            <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, visibility: "hidden" }} className="bar-label">
                ₹{formatCurrency(value)}
              </div>
              <div title={`₹${formatCurrency(value)}`} style={{ width: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6, background: value > 0 ? "#16a34a" : "#e5e7eb", height: `${heightPercent}%`, transition: "height 0.35s" }} />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{month.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------- Renderers for tabs ---------- */
  const renderBookingsTab = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Total Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>₹{formatCurrency(analytics.totalRevenue)}</div>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Total Bookings</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{analytics.totalBookings}</div>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{analytics.pendingBookings}</div>
        </div>
      </div>

      <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Monthly Revenue Trend</h3>
        <MonthlyBarChart data={analytics.monthlyRevenue} months={analytics.months} />
      </div>

      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: 12, borderBottom: "1px solid #f3f4f6", background: "#fbfbfb" }}>
          <strong>Guest Reservations</strong>
          <button onClick={downloadBookingsCSV} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6 }}>Export CSV</button>
        </div>

        {bookings.length === 0 ? (
          <div style={{ padding: 16, color: "#6b7280" }}>No bookings found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
                  <th style={{ padding: 12 }}>Guest</th>
                  <th style={{ padding: 12 }}>Dates</th>
                  <th style={{ padding: 12 }}>Amount</th>
                  <th style={{ padding: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id || Math.random()} style={{ borderBottom: "1px solid #fafafa" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{b.guestName || "—"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{b.guestPhone || ""}</div>
                    </td>
                    <td style={{ padding: 12 }}>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"} to {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>₹{formatCurrency(parseAmountSafe((b as any).totalAmount))}</td>
                    <td style={{ padding: 12 }}>{b.status || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderRoomsTab = () => (
    <div>
      <h3>Rooms</h3>
      {rooms.length === 0 ? <p style={{ color: "#6b7280" }}>No rooms loaded.</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {rooms.map(r => (
            <div key={r.id} style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Base price: ₹{r.basePrice}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div style={{ maxWidth: 720 }}>
      <h3>Settings</h3>
      <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Site Title</label>
        <input value={settings.siteTitle || ""} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 10 }} />
        <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Contact Email</label>
        <input value={settings.contactEmail || ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={async () => {
            try {
              // try window.api if present
              // @ts-ignore
              if (typeof window !== "undefined" && (window as any).api?.settings?.save) {
                // @ts-ignore
                await (window as any).api.settings.save(settings);
                alert("Settings saved");
                return;
              }
              // otherwise try POST
              const resp = await fetch(`${API_BASE}/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
              });
              if (!resp.ok) throw new Error("Save failed");
              alert("Settings saved");
            } catch (err) {
              console.error("save settings error:", err);
              alert("Failed to save settings");
            }
          }} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6 }}>Save Settings</button>
        </div>
      </div>
    </div>
  );

  /* ---------- UI while auth loading ---------- */
  if (authLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
        <div style={{ fontSize: 16, color: "#16a34a" }}>Checking auth…</div>
      </div>
    );
  }

  /* ---------- Main layout ---------- */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <aside style={{ width: 220, background: "#0f2f25", color: "#fff", padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Admin Panel</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setActiveTab("bookings")} style={{ background: activeTab === "bookings" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Bookings</button>
          <button onClick={() => setActiveTab("rooms")} style={{ background: activeTab === "rooms" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Rooms</button>
          <button onClick={() => setActiveTab("settings")} style={{ background: activeTab === "settings" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Settings</button>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <button onClick={logout} style={{ marginTop: 18, background: "transparent", color: "#fca5a5", border: "none" }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h1 style={{ margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div />
        </header>

        <section style={{ maxWidth: 1100 }}>
          {loading ? (
            <div style={{ padding: 20 }}>Loading…</div>
          ) : (
            <>
              {activeTab === "bookings" && renderBookingsTab()}
              {activeTab === "rooms" && renderRoomsTab()}
              {activeTab === "settings" && renderSettingsTab()}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
