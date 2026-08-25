const crypto = require('crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function sixDigitCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

module.exports = { randomToken, sixDigitCode };
