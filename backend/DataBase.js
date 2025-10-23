const mongo = require("./db");

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
module.exports = User;
