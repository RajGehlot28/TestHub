const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');
const Student = require('../models/Student');
const TestResult = require('../models/TestResult');
const Test = require('../models/Test');
const { memoryStore } = require('../config/memoryStore');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('student'));

// --- GET STUDENT DASHBOARD ---
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user.id;
    let student = null;
    let results = [];

    if (getIsConnected()) {
      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        student = await Student.findById(studentId);
      }
      if (!student && req.user.email) {
        student = await Student.findOne({ email: req.user.email.toLowerCase() });
      }
      const sid = student ? student._id : studentId;
      results = await TestResult.find({ studentId: sid }).sort({ createdAt: -1 });
    } else {
      student = memoryStore.students.find(s => s._id === studentId || (s.email && s.email.toLowerCase() === req.user.email.toLowerCase()));
      const sid = student ? student._id : studentId;
      results = memoryStore.results.filter(r => r.studentId === sid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const performanceTrends = results.map((r, idx) => ({
      testName: r.testName || `Test #${results.length - idx}`,
      percentage: r.percentage,
      marksObtained: r.totalMarksObtained,
      maxMarks: r.maxMarks,
      date: r.submittedAt || r.createdAt
    })).reverse();

    const avgScore = results.length > 0
      ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / results.length)
      : 0;

    const resolvedInstName = (student && student.instituteName && student.instituteName.trim()) 
      ? student.instituteName.trim() 
      : (req.user.instituteName && req.user.instituteName.trim() ? req.user.instituteName.trim() : null);

    res.json({
      student: {
        name: (student && student.name) || req.user.name,
        email: (student && student.email) || req.user.email,
        rollNo: (student && student.rollNo) || 'N/A',
        instituteId: (student && student.instituteId) || req.user.instituteId || null,
        instituteName: resolvedInstName || 'No Institute Assigned'
      },
      stats: {
        totalTestsTaken: results.length,
        averagePercentage: avgScore
      },
      performanceTrends,
      recentResults: results
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student dashboard data', error: error.message });
  }
});

// --- GET SINGLE TEST RESULT FOR STUDENT QUESTION REVIEW ---
router.get('/results/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    let result = null;
    let test = null;

    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(resultId)) {
        result = await TestResult.findById(resultId);
      }
      if (result) {
        test = await Test.findById(result.testId);
      }
    } else {
      result = memoryStore.results.find(r => r._id === resultId);
      if (result) {
        test = memoryStore.tests.find(t => t._id === result.testId);
      }
    }

    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }

    res.json({ result, test });
  } catch (error) {
    res.status(500).json({ message: 'Error loading test result breakdown', error: error.message });
  }
});

module.exports = router;
