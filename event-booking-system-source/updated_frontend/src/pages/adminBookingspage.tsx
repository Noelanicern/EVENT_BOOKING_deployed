import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base } from "../api";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingItem = {
  id: number;
  customer_name: string;
  customer_email: string;
  seats_booked: number;
  booking_status?: string;
  event_title: string;
  created_at?: string;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
};

// ── Toast Component ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "320px",
        width: "calc(100vw - 3rem)",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            background: "rgba(15, 23, 42, 0.97)",
            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            animation: "toastIn 0.22s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>
              {toast.type === "success" ? "✓" : "⚠"}
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9" }}>
              {toast.message}
            </span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayStatus(status?: string): "confirmed" | "unconfirmed" {
  return status === "confirmed" ? "confirmed" : "unconfirmed";
}

function isRecent(dateStr?: string): boolean {
  if (!dateStr) return false;
  const created = new Date(dateStr).getTime();
  const now = Date.now();
  return now - created < 24 * 60 * 60 * 1000;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "unconfirmed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Toast helpers ─────────────────────────────────────────────────────────

  function addToast(message: string, type: "success" | "error" = "success") {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => dismissToast(id), 3500);
    toastTimers.current.set(id, timer);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }

  useEffect(() => {
    return () => toastTimers.current.forEach((t) => clearTimeout(t));
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");
      if (!adminToken) {
        navigate("/admin/login");
        return;
      }
      const res = await fetch(`${base}/admin/bookings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
          navigate("/admin/login");
          throw new Error("Admin login required");
        }
        throw new Error("Failed to load bookings");
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [adminToken, navigate]);

  // ── Status update ─────────────────────────────────────────────────────────

  async function handleStatusUpdate(id: number, newStatus: string) {
    const previousBookings = [...bookings];

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, booking_status: newStatus } : b
      )
    );

    try {
      setUpdatingId(id);
      setError("");

      const attempts = [
        { url: `${base}/admin/bookings/${id}/status`, method: "PATCH" as const },
        { url: `${base}/admin/bookings/${id}/status`, method: "PUT" as const },
        { url: `${base}/admin/bookings/${id}`, method: "PATCH" as const },
        { url: `${base}/admin/bookings/${id}`, method: "PUT" as const },
      ];

      let success = false;
      let backendMessage = "Failed to update booking status";

      for (const attempt of attempts) {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            "Content-Type": "application/json",
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
          },
          body: JSON.stringify({ booking_status: newStatus, status: newStatus }),
        });

        if (res.ok) {
          success = true;
          break;
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
          return;
        }
        try {
          const errorData = await res.json();
          backendMessage = errorData?.message || errorData?.error || backendMessage;
        } catch {}
      }

      if (!success) throw new Error(backendMessage);

      addToast(
        newStatus === "confirmed"
          ? "Booking confirmed ✓"
          : "Booking set to unconfirmed",
        "success"
      );
    } catch (err: any) {
      // Rollback on failure
      setBookings(previousBookings);
      addToast(err.message || "Failed to update booking", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const confirmedCount = bookings.filter(
    (b) => getDisplayStatus(b.booking_status) === "confirmed"
  ).length;

  const unconfirmedCount = bookings.filter(
    (b) => getDisplayStatus(b.booking_status) === "unconfirmed"
  ).length;

  const recentCount = bookings.filter((b) => isRecent(b.created_at)).length;

  const needsAttention = unconfirmedCount > 0;

  const filteredBookings = bookings.filter((booking) => {
    const normalizedStatus = getDisplayStatus(booking.booking_status);
    const matchesStatus =
      statusFilter === "all" ? true : normalizedStatus === statusFilter;
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      search === ""
        ? true
        : booking.id.toString().includes(search) ||
          booking.customer_name.toLowerCase().includes(search) ||
          booking.customer_email.toLowerCase().includes(search) ||
          booking.event_title.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ maxWidth: "1220px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="skeleton" style={{ height: "160px", borderRadius: "22px" }} />
          <div className="skeleton" style={{ height: "400px", borderRadius: "16px" }} />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "1220px", margin: "0 auto", padding: "2rem 1rem 2.5rem" }}>

      {/* ── Header ── */}
      <section
        style={{
          marginBottom: "1.25rem",
          padding: "1.45rem",
          borderRadius: "22px",
          background: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(124,58,237,0.14))",
          border: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "0 16px 34px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0, marginBottom: "0.25rem" }}>Manage Bookings</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>
              View, filter, and update all customer bookings from one place.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="button-secondary" onClick={() => navigate("/admin")}>
              Back to Dashboard
            </button>
            <button className="button-primary" onClick={() => navigate("/admin/events")}>
              Events
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {[
            {
              label: "Total Bookings",
              value: bookings.length,
              accent: "rgba(59,130,246,0.16)",
              bar: "#3b82f6",
            },
            {
              label: "Confirmed",
              value: confirmedCount,
              accent: "rgba(34,197,94,0.16)",
              bar: "#22c55e",
            },
            {
              label: "Unconfirmed",
              value: unconfirmedCount,
              accent: unconfirmedCount > 0 ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.1)",
              bar: "#f59e0b",
            },
            ...(recentCount > 0
              ? [
                  {
                    label: "New (last 24h)",
                    value: recentCount,
                    accent: "rgba(99,102,241,0.16)",
                    bar: "#8b5cf6",
                  },
                ]
              : []),
          ].map((stat) => (
            <div
              key={stat.label}
              className="card"
              style={{
                padding: "0.9rem 1rem",
                border: `1px solid ${stat.accent}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: stat.bar,
                  opacity: 0.7,
                }}
              />
              <div className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Needs Attention Banner ── */}
      {needsAttention && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.1rem",
            padding: "0.9rem 1.1rem",
            borderRadius: "14px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.24)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span style={{ fontWeight: 600, color: "#fbbf24", fontSize: "0.92rem" }}>
              {unconfirmedCount} booking{unconfirmedCount !== 1 ? "s" : ""} need
              {unconfirmedCount === 1 ? "s" : ""} confirmation
            </span>
          </div>
          <button
            className="button-secondary"
            onClick={() => setStatusFilter("unconfirmed")}
            style={{
              fontSize: "0.85rem",
              padding: "0.38rem 0.9rem",
              borderColor: "rgba(245,158,11,0.35)",
              color: "#fbbf24",
            }}
          >
            Show unconfirmed →
          </button>
        </div>
      )}

      {error && (
        <p className="error" style={{ marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* ── Table Section ── */}
      <section className="card" style={{ padding: "1.2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Booking Records</h3>
            <p className="muted" style={{ margin: "0.3rem 0 0 0" }}>
              Search, filter, and update booking status
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {statusFilter !== "all" && (
              <button
                className="button-secondary"
                onClick={() => setStatusFilter("all")}
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}
              >
                Clear filter ×
              </button>
            )}
            <span className="muted" style={{ fontSize: "0.88rem" }}>
              {filteredBookings.length} shown
            </span>
          </div>
        </div>

        {/* Search + filter */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1.1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search by ID, name, email, or event…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "confirmed" | "unconfirmed")
            }
            style={{ flex: "0 0 auto" }}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="unconfirmed">Unconfirmed</option>
          </select>
        </div>

        {/* Empty state */}
        {filteredBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
            <span className="empty-state-icon">
              {bookings.length === 0 ? "📋" : "🔍"}
            </span>
            <h3>
              {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
            </h3>
            <p>
              {bookings.length === 0
                ? "Bookings will appear here once customers start reserving seats."
                : "Try adjusting your search term or clearing the filter."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                className="button-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "720px" }}>
              <thead>
                <tr>
                  <th style={{ width: "52px" }}>ID</th>
                  <th>Customer</th>
                  <th>Event</th>
                  <th style={{ width: "64px", textAlign: "center" }}>Seats</th>
                  <th style={{ width: "100px" }}>When</th>
                  <th style={{ width: "130px" }}>Status</th>
                  <th style={{ width: "140px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const displayStatus = getDisplayStatus(booking.booking_status);
                  const isConfirmed = displayStatus === "confirmed";
                  const isUpdating = updatingId === booking.id;
                  const recent = isRecent(booking.created_at);

                  return (
                    <tr
                      key={booking.id}
                      style={{
                        background: !isConfirmed
                          ? "rgba(245,158,11,0.04)"
                          : "transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                        #{booking.id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#f1f5f9" }}>
                          {booking.customer_name}
                        </div>
                        <div
                          className="muted"
                          style={{
                            fontSize: "0.8rem",
                            marginTop: "0.1rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "180px",
                          }}
                        >
                          {booking.customer_email}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: "0.92rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "180px",
                          }}
                        >
                          {booking.event_title}
                        </div>
                      </td>

                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {booking.seats_booked}
                      </td>

                      <td>
                        {booking.created_at ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.15rem",
                            }}
                          >
                            <span
                              className="muted"
                              style={{ fontSize: "0.82rem" }}
                            >
                              {formatRelativeTime(booking.created_at)}
                            </span>
                            {recent && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "999px",
                                  background: "rgba(99,102,241,0.18)",
                                  color: "#a5b4fc",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  width: "fit-content",
                                }}
                              >
                                New
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: "0.82rem" }}>
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.75rem",
                            borderRadius: "999px",
                            background: isConfirmed
                              ? "rgba(34,197,94,0.14)"
                              : "rgba(245,158,11,0.14)",
                            color: isConfirmed ? "#4ade80" : "#fbbf24",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            border: `1px solid ${
                              isConfirmed
                                ? "rgba(34,197,94,0.2)"
                                : "rgba(245,158,11,0.25)"
                            }`,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isConfirmed ? "#4ade80" : "#fbbf24",
                              flexShrink: 0,
                            }}
                          />
                          {isConfirmed ? "Confirmed" : "Needs confirmation"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() =>
                            handleStatusUpdate(
                              booking.id,
                              isConfirmed ? "pending" : "confirmed"
                            )
                          }
                          disabled={isUpdating}
                          style={{
                            fontSize: "0.82rem",
                            padding: "0.38rem 0.85rem",
                            minWidth: "110px",
                            borderColor: isConfirmed
                              ? "rgba(148,163,184,0.3)"
                              : "rgba(34,197,94,0.3)",
                            color: isConfirmed ? "var(--muted)" : "#4ade80",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.3rem",
                          }}
                        >
                          {isUpdating ? (
                            <>
                              <span
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  border: "2px solid rgba(255,255,255,0.2)",
                                  borderTopColor: "white",
                                  borderRadius: "50%",
                                  display: "inline-block",
                                  animation: "spin 0.7s linear infinite",
                                }}
                              />
                              Updating…
                            </>
                          ) : isConfirmed ? (
                            "Unconfirm"
                          ) : (
                            "✓ Confirm"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Toast notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}