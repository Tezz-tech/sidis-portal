const bcrypt = require('bcryptjs');

const ROUNDS = 12;

function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
