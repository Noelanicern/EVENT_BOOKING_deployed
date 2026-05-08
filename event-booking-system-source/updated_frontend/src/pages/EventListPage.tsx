import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Event, fetchEvents, base } from "../api";

function getCategoryImage(category?: string) {
  const key = (category || "").toLowerCase();
  if (key.includes("technology")) return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";
  if (key.includes("business")) return "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80";
  if (key.includes("education")) return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";
  if (key.includes("health")) return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";
  return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
}

function getSeatBadgeColor(seatsLeft: number) {
  if (seatsLeft <= 5) return "#ef4444";
  if (seatsLeft <= 15) return "#f59e0b";
  return "#22c55e";
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        <div className="skeleton skeleton-line" style={{ width: "45%" }} />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton skeleton-line" style={{ width: "35%", marginTop: "0.25rem" }} />
      </div>
    </div>
  );
}

export function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiReason, setAiReason] = useState("");
  const [searchingWithAI, setSearchingWithAI] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        setEvents(data);
        setAllEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load events");
        setLoading(false);
      });
  }, []);

  // ── Get unique categories from events
  const getCategories = () => {
    const cats = new Set(
      allEvents
        .map((e) => e.category)
        .filter((c) => c && c.trim())
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    );
    return ["All", ...Array.from(cats).sort()];
  };

  async function handleAISearch() {
    if (!aiQuery.trim()) {
      setEvents(allEvents);
      setAiReason("");
      setSelectedCategory("All");
      return;
    }

    try {
      setSearchingWithAI(true);
      setError(null);
      setAiReason("");
      setSelectedCategory("All");

      const res = await fetch(`${base}/events/ai-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });

      if (!res.ok) {
        let backendMessage = "AI search failed";
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
      setEvents(Array.isArray(data.events) ? data.events : []);
      setAiReason(data.reason || "");
    } catch (err: any) {
      setError(err.message || "AI search failed");
    } finally {
      setSearchingWithAI(false);
    }
  }

  function handleResetSearch() {
    setAiQuery("");
    setAiReason("");
    setEvents(allEvents);
    setError(null);
    setSelectedCategory("All");
  }

  // ── Apply category filter
  const filteredEvents =
    selectedCategory === "All"
      ? events
      : events.filter(
          (e) =>
            (e.category || "General").toLowerCase() ===
            selectedCategory.toLowerCase()
        );

  // ── Loading state — skeleton cards
  if (loading) {
    return (
      <div>
        <div
          style={{
            marginBottom: "2.5rem",
            padding: "1.4rem",
            borderRadius: "18px",
            border: "1px solid rgba(96, 165, 250, 0.12)",
            background: "rgba(37,99,235,0.08)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div className="skeleton skeleton-line" style={{ width: "240px", height: "28px", marginBottom: "0.6rem" }} />
            <div className="skeleton skeleton-line" style={{ width: "80%", height: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="skeleton skeleton-line" style={{ flex: "1", height: "42px", borderRadius: "0.8rem" }} />
            <div className="skeleton skeleton-line" style={{ width: "130px", height: "42px", borderRadius: "999px" }} />
            <div className="skeleton skeleton-line" style={{ width: "80px", height: "42px", borderRadius: "999px" }} />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state
  if (error && allEvents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <h3>Failed to load events</h3>
        <p>{error}</p>
        <button
          className="button-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── AI Search Section ── */}
      <section
        style={{
          marginBottom: "3rem",
          padding: "1.5rem 0",
          borderRadius: 0,
          border: "none",
          background: "transparent",
          boxShadow: "none",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, marginBottom: "0.35rem", fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Discover Events</h2>
          <p style={{ margin: 0, opacity: 0.6, fontSize: "0.9rem", fontWeight: 400, lineHeight: 1.4 }}>
            Search naturally or browse by category below
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
            placeholder="Search events..."
            style={{
              flex: "1 1 260px",
              background: "rgba(148, 163, 184, 0.04)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              borderRadius: "8px",
              padding: "0.8rem 1rem",
              color: "white",
              fontSize: "0.95rem",
              transition: "all 0.2s ease",
              outline: "none",
              fontWeight: 400,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)";
              e.currentTarget.style.background = "rgba(96,165,250,0.06)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(96,165,250,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.12)";
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.04)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            className="button-primary"
            onClick={handleAISearch}
            disabled={searchingWithAI}
            style={{
              fontWeight: 500,
              fontSize: "0.95rem",
            }}
          >
            {searchingWithAI ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Searching...
              </>
            ) : (
              "Search with AI"
            )}
          </button>
          <button type="button" className="button-secondary" onClick={handleResetSearch} style={{ fontWeight: 500, fontSize: "0.95rem" }}>
            Reset
          </button>
        </div>

        {error && (
          <p className="error" style={{ marginTop: "0.6rem", marginBottom: 0, fontSize: "0.9rem", color: "rgba(239,68,68,0.8)" }}>
            {error}
          </p>
        )}

        {aiReason && (
          <div
            style={{
              marginTop: "0.8rem",
              padding: "0.7rem 0.9rem",
              borderRadius: "8px",
              background: "rgba(96,165,250,0.05)",
              border: "1px solid rgba(96,165,250,0.1)",
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>✨</span>
            <span style={{ fontSize: "0.87rem", lineHeight: 1.5, color: "rgba(148,163,184,0.7)" }}><strong style={{ color: "rgba(148,163,184,0.85)" }}>Matched:</strong> {aiReason}</span>
          </div>
        )}
      </section>

      {/* ── Empty state ── */}
      {events.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎟️</span>
          <h3>No events found</h3>
          <p>
            {aiQuery
              ? "No events matched your search. Try different keywords or reset the search."
              : "No events are available right now. Check back soon."}
          </p>
          {aiQuery && (
            <button className="button-secondary" onClick={handleResetSearch}>
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Category Filter Pills ── */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginBottom: "2.25rem",
              marginTop: "1.5rem",
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: "0.5rem",
              scrollBehavior: "smooth",
            }}
          >
            {getCategories().map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    flex: "0 0 auto",
                    paddingLeft: "0.95rem",
                    paddingRight: "0.95rem",
                    paddingTop: "0.48rem",
                    paddingBottom: "0.48rem",
                    borderRadius: "8px",
                    border: isActive
                      ? "1px solid rgba(96, 165, 250, 0.25)"
                      : "1px solid rgba(148, 163, 184, 0.06)",
                    background: isActive
                      ? "rgba(96, 165, 250, 0.1)"
                      : "rgba(255, 255, 255, 0.01)",
                    color: isActive ? "rgba(147, 197, 253, 1)" : "rgba(148, 163, 184, 0.65)",
                    fontSize: "0.89rem",
                    fontWeight: isActive ? 500 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "none",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const target = e.currentTarget as HTMLButtonElement;
                      target.style.background =
                        "rgba(148, 163, 184, 0.04)";
                      target.style.color = "rgba(148, 163, 184, 0.75)";
                      target.style.borderColor = "rgba(148, 163, 184, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const target = e.currentTarget as HTMLButtonElement;
                      target.style.background = "rgba(255, 255, 255, 0.01)";
                      target.style.color = "rgba(148, 163, 184, 0.65)";
                      target.style.borderColor = "rgba(148, 163, 184, 0.06)";
                    }
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* ── Results count ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.75rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(148,163,184,0.47)", fontWeight: 400 }}>
              {aiQuery
                ? `${filteredEvents.length} result${filteredEvents.length !== 1 ? "s" : ""} for "${aiQuery}"`
                : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""} available`}
              {selectedCategory !== "All" && ` · ${selectedCategory}`}
            </p>
          </div>

          {/* ── No results with filter ── */}
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🔍</span>
              <h3>No events in this category</h3>
              <p>Try selecting a different category or reset the filters.</p>
              <button
                className="button-secondary"
                onClick={() => setSelectedCategory("All")}
              >
                Show All Events
              </button>
            </div>
          ) : (
          <>
          {/* ── Event Cards Grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "2.25rem",
            }}
          >
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  border: "1px solid rgba(148,163,184,0.04)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.14)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: "210px", overflow: "hidden" }}>
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
                      (e.target as HTMLImageElement).style.transform = "scale(1.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.transform = "scale(1)";
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(2,6,23,0.86), rgba(2,6,23,0.1))",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "0.95rem",
                      right: "0.95rem",
                      bottom: "0.95rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        background: "rgba(37, 99, 235, 0.65)",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.1px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {event.category || "General"}
                    </span>

                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        background: event.available_capacity === 0 ? "rgba(239,68,68,0.6)" : getSeatBadgeColor(event.available_capacity) + "99",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.1px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {event.available_capacity === 0
                        ? "Sold Out"
                        : `${event.available_capacity} left`}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "1.1rem 1.1rem 1.2rem" }}>
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: "0.45rem",
                      fontSize: "1.12rem",
                      fontWeight: 600,
                      lineHeight: 1.35,
                      letterSpacing: "-0.2px",
                      color: "white",
                    }}
                  >
                    {event.title}
                  </h3>

                  <p style={{ marginBottom: "0.7rem", fontSize: "0.82rem", color: "rgba(148,163,184,0.58)", letterSpacing: "0.2px", fontWeight: 400 }}>
                    📅 {new Date(event.date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · 📍 {event.location}
                  </p>

                  <p
                    style={{
                      marginBottom: "1rem",
                      color: "rgba(148,163,184,0.55)",
                      lineHeight: 1.4,
                      fontSize: "0.88rem",
                      fontWeight: 400,
                    }}
                  >
                    {event.description.length > 95
                      ? `${event.description.slice(0, 95)}...`
                      : event.description}
                  </p>

                  <Link
                    to={`/events/${event.id}`}
                    className="button-primary"
                    style={{ marginTop: 0, fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
          </>
          )}
        </>
      )}


      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
