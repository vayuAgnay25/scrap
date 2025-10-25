const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const User = require("./db");
const bcrypt = require("bcrypt");
const cryptoJS = require("crypto-js");
const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname,"../frontend")));

const links = [
  "/",
  "/dashboard",
  "/entries",
  "/gallery",
  "/contacts",
  "/passwords",
  "/login",
  "/home",
  "/signup",
];

links.forEach((link)=>{
    server.get((link),(req,res)=>{
    res.sendFile(path.join(__dirname,`../frontend/index.html`));
})
})


function encryption(input) {
  return cryptoJS.AES.encrypt(input, SECRET).toString();
}
function decryption(input) {
  return cryptoJS.AES.decrypt(input, SECRET).toString(cryptoJS.enc.Utf8);
}

// handeling user requests

server.post("/keyPass", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ status: "error", error: "Invalid Credentials" });
    } else {
      const user = await User.findOne({ Name: username }).lean();
      if (!user)
        return res.json({
          status: "failed",
          message: "user doesn't exist",
          messageColor: "red",
        });
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return res.json({
          status: "OK",
          message: " login successfull",
          messageColor: "green",
        });
      } else {
        return res.json({
          status: "failed",
          message: "Invalid Credentials",
          messageColor: "red",
        });
      }
    }
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to Login",
      messageColor: "red",
    });
  }
});

