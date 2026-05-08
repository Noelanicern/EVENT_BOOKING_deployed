const db = require("./db");

async function getAllEvents() {
  const [rows] = await db.query("SELECT * FROM events");
  return rows;
}

async function getEventById(id) {
  const [rows] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
  return rows[0];
}

async function createEvent(eventData) {
  const {
    title,
    description,
    date,
    location,
    total_capacity,
    available_capacity,
    category,
    image_url,
    attachment_url,
  } = eventData;

  const [result] = await db.query(
    `INSERT INTO events
    (title, description, date, location, total_capacity, available_capacity, category, image_url, attachment_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      date,
      location,
      total_capacity,
      available_capacity,
      category,
      image_url || null,
      attachment_url || null,
    ]
  );

  return result;
}

async function reduceCapacity(eventId, seatsBooked) {
  const [result] = await db.query(
    `UPDATE events
     SET available_capacity = available_capacity - ?
     WHERE id = ?`,
    [seatsBooked, eventId]
  );
  return result;
}

async function updateEvent(id, eventData) {
  const {
    title,
    description,
    date,
    location,
    total_capacity,
    available_capacity,
    category,
    image_url,
    attachment_url,
  } = eventData;

  const [result] = await db.query(
    `UPDATE events
     SET title = ?, description = ?, date = ?, location = ?, total_capacity = ?, available_capacity = ?, category = ?, image_url = ?, attachment_url = ?
     WHERE id = ?`,
    [
      title,
      description,
      date,
      location,
      total_capacity,
      available_capacity,
      category,
      image_url || null,
      attachment_url || null,
      id,
    ]
  );

  return result;
}

async function deleteEvent(id) {
  const [result] = await db.query("DELETE FROM events WHERE id = ?", [id]);
  return result;
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  reduceCapacity,
};