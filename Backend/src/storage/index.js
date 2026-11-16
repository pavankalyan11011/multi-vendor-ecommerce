const crypto = require('crypto');
const path = require('path');
const { getEnv } = require('../config/env');
const { createLocalDriver } = require('./local.driver');
const { createS3Driver } = require('./s3.driver');

let cached;

function buildDriver() {
  const env = getEnv();
  if (env.storageDriver === 's3') {
    return createS3Driver({
      region: env.s3Region,
      bucket: env.s3Bucket,
      endpoint: env.s3Endpoint,
      forcePathStyle: env.s3ForcePathStyle,
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    });
  }
  return createLocalDriver();
}

function getStorage() {
  if (!cached) {
    cached = buildDriver();
  }
  return cached;
}

function resetStorageCache() {
  cached = undefined;
}

function makeStoredName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 10);
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

/**
 * Persist an uploaded multer memory file into the active storage driver.
 * Mutates `file.filename` to the generated storedName for DB compatibility.
 */
async function persistUpload(folder, file) {
  if (!file?.buffer) {
    throw new Error('persistUpload expects a multer memory file with buffer');
  }
  const storedName = makeStoredName(file.originalname);
  const storage = getStorage();
  await storage.save({
    folder,
    storedName,
    buffer: file.buffer,
    contentType: file.mimetype,
  });
  file.filename = storedName;
  return storedName;
}

async function removeStoredFile(folder, storedName) {
  if (!storedName) return;
  await getStorage().remove({ folder, storedName });
}

async function openStoredFile(folder, storedName) {
  return getStorage().openReadStream({ folder, storedName });
}

module.exports = {
  getStorage,
  resetStorageCache,
  makeStoredName,
  persistUpload,
  removeStoredFile,
  openStoredFile,
};
