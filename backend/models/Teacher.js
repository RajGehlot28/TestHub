const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  
  // Institute Association (Optional)
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
  instituteName: { type: String, default: null },
  
  createdBy: { type: String, default: 'system' },
  isActive: { type: Boolean, default: true },
  totalTestsCreated: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);
