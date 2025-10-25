const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false; 

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return;
  }
  
  const uri = process.env.MONGO_DB_URL;

  try {
    console.log('=> using new database connection');
    
    await mongoose.connect(uri, {
      maxPoolSize: 1
    });

    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; 
  }
};

module.exports = connectToDatabase;