const express = require('express');
const router = express.Router();
const { getIsConnected } = require('../config/db');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { memoryStore, generateId } = require('../config/memoryStore');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateInstituteAccess } = require('../middleware/instituteAccess');

// --- PUBLIC: FETCH BASIC TEST INFO (For shareable link preview) ---
router.get('/:testCode', async (req, res) => {
  try {
    const { testCode } = req.params;
    let test = null;

    if (getIsConnected()) {
      test = await Test.findOne({ testCode }).select('-questions.correctAnswer');
    } else {
      const found = memoryStore.tests.find(t => t.testCode === testCode || t._id === testCode);
      if (found) {
        test = {
          ...found,
          questions: found.questions.map(q => ({
            questionId: q.questionId,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks
          }))
        };
      }
    }

    if (!test) {
      return res.status(404).json({ message: 'Test not found or link has expired.' });
    }

    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.endTime);

    let timingStatus = 'active';
    if (now < startTime) {
      timingStatus = 'not_started';
    } else if (now > endTime) {
      timingStatus = 'expired';
    }

    res.json({
      test: {
        _id: test._id,
        testCode: test.testCode,
        testName: test.testName,
        description: test.description,
        teacherName: test.teacherName,
        instituteId: test.instituteId,
        instituteName: test.instituteName,
        totalQuestions: test.totalQuestions,
        maxMarks: test.maxMarks,
        duration: test.duration,
        startTime: test.startTime,
        endTime: test.endTime
      },
      timingStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test info' });
  }
});

// --- PROTECTED STUDENT ROUTE: VERIFY ACCESS & TIMING WINDOW ---
router.get('/:testCode/verify', verifyToken, requireRole('student'), validateInstituteAccess, async (req, res) => {
  try {
    const test = req.testData;
    const student = req.studentData;
    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.endTime);

    let timingStatus = 'active';
    if (now < startTime) {
      timingStatus = 'not_started';
    } else if (now > endTime) {
      timingStatus = 'expired';
    }

    // Check if student has already submitted this test
    let existingResult = null;
    if (getIsConnected()) {
      existingResult = await TestResult.findOne({ testId: test._id, studentId: student._id });
    } else {
      existingResult = memoryStore.results.find(r => r.testId.toString() === test._id.toString() && r.studentId.toString() === student._id.toString());
    }

    res.json({
      allowed: true,
      alreadySubmitted: !!existingResult,
      existingResultId: existingResult ? existingResult._id : null,
      timingStatus,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        instituteName: student.instituteName
      },
      test: {
        _id: test._id,
        testCode: test.testCode,
        testName: test.testName,
        teacherName: test.teacherName,
        instituteName: test.instituteName,
        totalQuestions: test.totalQuestions,
        maxMarks: test.maxMarks,
        duration: test.duration,
        startTime: test.startTime,
        endTime: test.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying test session' });
  }
});

// --- PROTECTED STUDENT ROUTE: START TEST & FETCH QUESTIONS (Sanitized) ---
router.post('/:testCode/start', verifyToken, requireRole('student'), validateInstituteAccess, async (req, res) => {
  try {
    const test = req.testData;
    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.endTime);

    if (now < startTime) {
      return res.status(400).json({ message: 'Test has not started yet. Please wait until the scheduled start time.' });
    }
    if (now > endTime) {
      return res.status(400).json({ message: 'Test window has expired. Submissions are no longer accepted.' });
    }

    // Sanitize questions (strip correctAnswer before serving to client)
    const sanitizedQuestions = test.questions.map(q => ({
      questionId: q.questionId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks || 1
    }));

    res.json({
      message: 'Test session started',
      serverTime: now,
      test: {
        _id: test._id,
        testCode: test.testCode,
        testName: test.testName,
        description: test.description,
        teacherName: test.teacherName,
        instituteName: test.instituteName,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        maxMarks: test.maxMarks,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting test session' });
  }
});

// --- PROTECTED STUDENT ROUTE: SUBMIT TEST ---
router.post('/:testCode/submit', verifyToken, requireRole('student'), validateInstituteAccess, async (req, res) => {
  try {
    const test = req.testData;
    const student = req.studentData;
    const { answers, startedAt, timeTaken } = req.body; // answers = { [questionId]: 'A' | 'B' | 'C' | 'D' }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid test submission payload' });
    }

    // Grade student answers against original correct key in test
    let totalMarksObtained = 0;
    const maxMarks = test.maxMarks || test.questions.length;
    const gradedAnswers = [];

    test.questions.forEach(q => {
      const studentAns = answers[q.questionId] || null;
      const isCorrect = studentAns === q.correctAnswer;
      const marksObtained = isCorrect ? (q.marks || 1) : 0;
      if (isCorrect) {
        totalMarksObtained += marksObtained;
      }
      gradedAnswers.push({
        questionId: q.questionId,
        studentAnswer: studentAns,
        isCorrect,
        marksObtained
      });
    });

    const percentage = maxMarks > 0 ? Math.round((totalMarksObtained / maxMarks) * 100) : 0;

    const resultData = {
      testId: test._id,
      teacherId: test.teacherId,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      rollNo: student.rollNo,
      instituteId: student.instituteId || null,
      instituteName: student.instituteName || null,
      answers: gradedAnswers,
      totalMarksObtained,
      maxMarks,
      percentage,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - 600000),
      submittedAt: new Date(),
      timeTaken: Number(timeTaken) || 0,
      status: 'submitted',
      createdAt: new Date()
    };

    let savedResult = null;
    if (getIsConnected()) {
      savedResult = await TestResult.create(resultData);
      await Student.findByIdAndUpdate(student._id, { $inc: { totalTestsTaken: 1 } });
    } else {
      savedResult = { _id: generateId(), ...resultData };
      memoryStore.results.push(savedResult);
      if (student) {
        student.totalTestsTaken = (student.totalTestsTaken || 0) + 1;
      }
    }

    res.status(201).json({
      message: 'Test submitted and graded successfully!',
      resultId: savedResult._id,
      score: {
        totalMarksObtained,
        maxMarks,
        percentage,
        timeTaken: savedResult.timeTaken
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing test submission', error: error.message });
  }
});

module.exports = router;
