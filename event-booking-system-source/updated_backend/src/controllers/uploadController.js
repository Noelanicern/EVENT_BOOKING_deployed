const { uploadToS3 } = require("../../utils/s3");

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageUrl = await uploadToS3(req.file, "images");

    return res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("S3 image upload error:", err);
    return res.status(500).json({
      error: "Image upload failed",
    });
  }
}

module.exports = { uploadImage };