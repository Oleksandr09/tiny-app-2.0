const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key 1', 'key2']
}));

app.use(express.static(__dirname + "/public"));

//storing passwords in the variables to encrypt them
const user1Password = "purple-monkey-dinosaur";
const user2Password = "dishwasher-funk";

//hardcoded database of urls
const urlDatabase = {
  "b2xVn2": { 
		userID: "userRandomID",
		longURL: "http://www.lighthouselabs.ca"
	},
  "9sm5xK": {
  	userID: "user2RandomID",
		longURL:"http://www.google.com"
	}
};

//hardcoded database of users
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync(user1Password, 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync(user2Password, 10)
  }
}

//helper function to generate random string
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// helper function to find particular url our of url database
function urlsForUser(id) {
  let tempObj = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      tempObj[url] = urlDatabase[url];
    }
  }
  return tempObj;
}


app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// loads page urls_index when we use path "/urls" in address line
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
  let urlsObj = urlsForUser(req.session.user_id);
  const templateVars = { urls: urlDatabase, 
                       user: users[req.session.user_id],
                       urlsObj: urlsObj
                      };
  res.render("urls_index", templateVars);
                    } else {
                      res.send(`<html><body><span>Please </span><a href="/login">Login</a><span> or </span><a href="/register">Register</body></html>`);
                    }
});

// renders page with address "/urls/new" where we have form for URL shortening
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login");
  }
});

// loads page urls_show when we pass the path with id ("/urls/:id")
app.get("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID){
    const templateVars = { shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id].longURL,
                        user: users[req.session.user_id] 
                       };
    res.render("urls_show", templateVars);
  } else if (!req.session.user_id) {
    res.send("You are not logged in");
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("You are not authorized to edit this URL");
  }
});

// redirects the user to the matching long URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//renders urls_register page with a register form
app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

//renders urls_register page with a login form
app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

//generates random short URL and puts the link from the user to the database
app.post("/urls", (req, res) => {
  if(req.session.user_id){
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    let userID = req.session.user_id;
    
    let newURL = {
      userID: userID,
      longURL: longURL
    }

    urlDatabase[shortURL] = newURL;
    res.redirect("/urls/" + shortURL);
  } else {
    res.send("Please log in to continue");
  }
});

// updates longURL in the database
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id){
    let longURL = req.body.longURLUpdate;
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.send("Please register or log in");
  }
});

// deletes URL with indicated id || updated || deletes the link if user is an owner of it
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.send("You are not authorized to delete this URL");
  }
});

//matches the information from the user with database and lets user to log in
app.post("/login", (req, res) => {
  let err = "";
  for (let user in users) {
    if (users[user].email === req.body.email){
      let currentUser = users[user];
      if (!bcrypt.compareSync(req.body.password, users[user].password)) {
        res.send("Wrong password");
        return;
      } else if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = currentUser.id;
        res.redirect("/urls");
        return;
      }
    } else {
      err = "Please enter correct email";
      }
    }
    res.send(err);
});

//logs out user from the session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//matches the information from the user with database and lets user to register
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);

  if (newUserEmail === "" || newUserPassword === "") {
    res.send("400 - Bad Request Error");
    return;
  } else {
    for (let user in users) {
      if (users[user].email === newUserEmail){
        res.send("This email already exists, please use another one");
        return;
      }
    }
  }

  let newUser = {
    id: newUserID,
    email: newUserEmail,
    password: hashedPassword
  }

  users[newUserID] = newUser;
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});