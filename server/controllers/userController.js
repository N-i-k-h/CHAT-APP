import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, bio } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ 
      fullName, 
      email, 
      password: hashedPassword, 
      bio: bio || '' 
    });

    const token = generateToken(newUser._id);
    const userData = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      bio: newUser.bio,
      profilePic: newUser.profilePic
    };

    res.status(201).json({ 
      success: true, 
      message: 'Account created successfully', 
      token, 
      userData 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic
    };

    res.json({ 
      success: true, 
      message: 'Login successful', 
      token, 
      userData 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const checkAuth = (req, res) => {
  res.json({ 
    success: true, 
    userData: req.user 
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePic } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (bio) updates.bio = bio;
    if (profilePic) updates.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      userData: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};