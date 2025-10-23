const mongoose = require("mongoose");

// 1. IMPORTANT: Use a global object to persist the connection across invocations
// The global scope persists in a 'warm' serverless function instance.
global.mongoose = global.mongoose || {};
const connection = global.mongoose;

// 2. The connection function (must be an async function)
async function dbConnect() {
  // Use the environment variable, which Vercel will provide
  const dbURI = process.env.MONGO_DB_URL; 
  
  if (!dbURI) {
    throw new Error('MONGO_DB_URL environment variable is not defined.');
  }

  // A. Check if the connection is already active and return early
  if (connection.isConnected) {
    console.log('Using existing database connection.');
    return;
  }

  // B. Establish the new connection
  try {
    const db = await mongoose.connect(dbURI, {
      // These options are often recommended for Mongoose/Atlas:
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // You can also add options like serverSelectionTimeoutMS: 5000 
      // to quickly fail if the server is unreachable
    });

    // C. Cache the connection status
    connection.isConnected = db.connections[0].readyState;
    console.log("Database connected successfully: New connection established.");
    
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    throw new Error("Failed to connect to the database.");
  }
}

// 3. Export the connection function instead of the mongoose object
module.exports = dbConnect;