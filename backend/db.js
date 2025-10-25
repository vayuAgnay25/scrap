const mongo = require("mongoose");
require('dotenv').config();

const DB_url = process.env.MONGO_DB_URL;
let isConnected = false;
console.log("");

/**
 * Establishes connection to MongoDB or reuses existing one.
 * It's crucial this function is awaited by the caller.
 */
async function establishConnection() { // ⬅️ FIXED: Must be an async function to use await
    if (!isConnected && DB_url) {
        try {
            // Apply critical serverless optimizations here
            await mongo.connect(DB_url, {
                maxPoolSize: 1,       // Crucial for serverless connection reuse
                bufferCommands: false, // Prevents buffering if connection is down
                serverSelectionTimeoutMS: 5000,
            });

            console.log("Database connected successfully");
            // Check the actual readyState (1 is 'connected') for robust caching
            isConnected = mongo.connection.readyState === 1; 

        } catch (err) {
            console.error("Failed to connect to the database: " + err.message);
            // In a real application, you might want to throw the error
            throw err;
        }
    } else if (isConnected) {
        console.log("Database connection already established (reusing).");
    } else if (!DB_url) {
        console.error("DB_url is missing. Cannot establish connection.");
        throw new Error("MONGO_DB_URL not set.");
    }
}
establishConnection();

const schema = new mongo.Schema({
  Name: {
    type: String,
    required: true,
    unique: true, // keep this
  },
  password: String,
  Email: String,
  ProfilePicture: String,
  DairyPages: [
    {
      Date: String,
      Title: { type: String, required: true }, // removed unique
      Content: { type: String, required: true }, // removed unique
    },
  ],

  SavedPasswords: [
    {
      Website: String,
      UserName: { type: String, required: true }, // removed unique
      Password: { type: String, required: true }, // removed unique
    },
  ],

  SavedContacts: [
    {
      Name: String,
      Phone: { type: String, required: true }, // removed unique
      Email: { type: String, required: true }, // removed unique
    },
  ],
});

const User = mongo.model("User", schema);

// Export the mongoose object and the async connection function
module.exports = User;