// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminDashboard.tsx
 * - Server-validated token auth (localStorage 'vv_admin_token')
 * - Robust parseAmount and formatting helpers
 * - Monthly revenue calculation (last 6 months)
 * - Simple SVG bar chart for monthly revenue
 * - CSV export
 * - Minimal login modal fallback
 *
 * Adjust backend endpoints if yours are different.
 */

/* ---------- Types ---------- */
type Booking = {
  id?: string;
  guestName?: string;
  guestPhone?: string;
  roomId?: string;
  checkIn?: string; // ISO
  checkOut?: string; // ISO
  totalAmount?: string | number; // may contain "₹", commas etc.
  status?: string; // 'PAID' | 'PENDING' etc
  createdAt?: string; // booking creation
  [k: string]: any;
};

type ValidateResp = { ok: boolean } | { ok?: boolean };

/* ---------- Helpers: API wrappers (minimal) ---------- */
// Replace these with your existing `api` client if you have one.
const apiLogin = async (password: string) => {
  const resp = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!resp.ok) throw new Error("Login failed");
  return resp.json(); // expected { token }
};

const apiValidate = async (token?: string) => {
  const resp = await fetch("/auth/validate", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) return { ok: false } as ValidateResp;
  return resp.json() as Promise<ValidateResp>;
};

const apiFetchBookings = async (token?: string) => {
  // Update path if your bookings route is different
  const resp = await fetch("/bookings", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) throw new Error("Failed to load bookings");
  return (await resp.json()) as Booking[];
};

/* ---------- Money parsing & formatting ---------- */
const parseAmount = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === "number") return amt;
  const s = String(amt).replace(/[^\d.-]/g, ""); // removes ₹ , spaces, letters
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (n: number) => {
  // Indian-style grouping could be used, but toLocaleString usually suffices
  try {
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  } catch {
    return n.toFixed(2);
  }
};

