// imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = function(stringLength) {
  const randomChars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let output = '';
  // generate random number between 1 to the length of randomChars
  for (let i = 0; i < stringLength; i++) {
    output += randomChars[Math.floor(Math.random() * randomChars.length)];
  }
  return output;
};

const checkUser = function(email) {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return false; // true -> email in use, false -> email not in use
};

/* *** ROUTES ******************************************** */

app.get("/", (req, res) => {
  res.redirect("/urls");
});



app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});



app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = longURL;
  // https://expressjs.com/en/guide/routing.html
  res.redirect(`/urls/${shortURL}`);
});



// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});



// dynamic routing, use ":"
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
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




app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render('urls_register', templateVars);
});




app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log('No email or password provided');
  } else if (checkUser(req.body.email)) {
    console.log('Email address already in use');
  } else {
    const newUserID = generateRandomString(6);
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', newUserID);
  }

  res.redirect('/urls');
});



app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render('urls_login', templateVars);
});



app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log("Can't let you in without the creds buddy.");
  } else {
    const targetUser = checkUser(req.body.email);
    if (!targetUser) {
      console.log(`Nobody with ${req.body.email} exists.`);
    } else if (targetUser.password === req.body.password) {
      res.cookie('user_id', targetUser.id);
    } else {
      console.log('Wrong password or some other error');
    }
  }
  res.redirect('/urls');
});



app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});