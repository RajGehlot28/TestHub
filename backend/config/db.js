const mongoose = require('mongoose');

let isConnected = false;
let dbError = null;

const connectDB = async () => {
  try {
    dbError = null;
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      dbError = 'process.env.MONGODB_URI is undefined or empty on server';
      console.warn(`${dbError}. Running with in-memory store.`);
      isConnected = false;
      return;
    }

    // Trim whitespace/quotes that can sneak in via copy-paste on Render
    uri = uri.trim().replace(/^["']|["']$/g, '');

    // Log URI details BEFORE connecting so it appears even on failure
    console.log('[Database] Attempting connection...', {
      hasUri: true,
      length: uri.length,
      prefix: uri.substring(0, 40),
      isSRV: uri.startsWith('mongodb+srv://'),
    });

    const conn = await mongoose.connect(uri, {
      authSource: 'admin',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    dbError = error.message;
    console.warn(`MongoDB connection failed (${error.message}).`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;
const getDbDiagnostics = () => ({
  isConnected,
  hasMongoUri: !!process.env.MONGODB_URI,
  mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
  dbError
});

module.exports = { connectDB, getIsConnected, getDbDiagnostics };
