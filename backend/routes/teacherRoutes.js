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
      tests = memoryStore.tests.filter(t => t.teacherId === teacherId || t.teacherId === (teacherInfo ? teacherInfo._id : ''));
      const testIds = tests.map(t => t._id);
      results = memoryStore.results.filter(r => testIds.includes(r.testId));
    }

    // Performance trends: average score per test
    const performanceTrends = tests.map(test => {
      const testRes = results.filter(r => r.testId.toString() === test._id.toString());
      const avgPct = testRes.length > 0
        ? Math.round(testRes.reduce((acc, curr) => acc + curr.percentage, 0) / testRes.length)
        : 0;

      return {
        testId: test._id,
        testName: test.testName,
        testCode: test.testCode,
        totalStudentsTaken: testRes.length,
        averagePercentage: avgPct,
        date: test.createdAt
      };
    });

    const totalStudentsEvaluated = results.length;
    const overallAverage = results.length > 0
      ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
      : 0;

    // Build full test summaries including computed student stats
    const recentTests = tests.map(test => {
      const testRes = results.filter(r => r.testId.toString() === test._id.toString());
      const avgPct = testRes.length > 0
        ? Math.round(testRes.reduce((acc, curr) => acc + curr.percentage, 0) / testRes.length)
        : 0;
      return {
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
      };
    });

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

// --- GET ALL TESTS CREATED BY TEACHER ---
router.get('/tests', async (req, res) => {
  try {
    const teacherId = req.user.id;
    let tests = [];
    let results = [];

    if (getIsConnected()) {
      tests = await Test.find({ teacherId }).sort({ createdAt: -1 });
      const testIds = tests.map(t => t._id);
      results = await TestResult.find({ testId: { $in: testIds } });
    } else {
      const teacherInfo = memoryStore.teachers.find(t => t._id === teacherId || t.email === req.user.email);
      const tid = teacherInfo ? teacherInfo._id : teacherId;
      tests = memoryStore.tests.filter(t => t.teacherId === tid);
      const testIds = tests.map(t => t._id);
      results = memoryStore.results.filter(r => testIds.includes(r.testId));
    }

    const testSummaries = tests.map(t => {
      const tRes = results.filter(r => r.testId.toString() === t._id.toString());
      const avg = tRes.length > 0 ? Math.round(tRes.reduce((a, b) => a + b.percentage, 0) / tRes.length) : 0;
      return {
        _id: t._id,
        testCode: t.testCode,
        testName: t.testName,
        totalQuestions: t.totalQuestions,
        maxMarks: t.maxMarks,
        duration: t.duration,
        startTime: t.startTime,
        endTime: t.endTime,
        instituteName: t.instituteName,
        totalStudentsTaken: tRes.length,
        averagePercentage: avg,
        status: t.status,
        createdAt: t.createdAt
      };
    });

    res.json(testSummaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher tests' });
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
    const maxMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

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
        results = memoryStore.results
          .filter(r => r.testId === test._id)
          .sort((a, b) => b.totalMarksObtained - a.totalMarksObtained);
      }
    }

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Build metrics
    const totalSubmissions = results.length;
    const averageScorePercentage = totalSubmissions > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalSubmissions)
      : 0;
    const highestScore = totalSubmissions > 0 ? Math.max(...results.map(r => r.totalMarksObtained)) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...results.map(r => r.totalMarksObtained)) : 0;

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
    console.error('Error fetching test results:', error);
    res.status(500).json({ message: 'Error fetching test results', error: error.message });
  }
});

module.exports = router;
