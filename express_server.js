// imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

// configure app
const PORT = 8080;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});



// app.get("/checkcookie", (req, res) => {
//   const cookieMonster = req.cookies['username'];
//   res.send(`Here's your cookie name: ${cookieMonster}`);
// });



app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = longURL;
  // https://expressjs.com/en/guide/routing.html
  res.redirect(`/urls/${shortURL}`);
});



app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});



// dynamic routing, use ":"
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});



app.get("/u/:shortURL", (req, res) => {
  const target = urlDatabase[req.params.shortURL];
  if (target === undefined) {
    return res.redirect('/urls');
  }
  res.redirect(target);
});



app.post('/urls/:shortURL/delete', (req, res) => {
  const target = urlDatabase[req.params.shortURL];
  if (target === undefined) {
    return res.redirect('/urls');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});




app.post('/urls/:shortURL/update', (req, res) => {
  const target = urlDatabase[req.params.shortURL];
  if (target === undefined) {
    return res.redirect('/urls');
  }
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect('/urls');
});



app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username)
  res.redirect('/urls');
});




app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});