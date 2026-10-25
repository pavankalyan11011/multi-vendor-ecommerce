const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    // Safe in Node; also works around Jest/mongodb driver metadata issues in tests
    runtimeAdapters: { os: require('os') },
  });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = { connectDB };
