import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base } from "../api";

type EventItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  total_capacity: number;
  available_capacity: number;
  category: string;
  image_url?: string;
  attachment_url?: string;
};

function getCategoryImage(category?: string) {
  const key = (category || "").toLowerCase();
  if (key.includes("technology")) return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80";
  if (key.includes("business")) return "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80";
  if (key.includes("education")) return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80";
  if (key.includes("health")) return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80";
  return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80";
}

function getSeatBadgeColor(seatsLeft: number) {
  if (seatsLeft <= 5) return "#ef4444";
  if (seatsLeft <= 15) return "#f59e0b";
  return "#22c55e";
}

// Loading skeleton for the detail page
function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: "380px", borderRadius: "22px", marginBottom: "2rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <div className="skeleton-card" style={{ padding: "1.25rem" }}>
          <div className="skeleton skeleton-line" style={{ width: "140px", height: "20px", marginBottom: "1rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "14px" }} />
            ))}
          </div>
        </div>
        <div className="skeleton-card" style={{ padding: "1.25rem", height: "200px" }} />
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${base}/events/${id}`);
        if (!res.ok) throw new Error("Failed to load event");
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  async function handleBooking(e: FormEvent) {
    e.preventDefault();
    if (!event) return;

    if (!customerName || !customerEmail) {
      setBookingError("Please fill in all required fields.");
      return;
    }
    if (seatsBooked <= 0) {
      setBookingError("Seats booked must be at least 1.");
      return;
    }
    if (seatsBooked > event.available_capacity) {
      setBookingError("Seats booked cannot exceed available capacity.");
      return;
    }

    try {
      setSubmitting(true);
      setBookingError("");

      const res = await fetch(`${base}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          customer_name: customerName,
          customer_email: customerEmail,
          seats_booked: seatsBooked,
          booking_status: "confirmed",
        }),
      });

      if (!res.ok) {
        let backendMessage = "Failed to create booking";
        try {
          const errorData = await res.json();
          backendMessage = errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }

      navigate("/booking-success", {
        state: { eventTitle: event.title, seatsBooked, customerName },
      });
    } catch (err: any) {
      setBookingError(err.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChat() {
    if (chatLoading) return;
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage) {
      setChatError("Please enter a question.");
      return;
    }

    try {
      setChatLoading(true);
      setChatError("");
      setChatReply("");

      const res = await fetch(`${base}/events/${id}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      if (!res.ok) {
        let backendMessage = "Failed to get AI response";
        try {
          const errorData = await res.json();
          backendMessage = errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }

      const data = await res.json();
      setChatReply(data.reply || "No response received.");
    } catch (err: any) {
      setChatError(err.message || "AI chat failed");
    } finally {
      setChatLoading(false);
    }
  }

  function handleChatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleChat();
    }
  }

  // ── States
  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <h3>Failed to load event</h3>
        <p>{error}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="button-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
          <button className="button-secondary" onClick={() => navigate("/events")}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🔍</span>
        <h3>Event not found</h3>
        <p>This event may have been removed or the link is incorrect.</p>
        <button className="button-secondary" onClick={() => navigate("/events")}>
          Browse Events
        </button>
      </div>
    );
  }

  const heroImage = event.image_url
    ? event.image_url.startsWith("http")
      ? event.image_url
      : `${base}${event.image_url}`
    : getCategoryImage(event.category);

  const isSoldOut = event.available_capacity === 0;

  return (
    <div>
      {/* ── Back button ── */}
      <button
        className="button-secondary"
        onClick={() => navigate("/events")}
        style={{ marginBottom: "1rem", fontSize: "0.88rem", padding: "0.4rem 0.9rem" }}
      >
        ← Back to Events
      </button>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          borderRadius: "28px",
          overflow: "hidden",
          minHeight: "500px",
          marginBottom: "4.5rem",
          boxShadow: "0 40px 80px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <img
          src={heroImage}
          alt={event.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCategoryImage(event.category);
          }}
          style={{
            width: "100%",
            height: "500px",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 35%, rgba(0,0,0,0.44) 65%, rgba(0,0,0,0.05) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "clamp(2.5rem, 7vw, 3.5rem)",
          }}
        >
          <h1
            style={{
              margin: "0 0 1.3rem 0",
              color: "white",
              fontSize: "clamp(2.6rem, 7.5vw, 4.2rem)",
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.8px",
              maxWidth: "520px",
            }}
          >
            {event.title}
          </h1>

          <p
            style={{
              margin: "0 0 1.8rem 0",
              color: "rgba(255,255,255,0.78)",
              fontSize: "clamp(0.98rem, 2vw, 1.1rem)",
              maxWidth: "520px",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontWeight: 400,
            }}
          >
            {event.description}
          </p>

          {/* Hero metadata row */}
          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "0.4rem" }}>📅 Date & Time</div>
              <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>
                {new Date(event.date).toLocaleString("en-AU", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "0.4rem" }}>📍 Location</div>
              <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>{event.location}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "0.4rem" }}>🎫 Category</div>
              <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>{event.category}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main grid — collapses to single column on mobile ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
          gap: "2.25rem",
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "grid", gap: "2.25rem", minWidth: 0 }}>

          {/* About this event */}
          <section className="card" style={{ padding: "2.25rem", border: "1px solid rgba(148,163,184,0.03)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.006)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9" }}>About This Event</h3>
            
            <p style={{ margin: "0 0 2rem 0", fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(148,163,184,0.9)" }}>
              {event.description}
            </p>

            <h4 style={{ marginTop: "2rem", marginBottom: "1rem", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f1f5f9" }}>What You'll Discover</h4>
            <ul style={{ margin: "0 0 2rem 0", padding: "0 0 0 1.5rem", listStyle: "none" }}>
              {[
                "Insights and strategies relevant to this event's topic",
                "Practical knowledge from experienced speakers",
                "Networking opportunities with like-minded professionals",
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "0.75rem", fontSize: "0.93rem", lineHeight: 1.6, color: "rgba(255,255,255,0.62)" }}>
                  <span style={{ marginRight: "0.6rem", opacity: 0.5 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>

            <h4 style={{ marginTop: "2rem", marginBottom: "1rem", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f1f5f9" }}>Best Suited For</h4>
            <p style={{ margin: 0, fontSize: "0.93rem", lineHeight: 1.65, color: "rgba(255,255,255,0.62)" }}>
              Professionals, enthusiasts, and anyone interested in expanding their knowledge of {event.category.toLowerCase()}.
            </p>
          </section>

          {/* PDF attachment */}
          {event.attachment_url && (
            <section className="card" style={{ padding: "2rem", border: "1px solid rgba(148,163,184,0.06)", boxShadow: "0 12px 32px rgba(0,0,0,0.14)" }}>
              <h3 style={{ marginTop: 0, marginBottom: "0.65rem", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.4px", color: "#f1f5f9" }}>📄 Event Documents</h3>
              <p className="muted" style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(148,163,184,0.85)" }}>
                Download additional materials and documentation for this event.
              </p>
              <a
                href={
                  event.attachment_url.startsWith("http")
                    ? event.attachment_url
                    : `${base}${event.attachment_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", padding: "0.8rem 1.4rem", fontWeight: 600 }}
              >
                Download PDF
              </a>
            </section>
          )}

          {/* AI Concierge */}
          <section className="card" style={{ padding: "2.25rem", border: "1px solid rgba(148,163,184,0.04)", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.005)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9" }}>Event Concierge</h3>
            </div>
            <p style={{ marginTop: "0.3rem", marginBottom: "2rem", color: "rgba(148,163,184,0.7)", fontSize: "0.91rem", lineHeight: 1.6 }}>
              Get instant answers about this event — timing, requirements, format, or availability.
            </p>

            {/* Suggested prompts */}
            <div style={{ marginBottom: "1.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {[
                "Is this beginner-friendly?",
                "What will I learn?",
                "Are seats filling up?",
                "What should I bring?",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatInput(prompt);
                    setTimeout(() => {
                      setChatLoading(true);
                      setChatError("");
                      setChatReply("");
                      fetch(`${base}/events/${id}/ai-chat`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: prompt }),
                      })
                        .then((res) => {
                          if (!res.ok) throw new Error("Failed to get AI response");
                          return res.json();
                        })
                        .then((data) => {
                          setChatReply(data.reply || "No response received.");
                          setChatInput("");
                        })
                        .catch((err) => setChatError(err.message || "AI chat failed"))
                        .finally(() => setChatLoading(false));
                    }, 80);
                  }}
                  disabled={chatLoading}
                  style={{
                    padding: "0.65rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(96,165,250,0.12)",
                    background: "rgba(96,165,250,0.04)",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: chatLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: chatLoading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!chatLoading) {
                      e.currentTarget.style.background = "rgba(96,165,250,0.08)";
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!chatLoading) {
                      e.currentTarget.style.background = "rgba(96,165,250,0.04)";
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.12)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.72)";
                    }
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {chatError && (
              <p
                className="error"
                style={{
                  marginBottom: "1.5rem",
                  borderRadius: "12px",
                  padding: "0.9rem 1.1rem",
                  background: "rgba(239,68,68,0.08)",
                  borderLeft: "3px solid #ef4444",
                  fontSize: "0.9rem",
                  color: "#fca5a5",
                }}
              >
                {chatError}
              </p>
            )}

            {/* Input and submit */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask anything about this event…"
                disabled={chatLoading}
                style={{
                  flex: "1 1 240px",
                  padding: "0.9rem 1.2rem",
                  borderRadius: "11px",
                  border: "1px solid rgba(148,163,184,0.14)",
                  background: "rgba(255,255,255,0.018)",
                  color: "white",
                  fontSize: "0.94rem",
                  transition: "all 0.2s ease",
                  opacity: chatLoading ? 0.6 : 1,
                  cursor: chatLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  if (!chatLoading) {
                    e.currentTarget.style.borderColor = "rgba(96,165,250,0.3)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.026)";
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.018)";
                }}
              />
              <button
                type="button"
                className="button-primary"
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  whiteSpace: "nowrap",
                  padding: "0.9rem 1.8rem",
                  fontWeight: 700,
                  fontSize: "0.94rem",
                  opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                  cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                }}
              >
                {chatLoading ? (
                  <>
                    <span
                      style={{
                        width: "13px",
                        height: "13px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                        marginRight: "0.5rem",
                      }}
                    />
                    Thinking…
                  </>
                ) : (
                  "Ask"
                )}
              </button>
            </div>

            {/* Response */}
            {chatReply && (
              <div
                style={{
                  marginTop: "1.75rem",
                  padding: "1.5rem",
                  borderRadius: "14px",
                  border: "1px solid rgba(96,165,250,0.18)",
                  background: "rgba(37, 99, 235, 0.06)",
                  borderLeft: "3px solid rgba(96,165,250,0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "1rem", marginTop: "0.15rem" }}>💡</span>
                  <strong style={{ fontSize: "0.93rem", color: "#93c5fd", fontWeight: 700 }}>Answer</strong>
                </div>
                <div
                  style={{
                    lineHeight: 1.72,
                    fontSize: "0.94rem",
                    color: "#dbe4f0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {chatReply}
                </div>
              </div>
            )}

            {/* Trust microcopy */}
            <p style={{ marginTop: "1.5rem", marginBottom: 0, fontSize: "0.78rem", color: "rgba(148,163,184,0.48)", lineHeight: 1.5 }}>
              Answers are based on this event's current details. For more information, contact the organizer.
            </p>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "grid", gap: "2.25rem", minWidth: 0, marginBottom: "3rem" }}>
          {isSoldOut ? (
            <section
              className="card"
              style={{
                padding: "2.5rem",
                border: "1px solid rgba(239,68,68,0.12)",
                boxShadow: "0 20px 60px rgba(239,68,68,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
              <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#fca5a5", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.3px" }}>
                Sold Out
              </h3>
              <p className="muted" style={{ margin: "0 0 1.75rem", lineHeight: 1.6, fontSize: "0.95rem" }}>
                All tickets for this event have been reserved. Take a look at our other upcoming events.
              </p>
              <button className="button-secondary" onClick={() => navigate("/events")} style={{ padding: "0.85rem 1.8rem", fontWeight: 700, fontSize: "0.95rem" }}>
                Browse Events
              </button>
            </section>
          ) : (
            <section className="card" style={{ padding: "2.5rem", border: "1px solid rgba(96,165,250,0.22)", boxShadow: "0 32px 80px rgba(37,99,235,0.15), 0 8px 20px rgba(96,165,250,0.1), inset 0 1px 0 rgba(96,165,250,0.15)" }}>
              <h3 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px", color: "#f1f5f9" }}>Reserve Your Place</h3>
              <p className="muted" style={{ marginTop: "0.4rem", marginBottom: "2rem", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(148,163,184,0.78)" }}>
                Secure your spot immediately. Confirmed instantly, always.
              </p>

              {/* Availability visualization */}
              <div style={{ marginBottom: "2.25rem", padding: "1.5rem", borderRadius: "14px", background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.08)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "rgba(148,163,184,0.58)",
                    marginBottom: "0.9rem",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Seats Available</span>
                  <span style={{ color: getSeatBadgeColor(event.available_capacity), fontSize: "0.9rem", fontWeight: 800 }}>
                    {event.available_capacity} of {event.total_capacity}
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "999px",
                      width: `${(event.available_capacity / event.total_capacity) * 100}%`,
                      background: `linear-gradient(to right, ${getSeatBadgeColor(event.available_capacity)}, ${getSeatBadgeColor(event.available_capacity)})`,
                      transition: "width 0.4s ease",
                      boxShadow: `0 0 12px ${getSeatBadgeColor(event.available_capacity)}28`,
                    }}
                  />
                </div>
              </div>

              {bookingError && (
                <p className="error" style={{ marginBottom: "1.5rem", borderRadius: "12px", padding: "1rem", background: "rgba(239,68,68,0.08)", borderLeft: "4px solid #ef4444", marginLeft: 0, marginRight: 0, fontSize: "0.92rem" }}>
                  {bookingError}
                </p>
              )}

              <form onSubmit={handleBooking} className="form">
                <label style={{ marginBottom: "1.6rem", display: "block" }}>
                  <span style={{ display: "block", fontSize: "0.87rem", fontWeight: 700, marginBottom: "0.75rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>Full Name</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your full name"
                    style={{
                      width: "100%",
                      padding: "0.95rem 1.2rem",
                      borderRadius: "11px",
                      border: "1px solid rgba(148,163,184,0.14)",
                      background: "rgba(255,255,255,0.018)",
                      color: "white",
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(96,165,250,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.018)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                </label>

                <label style={{ marginBottom: "1.6rem", display: "block" }}>
                  <span style={{ display: "block", fontSize: "0.87rem", fontWeight: 700, marginBottom: "0.75rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>Email Address</span>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "0.95rem 1.2rem",
                      borderRadius: "11px",
                      border: "1px solid rgba(148,163,184,0.14)",
                      background: "rgba(255,255,255,0.018)",
                      color: "white",
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(96,165,250,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.018)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                </label>

                <label style={{ marginBottom: "2.2rem", display: "block" }}>
                  <span style={{ display: "block", fontSize: "0.87rem", fontWeight: 700, marginBottom: "0.75rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>Number of Seats</span>
                  <input
                    type="number"
                    min={1}
                    max={event.available_capacity}
                    value={seatsBooked}
                    onChange={(e) => setSeatsBooked(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "0.95rem 1.2rem",
                      borderRadius: "11px",
                      border: "1px solid rgba(148,163,184,0.14)",
                      background: "rgba(255,255,255,0.018)",
                      color: "white",
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(96,165,250,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.018)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="button-primary"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "1.2rem 1.5rem",
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    transition: "all 0.25s ease",
                    cursor: submitting ? "wait" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 18px 48px rgba(59, 130, 246, 0.18), inset 0 1px 0 rgba(255,255,255,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)";
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          border: "2.5px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                          marginRight: "0.6rem",
                        }}
                      />
                      Processing...
                    </>
                  ) : (
                    "Complete Booking"
                  )}
                </button>
              </form>

              {/* Trust footer */}
              <div style={{ marginTop: "1.8rem", paddingTop: "1.8rem", borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(148,163,184,0.55)", textAlign: "center", lineHeight: 1.6, letterSpacing: "0.1px" }}>
                  🔒 <strong style={{ color: "rgba(148,163,184,0.7)" }}>Your payment is secure & encrypted.</strong> Instant confirmation via email.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile grid fix + spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 720px) {
          .event-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
