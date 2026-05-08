const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');
const uploadPdf = require("../middleware/pdfUploadMiddleware");
const { uploadAttachment } = require("../controllers/attachmentController");

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllBookings,
  getAllBookingsWithTitles,
  updateBookingStatus,
  improveEventWithAI,
  getDashboardSummary,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// Event management
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// Bookings
router.get("/bookings", getAllBookingsWithTitles);
router.patch("/bookings/:id/status", updateBookingStatus);

// AI endpoints
router.post("/ai/improve-event", improveEventWithAI);
router.get("/ai-summary", getDashboardSummary);

// Image upload
router.post('/upload-image', upload.single('image'), uploadImage);
// PDF upload
router.post("/upload-attachment", uploadPdf.single("file"), uploadAttachment);

module.exports = router;