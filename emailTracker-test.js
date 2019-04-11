const userDB = {
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
};

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

const email = 'user2@example.com';

console.log('email Tracker comparison: ',emailTracker(email) === true);
