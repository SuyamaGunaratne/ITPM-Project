const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'   // you can change to '30d', '1h', etc.
  });
};

module.exports = generateToken;