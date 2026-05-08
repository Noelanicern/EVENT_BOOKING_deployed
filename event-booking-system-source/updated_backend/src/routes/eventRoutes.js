const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const eventModel = require("../models/eventModel");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

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

function cleanAiReply(text) {
  if (!text) return "";
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);

router.post("/ai-search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const events = await eventModel.getAllEvents();

    const eventText = events
      .map(
        (event) =>
          `ID: ${event.id}
Title: ${event.title}
Description: ${event.description}
Location: ${event.location}
Category: ${event.category}
Seats left: ${event.available_capacity}
Date: ${event.date}`
      )
      .join("\n\n---\n\n");

    const prompt = `
You are an event recommendation assistant.

User search query:
${query}

Available events:
${eventText}

Return ONLY valid JSON in this exact format:
{
  "matchedEventIds": [1, 2, 3],
  "reason": "short explanation"
}

Rules:
- Pick the most relevant event IDs based on the user's search query.
- Prefer events with available seats.
- Return up to 5 event IDs.
- If nothing matches, return an empty array.
- Keep the reason short and plain.
`;

    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = extractResponseText(response);

    if (!text) {
      return res.status(200).json({
        events: [],
        reason: "AI search is temporarily unavailable. Please try again or browse all events.",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("AI search JSON parse error:", text);
      return res.status(200).json({
        events: [],
        reason: "AI search is temporarily unavailable. Please try again or browse all events.",
      });
    }

    const matchedIds = Array.isArray(parsed.matchedEventIds)
      ? parsed.matchedEventIds
      : [];

    const matchedEvents = events.filter((event) => matchedIds.includes(event.id));

    res.status(200).json({
      events: matchedEvents,
      reason: parsed.reason || "AI search completed.",
    });
  } catch (error) {
    console.error("Error performing AI event search:", error);
    res.status(200).json({
      events: [],
      reason: "AI search is temporarily unavailable. Please try again or browse all events.",
    });
  }
});

router.post("/:id/ai-chat", async (req, res) => {
  try {
    const { message } = req.body;
    const eventId = req.params.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const event = await eventModel.getEventById(eventId);

    if (!event || event.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const e = Array.isArray(event) ? event[0] : event;

    const prompt = `
You are an event assistant helping a user understand one event.

Event details:
Title: ${e.title}
Description: ${e.description}
Location: ${e.location}
Category: ${e.category}
Seats left: ${e.available_capacity}
Date: ${e.date}

User question:
${message}

Instructions:
- Answer in natural, plain text.
- Do NOT use markdown, asterisks, bullet points, or headings.
- Keep the reply concise: 2 to 4 sentences maximum.
- Sound helpful and conversational.
- Only use the information provided above.
- If the user asks something not covered by the event details, clearly say that you do not have that information.
- Do not repeat every field unless it helps answer the question directly.
`;

    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = extractResponseText(response);

    if (!text) {
      return res.status(200).json({
        reply: "Sorry, I could not generate an AI answer right now. Please try again in a moment.",
      });
    }

    res.status(200).json({
      reply: cleanAiReply(text),
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(200).json({
      reply: "Sorry, I could not generate an AI answer right now. Please try again in a moment.",
    });
  }
});

module.exports = router;