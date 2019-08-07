//This file contains helper functions used by express_server.js

//Returns the user object if a user with that email exists
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

//Returns a random 6 character alphanumeric string
const generateRandomString = function() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "1234567890";
  let str = "";
  for (let i = 1; i <= 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
    // str += chars[Math.round((Math.random() * 10000000) % chars.length)];
  }
  return str;
};

//Filters the urlDatabase object and returns only the entries for the specified userID
const urlsForUser = function(userID, database) {
  let filtered = {};
  for (const url in database) {
    if (database[url].userID === userID) {
      filtered[url] = database[url].longURL;
    }
  }
  return filtered;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };