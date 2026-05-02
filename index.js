// ─────────────────────────────────────────────────────────────
//  models/User.js
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['super_admin','it_manager','viewer'], default: 'viewer' },
  mfaEnabled:{ type: Boolean, default: false },
  lastLogin:  { type: Date },
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// ─────────────────────────────────────────────────────────────
//  models/Device.js
// ─────────────────────────────────────────────────────────────
const DeviceSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true, unique: true }, // e.g. DEV-001
  name:        { type: String, required: true },
  type:        { type: String, enum: ['iOS','Android','Windows','macOS'], required: true },
  os:          { type: String },
  serialNumber:{ type: String },
  enrolledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedUser:{ type: String }, // email of the device user
  status:      { type: String, enum: ['online','offline','risk','warn'], default: 'offline' },
  compliance:  { type: String, enum: ['pass','warn','fail'], default: 'warn' },
  ipAddress:   { type: String },
  lastSeen:    { type: Date, default: Date.now },
  battery:     { type: Number, min: 0, max: 100 },
  location: {
    lat:  { type: Number },
    lng:  { type: Number },
    city: { type: String },
  },
  mdmToken:    { type: String }, // push notification token
  isEncrypted: { type: Boolean, default: false },
  isJailbroken:{ type: Boolean, default: false },
  vpnActive:   { type: Boolean, default: false },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
//  models/Policy.js
// ─────────────────────────────────────────────────────────────
const PolicySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, enum: ['password','encryption','vpn','threat','screen','app'], required: true },
  enabled:     { type: Boolean, default: true },
  settings:    { type: Map, of: mongoose.Schema.Types.Mixed }, // flexible key-value policy settings
  appliesTo:   [{ type: String, enum: ['iOS','Android','Windows','macOS','All'] }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
//  models/App.js
// ─────────────────────────────────────────────────────────────
const AppSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  bundleId:    { type: String, required: true },
  version:     { type: String },
  platform:    [{ type: String, enum: ['iOS','Android','Windows','macOS'] }],
  required:    { type: Boolean, default: false }, // mandatory install
  installedOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  iconUrl:     { type: String },
  storeUrl:    { type: String },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
//  models/AuditLog.js
// ─────────────────────────────────────────────────────────────
const AuditSchema = new mongoose.Schema({
  action:     { type: String, required: true }, // e.g. 'WIPE_DEVICE', 'LOCK_DEVICE'
  performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetDevice:{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  detail:     { type: String },
  ip:         { type: String },
  success:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  User:     mongoose.model('User',     UserSchema),
  Device:   mongoose.model('Device',   DeviceSchema),
  Policy:   mongoose.model('Policy',   PolicySchema),
  App:      mongoose.model('App',      AppSchema),
  AuditLog: mongoose.model('AuditLog', AuditSchema),
};
