const pool = require("../models/db");

exports.checkHealth = async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      message: "Server is healthy",
      db: "connected",
    });
  } catch (err) {
    console.error("Health check DB error:", err.message);
    res.status(503).json({
      status: "ERROR",
      message: "Database unreachable",
      db: "disconnected",
    });
  }
};
