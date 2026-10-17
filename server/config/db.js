const mongoose = require('mongoose');

let isDbConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!mongoURI || mongoURI === 'your_mongodb_connection_string') {
      if (isProduction) {
        console.error('❌ PRODUCTION DEPLOYMENT ERROR: MONGODB_URI environment variable is missing on Render!');
        console.error('👉 Fix: Go to Render Dashboard -> Web Service (carrier-bridge-2) -> Environment -> Add MONGODB_URI with your MongoDB Atlas connection string.');
      } else {
        console.warn('MongoDB URI is not configured or using default placeholder in .env');
      }
      isDbConnected = false;
      return false;
    }

    if (isProduction && (mongoURI.includes('127.0.0.1') || mongoURI.includes('localhost'))) {
      console.error('❌ PRODUCTION DEPLOYMENT ERROR: MONGODB_URI is set to localhost/127.0.0.1 in production environment!');
      console.error('👉 Fix: Replace MONGODB_URI in Render environment variables with your cloud MongoDB Atlas connection URI (mongodb+srv://...).');
      isDbConnected = false;
      return false;
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection warning: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Failed to connect to MongoDB Atlas cluster on Render. Please verify network access (0.0.0.0/0 whitelist in MongoDB Atlas) and database user credentials.');
    } else {
      console.warn('Backend active with In-Memory Storage Fallback for local development');
    }
    isDbConnected = false;
    return false;
  }
};

const isConnected = () => isDbConnected && mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isConnected = isConnected;
