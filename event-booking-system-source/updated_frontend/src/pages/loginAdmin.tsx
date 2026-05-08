import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {base} from "../api";

export default function LoginAdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate("/admin");
    }
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }

      if (!data?.token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data?.admin?.email || email);

      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <p
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            cursor: "pointer",
            fontSize: "0.9rem",
            opacity: 0.8,
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </p>

        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Admin Login</h2>
        <p style={{ marginTop: 0, marginBottom: "1.25rem", opacity: 0.85 }}>
          Sign in to access the admin dashboard.
        </p>

        {error && (
          <p className="error" style={{ marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.85rem",
            opacity: 0.75,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Back to main site
        </p>
      </div>
    </div>
  );
}
