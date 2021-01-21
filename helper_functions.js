const urlsForUser = function(database, userID) {
  let userURLs = {};
  for (let url in database) {
    if (database[url].userID === userID) {
      userURLs[url] = { longURL: database[url].longURL, userID };
    }
  }
  return userURLs;
};

const getVars = (req, urlDatabase, usersDatabase) => {
  // user appears in almost every GET route
  const user = usersDatabase[req.session.user_id];
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

const checkUser = function(email, database) {
  for (let userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return false; // true -> email in use, false -> email not in use
};

const checkOwnership = function(target, user) {
  if (target['userID'] === user['id']) {
    return true;
  }
  return false;
}

module.exports = {
  urlsForUser,
  getVars,
  generateRandomString,
  checkUser,
  checkOwnership
}