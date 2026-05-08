const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function uploadBuffer(buffer, originalName, mimetype) {
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const uploadDir = path.join(__dirname, '../../uploads');

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

module.exports = { uploadBuffer };

/* S3 version — uncomment when deploying to AWS (no other files need to change)
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });

async function uploadBuffer(buffer, originalName, mimetype) {
  const ext = path.extname(originalName) || '.jpg';
  const filename = `events/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  }));
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
}
*/