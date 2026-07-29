const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getIsConnected } = require('../config/db');
const Institute = require('../models/Institute');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Test = require('../models/Test');
const { memoryStore, generateId } = require('../config/memoryStore');
const { verifyToken, requireRole } = require('../middleware/auth');

// All routes require admin token
router.use(verifyToken, requireRole('admin'));

// --- GET ADMIN OVERVIEW DASHBOARD STATS ---
router.get('/dashboard', async (req, res) => {
  try {
    if (getIsConnected()) {
      const totalInstitutes = await Institute.countDocuments();
      const totalTeachers = await Teacher.countDocuments();
      const totalStudents = await Student.countDocuments();
      const totalTests = await Test.countDocuments();
      const institutes = await Institute.find().limit(10);
      const teachers = await Teacher.find().limit(10);

      return res.json({
        stats: { totalInstitutes, totalTeachers, totalStudents, totalTests },
        institutes,
        teachers
      });
    } else {
      return res.json({
        stats: {
          totalInstitutes: memoryStore.institutes.length,
          totalTeachers: memoryStore.teachers.length,
          totalStudents: memoryStore.students.length,
          totalTests: memoryStore.tests.length
        },
        institutes: memoryStore.institutes,
        teachers: memoryStore.teachers
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin dashboard data' });
  }
});

// --- CREATE NEW INSTITUTE ---
router.post('/institutes', async (req, res) => {
  try {
    const { instituteName, code, city, state, country, email, phone, adminEmail } = req.body;
    if (!instituteName || !code) {
      return res.status(400).json({ message: 'Institute Name and Code are required.' });
    }

    const instData = {
      instituteName,
      code: code.toUpperCase(),
      city: city || '',
      state: state || '',
      country: country || 'India',
      email: email || '',
      phone: phone || '',
      adminEmail: adminEmail || '',
      totalTeachers: 0,
      totalStudents: 0,
      isActive: true,
      createdAt: new Date()
    };

    let institute = null;
    if (getIsConnected()) {
      institute = await Institute.create(instData);
    } else {
      institute = { _id: generateId(), ...instData };
      memoryStore.institutes.push(institute);
    }

    res.status(201).json({ message: 'Institute created successfully', institute });
  } catch (error) {
    res.status(500).json({ message: 'Error creating institute', error: error.message });
  }
});

// --- CREATE NEW TEACHER (ADMIN CREATES TEACHER) ---
router.post('/teachers', async (req, res) => {
  try {
    const { email, password, fullName, instituteId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, Password, and Full Name are required.' });
    }

    const lowerEmail = email.toLowerCase();

    // Check if email already exists
    let existingTeacher = null;
    if (getIsConnected()) {
      existingTeacher = await Teacher.findOne({ email: lowerEmail });
    } else {
      existingTeacher = memoryStore.teachers.find(t => t.email.toLowerCase() === lowerEmail);
    }

    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher account with this email already exists.' });
    }

    let instituteObj = null;
    if (instituteId) {
      if (getIsConnected()) {
        instituteObj = await Institute.findById(instituteId);
      } else {
        instituteObj = memoryStore.institutes.find(i => i._id === instituteId);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const teacherData = {
      email: lowerEmail,
      passwordHash: passwordHash,
      fullName: fullName,
      instituteId: instituteObj ? instituteObj._id : (instituteId || null),
      instituteName: instituteObj ? instituteObj.instituteName : null,
      createdBy: req.user.email,
      isActive: true,
      totalTestsCreated: 0,
      createdAt: new Date()
    };

    let teacher = null;
    if (getIsConnected()) {
      teacher = await Teacher.create(teacherData);
      if (instituteObj) {
        await Institute.findByIdAndUpdate(instituteObj._id, { $inc: { totalTeachers: 1 } });
      }
    } else {
      teacher = { _id: generateId(), ...teacherData };
      memoryStore.teachers.push(teacher);
      if (instituteObj) {
        instituteObj.totalTeachers = (instituteObj.totalTeachers || 0) + 1;
      }
    }

    res.status(201).json({ message: 'Teacher account created successfully', teacher: teacher });
  } catch (error) {
    res.status(500).json({ message: 'Error creating teacher account', error: error.message });
  }
});

module.exports = router;
