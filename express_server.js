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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
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

const urlsForUser = function(urls, userID) {
  let userURLs = {};
  for (let url in urls) {
    if (urls[url].userID === userID) {
      userURLs[url] = { longURL: urls[url].longURL, userID };
    }
  }
  return userURLs;
};

const getVars = (req) => {
  // user appears in almost every GET route
  const user = users[req.cookies["user_id"]];
  if (user) {
    vars = {
      user,
      urls: urlsForUser(urlDatabase, user.id)
    };
    return vars;
  } else {
    return {
      user: undefined,
      urls: []
    };
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

const checkOwnership = function(target, user) {
  // console.log(target);
  if (target['userID'] === user['id']) {
    return true;
  }
  return false;
}

/* *** ROUTES ******************************************** */

app.get("/", (req, res) => {
  res.redirect("/urls");
});



app.get("/urls", (req, res) => {
  const templateVars = getVars(req);
  res.render('urls_index', templateVars);
});



app.post("/urls/new", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  const userID = req.cookies['user_id'];
  urlDatabase[shortURL] = { longURL, userID };
  console.log('------------------\n', urlDatabase, '\n---------------');
  res.redirect(`/urls/${shortURL}`);
});



// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = getVars(req);
  if (!templateVars.user) {
    console.log('You must be logged in to create a new URL');
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});



// dynamic routing, use ":"
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const target = urlDatabase[req.params.shortURL];
  if (!user || !target || !checkOwnership(target, user)) {
    console.log("You do not have the permission to edit a URL that belongs to someone else");
    return res.redirect('/urls');
  }
  const templateVars = getVars(req);
  templateVars['target'] = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
  res.render("urls_show", templateVars);
});



app.get("/u/:shortURL", (req, res) => {
  const target = urlDatabase[req.params.shortURL];
  if (target === undefined) {
    return res.redirect('/urls');
  }
  res.redirect(target.longURL);
});



app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const target = urlDatabase[req.params.shortURL];
  if (!user || !target || !checkOwnership(target, user)) {
    console.log("You do not have the permission to delete a URL that belongs to someone else");
    return res.redirect('/urls');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});




app.post('/urls/:shortURL/update', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const target = urlDatabase[req.params.shortURL];
  if (target === undefined) {
    console.log('Could not find this link.')
    return res.redirect('/urls');
  } else if (target.userID !== user.id) {
    console.log('Only the owner of this link can update its contents');
    return res.redirect('/urls');
  }
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect('/urls');
});




app.get('/register', (req, res) => {
  const templateVars = getVars(req);
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
  const templateVars = getVars(req);
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