const express = require('express'); //
const cookieSession = require('cookie-session')
const app = express(); //
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser'); // to make the post method work!
const bcrypt = require('bcrypt'); // to encrypt code

app.use(bodyParser.urlencoded({extended: true})); //
// app.use(cookieParser('You should be fine')); // that should be before the other app.use call --> 'You should be fine': that is your signature for the signed cookies!
app.use(cookieSession({
  name: 'session',
  keys: ['You should be fine'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//setting the variables like user_id to be a cookie so all views can acess it
app.use(function(req, res, next) {
  console.log('Cookies: ', req.session);
  console.log('Signed: ', req.signedCookies);
  next();
});

app.set('view engine', 'ejs'); //


///////////////////DataBases///////////////////


// global varaibles
const urlDB = {
  'b6UJxQ': { longURL: 'https://www.tsn.ca', userID: 'userRandomID' },
  'rhUTuT': { longURL: 'https://www.hotmail.ca', userID: 'userRandomID' },
  'a5BoGr': { longURL: 'https://www.google.ca', userID: 'user2RandomID' },
  'i3erGr': { longURL: 'https://www.google.com', userID: 'user2RandomID' }
};

const userDB = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '$2b$10$I6TVOGpd/d9MSAHpCI5nRu3wgHC60czt895MCNC3x65KKXHFSTL5u' // purple-monkey-dinosaur
  },
 'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2b$10$l6sDxe8PbxLEz7j2b.I2YuY8nO6S1.g5dMDhnCyMwi/odCOP2T5LG' // dishwasher-funk
  }
};


///////////////////GLOBAL FUNCTIONS///////////////////


function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// search for a id/email inside DataBase - result is going to be undefined if does not find what it is looking for!
function tracker(newElem) {
  let result = undefined;
  for (let user in userDB) {
    if (userDB[user].email === newElem) {
      result = user;
    }
  }
  return result;
}

// search for a url with the email inside DataBase - result is going to be undefined if does not find what it is looking for!
function findShortUrl(id) {
  let result = undefined;
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
};


///////////////////ROUTER///////////////////


// requests
app.get('/', (req, res) => {
  const userId = req.session.user_id;
  const userEmail = req.session.user_email;
  if (typeof(userId) === 'undefined') {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


// // render JSON
// app.get('/urls.json', (req, res) => {
//   res.json(urlDB);
// });


// generating main page urls
app.get('/urls', (req, res, next) => {
  const userId = req.session.user_id;
  const userEmail = req.session.user_email;
  if (userId === undefined) {
    // res.redirect('/login');
    res.status(401).send('You are not logged in!');
  } else {
    const shortURL = findShortUrl(req.session.user_id);
    const templateVars = {
      'urls': urlsForUser(urlDB,userId),
      'user_id': userId,
      'user_email': userEmail,
    };
  res.render('urls_index', templateVars);
  }
});


//posting the form and redirecting to new url
app.post('/urls', (req, res) => {
  const newTinyUrl = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  urlDB[newTinyUrl] = { 'longURL': req.body.longURL, 'userID': req.session.user_id}; // creating a new key in urlData and storing the long url info
  res.redirect(`/urls/${newTinyUrl}`);
});


// create a new tiny url!
app.get('/urls/new', (req, res) => {
  const templateVars = { user_id: req.session.user_id,
                          user_email: req.session.user_email, // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
 };

  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});


//showing the page short url
app.get('/urls/:shortURL', (req, res, next) => {
  const user_id = req.session.user_id;
  const user_email = req.session.user_email;
  const shortURL = req.params.shortURL; // req.params. its a given property you can acess
  if (!urlDB[shortURL]) {
    // if that tiny url does not exist in the database
    res.status(400).send('TinyUrl does not exist!');
  } else if (user_id === urlDB[shortURL].userID) {
    // if the user is logged in and the url belongs to it
    const templateVars = { shortURL: req.params.shortURL, //then req.params.shortURL === b2xVn2
                          longURL: urlDB[shortURL].longURL,
                          'user_id': user_id,
                          'user_email': user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
                        };
    res.render('urls_show', templateVars);
  } else if (!user_id) { // if user is not loggedin
    res.status(401).send('User is not loggedin!');
  } else {    // if that tiny url exist in the database, but does not belong to the user
    res.status(401).send('TinyUrl does not belong to you!');
  }
});


//redirecting short urls
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longUrl = urlDB[shortURL].longURL;
  if (shortURL === 'undefined') {
    res.status(400).send('TinyUrl does not belong to you!');
  }
  res.redirect(longUrl);
});


//delete TinyUrl and redirecting to new index page
app.post('/urls/:shortURL/delete', (req, res) => {
  const newTinyUrl = req.params.shortURL;
  const userId = req.session.user_id;
  if (typeof(userId) === 'undefined') {
    res.redirect('/login');
  } else {
  delete urlDB[newTinyUrl]; // deleting a existing key in urlData
  res.redirect('/urls');
}
});

//update longURL and redirecting to new index page
app.post('/urls/:shortURL', (req, res) => {
  const tinyUrl = req.params.shortURL;
  const newlongURL = req.body.newURL;
  const userId = req.session.user_id;
  if (typeof(userId) === 'undefined') {
    res.redirect('/login');
  } else {
  urlDB[tinyUrl].longURL = newlongURL;
  res.redirect('/urls');
}
});

//log in
app.get('/login', (req, res, next) => {
  // res.cookie.user_id = ;
  // res.cookie.user_email =;
  res.render('urls_login');
});


//log in
app.post('/login', (req, res, next) => {
  if ((req.session.user_id) === undefined) {

    const userEmail = req.body.user_email;
    const password = req.body.password;
    const userId = tracker(userEmail);
    const hashedPassword = userDB[userId]['password'];

    if (tracker(userEmail) === undefined) {
      res.status(403).send('id does not exist!');
    } else if (bcrypt.compareSync(password, hashedPassword)) {
      req.session.user_id = userId;
      req.session.user_email = userEmail;
      res.redirect('/urls');
    } else {
      res.status(403).send('password does not match!');
    }
    req.session.user_id = userId;
    req.session.user_email = userDB.idNum.email;
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
  });


//log out
app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls');
});


//register page!
app.get('/register', (req, res) => {
  if ((req.session.user_id) === undefined) {
    res.render('urls_register');
  } else {
    res.redirect('/urls');
  }
});


//registering!
app.post('/register', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = hasher(password);
  const idNum = (randomString(6, '0123456789').toString());
  const userId = {'id': idNum, 'email': email, 'password': hashedPassword};

  if (!email) {
    res.status(400).send('missing id');
  } else if (!password) {
    res.status(400).send('missing password');
  } else if (tracker(email,'email') !== undefined) {
    res.status(400).send('Email already registered');
  } else {
    userDB.idNum = userId;
    req.session.user_id = userDB.idNum.id;
    req.session.user_email = userDB.idNum.email;
    res.redirect('/urls');
  }
});

// just listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
