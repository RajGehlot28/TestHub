const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  studentAnswer: { type: String, default: null }, // 'A', 'B', 'C', 'D' or null
  isCorrect: { type: Boolean, default: false },
  marksObtained: { type: Number, default: 0 }
});

const testResultSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  rollNo: { type: String, required: true },
  
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
  instituteName: { type: String, default: null },
  
  answers: [answerSchema],
  
  totalMarksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number, default: 0 }, // in seconds
  status: { type: String, enum: ['submitted', 'completed'], default: 'submitted' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', testResultSchema);
