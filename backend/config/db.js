const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    isConnected = true;
    console.log('MongoDB connected:', conn.connection.host);
  } catch (err) {
    isConnected = false;
    console.error('MongoDB connection failed:', err.message);
  }
};

const getIsConnected = () => isConnected;
const getDbDiagnostics = () => ({
  isConnected,
  hasMongoUri: !!process.env.MONGODB_URI,
});

module.exports = { connectDB, getIsConnected, getDbDiagnostics };
