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


function idTracker(userEmail) {
  let result = undefined;
  for (let user in userDB) {
    if (userDB[user].email === userEmail) {
      result = user;
      console.log('user analized: ',user);
    }
    console.log('result is: ', result);
  }
  return result;
}


const userId = idTracker('user2@example.com');