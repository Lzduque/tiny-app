const users = {
  01: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  02: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

console.log(users);

const lastIdNum = function(obj) {
  for (user in obj) {
    const userArr = [];
    userArr.push(Number(user));
    return Math.max(userArr);
  }
};

console.log('Maximum id found: ',lastIdNum(users));
