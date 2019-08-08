const { assert } = require('chai');

const { getUserByEmail, generateRandomString, urlsForUser } = require('../helpers.js');

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
        vistor_id: "visitorRandomID",
        vistedTime: "Wednesday, August 7th 2019, 3:26:00 pm"
      },
      {
        vistor_id: "visitorRandomID",
        vistedTime: "Wednesday, August 7th 2019, 3:27:00 pm"
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
            vistor_id: "visitorRandomID",
            vistedTime: "Wednesday, August 7th 2019, 3:26:00 pm"
          },
          {
            vistor_id: "visitorRandomID",
            vistedTime: "Wednesday, August 7th 2019, 3:27:00 pm"
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