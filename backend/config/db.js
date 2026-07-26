const mongoose = require('mongoose');

let isConnected = false;
let dbError = null;

const connectDB = async () => {
  try {
    dbError = null;
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      dbError = 'MONGODB_URI is not set. Running with in-memory store.';
      console.warn(dbError);
      return;
    }

    uri = uri.trim().replace(/^["']|["']$/g, '');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });

    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    dbError = error.message;
    isConnected = false;
    console.error(`MongoDB connection failed: ${error.message}`);
  }
};

const getIsConnected = () => isConnected;
const getDbDiagnostics = () => ({
  isConnected,
  hasMongoUri: !!process.env.MONGODB_URI,
  dbError,
});

module.exports = { connectDB, getIsConnected, getDbDiagnostics };