server.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword, email } = req.body;

    if (!username || !password || !confirmPassword || !email) {
      return res.json({
        status: "failed",
        message: "All fields are required",
        messageColor: "red",
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        status: "failed",
        message: "Passwords do not match",
        messageColor: "red",
      });
    }

    if(!(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password))){
      return res.json({
        status: "failed",
        message: "Passwords is weak",
        messageColor: "red",
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ Name: username });
    if (existingUser) {
      return res.json({
        status: "failed",
        message: "User already exists",
        messageColor: "red",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      Name: username,
      password: hashedPassword,
      Email: email,
      ProfilePicture: "default"
    });

    await newUser.save();

    return res.json({
      status: "ok",
      message: "User registered successfully",
      messageColor: "green",
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res.json({
      status: "failed",
      message: "Something went wrong",
      messageColor: "red",
    });
  }
});

server.post("/dashData", async (req, res) => {
  console.clear();
  const fetchedData = await User.findOne({ Name: req.body.name }).lean();

  fetchedData.DairyPages.forEach((elem) => {
    elem.Title = decryption(elem.Title);
    elem.Content = decryption(elem.Content);
  });
  fetchedData.SavedPasswords.forEach((elem) => {
    elem.Password = decryption(elem.Password);
  });
  fetchedData.SavedContacts.forEach((elem) => {
    elem.Phone = decryption(elem.Phone);
    elem.Email = decryption(elem.Email);
  });

  if (!fetchedData) {
    return res.json({
      status: "failed",
      message: "User not found",
      messageColor: "red",
    });
  }

  return res.json({
    status: "ok",
    message: "Data fetched successfully",
    messageColor: "green",
    user: fetchedData,
  });
});

server.post("/uploadData", async (req, res) => {
  console.clear();
  console.log(req.body);
  var flag = {
    acknowledged: false,
    _id: "",
  };

  switch (req.body.type.toLowerCase()) {
    case "profilepicture":
      const profileResponse = await User.updateOne(
        {Name: req.body.name},
        {
          $set: {
            ProfilePicture: req.body.DP
          }
        }
      )

      flag._id = null;
      flag.acknowledged = profileResponse.acknowledged;
      break;

    case "password":
      const EncryptedPassword = encryption(req.body.Password);

      const PasswordResponse = await User.updateOne(
        {
          Name: req.body.name,
        },
        {
          $push: {
            SavedPasswords: {
              Website: req.body.Website,
              UserName: req.body.UserName,
              Password: EncryptedPassword,
            },
          },
        }
      );

      const retrievePassword = await User.findOne({
        Name: req.body.name,
      }).lean();

      retrievePassword.SavedPasswords.forEach((elem) => {
        if ((elem.Password = EncryptedPassword)) {
          flag._id = elem._id;
        }
      });

      flag.acknowledged = PasswordResponse.acknowledged;
      break;

    case "journal":
      const encryptedData = encryption(req.body.title);
      const JournalResponse = await User.updateOne(
        {
          Name: req.body.name,
        },
        {
          $push: {
            DairyPages: {
              Date: req.body.date,
              Title: encryptedData,
              Content: encryption(req.body.content),
            },
          },
        }
      );

      const retrieveJournal = await User.findOne({
        Name: req.body.name,
      }).lean();

      retrieveJournal.DairyPages.forEach((elem) => {
        if ((elem.Title = encryptedData)) {
          flag._id = elem._id;
        }
      });

      flag.acknowledged = JournalResponse.acknowledged;
      break;

    case "contact":
      EncryptedEmail = encryption(req.body.Email);
      EncryptedPhone = encryption(req.body.Phone);
      const ContactResponse = await User.updateOne(
        { Name: req.body.name },
        {
          $push: {
            SavedContacts: {
              Name: req.body.Name,
              Phone: EncryptedPhone,
              Email: EncryptedEmail,
            },
          },
        }
      );

      const retrieveContact = await User.findOne({
        Name: req.body.name,
      }).lean();

      retrieveContact.SavedContacts.forEach((elem) => {
        if (elem.Email === EncryptedEmail && elem.Phone == EncryptedPhone) {
          flag._id = elem._id;
        }
      });

      flag.acknowledged = ContactResponse.acknowledged;
      break;
  }

  if (flag.acknowledged) {
    return res.json({
      message: "Succesfully uploaded Data",
      messageColor: "green",
      status: "ok",
      returnData: flag,
    });
  } else {
    return res.json({
      message: "Data Upload Successful",
      messageColor: "red",
      status: "failed",
    });
  }
});

server.post("/deleteData", async (req, res) => {
  console.clear();
  console.log(req.body);
  var deleteFlag = false;

  switch (req.body.type.toLowerCase()) {
    case "password":
      const PasswordDelete = await User.updateOne(
        { Name: req.body.name },
        {
          $pull: {
            SavedPasswords: {
              _id: req.body.remove._id,
            },
          },
        }
      );
      deleteFlag = PasswordDelete.acknowledged;
      console.log(PasswordDelete);
      break;
    
    case "journal":
      const JournalDelete = await User.updateOne(
        { Name: req.body.name },
        {
          $pull: {
            DairyPages: {
              _id: req.body.remove._id,
            },
          },
        }
      );
      deleteFlag = JournalDelete.acknowledged;
      console.log(JournalDelete);
      break;

    case "contact":
      const ContactDelete = await User.updateOne(
        {
          Name: req.body.name,
        },
        {
          $pull: {
            SavedContacts: {
              _id: req.body.remove._id,
            },
          },
        }
      );

      deleteFlag = ContactDelete.acknowledged;
      break;
  }

  if (deleteFlag) {
    return res.json({
      message: "Succesfully Deleted Data",
      messageColor: "green",
      status: "ok",
    });
  } else {
    return res.json({
      message: "Data Deletion Unsuccessful",
      messageColor: "red",
      status: "failed",
    });
  }
});

server.post("/editData", async (req, res) => {
  console.log(req.body);
  const modificationFlag = {
    acknowledged: false,
    fetchData: {},
  };

  switch (req.body.type.toLowerCase()) {
    case "contact":
      const newEncryptedPhone = encryption(req.body.Phone);
      const ContactModification = await User.updateOne(
        {
          Name: req.body.name,
          "SavedContacts._id": req.body.id,
        },
        {
          $set: {
            "SavedContacts.$.Phone": newEncryptedPhone,
          },
        }
      );

      modificationFlag.acknowledged = ContactModification.acknowledged;
      break;
  }

  const retrieveContact = await User.findOne({
    Name: req.body.name,
  }).lean();

  retrieveContact.DairyPages.forEach((elem) => {
    elem.Title = decryption(elem.Title);
    elem.Content = decryption(elem.Content);
  });
  retrieveContact.SavedPasswords.forEach((elem) => {
    elem.Password = decryption(elem.Password);
  });
  retrieveContact.SavedContacts.forEach((elem) => {
    elem.Phone = decryption(elem.Phone);
    elem.Email = decryption(elem.Email);
  });

  console.log(retrieveContact);

  if (modificationFlag.acknowledged) {
    return res.json({
      message: "Succesfully Modified Data",
      messageColor: "green",
      status: "ok",
      returnData: retrieveContact,
    });
  } else {
    return res.json({
      message: "Data Modification Unsuccessful",
      messageColor: "red",
      status: "failed",
    });
  }
});


module.exports = server;
