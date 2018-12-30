const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
  text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// 
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
  });

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, 
                       user: users[req.cookies.user_id]
                      };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = { user: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  });

app.get("/urls/:id", (req, res) => {
    let templateVars = { shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id],
                        user: users[req.cookies.user_id] 
                       };
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/urls", (req, res) => {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    console.log(urlDatabase);
    res.redirect("/urls/" + shortURL);
});

app.post("/urls/:id", (req, res) => {
  let longURL = req.body.longURLUpdate;
  urlDatabase[req.params.id] = "http://" + longURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {

let err = "";

for (let user in users) {
  if (users[user].email === req.body.email){
    let currentUser = users[user];
    if (currentUser.password !== req.body.password) {
      res.send("Wrong password");
      return;
    } else if (currentUser.password === req.body.password) {
      res.cookie("user_id", currentUser.id);
      res.redirect("/urls");
      return;
    }
  } else {
    err = "Please enter correct email";
    }
  }
  res.send(err);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let newUserID = generateRandomString();
  let newUserEmail = req.body.email;
  let newUserPassword = req.body.password;

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
    password: newUserPassword
  }

  users[newUserID] = newUser;

  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});