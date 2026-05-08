import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { EventListPage } from "./pages/EventListPage";
import EventDetailPage from "./pages/EventDetailPage";
import HomePage from "./pages/HomePage";
import BookingSuccessPage from "./pages/BookingsuccessPage";
import AdminDashboard from "./pages/admindashboard";
import AdminEventsPage from "./pages/admineventspage";
import AdminBookingsPage from "./pages/adminBookingspage";
import LoginAdminPage from "./pages/loginAdmin";

function ProtectedAdminRoute({ children }: { children: JSX.Element }) {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function Header() {
  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");
  const isAdmin = location.pathname.startsWith("/admin");

  function isActive(path: string) {
    return location.pathname === path;
  }

  return (
    <header className="app-header">
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.55rem",
          textDecoration: "none",
          color: "white",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>🎟️</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          EVENTFLOW
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {!isAdmin && (
          <>
            <Link
              to="/"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.38rem 0.85rem",
                borderRadius: "999px",
                color: "white",
                opacity: isActive("/") ? 1 : 0.82,
                background: isActive("/")
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                transition: "background 0.16s ease, opacity 0.16s ease",
              }}
            >
              Home
            </Link>
            <Link
              to="/events"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.38rem 0.85rem",
                borderRadius: "999px",
                color: "white",
                opacity: isActive("/events") ? 1 : 0.82,
                background: isActive("/events")
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                transition: "background 0.16s ease, opacity 0.16s ease",
              }}
            >
              Events
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link
              to="/admin"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.38rem 0.85rem",
                borderRadius: "999px",
                color: "white",
                opacity: isActive("/admin") ? 1 : 0.82,
                background: isActive("/admin")
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                transition: "background 0.16s ease, opacity 0.16s ease",
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/events"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.38rem 0.85rem",
                borderRadius: "999px",
                color: "white",
                opacity: isActive("/admin/events") ? 1 : 0.82,
                background: isActive("/admin/events")
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                transition: "background 0.16s ease, opacity 0.16s ease",
              }}
            >
              Events
            </Link>
            <Link
              to="/admin/bookings"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.38rem 0.85rem",
                borderRadius: "999px",
                color: "white",
                opacity: isActive("/admin/bookings") ? 1 : 0.82,
                background: isActive("/admin/bookings")
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                transition: "background 0.16s ease, opacity 0.16s ease",
              }}
            >
              Bookings
            </Link>
          </>
        )}

        {/* Admin badge / login button */}
        {!isAdmin && (
          <Link
            to={adminToken ? "/admin" : "/admin/login"}
            style={{
              marginLeft: "0.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.38rem 0.9rem",
              borderRadius: "999px",
              color: "white",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              transition: "background 0.16s ease",
              whiteSpace: "nowrap",
            }}
          >
            {adminToken ? "Admin ↗" : "Admin Login"}
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/events"
            style={{
              marginLeft: "0.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.38rem 0.9rem",
              borderRadius: "999px",
              color: "white",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              transition: "background 0.16s ease",
              whiteSpace: "nowrap",
            }}
          >
            ← Public Site
          </Link>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/admin/login" element={<LoginAdminPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedAdminRoute>
                <AdminEventsPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedAdminRoute>
                <AdminBookingsPage />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}