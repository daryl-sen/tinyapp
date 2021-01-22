// imports
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getVars, generateRandomString, getUserByEmail, checkOwnership} = require('./helpers');
const methodOverride = require('method-override');

// configure app
const PORT = 8080;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['ddonajiogfadkjnla', 'jkdfsabjdfolafkldasg']
}));
app.use(methodOverride('_method'));



// pseudo databases
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
  const user = users[req.session.userID];
  if (!user) {
    return res.status(401).redirect('/login');
  }
  return res.redirect("/urls");
});



app.get("/urls", (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (!templateVars.user) {
    // pass an error message to display on the template
    templateVars['messageTitle'] = 'Login Required';
    templateVars['message'] = 'Sorry, you have to be <a href="/login">logged in</a> to view this page.';
    return res.status(401).render('urls_error', templateVars);
  }
  res.render('urls_index', templateVars);
});



// must be placed BEFORE the dynamic route with /urls/:shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (!templateVars.user) {
    return res.send(401).redirect('/login');
  }
  res.render("urls_new", templateVars);
});



app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.userID];
  const target = urlDatabase[req.params.shortURL];
  const templateVars = getVars(req, urlDatabase, users);

  // check and see if the target link belongs to the user
  const errorMessage = checkOwnership(target, user);
  if (errorMessage) {
    templateVars['messageTitle'] = errorMessage.title;
    templateVars['message'] = errorMessage.content;
    return res.status(errorMessage.statusCode).render('urls_error', templateVars);
  }

  templateVars['target'] = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
  res.render("urls_show", templateVars);
});



app.get("/u/:shortURL", (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  const target = urlDatabase[req.params.shortURL];
  if (!target) {
    templateVars['messageTitle'] = 'Short Link Not Found';
    templateVars['message'] = 'The short link you requested could not be found.';
    return res.status(404).render('urls_error', templateVars);
  }
  res.redirect(target.longURL);
});



app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.userID;
  const shortURL = generateRandomString(6);
  if (!userID) {
    let templateVars = {};
    templateVars['messageTitle'] = 'Login Required';
    templateVars['message'] = 'Sorry, you have to be <a href="/login">logged in</a> to create a new URL.';
    return res.status(401).render('urls_error', templateVars);
  }
  urlDatabase[shortURL] = { longURL, userID };
  res.status(201).redirect(`/urls/${shortURL}`);
});



app.patch('/urls/:shortURL', (req, res) => {
  const user = users[req.session.userID];
  const target = urlDatabase[req.params.shortURL];
  const templateVars = getVars(req, urlDatabase, users);
  
  const errorMessage = checkOwnership(target, user);
  if (errorMessage) {
    templateVars['messageTitle'] = errorMessage.title;
    templateVars['message'] = errorMessage.content;
    return res.status(errorMessage.statusCode).render('urls_error', templateVars);
  }

  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect('/urls');
});



app.delete('/urls/:shortURL', (req, res) => {
  const user = users[req.session.userID];
  const target = urlDatabase[req.params.shortURL];

  const errorMessage = checkOwnership(target, user);
  if (errorMessage) {
    let templateVars = {};
    templateVars['messageTitle'] = errorMessage.title;
    templateVars['message'] = errorMessage.content;
    return res.status(errorMessage.statusCode).render('urls_error', templateVars);
  }

  delete urlDatabase[req.params.shortURL];
  res.status(202).redirect('/urls');
});



app.get('/login', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (templateVars['user']) {
    return res.redirect('/urls');
  }
  res.render('urls_login', templateVars);
});



app.get('/register', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  res.status(201).render('urls_register', templateVars);
});



app.post('/login', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (!req.body.email || !req.body.password) {
    templateVars['messageTitle'] = 'Login Credentials Not Provided';
    templateVars['message'] = 'You did not provide any login credentials';
    return res.status(406).render('urls_error', templateVars);
  } else {
    const targetUser = getUserByEmail(req.body.email, users);
    if (!targetUser) {
      templateVars['messageTitle'] = 'Email Does Not Exist';
      templateVars['message'] = `The email address you provided (${req.body.email}) does not exist in our database.`;
      return res.status(403).render('urls_error', templateVars);
    } else if (bcrypt.compareSync(req.body.password, targetUser.password)) {
      req.session.userID = targetUser.id;
    } else {
      templateVars['messageTitle'] = 'Incorrect Password';
      templateVars['message'] = 'The password you provided is incorrect. Please <a href="/login">try again</a>.';
      return res.status(403).render('urls_error', templateVars);
    }
  }

  res.redirect('/urls');
});



app.post('/register', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  if (!req.body.email || !req.body.password) {
    templateVars['messageTitle'] = 'Incomplete Registration';
    templateVars['message'] = 'You did not provide an email address or password. We need this information to log you in. Please try <a href="/register">signing up again</a>.';
    return res.status(400).render('urls_error', templateVars);
  } else if (getUserByEmail(req.body.email, users)) {
    templateVars['messageTitle'] = 'Email Address In Use';
    templateVars['message'] = 'The email address you provided is already in use. Please try <a href="/login">logging in</a> or <a href="">sign up with a different email address</a>.';
    return res.status(400).render('urls_error', templateVars);
  } else {
    const newUserID = generateRandomString(6);
    const newUserPw = bcrypt.hashSync(req.body.password, 10);
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: newUserPw
    };
    req.session.userID = newUserID;
  }
  res.redirect('/urls');
});



app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});



// 'catch-all' link, used to handle 404s
app.get('*', (req, res) => {
  const templateVars = getVars(req, urlDatabase, users);
  templateVars['messageTitle'] = 'Page Not Found';
  templateVars['message'] = 'The page you requested could not be found, please check for any typos.';
  res.status(404).render('urls_error', templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});