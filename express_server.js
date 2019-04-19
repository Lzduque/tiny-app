// Whole-script strict mode syntax
'use strict';

const express         = require('express');
const cookieSession   = require('cookie-session');
const app             = express();
const PORT            = 8080; // default port 8080
const bodyParser      = require('body-parser'); // to make the post method work!
const bcrypt          = require('bcrypt'); // to encrypt code

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['You should be fine'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//setting the variables like user_id to be a cookie so all views can acess it
app.use(function(req, res, next) {
  console.log('Cookies: ', req.session);
  console.log('Signed: ', req.signedCookies);
  next();
});

app.set('view engine', 'ejs');


//////////////////////////DataBases//////////////////////////


// global varaibles
const urlDB = {};

const userDB = {};


//////////////////////////GLOBAL FUNCTIONS//////////////////////////


function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function findUser(email) {
  let result;
  for (let user in userDB) {
    if (userDB[user].email === email) {
      result = user;
    }
  }
  return result;
}

function findEmail(userId) {
  let result;
  for (let user in userDB) {
    if (userDB[user].id === userId) {
      result = userDB[user].email;
    }
  }
  return result;
}

function findShortUrl(id) {
  let result;
  for (let url in urlDB) {
    if (urlDB[url].userID === id) {
      result = url;
    }
  }
  return result;
}

function urlsForUser(DataBase,userId) {
  const urlsOfUser = {};
  for (let shortUrl in DataBase) {
    if (urlDB[shortUrl].userID === userId) {
      urlsOfUser[shortUrl] = urlDB[shortUrl];
    }
  }
  return urlsOfUser;
}

function hasher(password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
}


//////////////////////////ROUTER//////////////////////////


// requests
app.get('/', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


// generating main page urls
app.get('/urls', (req, res, next) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send('You are not logged in!');
  }

  const shortURL = findShortUrl(req.session.user_id);
  const templateVars = {  'urls': urlsForUser(urlDB,userId),
                          'user_id': userId,
                          'user_email': findEmail(userId),
                        };

  res.render('urls_index', templateVars);
});


//posting the form and redirecting to new url
app.post('/urls', (req, res) => {
  const newTinyUrl = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

  let longUrl;

  if (req.body.longURL.startsWith("http://")) {
    longUrl = req.body.longURL;
  } else {
    longUrl = 'http://' + req.body.longURL;
  }

  urlDB[newTinyUrl] = { 'longURL': longUrl,
                        'userID': req.session.user_id};

  res.redirect(`/urls/${newTinyUrl}`);
});


// create a new tiny url!
app.get('/urls/new', (req, res) => {
  const templateVars = { 'user_id': req.session.user_id,
                         'user_email': findEmail(req.session.user_id),
                       };

  if (req.session.user_id) {
    return res.render('urls_new', templateVars);
  }

  res.redirect('/login');
});


//showing the page short url
app.get('/urls/:shortURL', (req, res, next) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!urlDB[shortURL]) {
    return res.status(400).send('TinyUrl does not exist!');
  }

  if (!user_id) {
    return res.status(401).send('User is not loggedin!');
  }

  if (user_id !== urlDB[shortURL].userID) {
    return res.status(401).send('TinyUrl does not belong to you!');
  }

  const templateVars = {  shortURL: req.params.shortURL,
                          longURL: urlDB[shortURL].longURL,
                          'user_id': user_id,
                          'user_email': findEmail(user_id)
                        };
  res.render('urls_show', templateVars);
});


//redirecting short urls
app.get('/u/:shortURL', (req, res) => {
  console.log(urlDB);
  if (!urlDB.hasOwnProperty(req.params.shortURL)) {
    return res.status(400).send('TinyUrl does not exist!');
  }

  const longUrl = urlDB[req.params.shortURL].longURL;
  res.redirect(longUrl);
});


//delete TinyUrl and redirecting to new index page
app.post('/urls/:shortURL/delete', (req, res) => {
  const newTinyUrl = req.params.shortURL;
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send('User is not loggedin!');
  }

  if (userId !== urlDB[newTinyUrl].userID) {
    return res.status(401).send('TinyUrl does not belong to you!');
  }

  delete urlDB[newTinyUrl];
  res.redirect('/urls');
});


//update longURL and redirecting to new index page
app.post('/urls/:shortURL', (req, res) => {
  const tinyUrl = req.params.shortURL;
  const newlongURL = req.body.newURL;
  const userId = req.session.user_id;

  if (!userId || userId !== urlDB[tinyUrl].userID) {
    res.status(401).send('Unauthorized');
  } else {
    urlDB[tinyUrl].longURL = newlongURL;
    res.redirect('/urls');
  }
});


//log in
app.get('/login', (req, res, next) => {
  if (!req.session.user_id) {
    return res.render('urls_login');
  } else {
    res.redirect('/urls');
  }
});


//log in and send the form
app.post('/login', (req, res, next) => {

  const userId = findUser(req.body.user_email);

  if (userId && bcrypt.compareSync(req.body.password, userDB[userId].password)) {
    req.session.user_id = userId;
    res.redirect('/urls');
  } else {
    res.status(403).send('The email address or password you entered is not valid.');
  }
});


//log out
app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls');
});


//register page!
app.get('/register', (req, res) => {
  if (!req.session.user_id) {
    res.render('urls_register');
  } else {
    res.redirect('/urls');
  }
});


//registering!
app.post('/register', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const idNum = (randomString(6, '0123456789').toString());
  const userId = {'id': idNum, 'email': email, 'password': hasher(password)};

  if (!email || !password) {
    return res.status(400).send('missing id or password');
  }

  if (findUser(email)) {
    return res.status(400).send('Already registered');
  }

  userDB.idNum = userId;
  req.session.user_id = userDB.idNum.id;
  res.redirect('/urls');
});

// just listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
