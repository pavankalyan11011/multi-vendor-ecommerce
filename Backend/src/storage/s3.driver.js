const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} = require('@aws-sdk/client-s3');
const { ApiError } = require('../utils/ApiError');

function createS3Driver(config) {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: Boolean(config.forcePathStyle),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const bucket = config.bucket;

  function objectKey(folder, storedName) {
    return `${folder}/${storedName}`;
  }

  return {
    name: 's3',
    client,
    bucket,

    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    },

    async save({ folder, storedName, buffer, contentType }) {
      const Key = objectKey(folder, storedName);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key,
          Body: buffer,
          ContentType: contentType || 'application/octet-stream',
        })
      );
      return { storedName, key: Key };
    },

    async remove({ folder, storedName }) {
      const Key = objectKey(folder, storedName);
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key,
          })
        );
      } catch (err) {
        // Missing object is fine on delete
        if (err?.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
      }
    },

    async openReadStream({ folder, storedName }) {
      const Key = objectKey(folder, storedName);
      try {
        const out = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key,
          })
        );
        return {
          stream: out.Body,
          contentType: out.ContentType || undefined,
          contentLength: out.ContentLength,
        };
      } catch (err) {
        if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
          throw new ApiError(404, 'NOT_FOUND', 'File not found in storage');
        }
        throw err;
      }
    },
  };
}

module.exports = { createS3Driver };
