const bcrypt = require('bcrypt');

function hasher(password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
};

console.log('password 1: ',hasher('purple-monkey-dinosaur')); // $2b$10$I6TVOGpd/d9MSAHpCI5nRu3wgHC60czt895MCNC3x65KKXHFSTL5u
console.log('password 2: ',hasher('dishwasher-funk')); // $2b$10$l6sDxe8PbxLEz7j2b.I2YuY8nO6S1.g5dMDhnCyMwi/odCOP2T5LG
console.log('password 2: ',hasher('helloworld')); // $2b$10$l6sDxe8PbxLEz7j2b.I2YuY8nO6S1.g5dMDhnCyMwi/odCOP2T5LG