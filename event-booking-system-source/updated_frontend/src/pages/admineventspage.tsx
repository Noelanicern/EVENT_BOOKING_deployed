import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base } from "../api";

// ── Types ────────────────────────────────────────────────────────────────────

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

type EventForm = {
  title: string;
  description: string;
  date: string;
  location: string;
  total_capacity: number;
  available_capacity: number;
  category: string;
  image_url: string;
  attachment_url: string;
};

type DeletedEventSnapshot = {
  title: string;
  description: string;
  date: string;
  location: string;
  total_capacity: number;
  available_capacity: number;
  category: string;
  image_url: string;
  attachment_url: string;
};

type Toast = {
  id: string;
  message: string;
  eventId: number;
  eventTitle: string;
  progress: number; // 0–100, drives the progress bar
};

type AIOptimization = {
  suggestions: string[];
  improvedTitle: string;
  improvedDescription: string;
  suggestedCategory: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const UNDO_DELAY_MS = 5000;
const PROGRESS_INTERVAL_MS = 50;

const initialForm: EventForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  total_capacity: 1,
  available_capacity: 1,
  category: "",
  image_url: "",
  attachment_url: "",
};

// ── Toast Component ───────────────────────────────────────────────────────────

function UndoToastContainer({
  toasts,
  onUndo,
}: {
  toasts: Toast[];
  onUndo: (eventId: number, toastId: string) => void;
}) {
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
        gap: "0.6rem",
        maxWidth: "360px",
        width: "calc(100vw - 3rem)",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: "rgba(15, 23, 42, 0.97)",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "14px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
            animation: "toastSlideIn 0.25s ease",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              height: "3px",
              background: "rgba(255,255,255,0.06)",
              width: "100%",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${toast.progress}%`,
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                transition: `width ${PROGRESS_INTERVAL_MS}ms linear`,
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#f1f5f9" }}>
                Event deleted
              </div>
              <div
                className="muted"
                style={{
                  fontSize: "0.82rem",
                  marginTop: "0.1rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {toast.eventTitle}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUndo(toast.eventId, toast.id)}
              style={{
                flexShrink: 0,
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid rgba(96,165,250,0.4)",
                background: "rgba(37,99,235,0.18)",
                color: "#93c5fd",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "background 0.16s ease, border-color 0.16s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(37,99,235,0.32)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(37,99,235,0.18)";
              }}
            >
              Undo
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

  // Core state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<EventForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<DeletedEventSnapshot | null>(null);
  const [undoingDelete, setUndoingDelete] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [improvingWithAI, setImprovingWithAI] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [aiOptimization, setAiOptimization] = useState<AIOptimization | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);

  // ── Undo delete state ──
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Refs for timers — useRef so changes don't trigger re-renders
  const deleteTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const progressTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  // ── Quality score helpers ──────────────────────────────────────────────────

  function calculateQualityScore(): number {
    let score = 0;
    if (form.title && form.title.length >= 8) score += 15;
    if (form.title && form.title.length >= 15) score += 5;
    if (form.description && form.description.length >= 40) score += 20;
    if (form.description && form.description.length >= 100) score += 10;
    if (form.date) score += 15;
    if (form.location && form.location.length >= 5) score += 15;
    if (form.category) score += 10;
    if (form.total_capacity > 0) score += 10;
    return Math.min(score, 100);
  }

  function getQualityHints(): string[] {
    const hints = [];
    if (!form.title || form.title.length < 8)
      hints.push("Use a clear, descriptive title (8+ characters)");
    if (!form.description || form.description.length < 40)
      hints.push("Add a detailed description (40+ characters)");
    if (!form.location) hints.push("Specify a location for better discoverability");
    return hints;
  }

  function getEventStatus(event: EventItem): {
    label: string;
    color: string;
    bgColor: string;
  } {
    const usagePercent =
      ((event.total_capacity - event.available_capacity) / event.total_capacity) * 100;
    if (usagePercent >= 80)
      return {
        label: "Nearly full",
        color: "#ef4444",
        bgColor: "rgba(239,68,68,0.15)",
      };
    if (usagePercent >= 40)
      return {
        label: "Healthy",
        color: "#10b981",
        bgColor: "rgba(16,185,129,0.15)",
      };
    return {
      label: "Low interest",
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.15)",
    };
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${base}/events`);
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // Cleanup all timers on unmount
    return () => {
      deleteTimers.current.forEach((t) => clearTimeout(t));
      progressTimers.current.forEach((t) => clearInterval(t));
    };
  }, []);

  // ── Form handlers ─────────────────────────────────────────────────────────

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "total_capacity" || name === "available_capacity"
          ? Number(value)
          : value,
    }));
  }

  function handleEdit(event: EventItem) {
    setEditingId(event.id);
    setMessage("");
    setError("");
    setSuggestedTags([]);
    setImagePreview(event.image_url || "");
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.slice(0, 16),
      location: event.location,
      total_capacity: event.total_capacity,
      available_capacity: event.available_capacity,
      category: event.category,
      image_url: event.image_url || "",
      attachment_url: event.attachment_url || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
    setError("");
    setSuggestedTags([]);
    setImagePreview("");
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${base}/admin/upload-image`, {
        method: "POST",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((prev) => ({ ...prev, image_url: data.imageUrl }));
    } catch (err: any) {
      setError(err.message || "Image upload failed");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  }

  async function handleAttachmentUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAttachmentUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${base}/admin/upload-attachment`, {
        method: "POST",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        body: formData,
      });
      if (!res.ok) {
        let backendMessage = "PDF upload failed";
        try {
          const errorData = await res.json();
          backendMessage =
            errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        attachment_url: data.url || data.attachment_url || "",
      }));
    } catch (err: any) {
      setError(err.message || "Attachment upload failed");
    } finally {
      setAttachmentUploading(false);
    }
  }

  async function handleImproveWithAI() {
    if (!form.title && !form.description) {
      setError("Please enter a title or description first.");
      return;
    }
    try {
      setImprovingWithAI(true);
      setError("");
      setMessage("");
      const res = await fetch(`${base}/admin/ai/improve-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
        }),
      });
      if (!res.ok) {
        let backendMessage = "Failed to improve event with AI";
        try {
          const errorData = await res.json();
          backendMessage =
            errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }
      const data = await res.json();
      const optimization: AIOptimization = {
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions.slice(0, 3)
          : [],
        improvedTitle: data.improvedTitle || form.title,
        improvedDescription: data.improvedDescription || form.description,
        suggestedCategory: data.category || form.category,
      };
      setAiOptimization(optimization);
      setShowAIResults(true);
      setSuggestedTags(Array.isArray(data.tags) ? data.tags : []);
    } catch (err: any) {
      setError(err.message || "Failed to improve event with AI");
    } finally {
      setImprovingWithAI(false);
    }
  }

  function applyAISuggestions() {
    if (!aiOptimization) return;
    setForm((prev) => ({
      ...prev,
      title: aiOptimization.improvedTitle || prev.title,
      description: aiOptimization.improvedDescription || prev.description,
      category: aiOptimization.suggestedCategory || prev.category,
    }));
    setMessage("AI suggestions applied successfully!");
    setShowAIResults(false);
  }

  function handleViewEvent(event: EventItem) {
    window.open(`/events/${event.id}`, "_blank");
  }

  function handleDuplicateEvent(event: EventItem) {
    setForm({
      title: event.title + " (Copy)",
      description: event.description,
      date: event.date.slice(0, 16),
      location: event.location,
      total_capacity: event.total_capacity,
      available_capacity: event.total_capacity,
      category: event.category,
      image_url: event.image_url || "",
      attachment_url: event.attachment_url || "",
    });
    setImagePreview(event.image_url || "");
    setEditingId(null);
    setMessage("");
    setSuggestedTags([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.title ||
      !form.description ||
      !form.date ||
      !form.location ||
      !form.category
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.total_capacity <= 0) {
      setError("Total capacity must be greater than 0.");
      return;
    }
    if (form.available_capacity < 0) {
      setError("Available capacity cannot be negative.");
      return;
    }
    if (form.available_capacity > form.total_capacity) {
      setError("Available capacity cannot exceed total capacity.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const url = editingId
        ? `${base}/admin/events/${editingId}`
        : `${base}/admin/events`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let backendMessage = editingId
          ? "Failed to update event"
          : "Failed to create event";
        try {
          const errorData = await res.json();
          backendMessage =
            errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }
      setMessage(
        editingId ? "Event updated successfully" : "Event created successfully"
      );
      setForm(initialForm);
      setEditingId(null);
      setSuggestedTags([]);
      setImagePreview("");
      await loadEvents();
    } catch (err: any) {
      setError(err.message || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  // ── UNDO DELETE SYSTEM ────────────────────────────────────────────────────

  function removeToast(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }

  function handleDeleteRequest(id: number) {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    // If already pending (double-click guard), ignore
    if (pendingDeleteIds.has(id)) return;

    // Clear any editing state for this event
    if (editingId === id) handleCancelEdit();

    // Hide from list immediately
    setPendingDeleteIds((prev) => new Set(prev).add(id));

    const toastId = `toast-${id}-${Date.now()}`;

    // Add toast with full progress
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message: "Event deleted",
        eventId: id,
        eventTitle: event.title,
        progress: 100,
      },
    ]);

    // Progress bar countdown
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / UNDO_DELAY_MS) * 100);
      setToasts((prev) =>
        prev.map((t) =>
          t.id === toastId ? { ...t, progress: remaining } : t
        )
      );
    }, PROGRESS_INTERVAL_MS);

    progressTimers.current.set(id, progressInterval);

    // Actual delete after delay
    const timer = setTimeout(async () => {
      clearInterval(progressTimers.current.get(id));
      progressTimers.current.delete(id);
      deleteTimers.current.delete(id);
      removeToast(toastId);

      try {
        const res = await fetch(`${base}/admin/events/${id}`, {
          method: "DELETE",
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });

        if (!res.ok) throw new Error("Failed to delete event");

        // Remove from events list permanently
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } catch {
        // Backend failed — restore event in UI
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(`Failed to delete "${event.title}". The event has been restored.`);
      } finally {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, UNDO_DELAY_MS);

    deleteTimers.current.set(id, timer);
  }

  function handleUndoDelete(eventId: number, toastId: string) {
    // Cancel the pending delete timer
    const timer = deleteTimers.current.get(eventId);
    if (timer) {
      clearTimeout(timer);
      deleteTimers.current.delete(eventId);
    }

    // Cancel progress timer
    const progressTimer = progressTimers.current.get(eventId);
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimers.current.delete(eventId);
    }

    // Restore event in visible list
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });

    // Remove toast
    removeToast(toastId);
  }

  // ── Legacy undo (top banner) — keep for backwards compat ─────────────────

  async function handleUndoDeleteLegacy() {
    if (!recentlyDeleted) return;
    try {
      setUndoingDelete(true);
      setError("");
      setMessage("");
      const res = await fetch(`${base}/admin/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(recentlyDeleted),
      });
      if (!res.ok) {
        let backendMessage = "Failed to restore deleted event";
        try {
          const errorData = await res.json();
          backendMessage =
            errorData?.message || errorData?.error || backendMessage;
        } catch {
          try {
            const errorText = await res.text();
            if (errorText) backendMessage = errorText;
          } catch {}
        }
        throw new Error(backendMessage);
      }
      setMessage("Deleted event restored successfully.");
      setRecentlyDeleted(null);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || "Failed to restore deleted event");
    } finally {
      setUndoingDelete(false);
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const uniqueCategories = Array.from(
    new Set(events.map((event) => event.category).filter(Boolean))
  );

  const filteredEvents = events.filter((event) => {
    // Hide events pending deletion
    if (pendingDeleteIds.has(event.id)) return false;

    const matchesCategory =
      categoryFilter === "all" ? true : event.category === categoryFilter;
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      search === ""
        ? true
        : event.id.toString().includes(search) ||
          event.title.toLowerCase().includes(search) ||
          event.location.toLowerCase().includes(search) ||
          event.category.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  if (loading) return <p>Loading events...</p>;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "1220px", margin: "0 auto", padding: "2rem 1rem 2.5rem" }}>

      {/* Header */}
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1.45rem",
          borderRadius: "22px",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(124,58,237,0.14))",
          border: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "0 16px 34px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0, marginBottom: "0.4rem" }}>Manage Events</h2>
            <p style={{ margin: 0, opacity: 0.82, maxWidth: "760px" }}>
              Create, refine, and manage event listings with AI-assisted content
              improvements.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="button-secondary"
              onClick={() => navigate("/admin")}
            >
              Back to Dashboard
            </button>
            <button
              className="button-primary"
              onClick={() => navigate("/admin/bookings")}
            >
              Bookings
            </button>
          </div>
        </div>
      </section>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* Legacy undo banner — kept for safety */}
      {recentlyDeleted && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
            padding: "0.95rem 1rem",
            borderRadius: "14px",
            border: "1px solid rgba(245,158,11,0.32)",
            backgroundColor: "rgba(245,158,11,0.12)",
            color: "#fbbf24",
          }}
        >
          <span>Event deleted. You can undo this action now.</span>
          <button
            type="button"
            className="button-secondary"
            onClick={handleUndoDeleteLegacy}
            disabled={undoingDelete}
          >
            {undoingDelete ? "Restoring..." : "Undo Delete"}
          </button>
        </div>
      )}

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
          gap: "1.6rem",
          alignItems: "start",
        }}
      >
        {/* Events table */}
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
              <h3 style={{ margin: 0 }}>Existing Events</h3>
              <p className="muted" style={{ margin: "0.3rem 0 0 0" }}>
                Search and manage all published event records
              </p>
            </div>
            <span className="muted">{filteredEvents.length} shown</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search by ID, title, location, or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {filteredEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const booked =
                    event.total_capacity - event.available_capacity;
                  const status = getEventStatus(event);
                  return (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>{event.title}</td>
                      <td>{event.category}</td>
                      <td style={{ fontSize: "0.9rem" }}>
                        {booked} / {event.total_capacity}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.3rem 0.7rem",
                            borderRadius: "6px",
                            backgroundColor: status.bgColor,
                            color: status.color,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleViewEvent(event)}
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleDuplicateEvent(event)}
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleEdit(event)}
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                          >
                            Edit
                          </button>
                          {/* DELETE — now uses delayed undo system */}
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleDeleteRequest(event.id)}
                            style={{
                              fontSize: "0.8rem",
                              padding: "0.4rem 0.7rem",
                              borderColor: "rgba(239,68,68,0.3)",
                              color: "#f87171",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Create / Edit form */}
        <section className="card" style={{ padding: "1.2rem" }}>
          <div style={{ marginBottom: "1.2rem" }}>
            <h3 style={{ margin: 0, marginBottom: "0.3rem" }}>
              {editingId ? "Edit Event" : "Create Event"}
            </h3>
            <p className="muted" style={{ margin: "0.3rem 0 0 0" }}>
              {editingId
                ? "Refine event details with AI guidance"
                : "Build event details with AI assistance"}
            </p>
          </div>

          {!editingId && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, rgba(96,165,250,0.08), rgba(139,92,246,0.08))",
                border: "1px solid rgba(96,165,250,0.18)",
                marginBottom: "1.2rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.92rem",
                  opacity: 0.82,
                  lineHeight: 1.5,
                }}
              >
                <strong>💡 Pro Tips:</strong> Clear titles improve visibility,
                detailed descriptions increase bookings, and limited seats create
                urgency. Use AI assistance to refine your content.
              </p>
            </div>
          )}

          {(form.title || form.description) && (
            <div
              style={{
                padding: "0.85rem",
                borderRadius: "10px",
                background: "rgba(37,99,235,0.06)",
                border: "1px solid rgba(96,165,250,0.14)",
                marginBottom: "1.2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>
                    Event Quality Score
                  </strong>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.75,
                      marginTop: "0.2rem",
                    }}
                  >
                    {calculateQualityScore()}/100
                  </div>
                </div>
                <div
                  style={{
                    width: "120px",
                    height: "6px",
                    borderRadius: "3px",
                    background: "rgba(148,163,184,0.2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${calculateQualityScore()}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
              {getQualityHints().length > 0 && (
                <div
                  style={{ marginTop: "0.6rem", fontSize: "0.85rem", opacity: 0.75 }}
                >
                  {getQualityHints().map((hint, idx) => (
                    <div key={idx}>• {hint}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form" noValidate>
            {/* CORE INFO */}
            <div
              style={{
                marginBottom: "1.3rem",
                paddingBottom: "1.2rem",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.8rem 0",
                  fontSize: "0.95rem",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Core Info
              </h4>
              <label>
                Title
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* AI Assistant */}
              <div
                style={{
                  padding: "0.9rem",
                  borderRadius: "10px",
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(96,165,250,0.16)",
                  marginTop: "0.8rem",
                  marginBottom: "0.8rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.92rem" }}>
                      ✨ AI Event Optimizer
                    </strong>
                    <p
                      className="muted"
                      style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}
                    >
                      Improve title, description & category
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleImproveWithAI}
                    disabled={improvingWithAI}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {improvingWithAI ? "Optimizing..." : "Optimize"}
                  </button>
                </div>
              </div>

              {showAIResults && aiOptimization && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,197,94,0.08))",
                    border: "1px solid rgba(16,185,129,0.2)",
                    marginBottom: "0.8rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                      marginBottom: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ fontSize: "0.92rem" }}>
                      🎯 AI Suggestions
                    </strong>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={applyAISuggestions}
                      style={{ fontSize: "0.85rem", padding: "0.35rem 0.8rem" }}
                    >
                      Apply All
                    </button>
                  </div>
                  {aiOptimization.suggestions.length > 0 && (
                    <div style={{ marginBottom: "0.8rem" }}>
                      <p
                        style={{
                          margin: "0 0 0.4rem 0",
                          fontSize: "0.85rem",
                          opacity: 0.75,
                        }}
                      >
                        <strong>Recommendations:</strong>
                      </p>
                      <ul
                        style={{
                          margin: "0.3rem 0 0 1rem",
                          paddingLeft: "1rem",
                          fontSize: "0.85rem",
                          opacity: 0.85,
                        }}
                      >
                        {aiOptimization.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.8rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.6rem",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "6px",
                      }}
                    >
                      <p style={{ margin: "0 0 0.3rem 0", opacity: 0.7 }}>
                        Improved Title
                      </p>
                      <p style={{ margin: 0, fontSize: "0.85rem" }}>
                        {aiOptimization.improvedTitle}
                      </p>
                    </div>
                    {aiOptimization.suggestedCategory && (
                      <div
                        style={{
                          padding: "0.6rem",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: "6px",
                        }}
                      >
                        <p style={{ margin: "0 0 0.3rem 0", opacity: 0.7 }}>
                          Category
                        </p>
                        <p style={{ margin: 0, fontSize: "0.85rem" }}>
                          {aiOptimization.suggestedCategory}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {suggestedTags.length > 0 && (
                <div
                  style={{
                    padding: "0.8rem",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    Suggested Tags
                  </strong>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {suggestedTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          backgroundColor: "rgba(99,102,241,0.18)",
                          color: "#c4b5fd",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* LOGISTICS */}
            <div
              style={{
                marginBottom: "1.3rem",
                paddingBottom: "1.2rem",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.8rem 0",
                  fontSize: "0.95rem",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Logistics
              </h4>
              <label>
                Date and Time
                <input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Location
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* CAPACITY */}
            <div
              style={{
                marginBottom: "1.3rem",
                paddingBottom: "1.2rem",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.8rem 0",
                  fontSize: "0.95rem",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Capacity
              </h4>
              <label>
                Category
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Total Capacity
                <input
                  type="number"
                  name="total_capacity"
                  min={1}
                  value={form.total_capacity}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Available Capacity
                <input
                  type="number"
                  name="available_capacity"
                  min={0}
                  value={form.available_capacity}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* MEDIA */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h4
                style={{
                  margin: "0 0 0.8rem 0",
                  fontSize: "0.95rem",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Media
              </h4>
              <label>
                Image URL
                <input
                  type="text"
                  name="image_url"
                  placeholder="https://example.com/image.jpg"
                  value={form.image_url}
                  readOnly={form.image_url.startsWith("/uploads/")}
                  onChange={(e) => {
                    handleChange(e);
                    setImagePreview(e.target.value);
                  }}
                />
              </label>
              <div>
                <label style={{ marginBottom: "0.4rem", display: "block" }}>
                  Or upload image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="muted" style={{ margin: "0.3rem 0 0 0" }}>
                    Uploading...
                  </p>
                )}
                {!uploading && form.image_url.startsWith("/uploads/") && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="muted">Image uploaded successfully.</span>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image_url: "" }));
                        setImagePreview("");
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
              {imagePreview && (
                <div style={{ marginTop: "0.25rem" }}>
                  <img
                    src={
                      imagePreview.startsWith("http")
                        ? imagePreview
                        : `${base}${imagePreview}`
                    }
                    alt="Preview"
                    onError={() => setImagePreview("")}
                    style={{
                      width: "100%",
                      maxHeight: "180px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid rgba(148,163,184,0.2)",
                    }}
                  />
                </div>
              )}
              <label>
                PDF Attachment URL
                <input
                  type="text"
                  name="attachment_url"
                  placeholder="https://example.com/document.pdf"
                  value={form.attachment_url}
                  readOnly={form.attachment_url.startsWith("/uploads/")}
                  onChange={(e) => handleChange(e)}
                />
              </label>
              <div>
                <label style={{ marginBottom: "0.4rem", display: "block" }}>
                  Or upload PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleAttachmentUpload}
                  disabled={attachmentUploading}
                />
                {attachmentUploading && (
                  <p className="muted" style={{ margin: "0.3rem 0 0 0" }}>
                    Uploading...
                  </p>
                )}
                {!attachmentUploading &&
                  form.attachment_url.startsWith("/uploads/") && (
                    <div
                      style={{
                        marginTop: "0.6rem",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="muted">PDF uploaded successfully.</span>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, attachment_url: "" }))
                        }
                      >
                        Remove PDF
                      </button>
                    </div>
                  )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.2rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                className="button-primary"
                disabled={submitting}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                  ? "Update Event"
                  : "Create Event"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* ── Undo Toast Container (fixed, bottom-right) ── */}
      <UndoToastContainer toasts={toasts} onUndo={handleUndoDelete} />
    </div>
  );
}