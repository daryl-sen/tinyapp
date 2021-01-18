// imports
const express = require("express");
const bodyParser = require("body-parser");

// configure app
const PORT = 8080;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(stringLength) {
  const randomChars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let output = '';

  // generate random number between 1 to the length of randomChars
  for (let i = 0; i < stringLength; i++) {
    output += randomChars[Math.floor(Math.random() * randomChars.length)];
  }

  return output;

}

/* *** ROUTES ******************************************** */

app.get("/", (req, res) => {
  res.send("Hello!");
});



app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});



app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  console.log(shortURL);
  urlDatabase[shortURL] = longURL;
  // https://expressjs.com/en/guide/routing.html
  res.redirect(`/urls/${shortURL}`);
});



app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});



// dynamic routing, use ":"
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});