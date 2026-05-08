import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type BookingSuccessState = {
  eventTitle?: string;
  seatsBooked?: number;
  customerName?: string;
};

export default function BookingSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as BookingSuccessState | null) || null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "3rem 1rem 2rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))",
          border: "1px solid rgba(34,197,94,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          fontSize: "2rem",
        }}
      >
        ✓
      </div>

      <h2
        style={{
          margin: "0 0 0.5rem",
          fontSize: "1.75rem",
          color: "#f8fafc",
        }}
      >
        Booking Confirmed
      </h2>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Your reservation has been successfully placed.
      </p>

      {/* Summary card — fixed for dark theme */}
      {(state?.eventTitle || state?.seatsBooked || state?.customerName) && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.35rem 1.5rem",
            borderRadius: "16px",
            background: "rgba(15, 23, 42, 0.82)",
            border: "1px solid rgba(34,197,94,0.2)",
            textAlign: "left",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "1.1rem",
              paddingBottom: "0.85rem",
              borderBottom: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#f8fafc" }}>
              Booking Summary
            </h3>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {state?.customerName && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Name</span>
                <span style={{ fontWeight: 600, color: "#e5e7eb" }}>{state.customerName}</span>
              </div>
            )}
            {state?.eventTitle && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Event</span>
                <span style={{ fontWeight: 600, color: "#e5e7eb", textAlign: "right" }}>{state.eventTitle}</span>
              </div>
            )}
            {typeof state?.seatsBooked === "number" && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Seats Booked</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#4ade80",
                    fontSize: "1rem",
                  }}
                >
                  {state.seatsBooked}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.85rem",
          flexWrap: "wrap",
        }}
      >
        <button className="button-primary" onClick={() => navigate("/events")}>
          Browse More Events
        </button>
        <button className="button-secondary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    </div>
  );
}