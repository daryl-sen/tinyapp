// imports
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { urlsForUser, getVars, generateRandomString, checkUser, checkOwnership} = require('./helper_functions');


// configure app
const PORT = 8080;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['ddonajiogfadkjnla', 'jkdfsabjdfolafkldasg']
}));

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



/* *** ROUTES ******************************************** */

app.get("/", (req, res) => {
  res.redirect("/urls");
});



app.get("/urls", (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  res.render('urls_index', templateVars);
});



app.post("/urls/new", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  const userID = req.session.user_id;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});



// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (!templateVars.user) {
    console.log('You must be logged in to create a new URL');
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});



// dynamic routing, use ":"
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  const target = urlDatabase[req.params.shortURL];
  if (!user || !target || !checkOwnership(target, user)) {
    console.log("You do not have the permission to edit a URL that belongs to someone else");
    return res.redirect('/urls');
  }
  const templateVars = getVars(req, urlDatabase, users);
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
  const user = users[req.session.user_id];
  const target = urlDatabase[req.params.shortURL];
  if (!user || !target || !checkOwnership(target, user)) {
    console.log("You do not have the permission to delete a URL that belongs to someone else");
    return res.redirect('/urls');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});




app.post('/urls/:shortURL/update', (req, res) => {
  const user = users[req.session.user_id];
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
  const templateVars = getVars(req, urlDatabase, users);
  res.render('urls_register', templateVars);
});




app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log('No email or password provided');
  } else if (checkUser(req.body.email)) {
    console.log('Email address already in use');
  } else {
    const newUserID = generateRandomString(6);
    const newUserPw = bcrypt.hashSync(req.body.password, 10);
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: newUserPw
    };
    req.session.user_id = newUserID;
  }
  res.redirect('/urls');
});



app.get('/login', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  res.render('urls_login', templateVars);
});



app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log("Can't let you in without the creds buddy.");
  } else {
    const targetUser = checkUser(req.body.email);
    if (!targetUser) {
      console.log(`Nobody with ${req.body.email} exists.`);
    } else if (bcrypt.compareSync(req.body.password, targetUser.password)) {
      req.session.user_id = targetUser.id;
    } else {
      console.log('Wrong password or some other error');
    }
  }
  res.redirect('/urls');
});



app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});