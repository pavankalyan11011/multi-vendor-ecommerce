/**
 * Creates the S3 bucket used by STORAGE_DRIVER=s3 (LocalStack or real AWS).
 *
 * Usage (from Backend/):
 *   node scripts/ensure-s3-bucket.js
 */
require('dotenv').config();

const { S3Client, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');

async function main() {
  const bucket = process.env.S3_BUCKET || 'emporia-uploads';
  const region = process.env.S3_REGION || 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const forcePathStyle =
    String(process.env.S3_FORCE_PATH_STYLE || 'true').toLowerCase() !== 'false';

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket already exists: ${bucket}`);
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created bucket: ${bucket}`);
  }

  if (endpoint) {
    console.log(`Endpoint: ${endpoint}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
