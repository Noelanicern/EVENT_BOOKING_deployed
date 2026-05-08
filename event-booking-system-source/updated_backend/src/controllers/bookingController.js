const bookingModel = require("../models/bookingModel");
const eventModel = require("../models/eventModel");

exports.createBooking = async (req, res) => {
  try {
    const { event_id, seats_booked } = req.body;

    // 1. Check if event exists
    const event = await eventModel.getEventById(event_id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. Check available seats
    if (event.available_capacity < seats_booked) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    // 3. Create booking
    const result = await bookingModel.createBooking(req.body);

    // 4. Reduce available seats
    await eventModel.reduceCapacity(event_id, seats_booked);

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};