import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base } from "../api";

type EventItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  available_capacity: number;
  category: string;
  image_url?: string;
};

function getCategoryImage(category?: string) {
  const key = (category || "").toLowerCase();
  if (key.includes("technology")) return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80";
  if (key.includes("business")) return "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80";
  if (key.includes("education")) return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80";
  if (key.includes("health")) return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80";
  return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80";
}

function getSeatBadgeColor(seatsLeft: number) {
  if (seatsLeft <= 5) return "#ef4444";
  if (seatsLeft <= 15) return "#f59e0b";
  return "#22c55e";
}

function FeaturedSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" style={{ height: "220px" }} />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" style={{ width: "65%", height: "18px" }} />
        <div className="skeleton skeleton-line" style={{ width: "45%", height: "13px" }} />
        <div className="skeleton skeleton-line" style={{ width: "90%", height: "13px" }} />
        <div className="skeleton skeleton-line" style={{ width: "75%", height: "13px" }} />
        <div className="skeleton skeleton-line" style={{ width: "110px", height: "36px", borderRadius: "999px", marginTop: "0.25rem" }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    async function loadFeaturedEvents() {
      try {
        const res = await fetch(`${base}/events`);
        if (!res.ok) throw new Error("Failed to load events");
        const data = await res.json();
        const events = Array.isArray(data) ? data : [];
        setFeaturedEvents(events.slice(0, 3));
      } catch {
        setFeaturedEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadFeaturedEvents();
  }, []);

  return (
    <div style={{ display: "grid", gap: "2.75rem" }}>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          minHeight: "520px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80"
          alt="Event audience"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "520px",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.82) 40%, rgba(2,6,23,0.15) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            padding: "clamp(1.5rem, 4vw, 3rem)",
          }}
        >
          <div style={{ maxWidth: "620px" }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.18)",
                border: "1px solid rgba(165,180,252,0.2)",
                color: "#c7d2fe",
                fontWeight: 600,
                fontSize: "0.84rem",
                marginBottom: "1.3rem",
              }}
            >
              <span>🎟️</span>
              <span>AI-powered event discovery</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                lineHeight: 1.08,
                margin: "0 0 1.2rem",
                color: "white",
                fontWeight: 800,
                letterSpacing: "-0.4px",
              }}
            >
              Discover, host, and book events with confidence
            </h1>

            <p
              style={{
                fontSize: "1.04rem",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.82)",
                maxWidth: "540px",
                margin: "0 0 2rem",
                fontWeight: 400,
              }}
            >
              Explore conferences, workshops, and networking experiences through a booking platform enhanced by AI search, event assistance, and live availability.
            </p>

            {/* CTA — only Explore Events, dashboard is in header */}
            <button
              className="button-primary"
              onClick={() => navigate("/events")}
              style={{ minWidth: "160px", fontSize: "0.96rem", padding: "0.75rem 1.75rem", fontWeight: 500 }}
            >
              Explore Events →
            </button>

            {/* Stats row */}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                gap: "0",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "search + assistance", value: "AI" },
                { label: "seat availability", value: "Live" },
                { label: "admin event tools", value: "Smart" },
              ].map((stat, i) => (
                <div
                  key={stat.value}
                  style={{
                    paddingRight: "1.5rem",
                    marginRight: "1.5rem",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  }}
                >
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.3rem",
        }}
      >
        {[
          {
            icon: "🔍",
            title: "AI Event Search",
            desc: 'Search naturally like "tech workshops with seats" or "business events nearby" for instant smart results.',
          },
          {
            icon: "🤖",
            title: "Event AI Assistant",
            desc: "Each event has a live AI assistant answering questions using real event details.",
          },
          {
            icon: "⚙️",
            title: "Admin AI Tools",
            desc: "Improve event content, get suggestions, and view AI-generated booking insights.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="card"
            style={{ padding: "1.25rem", border: "1px solid rgba(148,163,184,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.005)" }}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "0.8rem" }}>
              {feature.icon}
            </div>
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "0.98rem", fontWeight: 600 }}>
              {feature.title}
            </h3>
            <p style={{ marginBottom: 0, lineHeight: 1.6, fontSize: "0.89rem", color: "rgba(148,163,184,0.62)", fontWeight: 400 }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Featured Events ── */}
      <section style={{ marginTop: "3rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0, marginBottom: "0.3rem", fontSize: "1.4rem", fontWeight: 700 }}>Featured Events</h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(148,163,184,0.54)", fontWeight: 400 }}>
              Curated events available to book now.
            </p>
          </div>
          <button className="button-secondary" onClick={() => navigate("/events")} style={{ fontSize: "0.92rem", fontWeight: 500 }}>
            View All →
          </button>
        </div>

        {loadingEvents ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.3rem",
            }}
          >
            {[0, 1, 2].map((i) => <FeaturedSkeleton key={i} />)}
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📅</span>
            <h3>No events yet</h3>
            <p>Check back soon — events will appear here once they're added.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.3rem",
            }}
          >
            {featuredEvents.map((event) => (
              <article
                key={event.id}
                className="card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                  <img
                    src={
                      event.image_url
                        ? event.image_url.startsWith("http")
                          ? event.image_url
                          : `${base}${event.image_url}`
                        : getCategoryImage(event.category)
                    }
                    alt={event.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryImage(event.category);
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLImageElement).style.transform = "scale(1.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.transform = "scale(1)";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(2,6,23,0.88), rgba(2,6,23,0.1))",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "1rem",
                      right: "1rem",
                      bottom: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "999px",
                        background: "rgba(37,99,235,0.9)",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {event.category || "General"}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "999px",
                        background: getSeatBadgeColor(event.available_capacity),
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {event.available_capacity === 0
                        ? "Sold Out"
                        : `${event.available_capacity} seats left`}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "1.1rem 1.1rem 1.2rem" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {event.title}
                  </h3>
                  <p className="muted" style={{ marginBottom: "0.65rem", fontSize: "0.87rem" }}>
                    📅{" "}
                    {new Date(event.date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · 📍 {event.location}
                  </p>
                  <p style={{ marginBottom: "1rem", fontSize: "0.91rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                    {event.description.length > 110
                      ? `${event.description.slice(0, 110)}...`
                      : event.description}
                  </p>
                  <button
                    className={event.available_capacity === 0 ? "button-secondary" : "button-primary"}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{ marginTop: 0 }}
                  >
                    {event.available_capacity === 0 ? "View Details" : "View Event"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="card"
        style={{
          padding: "2rem 2.25rem",
          background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.1))",
          border: "1px solid rgba(96,165,250,0.18)",
          marginTop: "2.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "2rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "580px" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.2px" }}>
              Ready to discover smarter event booking?
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65, color: "rgba(148,163,184,0.65)", fontSize: "0.95rem" }}>
              Browse curated events, use AI search, and manage bookings seamlessly.
            </p>
          </div>
          <button
            className="button-primary"
            onClick={() => navigate("/events")}
            style={{ whiteSpace: "nowrap", fontSize: "0.96rem", padding: "0.75rem 1.75rem", fontWeight: 500 }}
          >
            Browse Events →
          </button>
        </div>
      </section>

    </div>
  );
}