const { uploadToS3 } = require("../../utils/s3");

async function uploadAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const url = await uploadToS3(req.file, "attachments");

    return res.status(200).json({
      message: "PDF uploaded successfully",
      url,
    });
  } catch (err) {
    console.error("S3 PDF upload error:", err);
    return res.status(500).json({
      error: "PDF upload failed",
    });
  }
}

module.exports = { uploadAttachment };