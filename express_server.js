const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const moment = require('moment');
const { getUserByEmail, generateRandomString, urlsForUser, alreadyVisited } = require('./helpers');

//Set up express app and required middleware
const app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  secret: 'secret sauce',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

//Object containing short URL, long URL pairs
const urlDatabase = {
  //Empty at start of application
  /*
  Example object:
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    created: "Wednesday, August 7th 2019, 3:25:50 pm",
    totalVisits: 2,
    uniqueVisits: 1,
    visits: [
      {
        visitorId: "visitorRandomID",
        visitedTime: "Wednesday, August 7th 2019, 3:26:00 pm"
      },
      {
        visitorId: "visitorRandomID",
        visitedTime: "Wednesday, August 7th 2019, 3:27:00 pm"
      }
    ]
  }
  */
};

//Object containing user information for registered users
const users = {
  //Empty at start of application
  /*
  Example object:
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password1"
  }
  */
};

//Contains visitorIDs. This is stored in this object (instead of an array of visitorIDs) so that the generateRandomString function can reference this "database" and generate a unique visitorID.
let visitors = {
  //Empty at start of application
  /*
  Example key-value pair:
  "visitorRandomID" : "visitorRandomID"
  */
};

/****************************************GET METHODS****************************************/

//Redirects the user if they access the root resource based on their login status ("user_id" cookie present or not)
app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect(`/urls`);
  } else {
    res.redirect(`/login`);
  }
});

//Renders the registration page
app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect(`/urls`);
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("register", templateVars);
  }
});

//Renders the login page
app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect(`/urls`);
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

//Renders the homepage which displays the user's short urls, long urls and an edit and delete button for each
app.get("/urls", (req, res) => {
  if (!(users[req.session.user_id])) {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not logged in." });
  } else {
    const userUrls = urlsForUser(req.session.user_id, urlDatabase);
    let templateVars = { user: users[req.session.user_id], urls: userUrls };
    res.render("urls_index", templateVars);
  }
});

//Outputs the database object as a JSON object to the browser
app.get("/urls.json", (req, res) => {
  res.json(urlsForUser(req.session.user_id, urlDatabase));
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

//Renders a page with the information about the short URL if it exists and the option to edit the associated long URL.
//The page is only rendered if that short URL was created by the currently logged in user.
//If the user is not logged in or the short URL is not owned by the current user, display a 401 page
//If the short URL does not exist at all, display a 404 page
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, details: urlDatabase[req.params.shortURL] };
      res.render("urls_show", templateVars);
    } else if (!(req.session.user_id)) {
      res.statusCode = 401;
      res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not logged in." });
    } else {
      res.statusCode = 401;
      res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not the owner of this short URL." });
    }
  } else {
    res.statusCode = 404;
    res.render("error_page", { statusCode: 404, description:"Not found", message: "This TinyApp URL does not exist." });
  }
});

//Redirects to the long url associated with a short URL, if it exists. This route also takes care of counting of total visits and unique visits to this shortURL.
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    let visitorID;
    //If the user has a visitorID cookie and our database contains that same visitorID, continue. If not, then generate a new visitorID, set that as the visitorID cookie and add it to our visitorID database.
    if (req.cookies["visitorID"] && visitors[req.cookies["visitorID"]]) {
      visitorID = req.cookies["visitorID"];
    } else {
      visitorID = generateRandomString(visitors);
      visitors[visitorID] = visitorID;
      res.cookie('visitorID', visitorID);
    }

    //Increment the total visits and only increment the unique visits if this user has not visited the short URL before
    urlDatabase[req.params.shortURL].totalVisits++;
    if (!alreadyVisited(visitorID, req.params.shortURL, urlDatabase)) {
      urlDatabase[req.params.shortURL].uniqueVisits++;
    }

    //Add the visit information to the short url object
    urlDatabase[req.params.shortURL].visits.push({
      visitorId: visitorID,
      visitedTime: moment().subtract(4, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a")
    });

    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("error_page", { statusCode: 404, description:"Not found", message: "This TinyApp URL does not exist." });
  }
});

/****************************************POST METHODS****************************************/

//Logs a user in, sets their user_id cookie and refreshes the page
app.post("/login", (req, res) => {
  let user = users[getUserByEmail(req.body.email, users)];
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id =  user.id;
    res.redirect(`/urls`);
  } else {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "These credentials do not match anything on file." });
  }
});

//Logs a user out, deletes their user_id cookie and refreshes the page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/`);
});

//Adds a new user to the list of users with the information they inputted on the register page. If the user already exists send a 401 status with a message. This also checks if the email or password fields were inputted blank, but that should never be the case as the input fields are defined as required.
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.statusCode = 400;
    res.render("error_page", { statusCode: 400, description:"Bad Request", message: "Required input fields missing." });
  } else if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 409;
    res.render("error_page", { statusCode: 409, description:"Conflict", message: "A user with this email already exists." });
  } else {
    const id = generateRandomString(users);
    const email = req.body.email;
    const password = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id, email, password };
    req.session.user_id = id;
    res.redirect(`/urls`);
  }
});

//Adds a new short URL and long URL pair to the url database
app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    let randomString = generateRandomString(urlDatabase);
    urlDatabase[randomString] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      created: moment().subtract(4, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a"),
      totalVisits: 0,
      uniqueVisits: 0,
      visits: []
    };
    res.redirect(`/urls/${randomString}`);
  } else {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not logged in." });
  }
});

/****************************************PUT METHODS****************************************/

//Edits the long url associated with a short url and then redirects to the homepage. This is dependent on the user being logged in and also being the owner of that short URL.
app.put("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] && (urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect(`/urls`);
  } else if (users[req.session.user_id] && !(urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not the owner of this short URL." });
  } else {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not logged in." });
  }
});

/****************************************DELETE METHODS****************************************/


//Deletes the short url specified in the URL parameters. This is dependent on the user being logged in and also being the owner of that short URL.
app.delete("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] && (urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  } else if (users[req.session.user_id] && !(urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not the owner of this short URL." });
  } else {
    res.statusCode = 401;
    res.render("error_page", { statusCode: 401, description:"Unauthorized", message: "You are not logged in." });
  }
});

//Express server begins to listen on the specified PORT
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});