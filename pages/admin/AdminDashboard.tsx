// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminDashboard.tsx
 * - Server-validated token auth when available
 * - DEV fallback (localStorage vv_admin_auth or test password) so the UI isn't blocked
 * - Robust parseAmount & formatting
 * - Monthly revenue (last 6 months) + tiny SVG bar chart
 * - CSV export
 *
 * IMPORTANT:
 * - Remove DEV fallback (DEV_TEST_PASSWORD and localStorage fallback) after backend is configured.
 */

/* ---------- Types ---------- */
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

type ValidateResp = { ok: boolean } | { ok?: boolean };

/* ---------- Minimal API wrappers (replace if you have an api client) ---------- */
const apiLogin = async (password: string) => {
  const resp = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!resp.ok) throw new Error("Login failed");
  return resp.json();
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
  const resp = await fetch("/bookings", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) {
    // bubble up error so caller can fallback if needed
    throw new Error("Failed to load bookings");
  }
  return resp.json() as Promise<Booking[]>;
};

/* ---------- Money helpers ---------- */
const parseAmount = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === "number") return amt;
  const s = String(amt).replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (n: number) => {
  try {
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  } catch {
    return n.toFixed(2);
  }
};

/* ---------- Component ---------- */
export default function AdminDashboard(): JSX.Element {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("vv_admin_token"));

  // Data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms" | "settings">("bookings");

  // DEV fallback password (remove/change for production)
  const DEV_TEST_PASSWORD = "admin123";

  // Auth check: prefer server validation, fall back to legacy localStorage flag for dev
  useEffect(() => {
    const check = async () => {
      setAuthLoading(true);
      try {
        const localToken = localStorage.getItem("vv_admin_token");
        if (localToken) {
          try {
            const v = await apiValidate(localToken);
            if (v && (v as any).ok) {
              setToken(localToken);
              setShowLoginModal(false);
              setAuthLoading(false);
              return;
            } else {
              // invalid token -> remove
              localStorage.removeItem("vv_admin_token");
              setToken(null);
            }
          } catch (err) {
            // network or endpoint missing -> continue to fallback
            console.warn("apiValidate failed (network or missing endpoint). Falling back to DEV checks.", err);
          }
        }

        // DEV fallback: if old localStorage flag was used in the past
        if (localStorage.getItem("vv_admin_auth") === "true") {
          console.warn("Using DEV localStorage vv_admin_auth fallback.");
          setShowLoginModal(false);
          setAuthLoading(false);
          return;
        }

        // No valid auth -> show login modal
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

  // Load bookings when token present or when using DEV fallback (no token)
  const loadBookings = async (tkn?: string | null) => {
    setLoadingBookings(true);
    try {
      // If token present, try secure fetch
      if (tkn) {
        const b = await apiFetchBookings(tkn);
        setBookings(Array.isArray(b) ? b : []);
        return;
      }

      // Try unauthenticated fetch (some setups allow public bookings)
      try {
        const b = await apiFetchBookings(undefined);
        setBookings(Array.isArray(b) ? b : []);
        return;
      } catch (err) {
        // ignore, will set empty bookings below
      }

      // If DEV flag present, and no server bookings, show empty dataset (you can seed local sample if needed)
      setBookings([]);
    } catch (err) {
      console.error("loadBookings error:", err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    // If token or dev flag present, load bookings
    if (token || localStorage.getItem("vv_admin_auth") === "true") {
      loadBookings(token ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Login handler: tries server login; falls back to DEV test password
  const handleLogin = async () => {
    try {
      if (!loginPassword || loginPassword.trim().length === 0) {
        alert("Please enter password");
        return;
      }

      // Try server login first
      try {
        const r = await apiLogin(loginPassword);
        if (r && (r as any).token) {
          const t = (r as any).token as string;
          localStorage.setItem("vv_admin_token", t);
          setToken(t);
          setShowLoginModal(false);
          setLoginPassword("");
          await loadBookings(t);
          return;
        }
      } catch (err) {
        console.warn("apiLogin failed (network or missing endpoint). Trying DEV fallback.", err);
      }

      // DEV fallback: allow known test password
      if (loginPassword === DEV_TEST_PASSWORD) {
        localStorage.setItem("vv_admin_auth", "true");
        setShowLoginModal(false);
        setLoginPassword("");
        setAuthLoading(false);
        try {
          await loadBookings(undefined);
        } catch {}
        alert("Logged in with DEV fallback. Remove fallback ASAP in production.");
        return;
      }

      alert("Login failed. If the server endpoints are not available, use DEV password or set localStorage.vv_admin_auth = 'true' in console.");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login error");
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("vv_admin_token");
    localStorage.removeItem("vv_admin_auth");
    setToken(null);
    setBookings([]);
    setShowLoginModal(true);
  };

  /* ---------- Analytics ---------- */
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

    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
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

  /* ---------- Chart ---------- */
  const MonthlyBarChart: React.FC<{ data: Record<string, number>; months: string[] }> = ({ data, months }) => {
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

  /* ---------- Render ---------- */
  if (authLoading) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Checking auth…</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#0f2f25", color: "white", padding: 20 }}>
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

      {/* Main */}
      <main style={{ flex: 1, padding: 24, background: "#f3f4f6" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h1 style={{ margin: 0 }}>Bookings</h1>
          <div>
            <button onClick={downloadBookingsCSV} style={{ background: "#16a34a", color: "white", padding: "8px 12px", borderRadius: 6, border: "none" }}>
              Export CSV
            </button>
          </div>
        </header>

        {/* Stats */}
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

        {/* Chart */}
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
                          {b.status || ""}
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

      {/* Login modal */}
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
              Tip: This UI prefers server-validated tokens. DEV fallback is enabled so your site isn't blocked while backend is not ready. Remove DEV fallback when you have a proper backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