/* ---------- Component ---------- */
export default function AdminDashboard(): JSX.Element {
  /* Auth state */
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("vv_admin_token"));

  /* Data state */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  /* UI state */
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms" | "settings">("bookings");

  /* ---------- Auth check ---------- */
  useEffect(() => {
    const check = async () => {
      setAuthLoading(true);
      try {
        // Prefer server validation: if token exists validate it
        const localToken = localStorage.getItem("vv_admin_token");
        if (localToken) {
          const v = await apiValidate(localToken);
          if (v && (v as any).ok) {
            setToken(localToken);
            setAuthLoading(false);
            return;
          } else {
            // token invalid -> clear
            localStorage.removeItem("vv_admin_token");
            setToken(null);
          }
        }

        // If we reach here, show login modal
        setShowLoginModal(true);
      } catch (err) {
        console.error("Auth check error:", err);
        setShowLoginModal(true);
      } finally {
        setAuthLoading(false);
      }
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Fetch bookings (needs valid token) ---------- */
  const loadBookings = async (tkn?: string | null) => {
    setLoadingBookings(true);
    try {
      const b = await apiFetchBookings(tkn ?? token ?? undefined);
      setBookings(Array.isArray(b) ? b : []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (token) loadBookings(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---------- Login handler ---------- */
  const handleLogin = async () => {
    try {
      if (!loginPassword || loginPassword.trim().length === 0) {
        alert("Please enter password");
        return;
      }

      // Call backend login
      const r = await apiLogin(loginPassword);
      if (r && (r as any).token) {
        const t = (r as any).token as string;
        localStorage.setItem("vv_admin_token", t);
        setToken(t);
        setShowLoginModal(false);
        setLoginPassword("");
        // load bookings
        await loadBookings(t);
      } else {
        // fallback: not recommended — remove in production
        alert("Login responded with no token");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Check password or server.");
    }
  };

  /* ---------- Analytics calculations ---------- */
  const analytics = useMemo(() => {
    const totals = {
      totalRevenue: 0,
      totalBookings: bookings.length,
      pendingBookings: 0,
      failedBookings: 0,
      paidBookings: 0,
      monthlyRevenue: {} as Record<string, number>,
      months: [] as string[],
    };

    // Prepare last 6 months keys
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" }); // e.g., "Aug 25"
      months.push(key);
      totals.monthlyRevenue[key] = 0;
    }
    totals.months = months;

    bookings.forEach((b) => {
      const status = (b.status || "").toUpperCase();
      const amt = parseAmount(b.totalAmount);
      if (status === "PAID") {
        totals.totalRevenue += amt;
        totals.paidBookings += 1;
      } else if (status === "PENDING") {
        totals.pendingBookings += 1;
      } else if (status === "FAILED" || status === "CANCELLED") {
        totals.failedBookings += 1;
      }

      // try pick date: createdAt -> checkIn -> now
      const dateStr = b.createdAt || b.checkIn || null;
      const bookingDate = dateStr ? new Date(dateStr) : null;
      if (bookingDate && !isNaN(bookingDate.getTime())) {
        const key = bookingDate.toLocaleString("default", { month: "short", year: "2-digit" });
        if (totals.monthlyRevenue[key] !== undefined && status === "PAID") {
          totals.monthlyRevenue[key] += amt;
        }
      }
    });

    return totals;
  }, [bookings]);

  /* ---------- SVG small bar chart ---------- */
  const MonthlyBarChart: React.FC<{ data: Record<string, number>; months: string[] }> = ({ data, months }) => {
    // find max for scaling
    const values = months.map((m) => data[m] || 0);
    const max = Math.max(...values, 1);
    const width = 600;
    const height = 160;
    const padding = 20;
    const barGap = 10;
    const barWidth = (width - padding * 2 - (months.length - 1) * barGap) / months.length;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: width }}>
        <rect x="0" y="0" width={width} height={height} rx={8} fill="#fff" stroke="#eee" />
        {months.map((m, i) => {
          const val = data[m] || 0;
          const h = (val / max) * (height - padding * 2);
          const x = padding + i * (barWidth + barGap);
          const y = height - padding - h;
          return (
            <g key={m} transform={`translate(${x},0)`}>
              <rect x={0} y={y} width={barWidth} height={h} rx={4} fill="#16a34a" />
              <text x={barWidth / 2} y={height - padding + 14} fontSize={11} textAnchor="middle" fill="#444">
                {m.split(" ")[0]}
              </text>
              <title>{`${m}: ₹${formatCurrency(val)}`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  /* ---------- CSV export ---------- */
  const downloadBookingsCSV = () => {
    if (!bookings || bookings.length === 0) {
      alert("No bookings to export");
      return;
    }
    const header = ["id", "guestName", "guestPhone", "roomId", "checkIn", "checkOut", "amount", "status", "createdAt"];
    const rows = bookings.map((b) => [
      b.id || "",
      (b.guestName || "").replace(/"/g, '""'),
      (b.guestPhone || "").replace(/"/g, '""'),
      b.roomId || "",
      b.checkIn || "",
      b.checkOut || "",
      parseAmount(b.totalAmount).toFixed(2),
      b.status || "",
      b.createdAt || "",
    ]);

    const lines = [header.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- tiny utilities ---------- */
  const logout = () => {
    localStorage.removeItem("vv_admin_token");
    setToken(null);
    setBookings([]);
    setShowLoginModal(true);
  };

  /* ---------- Render ---------- */
  if (authLoading) {
    return (
      <div className="p-6">
        <h3>Checking auth…</h3>
      </div>
    );
  }

  // If no token: show modal/login overlay (modal rendered below) but allow the page to render minimal
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Left sidebar */}
      <aside style={{ width: 220, background: "#1f3c2f", color: "white", padding: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setActiveTab("bookings")} style={{ background: activeTab === "bookings" ? "#14532d" : "transparent", color: "white", border: "none", padding: "8px 12px", textAlign: "left", borderRadius: 6 }}>
            Bookings
          </button>
          <button onClick={() => setActiveTab("rooms")} style={{ background: activeTab === "rooms" ? "#14532d" : "transparent", color: "white", border: "none", padding: "8px 12px", textAlign: "left", borderRadius: 6 }}>
            Rooms
          </button>
          <button onClick={() => setActiveTab("settings")} style={{ background: activeTab === "settings" ? "#14532d" : "transparent", color: "white", border: "none", padding: "8px 12px", textAlign: "left", borderRadius: 6 }}>
            Settings
          </button>

          <div style={{ marginTop: "auto" }}>
            <button onClick={logout} style={{ background: "transparent", color: "#fca5a5", border: "none" }}>
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 24, background: "#f3f4f6" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h1 style={{ margin: 0 }}>Bookings</h1>
          <div>
            <button onClick={downloadBookingsCSV} style={{ background: "#16a34a", color: "white", padding: "8px 12px", borderRadius: 6, border: "none" }}>
              Export CSV
            </button>
          </div>
        </header>

        {/* Top stats */}
        <section style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "white", padding: 16, borderRadius: 8, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Total Revenue</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>₹{formatCurrency(analytics.totalRevenue)}</div>
          </div>

          <div style={{ background: "white", padding: 16, borderRadius: 8, minWidth: 140 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Total Bookings</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{analytics.totalBookings}</div>
          </div>

          <div style={{ background: "white", padding: 16, borderRadius: 8, minWidth: 140 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Pending</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{analytics.pendingBookings}</div>
          </div>
        </section>

        {/* Monthly revenue chart */}
        <section style={{ background: "white", padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Monthly Revenue Trend</h3>
          <div style={{ width: "100%", overflow: "hidden" }}>
            <MonthlyBarChart data={analytics.monthlyRevenue} months={analytics.months} />
          </div>
        </section>

        {/* Bookings table */}
        <section style={{ background: "white", padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Guest Reservations</h3>

          {loadingBookings ? (
            <div>Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div>No bookings found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>Guest</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>Dates</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>Amount</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>Status</th>
                    <th style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id || Math.random()} style={{ borderBottom: "1px solid #fafafa" }}>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ fontWeight: 600 }}>{b.guestName || "—"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{b.guestPhone || ""}</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 13 }}>
                        {(b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—")} to {(b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "—")}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>₹{formatCurrency(parseAmount(b.totalAmount))}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ padding: "6px 10px", borderRadius: 999, background: b.status === "PAID" ? "#bbf7d0" : "#fde68a", color: "#065f46", fontSize: 12 }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <button onClick={() => alert(`Chat with ${b.guestName || "guest"}`)} style={{ background: "transparent", border: "none", color: "#059669" }}>
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ---------- Login Modal (overlay) ---------- */}
      {showLoginModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ width: 420, background: "white", borderRadius: 10, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Admin Login</h3>
            <p style={{ color: "#6b7280", marginBottom: 12 }}>Enter admin password to continue to the dashboard.</p>

            <input
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Admin password"
              type="password"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                }}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "white" }}
              >
                Login
              </button>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>
              Tip: This UI enforces server-validated tokens. If you previously had `vv_admin_auth` set in localStorage for testing, remove it to ensure proper validation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
