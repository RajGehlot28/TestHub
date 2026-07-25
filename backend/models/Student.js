const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rollNo: { type: String, required: true },
  passwordHash: { type: String, required: true },
  
  // Institute Association (Optional)
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
  instituteName: { type: String, default: null },
  
  isActive: { type: Boolean, default: true },
  totalTestsTaken: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
