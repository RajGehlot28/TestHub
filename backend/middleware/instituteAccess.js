const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');
const Test = require('../models/Test');
const Student = require('../models/Student');
const { memoryStore } = require('../config/memoryStore');

const validateInstituteAccess = async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const studentUser = req.user;

    if (!studentUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let test = null;
    let student = null;

    if (getIsConnected()) {
      test = await Test.findOne({ testCode });
      if (studentUser.id && mongoose.Types.ObjectId.isValid(studentUser.id)) {
        student = await Student.findById(studentUser.id);
      }
      if (!student && studentUser.email) {
        student = await Student.findOne({ email: studentUser.email.toLowerCase() });
      }
    } else {
      test = memoryStore.tests.find(t => t.testCode === testCode || t._id === testCode);
      student = memoryStore.students.find(s => s._id === studentUser.id || (s.email && s.email.toLowerCase() === studentUser.email.toLowerCase()));
    }

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Attach test & student to request object for downstream usage
    req.testData = test;
    req.studentData = student;

    // Determine Teacher's Institute
    const teacherInstituteId = test.instituteId ? test.instituteId.toString() : null;
    const teacherInstituteName = test.instituteName ? test.instituteName.trim() : null;

    // Determine Student's Institute (Check DB object first, then JWT token payload fallback)
    const studentInstituteId = (student && student.instituteId) ? student.instituteId.toString() : (studentUser.instituteId || null);
    const studentInstituteName = (student && student.instituteName && student.instituteName.trim()) 
      ? student.instituteName.trim() 
      : (studentUser.instituteName && studentUser.instituteName.trim() ? studentUser.instituteName.trim() : null);

    if (teacherInstituteId || teacherInstituteName) {
      // Teacher has an institute - student MUST have matching institute by ID or Name (case-insensitive)
      const tNameClean = teacherInstituteName ? teacherInstituteName.toLowerCase() : '';
      const sNameClean = studentInstituteName ? studentInstituteName.toLowerCase() : '';

      const isIdMatch = teacherInstituteId && studentInstituteId && (teacherInstituteId === studentInstituteId);
      const isNameMatch = tNameClean && sNameClean && (tNameClean === sNameClean);

      if (!isIdMatch && !isNameMatch) {
        return res.status(403).json({
          allowed: false,
          error: 'ACCESS_DENIED',
          message: 'Institute Mismatch Access Denied',
          teacherInstitute: test.instituteName || 'Teacher Institute',
          studentInstitute: studentInstituteName || 'No Registered Institute',
          reason: `This test is created for ${test.instituteName || 'specific institution'} students only.`
        });
      }
    }

    // If teacher has no institute, or institutes match:
    next();
  } catch (error) {
    console.error('Institute access validation error:', error);
    return res.status(500).json({ message: 'Server error validating institute access', error: error.message });
  }
};

module.exports = { validateInstituteAccess };
