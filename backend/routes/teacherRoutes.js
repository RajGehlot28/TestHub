const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getIsConnected } = require('../config/db');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Teacher = require('../models/Teacher');
const { memoryStore, generateId } = require('../config/memoryStore');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('teacher'));

// --- GET TEACHER DASHBOARD DATA ---
router.get('/dashboard', async (req, res) => {
  try {
    const teacherId = req.user.id;
    let tests = [];
    let results = [];
    let teacherInfo = null;

    if (getIsConnected()) {
      teacherInfo = await Teacher.findById(teacherId);
      tests = await Test.find({ teacherId }).sort({ createdAt: -1 });
      const testIds = tests.map(t => t._id);
      results = await TestResult.find({ testId: { $in: testIds } });
    } else {
      teacherInfo = memoryStore.teachers.find(t => t._id === teacherId || t.email === req.user.email);
      tests = memoryStore.tests.filter(t => t.teacherId === teacherId || t.teacherId === (teacherInfo ? teacherInfo._id : '')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const testIds = tests.map(t => t._id);
      results = memoryStore.results.filter(r => testIds.includes(r.testId));
    }

    // Copy tests array and sort chronologically (oldest to newest) using simple sort function
    let chronologicalTests = [];
    for (let i = 0; i < tests.length; i++) {
      chronologicalTests.push(tests[i]);
    }
    chronologicalTests.sort(function (a, b) {
      let dateA = new Date(a.createdAt);
      let dateB = new Date(b.createdAt);
      return dateA - dateB;
    });

    let performanceTrends = [];
    for (let i = 0; i < chronologicalTests.length; i++) {
      let test = chronologicalTests[i];
      let testRes = [];
      for (let j = 0; j < results.length; j++) {
        if (results[j].testId.toString() === test._id.toString()) {
          testRes.push(results[j]);
        }
      }

      let totalPct = 0;
      for (let k = 0; k < testRes.length; k++) {
        totalPct = totalPct + testRes[k].percentage;
      }

      let avgPct = 0;
      if (testRes.length > 0) {
        avgPct = Math.round(totalPct / testRes.length);
      }

      performanceTrends.push({
        testId: test._id,
        testName: test.testName,
        testCode: test.testCode,
        totalStudentsTaken: testRes.length,
        averagePercentage: avgPct,
        date: test.createdAt
      });
    }

    const totalStudentsEvaluated = results.length;
    let overallSum = 0;
    for (let i = 0; i < results.length; i++) {
      overallSum = overallSum + results[i].percentage;
    }
    let overallAverage = 0;
    if (results.length > 0) {
      overallAverage = Math.round(overallSum / results.length);
    }

    // Build full test summaries including computed student stats
    let recentTests = [];
    for (let i = 0; i < tests.length; i++) {
      let test = tests[i];
      let testRes = [];
      for (let j = 0; j < results.length; j++) {
        if (results[j].testId.toString() === test._id.toString()) {
          testRes.push(results[j]);
        }
      }

      let totalPct = 0;
      for (let k = 0; k < testRes.length; k++) {
        totalPct = totalPct + testRes[k].percentage;
      }

      let avgPct = 0;
      if (testRes.length > 0) {
        avgPct = Math.round(totalPct / testRes.length);
      }

      recentTests.push({
        _id: test._id,
        testCode: test.testCode,
        testName: test.testName,
        totalQuestions: test.totalQuestions,
        maxMarks: test.maxMarks,
        duration: test.duration,
        startTime: test.startTime,
        endTime: test.endTime,
        instituteName: test.instituteName,
        totalStudentsTaken: testRes.length,
        averagePercentage: avgPct,
        status: test.status,
        createdAt: test.createdAt
      });
    }

    res.json({
      teacher: {
        fullName: req.user.fullName,
        email: req.user.email,
        instituteId: teacherInfo ? teacherInfo.instituteId : null,
        instituteName: teacherInfo ? teacherInfo.instituteName : (req.user.instituteName || 'No Institute (Independent)')
      },
      stats: {
        totalTestsCreated: tests.length,
        totalStudentsEvaluated,
        overallAverage
      },
      performanceTrends,
      recentTests
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading teacher dashboard data', error: error.message });
  }
});

// --- CREATE TEST ---
router.post('/tests', async (req, res) => {
  try {
    const { testName, description, questions, duration, startTime, endTime, pdfSourceNames } = req.body;

    if (!testName || !questions || !Array.isArray(questions) || questions.length === 0 || !duration || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required test parameters (Name, Questions, Duration, Start/End Window).' });
    }

    const teacherId = req.user.id;
    let teacher = null;

    if (getIsConnected()) {
      teacher = await Teacher.findById(teacherId);
    } else {
      teacher = memoryStore.teachers.find(t => t._id === teacherId || t.email === req.user.email);
    }

    const testCode = 'TH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const marksPerQuestion = questions[0]?.marks || 1;
    
    let maxMarks = 0;
    for (let i = 0; i < questions.length; i++) {
      let q = questions[i];
      maxMarks = maxMarks + (q.marks || 1);
    }

    const testData = {
      testCode,
      teacherId: teacher ? teacher._id : teacherId,
      teacherName: teacher ? teacher.fullName : req.user.fullName,
      instituteId: teacher ? teacher.instituteId : (req.user.instituteId || null),
      instituteName: teacher ? teacher.instituteName : (req.user.instituteName || null),
      testName,
      description: description || '',
      questions,
      totalQuestions: questions.length,
      maxMarks,
      marksPerQuestion,
      duration: Number(duration),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      pdfSourceNames: pdfSourceNames || [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let testObj = null;
    if (getIsConnected()) {
      testObj = await Test.create(testData);
    } else {
      testObj = { _id: generateId(), ...testData };
      memoryStore.tests.push(testObj);
    }

    res.status(201).json({
      message: 'Test created successfully!',
      test: testObj,
      shareableLink: `/test/${testCode}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
});

// --- GET TEST RESULTS LIST FOR A SPECIFIC TEST ---
router.get('/tests/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    let test = null;
    let results = [];

    if (getIsConnected()) {
      test = await Test.findById(testId);
      if (!test) {
        // Try by testCode
        test = await Test.findOne({ testCode: testId });
      }
      if (test) {
        results = await TestResult.find({ testId: test._id }).sort({ totalMarksObtained: -1 });
      }
    } else {
      test = memoryStore.tests.find(t => t._id === testId || t.testCode === testId);
      if (test) {
        results = memoryStore.results.filter(r => r.testId === test._id);
        results.sort(function(a, b) {
          return b.totalMarksObtained - a.totalMarksObtained;
        });
      }
    }

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Build metrics
    const totalSubmissions = results.length;
    let sumPct = 0;
    for (let i = 0; i < results.length; i++) {
      sumPct = sumPct + results[i].percentage;
    }
    let averageScorePercentage = 0;
    if (totalSubmissions > 0) {
      averageScorePercentage = Math.round(sumPct / totalSubmissions);
    }

    let highestScore = 0;
    let lowestScore = 0;
    if (totalSubmissions > 0) {
      highestScore = results[0].totalMarksObtained;
      lowestScore = results[0].totalMarksObtained;
      for (let i = 1; i < results.length; i++) {
        if (results[i].totalMarksObtained > highestScore) {
          highestScore = results[i].totalMarksObtained;
        }
        if (results[i].totalMarksObtained < lowestScore) {
          lowestScore = results[i].totalMarksObtained;
        }
      }
    }

    // Map submissions into the expected shape
    const submissions = results.map(r => {
      // Convert answers array to {questionId: studentAnswer} map
      const answersMap = {};
      if (Array.isArray(r.answers)) {
        r.answers.forEach(a => {
          if (a.questionId) answersMap[a.questionId] = a.studentAnswer || null;
        });
      } else if (r.answers && typeof r.answers === 'object') {
        Object.assign(answersMap, r.answers);
      }
      return {
        resultId: r._id,
        studentName: r.studentName || 'Unknown',
        studentEmail: r.studentEmail || '',
        studentRollNo: r.rollNo || r.studentRollNo || '',
        instituteName: r.instituteName || null,
        totalMarksObtained: r.totalMarksObtained,
        maxMarks: r.maxMarks,
        percentage: r.percentage,
        timeTaken: r.timeTaken || 0,
        submittedAt: r.submittedAt || r.createdAt,
        answers: answersMap
      };
    });

    res.json({
      test: {
        _id: test._id,
        testCode: test.testCode,
        testName: test.testName,
        teacherName: test.teacherName,
        instituteName: test.instituteName,
        maxMarks: test.maxMarks,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        questions: test.questions || []
      },
      metrics: {
        totalSubmissions,
        averageScorePercentage,
        highestScore,
        lowestScore
      },
      submissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test results', error: error.message });
  }
});

module.exports = router;
