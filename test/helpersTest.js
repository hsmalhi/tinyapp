const { assert } = require('chai');

const { getUserByEmail, generateRandomString, urlsForUser, alreadyVisited } = require('../helpers.js');

//Object containing short URL, long URL pairs
const testURLs = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "userRandomID",
    created: "Wednesday, August 7th 2019, 3:25:50 pm",
    totalVisits: 2,
    uniqueVisits: 1,
    visits: [
      {
        visitor_id: "visitorRandomID",
        visitedTime: "Wednesday, August 7th 2019, 3:26:00 pm"
      },
      {
        visitor_id: "visitorRandomID",
        visitedTime: "Wednesday, August 7th 2019, 3:27:00 pm"
      }
    ]
  } 
};

//Object containing user information for registered users
const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password2"
  }
};

describe('generateRandomString', function() {
  it('should return a string that is 6 characters long given the testURLs database', function() {
    assert.strictEqual(6, generateRandomString(testURLs).length);
  });

  it('should return a string that is 6 characters long given the testUsers database', function() {
    assert.strictEqual(6, generateRandomString(testUsers).length);
  });
});

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });

  it('should return undefined for an invalid email', function() {
    const user = getUserByEmail("invalid@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe('urlsForUser', function() {
  it('should return correct urls for a given user', function() {
    const actualOutput = urlsForUser("userRandomID", testURLs);
    const expectedOutput = { 
      "b2xVn2": { 
        longURL: "http://www.lighthouselabs.ca", 
        userID: "userRandomID",
        created: "Wednesday, August 7th 2019, 3:25:50 pm",
        totalVisits: 2,
        uniqueVisits: 1,
        visits: [
          {
            visitor_id: "visitorRandomID",
            visitedTime: "Wednesday, August 7th 2019, 3:26:00 pm"
          },
          {
            visitor_id: "visitorRandomID",
            visitedTime: "Wednesday, August 7th 2019, 3:27:00 pm"
          }
        ]
      } 
    };
    assert.deepStrictEqual(actualOutput, expectedOutput);
  });

  it('should return an empty object for a user who has no urls', function() {
    const actualOutput = urlsForUser("invalidID", testURLs);
    const expectedOutput = {};
    assert.deepStrictEqual(actualOutput, expectedOutput);
  });
});

describe('alreadyVisited', function() {
  it('should return a true for a vistor who has visited the shortURL', function() {
    assert.equal(alreadyVisited("visitorRandomID", "b2xVn2", testURLs), true);
  });

  it('should return false for a vistor who has not visited the shortURL', function() {
    assert.equal(alreadyVisited("visitor2RandomID", "b2xVn2", testURLs), false);
  });
});