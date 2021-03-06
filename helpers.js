// finds all the URLs created by the user
const urlsForUser = function(database, userID) {
  let userURLs = {};
  for (let url in database) {
    if (database[url].userID === userID) {
      userURLs[url] = { longURL: database[url].longURL, userID };
    }
  }
  return userURLs;
};



// create variables that are frequently passed into templates
const getVars = (req, urlDatabase, usersDatabase) => {
  // user appears in almost every GET route
  const user = usersDatabase[req.session.userID];
  if (user) {
    const vars = {
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



// generate a random alphanumeric string
const generateRandomString = function(stringLength) {
  const randomChars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let output = '';
  // generate random number between 1 to the length of randomChars
  for (let i = 0; i < stringLength; i++) {
    output += randomChars[Math.floor(Math.random() * randomChars.length)];
  }
  return output;
};



// return a user object given an email address
const getUserByEmail = function(email, database) {
  for (let userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return false; // true -> email in use, false -> email not in use
};



// check to see if the link being modified belongs to the user who is trying to modify it
const checkOwnership = function(target, user) {
  let messageTitle;
  let message;
  let statusCode;
  if (!user) {
    messageTitle = 'Login Required';
    message = 'Sorry but you have to be <a href="/login">logged in</a> to work on saved links.';
    statusCode = 401;
  } else if (!target) {
    messageTitle = 'Short Link Not Found';
    message = 'The short link you requested could not be found.';
    statusCode = 404;
  } else if (target.userID !== user.id) {
    messageTitle = 'Unauthorized';
    message = 'Sorry but you cannot make changes to a link that does not belong to you.';
    statusCode = 401;
  } else {
    return false;
  }
  return {
    title: messageTitle,
    content: message,
    statusCode,
  };
};

module.exports = {
  urlsForUser,
  getVars,
  generateRandomString,
  getUserByEmail,
  checkOwnership
};