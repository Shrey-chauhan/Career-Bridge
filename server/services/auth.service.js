const User = require('../models/User');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');
const { isConnected } = require('../config/db');
const bcrypt = require('bcryptjs');

// In-memory storage fallback when MongoDB server is offline
const memoryUsers = new Map();

const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    throw new AppError('Please provide name, email, and password', 400);
  }

  const userRole = role ? role.toUpperCase() : 'STUDENT';
  if (userRole === 'ADMIN') {
    throw new AppError(
      'Public registration for ADMIN role is not permitted',
      400
    );
  }

  if (!['STUDENT', 'COMPANY'].includes(userRole)) {
    throw new AppError('Role must be STUDENT or COMPANY', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (isConnected()) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
    });

    const token = generateToken({ id: user._id, role: user.role });
    return { user, token };
  } else {
    // In-memory fallback logic
    if (memoryUsers.has(normalizedEmail)) {
      throw new AppError('Email is already registered', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const memoryUser = {
      id,
      _id: id,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryUsers.set(normalizedEmail, memoryUser);

    const safeUser = { ...memoryUser };
    delete safeUser.password;

    const token = generateToken({ id: safeUser.id, role: safeUser.role });
    return { user: safeUser, token };
  }
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Please provide both email and password', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (isConnected()) {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 401);
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({ id: user._id, role: user.role });
    return { user, token };
  } else {
    // In-memory fallback login logic
    const memoryUser = memoryUsers.get(normalizedEmail);
    if (!memoryUser) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!memoryUser.isActive) {
      throw new AppError('Your account has been deactivated', 401);
    }

    const isMatch = await bcrypt.compare(password, memoryUser.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const safeUser = { ...memoryUser };
    delete safeUser.password;

    const token = generateToken({ id: safeUser.id, role: safeUser.role });
    return { user: safeUser, token };
  }
};

const getUserById = async (userId) => {
  if (isConnected()) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  } else {
    for (const memUser of memoryUsers.values()) {
      if (memUser.id === userId || memUser._id === userId) {
        const safeUser = { ...memUser };
        delete safeUser.password;
        return safeUser;
      }
    }
    throw new AppError('User not found', 404);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
