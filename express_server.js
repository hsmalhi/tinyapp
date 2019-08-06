const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

//Set up express app and required middleware
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

//Database containing short URL, long URL key value pairs.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Returns a random 6 character alphanumeric string
const generateRandomString = function() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "1234567890";
  let str = "";
  for (let i = 1; i <= 6; i++) {
    str += chars[Math.round((Math.random() * 1000000) % chars.length)];
  }
  return str;
}

/****************************************GET METHODS****************************************/

//Redirects the user if they access the root resource based on their login status ("username" cookie present or not)
app.get("/", (req, res) => {
  //TO DO
  //If user is logged in, redirect to /urls
  //Else redirect to /login
  res.redirect("/urls");
});

//Renders the registration page
app.get("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("register", templateVars);
});

//Renders the homepage which displays the user's short urls, long urls and an edit and delete button for each
app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Outputs the database object as a JSON object to the browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Renders the page for creating a new short URL
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

//Renders a page with the information about the short URL if it exists and the option to edit the associated long URL
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    res.statusCode = 404;
    res.render("404");
  }
});

//Redirects to the long url associated with a short URL, if it exists
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("404");
  }
});

/****************************************POST METHODS****************************************/

//Logs a user in, sets their username cookie and refreshes the page
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect(`back`);
});

//Logs a user out, deletes their username cookie and refreshes the page
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect(`back`);
});

//Adds a new short URL and long URL pair to the url database
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

//Edits the long url associated with a short url and then redirects to the homepage
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect(`/urls`);
});

//Deletes the short url specified in the URL parameters
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

//Express server begins to listen on the specified PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});