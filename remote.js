// ─────────────────────────────────────────────────────────────
//  routes/remote.js — Remote device commands
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { Device, AuditLog } = require('../models');
const { protect, requireRole } = require('../middleware/auth');

const log = (action, user, device, detail) =>
  AuditLog.create({ action, performedBy: user._id, targetDevice: device._id, detail });

// POST /api/remote/:deviceId/lock
router.post('/:deviceId/lock', protect, async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  // In production: send push notification via APNS / FCM / WNS
  await log('LOCK_DEVICE', req.user, device, 'Remote lock initiated');
  res.json({ success: true, message: `Lock command sent to ${device.name}` });
});

// POST /api/remote/:deviceId/wipe — requires super_admin
router.post('/:deviceId/wipe', protect, requireRole('super_admin'), async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  // In production: send MDM wipe command
  device.status = 'offline';
  await device.save();
  await log('WIPE_DEVICE', req.user, device, 'Factory wipe initiated');
  res.json({ success: true, message: `Wipe command sent to ${device.name}` });
});

// POST /api/remote/:deviceId/message
router.post('/:deviceId/message', protect, async (req, res) => {
  const { message } = req.body;
  const device = await Device.findOne({ deviceId: req.params.deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  await log('SEND_MESSAGE', req.user, device, message);
  res.json({ success: true, message: 'Message pushed to device' });
});

// POST /api/remote/:deviceId/track — get last known location
router.post('/:deviceId/track', protect, async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  await log('TRACK_DEVICE', req.user, device, 'Location requested');
  res.json({ success: true, location: device.location });
});

// POST /api/remote/:deviceId/reboot
router.post('/:deviceId/reboot', protect, requireRole('super_admin','it_manager'), async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  await log('REBOOT_DEVICE', req.user, device, 'Remote reboot sent');
  res.json({ success: true, message: `Reboot command sent to ${device.name}` });
});

module.exports = router;
