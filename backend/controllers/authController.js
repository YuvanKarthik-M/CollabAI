const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isAdminEmail } = require('../utils/adminCheck');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user (Student or Organisation)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, skills, interests, role: requestedRole } = req.body;

    const lowerEmail = email ? email.trim().toLowerCase() : '';
    const existingUser = await User.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

    const isListedAdmin = isAdminEmail(lowerEmail);

    // Prevent public Admin registration unless listed in .env
    if (requestedRole === 'admin' && !isListedAdmin) {
      return res.status(403).json({ 
        message: 'Admin accounts cannot be created via public sign up. Contact database administrator.' 
      });
    }

    let finalRole = 'student';
    if (isListedAdmin) {
      finalRole = 'admin';
    } else if (requestedRole === 'organisation') {
      finalRole = 'organisation';
    } else {
      finalRole = 'student';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: finalRole,
      skills: skills || [],
      interests: interests || []
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      interests: user.interests,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unified Login for all roles
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const lowerEmail = email ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Role synchronization with .env file
    const isListedAdmin = isAdminEmail(lowerEmail);
    if (isListedAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      interests: user.interests,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};