require('dotenv').config();

const createApp = require('./src/app');
const { connectDB } = require('./src/config/db');
const { getEnv } = require('./src/config/env');

async function start() {
  const env = getEnv();
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
