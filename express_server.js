let express = require('express');
let cookieParser = require('cookie-parser');
let app = express();
let PORT = 8080; // default port 8080

const bodyParser = require('body-parser'); // to make the post method work!
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//setting the username to be a variable so all views can acess it

app.set('view engine', 'ejs');

function randomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {};


app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies.userName
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let cookies = {
    username: req.cookies.userName
  };
  res.render('urls_new', cookies);
});

//posting the form and redirecting to new url
app.post('/urls', (req, res) => {
  let newTinyUrl = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  urlDatabase[newTinyUrl] = req.body.longURL; // creating a new key in urlData and storing the long url info
  res.redirect(`/urls/${newTinyUrl}`);
});

//showing the page short url
app.get('/urls/:shortURL', (req, res) => { // if :shortURL === :b2xVn2
  //ned to do something about short urls that are called but dont exist!
  let shortURL = req.params.shortURL; // req.params. its a given property you can acess
  let templateVars = { shortURL: req.params.shortURL, //then req.params.shortURL === b2xVn2
                        longURL: urlDatabase[shortURL],
                        username: req.cookies.userName
                      };
  res.render('urls_show', templateVars);
});

//redirecting short urls
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  const longURL = `/urls/${shortURL}`;
  res.redirect(longURL);
});

//delete TinyUrl and redirecting to new index page
app.post('/urls/:shortURL/delete', (req, res) => {
  let newTinyUrl = req.params.shortURL;
  delete urlDatabase[newTinyUrl]; // deleting a existing key in urlData
  res.redirect('/urls');
});

//update LongURL and redirecting to new index page
app.post('/urls/:shortURL/edit', (req, res) => {
  let tinyUrl = req.params.shortURL;
  let newLongURL = req.body.newURL;
  urlDatabase[tinyUrl] = newLongURL;
  res.redirect('/urls');
});

//log in
app.post('/login', (req, res) => {
  const userName = req.body.username;
  cookieParser.JSONCookie(userName);
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
  let templateVars = { username: req.cookies.userName };
  console.log('users when it loads: ',users);
  res.render('urls_register', templateVars);
});

//registering!
app.post('/register', (req, res) => {
  let templateVars = { username: req.cookies.userName };
  const email = req.body.email;
  const password = req.body.password;
  const newId = Object.keys(users).length + 1;
  const id = {'id': newId, 'email': email, 'password': password};
  users[newId] = id;
  res.redirect('/urls');
});

// just listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
