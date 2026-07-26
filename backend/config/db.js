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

    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log({
      hasUri: !!process.env.MONGODB_URI,
      length: process.env.MONGODB_URI?.length,
      prefix: process.env.MONGODB_URI?.substring(0, 30),
      isConnected
    });
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
