const db = require("./db");

async function getAllBookings() {
  const [rows] = await db.query("SELECT * FROM bookings");
  return rows;
}

async function getBookingById(id) {
  const [rows] = await db.query("SELECT * FROM bookings WHERE id = ?", [id]);
  return rows[0];
}

async function getAllBookingsWithEventTitles() {
  const [rows] = await db.query(`
    SELECT
      b.id,
      b.event_id,
      b.customer_name,
      b.customer_email,
      b.seats_booked,
      b.booking_status,
      e.title AS event_title
    FROM bookings b
    LEFT JOIN events e ON b.event_id = e.id
    ORDER BY b.id DESC
  `);

  return rows;
}

async function createBooking(bookingData) {
  const {
    event_id,
    customer_name,
    customer_email,
    seats_booked,
    booking_status
  } = bookingData;

  const [result] = await db.query(
    `INSERT INTO bookings
    (event_id, customer_name, customer_email, seats_booked, booking_status)
    VALUES (?, ?, ?, ?, ?)`,
    [event_id, customer_name, customer_email, seats_booked, booking_status || "pending"]
  );

  return result;
}

async function updateBookingStatus(id, status) {
  const [result] = await db.query(
    "UPDATE bookings SET booking_status = ? WHERE id = ?",
    [status, id]            
  );

  return result;
}

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  getAllBookingsWithEventTitles
};