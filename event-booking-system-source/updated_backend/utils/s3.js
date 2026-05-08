const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");

// No credentials block — EC2 IAM role (LabRole) provides access automatically
// This also works locally if you have AWS CLI configured
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

async function uploadToS3(file, folder = "uploads") {
  const fileExt = path.extname(file.originalname);
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}${fileExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.${
    process.env.AWS_REGION || "us-east-1"
  }.amazonaws.com/${fileName}`;
}

module.exports = { uploadToS3 };