 const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Register attempt:', email);
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Account already exists' });
    const user = await User.create({ email, password });
    console.log('User created:', user._id);
    res.status(201).json({ message: 'Account created successfully! Please login.' });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, awsRegion: user.awsRegion, hasAwsCredentials: !!(user.awsAccessKey && user.awsSecretKey) }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/credentials', authMiddleware, async (req, res) => {
  try {
    const { accessKey, secretKey, region } = req.body;
    if (!accessKey || !secretKey) return res.status(400).json({ error: 'Access key and secret key are required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.awsAccessKey = accessKey;
    user.awsSecretKey = secretKey;
    user.awsRegion = region || 'us-east-1';
    await user.save();
    res.json({ message: 'AWS credentials saved successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      hasCredentials: !!(user.awsAccessKey && user.awsSecretKey),
      region: user.awsRegion,
      accessKeyHint: user.awsAccessKey ? user.awsAccessKey.substring(0, 4) + '****' : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;