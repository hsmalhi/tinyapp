const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

//Set up express app and required middleware
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: 'secret sauce',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

//Object containing short URL, long URL pairs
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

//Object containing user information for registered users
const users = {
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

/**************************************HELPER FUNCTIONS**************************************/

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

//Returns the user object if a user with that email exists
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
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

/****************************************GET METHODS****************************************/

//Redirects the user if they access the root resource based on their login status ("user_id" cookie present or not)
app.get("/", (req, res) => {
  //TO DO
  //If user is logged in, redirect to /urls
  //Else redirect to /login
  res.redirect(`/urls`);
});

//Renders the registration page
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

//Renders the login page
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

//Renders the homepage which displays the user's short urls, long urls and an edit and delete button for each
app.get("/urls", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  let templateVars = { user: users[req.session.user_id], urls: userUrls };
  res.render("urls_index", templateVars);
});

//Outputs the database object as a JSON object to the browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Renders the page for creating a new short URL
app.get("/urls/new", (req, res) => {
  if (!(users[req.session.user_id])) {
    res.redirect(`/login`);
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

//Renders a page with the information about the short URL if it exists and the option to edit the associated long URL. The page is only rendered if that short URL was created by the currently logged in user.
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
      res.render("urls_show", templateVars);
    } else {
      res.statusCode = 401;
      res.send("Unauthorized");
    }
  } else {
    res.statusCode = 404;
    res.render("404");
  }
});

//Redirects to the long url associated with a short URL, if it exists
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("404");
  }
});

/****************************************POST METHODS****************************************/

//Logs a user in, sets their user_id cookie and refreshes the page
app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id =  user.id;
    res.redirect(`/urls`);
  } else {
    res.statusCode = 403;
    res.send('Your email and password did not match anything in our records.');
  }
});

//Logs a user out, deletes their user_id cookie and refreshes the page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

//Adds a new user to the list of users with the information they inputted on the register page. If the user already exists, send a 400 status with a message. This also checks if the email or password fields were inputted blank, but that should never be the case as the input fields are defined as required.
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.statusCode = 400;
    res.send('Expected input fields were empty');
  } else if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.send('This email is already registered!');
  } else {
    const id = generateRandomString();
    const email = req.body.email;
    const password = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id, email, password };
    req.session.user_id =  id;
    res.redirect(`/urls`);
  }
});

//Adds a new short URL and long URL pair to the url database
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${randomString}`);
});

//Edits the long url associated with a short url and then redirects to the homepage
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect(`/urls`);
  } else {
    res.statusCode = 401;
    res.send("Unauthorized");
  }
});

//Deletes the short url specified in the URL parameters
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  } else {
    res.statusCode = 401;
    res.send("Unauthorized");
  }
});

//Express server begins to listen on the specified PORT
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});