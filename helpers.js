//This file contains helper functions used by express_server.js

//Returns the user object if a user with that email exists
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
  return undefined;
};

//Returns a random 6 character alphanumeric string, that does not already exist for the given database
const generateRandomString = function(database) {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "1234567890";
  let str = "";
  for (let i = 1; i <= 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (database[str]) {
    str = generateRandomString(database);
  }
  return str;
};

//Filters the urlDatabase object and returns only the entries for the specified userID
const urlsForUser = function(userID, database) {
  let filtered = {};
  for (const url in database) {
    if (database[url].userID === userID) {
      filtered[url] = {
        longURL: database[url].longURL,
        userID: database[url].userID,
        created: database[url].created,
        totalVisits: database[url].totalVisits,
        uniqueVisits: database[url].uniqueVisits,
        visits: database[url].visits
      }
    }
  }
  return filtered;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };