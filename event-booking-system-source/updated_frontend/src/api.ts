export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  total_capacity: number;
  available_capacity: number;
  category: string;
  image_url?: string;
}

export interface BookingPayload {
  event_id: number;
  customer_name: string;
  customer_email: string;
  seats_booked: number;
  booking_status?: string;
}

export const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${base}/events`);
  if (!res.ok) {
    throw new Error("Failed to load events");
  }
  return res.json();
}

export async function fetchEvent(id: string | number): Promise<Event> {
  const res = await fetch(`${base}/events/${id}`);
  if (!res.ok) {
    throw new Error("Failed to load event");
  }
  return res.json();
}

export async function createBooking(payload: BookingPayload): Promise<any> {
  const res = await fetch(`${base}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create booking");
  }
  return data;
}