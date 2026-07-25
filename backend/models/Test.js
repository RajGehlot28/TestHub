const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  questionNumber: { type: Number, required: true },
  options: [
    {
      optionId: { type: String, required: true }, // 'A', 'B', 'C', 'D'
      optionText: { type: String, required: true }
    }
  ],
  correctAnswer: { type: String, required: true }, // 'A', 'B', 'C', or 'D'
  marks: { type: Number, default: 1 }
});

const testSchema = new mongoose.Schema({
  testCode: { type: String, required: true, unique: true },
  
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherName: { type: String, default: '' },
  
  // Institute Reference (Inherited from Teacher - null if teacher has no institute)
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
  instituteName: { type: String, default: null },
  
  testName: { type: String, required: true },
  description: { type: String, default: '' },
  
  questions: [questionSchema],
  
  totalQuestions: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  marksPerQuestion: { type: Number, default: 1 },
  duration: { type: Number, required: true }, // In minutes
  
  // Timing Window
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  testDate: { type: String },
  
  pdfSourceNames: [{ type: String }],
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', testSchema);
