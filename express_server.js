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
  // console.log('Request: ', req.url);
  // console.log('Headers: ', req.headers);
  console.log('Cookies: ', req.session);
  console.log('Signed: ', req.signedCookies);
  next();
});

app.set('view engine', 'ejs'); //



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



// global functions
function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
  // const result = Math.random().toString().substr(length,length); // creates a random number of 6
}

// search for a id/email inside DataBase - result is going to be undefined if does not find what it is looking for!
function tracker(newElem) {
  let result = undefined;
  for (let user in userDB) {
    if (userDB[user].email === newElem) {
      result = user;
      console.log('user analized: ',user);
    }
    console.log('result is tracker: ', result);
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
  console.log('result findShortUrl: ',result);
}

function urlsForUser(DataBase,userId) {
  const urlsOfUser = {};
  for (let shortUrl in DataBase) {
    if (urlDB[shortUrl].userID === userId) {
      urlsOfUser[shortUrl] = urlDB[shortUrl];
    }
  }
  console.log('obj with the users',urlsOfUser);
  return urlsOfUser;
}

function hasher(password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
};




// requests
app.get('/', (req, res) => {
  const userId = req.session.user_id;
  const userEmail = req.session.user_email;
  console.log('userId: ', userId);
  console.log('type of userId: ', typeof(userId));
  if (typeof(userId) === 'undefined') {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


// render JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDB);
});


// generating main page urls
app.get('/urls', (req, res, next) => {
  const userId = req.session.user_id;
  const userEmail = req.session.user_email;
  console.log('userId: ', userId);
  console.log('type of userId: ', typeof(userId));
  if (typeof(userId) === 'undefined') {
    // res.redirect('/login');
    const error = new Error('You are not connected! Go to login first!');
    error.httpStatusCode = 401;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else {
    const shortURL = findShortUrl(req.session.user_id);
    console.log('shorturl of the user',shortURL);
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
    const error = new Error('TinyUrl does not exist!');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else if (user_id === urlDB[shortURL].userID) {
    // if the user is logged in and the url belongs to it
    const templateVars = { shortURL: req.params.shortURL, //then req.params.shortURL === b2xVn2
                          longURL: urlDB[shortURL].longURL,
                          'user_id': user_id,
                          'user_email': user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
                        };
    res.render('urls_show', templateVars);
  } else if (!user_id) { // if user is not loggedin
    const error = new Error('User is not loggedin!');
    error.httpStatusCode = 401;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
    } else {    // if that tiny url exist in the database, but does not belong to the user
    const error = new Error('TinyUrl does not belong to you!');
    error.httpStatusCode = 401;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  }
});

//redirecting short urls
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longUrl = urlDB[shortURL].longURL;
  if (shortURL === 'undefined') {
    const error = new Error('Page does not exist!');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
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
app.post('/urls/:shortURL/edit', (req, res) => {
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
  const userEmail = req.body.user_email;
  const password = req.body.password;
  const userId = tracker(userEmail,'email');
  const hashedPassword = userDB[userId]['password'];

  if (tracker(userEmail,'email') === undefined) {
    const error = new Error('id does not exist!');
    error.httpStatusCode = 403;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else if (bcrypt.compareSync(password, hashedPassword)) {
    console.log('Cookies :  ', req.session);
    req.session.user_id = userId;
    req.session.user_email = userEmail;
    res.redirect('/urls');
  } else {
    const error = new Error('password does not match!');
    error.httpStatusCode = 403;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  }
  req.session.user_id = userId;
  req.session.user_email = userDB.idNum.email;
  res.redirect('/urls');
});

//log out
app.post('/logout', (req, res) => {
  req.session = null
  console.log('Cookies :  ', req.session);
  res.redirect('/urls');
});

//register page!
app.get('/register', (req, res) => {
  const templateVars = { user_id: req.session.user_id,
    user_email: req.session.user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
 };
  res.render('urls_register', templateVars);
});

//registering!
app.post('/register', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = hasher(password);
  const idNum = (randomString(6, '0123456789').toString());
  const userId = {'id': idNum, 'email': email, 'password': hashedPassword};

  if (!email) {
    const error = new Error('missing id');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else if (!password) {
    const error = new Error('missing id');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else if (tracker(email,'email') !== undefined) {
    let error = new Error('Email already registered!');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  } else {

  userDB.idNum = userId;
  // cookieParser.JSONCookie(id);
  console.log('Cookies after creating cookie id: ', req.session);

  req.session.user_id = userDB.idNum.id;
  req.session.user_email = userDB.idNum.email;
  res.redirect('/urls');
}
});

// just listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
