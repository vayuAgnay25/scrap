const mongoose = require("mongoose");
require('dotenv').config();
// Use an environment variable or default to a local MongoDB instance
console.log("mongodb+srv://vayuAgnay25:RWc8TnHhrQD6kGrM@vayuagnay25.38jc4kh.mongodb.net/?retryWrites=true&w=majority&appName=vayuAgnay25");

// Establish the connection  
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Failed to connect to the database: " + err.message);
    // Optional: Exit the process if the database connection fails
    // process.exit(1); 
  });

// Export the mongoose connection object if needed elsewhere
module.exports = mongoose;