const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'careerbridge_super_secret_jwt_key_2026_dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'careerbridge_super_secret_jwt_key_2026_dev';

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
