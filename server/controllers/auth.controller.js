const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const protectedTest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'You have accessed a protected endpoint',
      user: {
        id: req.user.id || req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const studentTest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Student role authorization test passed',
      user: {
        id: req.user.id || req.user._id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const companyTest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Company role authorization test passed',
      user: {
        id: req.user.id || req.user._id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminTest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Admin role authorization test passed',
      user: {
        id: req.user.id || req.user._id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  protectedTest,
  studentTest,
  companyTest,
  adminTest,
};
