const express = require('express'); //
const cookieParser = require('cookie-parser'); //
const app = express(); //
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser'); // to make the post method work!
const bcrypt = require('bcrypt'); // to encrypt code

app.use(bodyParser.urlencoded({extended: true})); //
app.use(cookieParser('You should be fine')); // that should be before the other app.use call --> 'You should be fine': that is your signature for the signed cookies!

//setting the username to be a cookie so all views can acess it
app.use(function(req, res, next) {
  // console.log('Request: ', req.url);
  // console.log('Headers: ', req.headers);
  console.log('Cookies: ', req.cookies);
  console.log('Signed: ', req.signedCookies);
  next();
});

app.set('view engine', 'ejs'); //



// global varaibles
const urlDB = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const userDB = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
 'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};



// global functions
function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
  // const result = Math.random().toString().substr(length,length); // creates a random number of 6
}

// email tracker - check if there is already an email registered!
function emailTracker(newEmail) {
  let result = false;
  for (let user in userDB) {
    if (userDB[user].email === newEmail) {
      result = true;
      console.log('user analized: ',user);
    }
    console.log('result is: ', result);
  }
  return result;
}



// requests
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDB);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDB,
    user_id: req.cookies.user_id,
    user_email: req.cookies.user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user_id: req.cookies.user_id,
    user_email: req.cookies.user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
 };
  res.render('urls_new', templateVars);
});

//posting the form and redirecting to new url
app.post('/urls', (req, res) => {
  const newTinyUrl = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  urlDB[newTinyUrl] = req.body.longURL; // creating a new key in urlData and storing the long url info
  res.redirect(`/urls/${newTinyUrl}`);
});

//showing the page short url
app.get('/urls/:shortURL', (req, res) => { // if :shortURL === :b2xVn2
  //ned to do something about short urls that are called but dont exist!
  const shortURL = req.params.shortURL; // req.params. its a given property you can acess
  const templateVars = { shortURL: req.params.shortURL, //then req.params.shortURL === b2xVn2
                        longURL: urlDB[shortURL],
                        user_id: req.cookies.user_id,
                        user_email: req.cookies.user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
                      };
  res.render('urls_show', templateVars);
});

//redirecting short urls
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = `/urls/${shortURL}`;
  res.redirect(longURL);
});

//delete TinyUrl and redirecting to new index page
app.post('/urls/:shortURL/delete', (req, res) => {
  const newTinyUrl = req.params.shortURL;
  delete urlDB[newTinyUrl]; // deleting a existing key in urlData
  res.redirect('/urls');
});

//update LongURL and redirecting to new index page
app.post('/urls/:shortURL/edit', (req, res) => {
  const tinyUrl = req.params.shortURL;
  const newLongURL = req.body.newURL;
  urlDB[tinyUrl] = newLongURL;
  res.redirect('/urls');
});

//log in
app.post('/login', (req, res) => {
  const userName = req.body.username;
  console.log('Cookies :  ', req.cookies);
  res.cookie('userName', userName).redirect('/urls');
});

//log out
app.post('/logout', (req, res) => {
  res.clearCookie('userName');
  console.log('Cookies :  ', req.cookies);
  res.redirect('/urls');
});

//register page!
app.get('/register', (req, res) => {
  const templateVars = { user_id: req.cookies.user_id,
    user_email: req.cookies.user_email // you are only passing that variable because you need to show it in your page. The cookie exists independently of that variable!
 };
  res.render('urls_register', templateVars);
});

//registering!
app.post('/register', (req, res, next) => {
  const username = req.cookies.userName;
  const email = req.body.email;
  const password = req.body.password;
  const idNum = (randomString(6, '0123456789').toString());
  const userId = {'id': idNum, 'email': email, 'password': password};

  if (!email) {
    const error = new Error('missing id');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  }

  if (!password) {
    const error = new Error('missing id');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  }

  if (emailTracker(email) === true) {
    let error = new Error('Email already registered!');
    error.httpStatusCode = 400;
    return next(error);
    res.sendStatus(err.httpStatusCode).json(err);
  }

  userDB.idNum = userId;
  // cookieParser.JSONCookie(id);
  console.log('Cookies after creating cookie id: ', req.cookies);

  res.cookie('user_id', userDB.idNum.id);
  res.cookie('user_email', userDB.idNum.email);
  res.redirect('/urls');
});

// just listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
