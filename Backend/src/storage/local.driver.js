const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { ApiError } = require('../utils/ApiError');

function rootDir() {
  return path.join(process.cwd(), 'uploads');
}

function folderPath(folder) {
  return path.join(rootDir(), folder);
}

function resolveSafe(folder, storedName) {
  const root = path.resolve(folderPath(folder));
  const full = path.resolve(root, storedName);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new ApiError(400, 'INVALID_PATH', 'Invalid storage path');
  }
  return full;
}

function createLocalDriver() {
  return {
    name: 'local',

    async save({ folder, storedName, buffer }) {
      const dir = folderPath(folder);
      await fsp.mkdir(dir, { recursive: true });
      const full = resolveSafe(folder, storedName);
      await fsp.writeFile(full, buffer);
      return { storedName, key: `${folder}/${storedName}` };
    },

    async remove({ folder, storedName }) {
      const full = resolveSafe(folder, storedName);
      try {
        await fsp.unlink(full);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    },

    async openReadStream({ folder, storedName }) {
      const full = resolveSafe(folder, storedName);
      await fsp.access(full);
      return {
        stream: fs.createReadStream(full),
        contentLength: (await fsp.stat(full)).size,
      };
    },
  };
}

module.exports = { createLocalDriver, rootDir };
