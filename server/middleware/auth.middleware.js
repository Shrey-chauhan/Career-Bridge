const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const { getUserById } = require('../services/auth.service');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Authentication required. Please log in to gain access', 401)
      );
    }

    const decoded = verifyToken(token);
    const userId = decoded.id || decoded.userId;

    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return next(
        new AppError('User belonging to this token no longer exists', 401)
      );
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
};
