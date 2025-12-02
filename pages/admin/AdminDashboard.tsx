// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Safe AdminDashboard replacement
 * - Shows login modal overlay instead of redirecting (prevents lockout)
 * - Tries server login if /auth/login exists; falls back to DEV password
 * - Robust amount parsing & stable monthly chart
 * - Uses fetch('/api/...') by default but will try window.api.* if present
 *
 * IMPORTANT: remove DEV_TEST_PASSWORD and fallback as soon as you have a stable backend.
 */

const API_BASE = "/api"; // change if your backend uses a different base

type Booking = {
  id?: string;
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  totalAmount?: string | number;
  status?: string;
  createdAt?: string;
  [k: string]: any;
};

type Room = { id?: string; name?: string; basePrice?: any; capacity?: number; [k: string]: any };
type SiteSettings = { siteTitle?: string; contactEmail?: string; [k: string]: any };

// ---------- helpers ----------
const parseAmountSafe = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === "number") return amt;
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

const safeFetchJson = async (url: string, opts: RequestInit = {}) => {
  const resp = await fetch(url, { credentials: "same-origin", ...opts });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  return resp.json();
};

// Dev fallback password — change/remove in production
const DEV_TEST_PASSWORD = "admin123";

export default function AdminDashboard(): JSX.Element {
  const navigate = useNavigate();

  // auth & UI
  const [isAuthed, setIsAuthed] = useState<boolean>(() => localStorage.getItem("vv_admin_auth") === "true");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<"bookings" | "rooms" | "settings">("bookings");
  const [loading, setLoading] = useState(false);

  // data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});

  // Check initial auth but DO NOT auto-redirect. If not authed → show login modal.
  useEffect(() => {
    const check = async () => {
      try {
        const flag = localStorage.getItem("vv_admin_auth") === "true";
        if (flag) {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
          setShowLoginModal(true);
        }
      } catch (err) {
        console.warn("auth check error", err);
        setIsAuthed(false);
        setShowLoginModal(true);
      } finally {
        setAuthChecking(false);
      }
    };
    check();
  }, []);

  // loaders (try window.api first, else fetch)
  const loadBookings = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      if ((window as any)?.api?.bookings?.getAll) {
        // @ts-ignore
        const data = await (window as any).api.bookings.getAll();
        setBookings(Array.isArray(data) ? data : []);
        return;
      }
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
      if ((window as any)?.api?.rooms?.getAll) {
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
      if ((window as any)?.api?.settings?.get) {
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

  // when authed, load activeTab data
  useEffect(() => {
    if (!isAuthed) return;
    if (activeTab === "bookings") loadBookings();
    else if (activeTab === "rooms") loadRooms();
    else if (activeTab === "settings") loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthed]);

  const doLogout = () => {
    localStorage.removeItem("vv_admin_auth");
    setIsAuthed(false);
    setShowLoginModal(true);
  };

  // ---------- analytics for chart ----------
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const paidBookingsList = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PAID");
    const pendingBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "PENDING").length;
    const failedBookings = bookings.filter(b => ((b.status || "") as string).toUpperCase() === "FAILED").length;
    const paidBookings = paidBookingsList.length;
    const totalRevenue = paidBookingsList.reduce((s, b) => s + parseAmountSafe((b as any).totalAmount), 0);

    // last 6 months labels
    const monthlyRevenue: Record<string, number> = {};
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" }); // "Aug 25"
      months.push(key);
      monthlyRevenue[key] = 0;
    }

    paidBookingsList.forEach(b => {
      const dateStr = b.createdAt || b.checkIn || null;
      if (!dateStr) return;
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return;
      const key = dt.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyRevenue[key] !== undefined) monthlyRevenue[key] += parseAmountSafe((b as any).totalAmount);
    });

    return { totalRevenue, totalBookings, pendingBookings, failedBookings, paidBookings, monthlyRevenue, months };
  }, [bookings]);

  // ---------- CSV export ----------
  const downloadBookingsCSV = () => {
    if (!bookings || bookings.length === 0) { alert("No bookings"); return; }
    const header = ["id", "guestName", "guestPhone", "roomId", "checkIn", "checkOut", "amount", "status", "createdAt"];
    const rows = bookings.map(b => [b.id || "", (b.guestName || "").replace(/"/g,'""'), (b.guestPhone || "").replace(/"/g,'""'), b.roomId || "", b.checkIn || "", b.checkOut || "", parseAmountSafe((b as any).totalAmount).toFixed(2), b.status || "", b.createdAt || ""]);
    const csv = [header.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Chart component ----------
  const MonthlyBarChart: React.FC<{ data: Record<string, number>, months: string[] }> = ({ data, months }) => {
    const values = months.map(m => data[m] || 0);
    const maxVal = Math.max(...values, 1); // avoid division by zero
    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, height: 200, padding: "12px 8px", borderBottom: "1px solid #eee" }}>
        {months.map((m) => {
          const v = data[m] || 0;
          const raw = (v / maxVal) * 100;
          const h = v === 0 ? 6 : Math.max(raw, 6);
          return (
            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, visibility: "hidden" }}>{/* placeholder for label on hover */}</div>
              <div title={`₹${formatCurrency(v)}`} style={{ width: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6, background: v > 0 ? "#16a34a" : "#e5e7eb", height: `${h}%`, transition: "height .35s" }} />
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>{m.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- Login flow ----------
  const tryServerLogin = async (password: string) => {
    try {
      const resp = await fetch("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!resp.ok) throw new Error("server login failed");
      const data = await resp.json();
      // expected { token } but we still set legacy flag for compatibility
      if (data?.token) {
        // optional: store token somewhere if you implement validate later
        localStorage.setItem("vv_admin_auth", "true");
        setIsAuthed(true);
        setShowLoginModal(false);
        setLoginPassword("");
        return true;
      }
      return false;
    } catch (err) {
      console.warn("server login error:", err);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!loginPassword || loginPassword.trim().length === 0) { alert("Enter password"); return; }

    // try server login first
    const ok = await tryServerLogin(loginPassword);
    if (ok) {
      // load data after login
      setShowLoginModal(false);
      setIsAuthed(true);
      loadBookings();
      return;
    }

    // fallback DEV password
    if (loginPassword === DEV_TEST_PASSWORD) {
      localStorage.setItem("vv_admin_auth", "true");
      setIsAuthed(true);
      setShowLoginModal(false);
      setLoginPassword("");
      loadBookings();
      alert("Logged in with DEV fallback — remove this after backend is ready.");
      return;
    }

    alert("Login failed. If your server doesn't have /auth/login, use the DEV password or set localStorage.vv_admin_auth='true' in console.");
  };

  // ---------- small renderers ----------
  const renderBookingsTab = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
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
    </div>
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
    <div>
      <h3>Settings</h3>
      <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Site Title</label>
        <input value={settings.siteTitle || ""} onChange={e => setSettings({ ...settings, siteTitle: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 10 }} />
        <label style={{ display: "block", marginBottom: 6 }}>Contact Email</label>
        <input value={settings.contactEmail || ""} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={async () => {
            try {
              // @ts-ignore
              if ((window as any)?.api?.settings?.save) {
                // @ts-ignore
                await (window as any).api.settings.save(settings);
                alert("Settings saved");
                return;
              }
              const resp = await fetch(`${API_BASE}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
              if (!resp.ok) throw new Error("Save failed");
              alert("Settings saved");
            } catch (err) {
              console.error("save settings", err);
              alert("Failed to save settings");
            }
          }} style={{ background: "#16a34a", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6 }}>Save Settings</button>
        </div>
      </div>
    </div>
  );

  // ---------- UI while checking auth ----------
  if (authChecking) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Checking auth…</div>;
  }

  // ---------- Main layout ----------
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6", fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#0f2f25", color: "#fff", padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Admin Panel</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setActiveTab("bookings")} style={{ background: activeTab === "bookings" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Bookings</button>
          <button onClick={() => setActiveTab("rooms")} style={{ background: activeTab === "rooms" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Rooms</button>
          <button onClick={() => setActiveTab("settings")} style={{ background: activeTab === "settings" ? "#14532d" : "transparent", color: "#fff", padding: "8px 10px", border: "none", textAlign: "left", borderRadius: 6 }}>Settings</button>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <button onClick={doLogout} style={{ marginTop: 18, background: "transparent", color: "#fca5a5", border: "none" }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h1 style={{ margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div />
        </header>

        <section style={{ maxWidth: 1100 }}>
          {loading ? <div>Loading…</div> : (
            <>
              {activeTab === "bookings" && renderBookingsTab()}
              {activeTab === "rooms" && renderRoomsTab()}
              {activeTab === "settings" && renderSettingsTab()}
            </>
          )}
        </section>
      </main>

      {/* LOGIN MODAL (overlay) */}
      {!isAuthed && showLoginModal && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: 420, background: "#fff", borderRadius: 10, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Admin Login</h3>
            <p style={{ color: "#6b7280" }}>Enter admin password to continue.</p>
            <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Admin password" type="password" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowLoginModal(false); /* optional: navigate("/admin/login") */ }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "transparent" }}>Cancel</button>
              <button onClick={handleLogin} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff" }}>Login</button>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>
              Tip: If your server has <code>/auth/login</code>, the modal will try server login. Otherwise you can use the temporary dev password <strong>{DEV_TEST_PASSWORD}</strong> to restore access. Remove dev password after backend is configured.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
