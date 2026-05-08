const eventModel = require("../models/eventModel");


exports.getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await eventModel.getEventById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
};