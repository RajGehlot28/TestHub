const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  instituteName: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  adminEmail: { type: String, default: '' },
  totalTeachers: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Institute', instituteSchema);
