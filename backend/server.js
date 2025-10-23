const express = require('express');
const path = require('path');
const app = express();

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

app.use(express.static(path.join(__dirname,"../frontend")));

links.forEach((link)=>{
    app.get((link),(req,res)=>{
    res.sendFile(path.join(__dirname,`../frontend/index.html`));
})
})

module.exports = app;
