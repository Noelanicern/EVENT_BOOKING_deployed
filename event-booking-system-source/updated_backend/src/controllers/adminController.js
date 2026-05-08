const eventModel = require("../models/eventModel");
const bookingModel = require("../models/bookingModel");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

/* =========================
   HELPERS
========================= */

function extractResponseText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  if (
    response.output &&
    Array.isArray(response.output) &&
    response.output[0] &&
    response.output[0].content &&
    Array.isArray(response.output[0].content) &&
    response.output[0].content[0] &&
    response.output[0].content[0].text
  ) {
    return response.output[0].content[0].text;
  }

  return "";
}

/* =========================
   CONTROLLERS
========================= */

exports.createEvent = async (req, res) => {
  try {
    const result = await eventModel.createEvent(req.body);
    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const result = await eventModel.updateEvent(req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const result = await eventModel.deleteEvent(req.params.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingModel.getAllBookings();
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllBookingsWithTitles = async (req, res) => {
  try {
    const bookings = await bookingModel.getAllBookingsWithEventTitles();
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings with event titles:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const result = await bookingModel.updateBookingStatus(
      req.params.id,
      status
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    res.status(200).json({
      message: "Booking status updated successfully",
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   AI ENDPOINT — B + C
========================= */

exports.improveEventWithAI = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        message: "Title or description is required",
      });
    }

    const prompt = `
You are an assistant helping improve event content.

Given:
Title: ${title || ""}
Description: ${description || ""}

Return ONLY valid JSON in this exact format:
{
  "improvedDescription": "...",
  "category": "...",
  "tags": ["...", "...", "..."]
}

Rules:
- Improve the description so it sounds clearer, more engaging, and professional.
- Category must be one short label like Technology, Business, Education, Health, or General.
- Tags must contain 3 to 5 relevant short keywords.
`;

    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = extractResponseText(response);

    if (!text) {
      return res.status(200).json({
        improvedDescription: description || "",
        category: "General",
        tags: [],
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("AI JSON parse error:", text);
      return res.status(200).json({
        improvedDescription: description || "",
        category: "General",
        tags: [],
      });
    }

    res.status(200).json({
      improvedDescription: parsed.improvedDescription || description || "",
      category: parsed.category || "General",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });
  } catch (error) {
    console.error("Error improving event with AI:", error);
    res.status(200).json({
      improvedDescription: req.body?.description || "",
      category: "General",
      tags: [],
    });
  }
};

/* =========================
   AI DASHBOARD SUMMARY — G
========================= */

exports.getDashboardSummary = async (req, res) => {
  try {
    const events = await eventModel.getAllEvents();
    const bookings = await bookingModel.getAllBookings();

    const prompt = `
You are an analytics assistant for an event booking admin dashboard.

Data:
- Total events: ${events.length}
- Total bookings: ${bookings.length}

Write a short 2-3 sentence summary for the admin.
Mention:
- overall activity level
- whether bookings seem healthy or low
- one practical admin insight

Keep it concise and professional.
`;

    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = extractResponseText(response);

    if (!text) {
      return res.status(200).json({
        summary:
          "AI summary is temporarily unavailable. You can still review total events and bookings from the dashboard cards.",
      });
    }

    res.status(200).json({ summary: text });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    res.status(200).json({
      summary:
        "AI summary is temporarily unavailable. You can still review total events and bookings from the dashboard cards.",
    });
  }
};