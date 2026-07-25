const mongoose = require('mongoose');

let isConnected = false;
let dbError = null;

const connectDB = async () => {
  try {
    dbError = null;
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      dbError = 'process.env.MONGODB_URI is undefined or empty on server';
      console.warn(`[Database Warning] ${dbError}. Running with in-memory store.`);
      isConnected = false;
      return;
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    dbError = error.message;
    console.warn(`[Database Warning] MongoDB connection failed (${error.message}). Running with in-memory store.`);
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
