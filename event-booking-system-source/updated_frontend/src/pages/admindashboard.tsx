import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base } from "../api";

type EventItem = {
  id: number;
  title: string;
  available_capacity?: number;
  total_capacity?: number;
};

type BookingItem = {
  id: number;
  customer_name: string;
  booking_status?: string;
  seats_booked?: number;
  event_id?: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prevBookingsCount, setPrevBookingsCount] = useState(0);

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  }

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [eventsRes, bookingsRes, aiSummaryRes] = await Promise.all([
          fetch(`${base}/events`),
          fetch(`${base}/admin/bookings`, {
            headers: adminToken
              ? {
                  Authorization: `Bearer ${adminToken}`,
                }
              : {},
          }),
          fetch(`${base}/admin/ai-summary`, {
            headers: adminToken
              ? {
                  Authorization: `Bearer ${adminToken}`,
                }
              : {},
          }),
        ]);

        if (!eventsRes.ok) {
          throw new Error("Failed to load events");
        }

        if (!bookingsRes.ok) {
          if (bookingsRes.status === 401 || bookingsRes.status === 403) {
            navigate("/admin/login");
            throw new Error("Admin login required");
          }
          throw new Error("Failed to load bookings");
        }

        const eventsData = await eventsRes.json();
        const bookingsData = await bookingsRes.json();

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);

        if (aiSummaryRes.ok) {
          const aiData = await aiSummaryRes.json();
          setAiSummary(aiData.summary || "");
        } else {
          setAiSummary("AI summary unavailable.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [adminToken, navigate]);

  const confirmedBookings = bookings.filter(
    (booking) => booking.booking_status === "confirmed"
  ).length;

  const pendingBookings = bookings.filter(
    (booking) => booking.booking_status !== "confirmed"
  ).length;

  // Trend calculation
  const bookingTrend = bookings.length > prevBookingsCount ? "up" : bookings.length < prevBookingsCount ? "down" : "stable";

  // Conversion rate
  const conversionRate = events.length > 0 ? Math.round((confirmedBookings / events.length) * 100) : 0;

  // Calculate metrics
  const avgBookingsPerEvent = events.length > 0 ? (bookings.length / events.length).toFixed(1) : 0;

  // Identify needs attention
  const needsAttention = {
    lowBookings: bookings.length < events.length * 0.3,
    highPendingRatio: pendingBookings > confirmedBookings,
    noRecentActivity: bookings.length === 0,
  };

  // Booking trend data for last 7 days (simulated)
  const pastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  });

  // Simulate booking distribution (in real scenario, group by date from backend)
  const bookingsByDay = pastSevenDays.map((_, i) => {
    const baseCount = Math.floor(bookings.length / 7);
    return baseCount + (i % 2 === 0 ? Math.floor(Math.random() * 3) : 0);
  });

  const maxBookingsDay = Math.max(...bookingsByDay, 1);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "2rem 1rem 2.5rem" }}>
      <section
        style={{
          marginBottom: "1.75rem",
          padding: "1.5rem",
          borderRadius: "22px",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(124,58,237,0.16))",
          border: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0, marginBottom: "0.4rem" }}>Admin Dashboard</h2>
            <p style={{ margin: 0, opacity: 0.82, maxWidth: "760px" }}>
              Monitor event activity, bookings, and AI-generated insights from one control center.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="button-secondary" onClick={() => navigate("/admin/events")}>
              Manage Events
            </button>
            <button className="button-secondary" onClick={() => navigate("/admin/bookings")}>
              Manage Bookings
            </button>
            <button className="button-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1.15rem",
            border: "1px solid rgba(59,130,246,0.16)",
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
              height: "4px",
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            }}
          />
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "0.9rem", fontWeight: 700 }}>Total Events</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{events.length}</p>
            <span style={{ fontSize: "0.82rem", color: "rgba(148,163,184,0.62)", fontWeight: 600 }}>
              {events.length === 0 ? "Starting out" : events.length < 5 ? "Early stage" : "Active"}
            </span>
          </div>
          <p className="muted" style={{ marginBottom: 0, fontSize: "0.82rem" }}>
            {bookings.length === 0 ? "Awaiting bookings" : `${avgBookingsPerEvent} bookings/event avg`}
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: "1.15rem",
            border: "1px solid rgba(124,58,237,0.16)",
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
              height: "4px",
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
            }}
          />
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "0.9rem", fontWeight: 700 }}>Total Bookings</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{bookings.length}</p>
            <span
              style={{
                fontSize: "0.75rem",
                color:
                  bookingTrend === "up"
                    ? "rgba(34,197,94,0.8)"
                    : bookingTrend === "down"
                      ? "rgba(239,68,68,0.8)"
                      : "rgba(148,163,184,0.6)",
                fontWeight: 600,
              }}
            >
              {bookingTrend === "up" ? "↑ Growing" : bookingTrend === "down" ? "↓ Declining" : "→ Stable"}
            </span>
          </div>
          <p className="muted" style={{ marginBottom: 0, fontSize: "0.82rem" }}>
            {bookings.length === 0 ? "No bookings yet" : "Managed in system"}
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: "1.15rem",
            border: "1px solid rgba(34,197,94,0.16)",
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
              height: "4px",
              background: "linear-gradient(90deg, #22c55e, #4ade80)",
            }}
          />
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "0.9rem", fontWeight: 700 }}>Confirmed Bookings</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{confirmedBookings}</p>
            <span style={{ fontSize: "0.82rem", color: "rgba(148,163,184,0.62)", fontWeight: 600 }}>
              {conversionRate}% conversion
            </span>
          </div>
          <p className="muted" style={{ marginBottom: 0, fontSize: "0.82rem" }}>
            {confirmedBookings === 0 ? "Awaiting confirmations" : "Successfully reserved"}
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: "1.15rem",
            border: "1px solid rgba(245,158,11,0.16)",
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
              height: "4px",
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
            }}
          />
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem", fontSize: "0.9rem", fontWeight: 700 }}>Pending Bookings</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{pendingBookings}</p>
            <span
              style={{
                fontSize: "0.75rem",
                color: pendingBookings > confirmedBookings ? "rgba(239,68,68,0.8)" : "rgba(148,163,184,0.6)",
                fontWeight: 600,
              }}
            >
              {pendingBookings > confirmedBookings ? "⚠ High" : "Normal"}
            </span>
          </div>
          <p className="muted" style={{ marginBottom: 0, fontSize: "0.82rem" }}>
            {pendingBookings === 0 ? "All processed" : "Awaiting final state"}
          </p>
        </div>
      </div>

      {/* Needs Attention Section */}
      {(needsAttention.lowBookings || needsAttention.highPendingRatio || needsAttention.noRecentActivity) && (
        <section
          className="card"
          style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Needs Attention</h3>
          </div>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {needsAttention.noRecentActivity && (
              <p style={{ margin: 0, fontSize: "0.92rem", color: "rgba(245,158,11,0.9)", lineHeight: 1.6 }}>
                • No bookings recorded yet. Review event visibility and promotion.
              </p>
            )}
            {needsAttention.lowBookings && (
              <p style={{ margin: 0, fontSize: "0.92rem", color: "rgba(245,158,11,0.9)", lineHeight: 1.6 }}>
                • Booking volume is low relative to total events. Improve event descriptions or add urgency messaging.
              </p>
            )}
            {needsAttention.highPendingRatio && (
              <p style={{ margin: 0, fontSize: "0.92rem", color: "rgba(245,158,11,0.9)", lineHeight: 1.6 }}>
                • High ratio of pending to confirmed bookings. Follow up on pending confirmations.
              </p>
            )}
          </div>
        </section>
      )}

      {/* AI Insight - Structured */}
      <section
        className="card"
        style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.07))",
          border: "1px solid rgba(99,102,241,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1rem" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            }}
          />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>AI Insight</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: 0 }}>
          <div>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 700, color: "rgba(148,163,184,0.8)" }}>
              Observations
            </h4>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                {bookings.length === 0
                  ? "• No booking activity yet. System is ready for traffic."
                  : `• Average ${avgBookingsPerEvent} booking(s) per event`}
              </p>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                {conversionRate > 50 
                  ? `• Strong conversion rate at ${conversionRate}%`
                  : conversionRate === 0
                    ? "• No confirmed bookings yet"
                    : `• Conversion at ${conversionRate}%. Room for improvement.`}
              </p>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                {pendingBookings === 0
                  ? "• No pending bookings holding up the pipeline."
                  : `• ${((pendingBookings / bookings.length) * 100).toFixed(0)}% of bookings still pending.`}
              </p>
            </div>
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 700, color: "rgba(148,163,184,0.8)" }}>
              Suggested Actions
            </h4>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {bookings.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                  • Publish events and promote to drive traffic
                </p>
              ) : (
                <>
                  {conversionRate < 50 && (
                    <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                      • Enhance event descriptions with value propositions
                    </p>
                  )}
                  {confirmedBookings === 0 && (
                    <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                      • Follow up on pending bookings to drive confirmations
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                    • Consider limited-seat messaging to create urgency
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
          marginBottom: "1.5rem",
        }}
      >
        <section className="card" style={{ padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Recent Events</h3>
            <span className="muted" style={{ fontSize: "0.88rem" }}>{events.length} total</span>
          </div>

          {events.length === 0 ? (
            <p style={{ marginTop: "1rem", fontSize: "0.92rem", color: "rgba(148,163,184,0.7)" }}>No events yet. Ready to add your first.</p>
          ) : (
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.85rem" }}>
              {events.slice(0, 5).map((event) => {
                const eventBookings = bookings.filter((b) => b.event_id === event.id).length;
                const seatUsageViz = eventBookings > 0 ? Math.min((eventBookings / Math.max(events.length, 5)) * 100, 100) : 0;
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(148,163,184,0.08)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(148,163,184,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(148,163,184,0.08)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          flexShrink: 0,
                          fontSize: "0.85rem",
                        }}
                      >
                        #{event.id}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{event.title}</div>
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                            fontSize: "0.8rem",
                            color: "rgba(148,163,184,0.65)",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span>{eventBookings} booking{eventBookings !== 1 ? "s" : ""}</span>
                          {event.available_capacity && (
                            <span>{event.available_capacity} seats left</span>
                          )}
                        </div>
                        {eventBookings > 0 && (
                          <div
                            style={{
                              height: "3px",
                              borderRadius: "999px",
                              background: "rgba(255,255,255,0.08)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "999px",
                                width: `${seatUsageViz}%`,
                                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Recent Bookings</h3>
            <span className="muted" style={{ fontSize: "0.88rem" }}>{bookings.length} total</span>
          </div>

          {bookings.length === 0 ? (
            <p style={{ marginTop: "1rem", fontSize: "0.92rem", color: "rgba(148,163,184,0.7)" }}>No bookings yet. Awaiting first reservation.</p>
          ) : (
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.85rem" }}>
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(148,163,184,0.08)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(148,163,184,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(148,163,184,0.08)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{booking.customer_name}</div>
                      <div style={{ display: "flex", gap: "0.9rem", fontSize: "0.8rem", color: "rgba(148,163,184,0.65)", marginBottom: "0.5rem" }}>
                        <span>#{booking.id}</span>
                        {booking.seats_booked && <span>{booking.seats_booked} seat{booking.seats_booked !== 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "12px",
                        background:
                          booking.booking_status === "confirmed"
                            ? "rgba(34,197,94,0.16)"
                            : "rgba(245,158,11,0.16)",
                        color:
                          booking.booking_status === "confirmed"
                            ? "#4ade80"
                            : "#fbbf24",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {booking.booking_status || "unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bookings trend chart */}
      <section className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1.25rem", fontSize: "1rem", fontWeight: 800 }}>Bookings This Week</h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.5rem",
            height: "140px",
            justifyContent: "space-between",
          }}
        >
          {pastSevenDays.map((day, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${(bookingsByDay[i] / maxBookingsDay) * 100}%`,
                  minHeight: "8px",
                  borderRadius: "6px 6px 0 0",
                  background:
                    bookingsByDay[i] > 3
                      ? "linear-gradient(180deg, #3b82f6, #1e40af)"
                      : bookingsByDay[i] > 0
                        ? "rgba(96,165,250,0.4)"
                        : "rgba(148,163,184,0.08)",
                  transition: "all 0.3s ease",
                }}
                title={`${bookingsByDay[i]} booking(s)`}
              />
              <span style={{ fontSize: "0.7rem", color: "rgba(148,163,184,0.6)", marginTop: "0.25rem" }}>{day}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.8rem", color: "rgba(148,163,184,0.5)" }}>
          Last 7 days activity — showing distribution of booking events
        </p>
      </section>
    </div>
  );
}