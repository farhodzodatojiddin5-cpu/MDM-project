// ─────────────────────────────────────────────────────────────
//  middleware/auth.js — JWT protection middleware
// ─────────────────────────────────────────────────────────────
const jwt    = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'mdm_secret_key');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

// ─────────────────────────────────────────────────────────────
//  routes/devices.js — Full CRUD for enrolled devices
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { Device, AuditLog } = require('../models');
const { protect } = require('../middleware/auth');

// GET all devices (with optional filters)
router.get('/', protect, async (req, res) => {
  const { type, status, compliance, search } = req.query;
  const filter = {};
  if (type)       filter.type = type;
  if (status)     filter.status = status;
  if (compliance) filter.compliance = compliance;
  if (search)     filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { assignedUser: { $regex: search, $options: 'i' } },
  ];
  const devices = await Device.find(filter).sort({ lastSeen: -1 });
  res.json({ count: devices.length, devices });
});

// GET single device
router.get('/:id', protect, async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.id });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

// POST enroll new device
router.post('/', protect, async (req, res) => {
  const device = await Device.create({ ...req.body, enrolledBy: req.user._id });
  res.status(201).json(device);
});

// PATCH update device info
router.patch('/:id', protect, async (req, res) => {
  const device = await Device.findOneAndUpdate(
    { deviceId: req.params.id }, req.body, { new: true, runValidators: true }
  );
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

// DELETE unenroll device
router.delete('/:id', protect, async (req, res) => {
  await Device.findOneAndDelete({ deviceId: req.params.id });
  res.json({ message: 'Device unenrolled' });
});

// GET compliance stats
router.get('/stats/compliance', protect, async (req, res) => {
  const stats = await Device.aggregate([
    { $group: { _id: '$compliance', count: { $sum: 1 } } }
  ]);
  res.json(stats);
});

module.exports = router;
