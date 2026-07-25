const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getIsConnected } = require('../config/db');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Institute = require('../models/Institute');
const { memoryStore, generateId } = require('../config/memoryStore');
const { JWT_SECRET } = require('../middleware/auth');

// --- STUDENT REGISTRATION (Self-Service) ---
router.post('/student/register', async (req, res) => {
  try {
    const { email, name, rollNo, password, instituteId, instituteName } = req.body;

    console.log('[REGISTER] Request body:', { email, name, rollNo, instituteName, instituteId });

    if (!email || !name || !rollNo || !password) {
      return res.status(400).json({ message: 'All required fields (Email, Name, Roll No, Password) must be provided.' });
    }

    // Step 1: Resolve institute from typed name
    let finalInstName = (instituteName && instituteName.trim()) ? instituteName.trim() : null;
    let finalInstId = instituteId || null;

    console.log('[REGISTER] Initial finalInstName:', finalInstName, 'finalInstId:', finalInstId);

    if (finalInstName) {
      try {
        const escapedName = finalInstName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const safeRegex = new RegExp(`^${escapedName}$`, 'i');
        console.log('[REGISTER] DB connected:', getIsConnected());

        if (getIsConnected()) {
          let instObj = null;
          if (instituteId) {
            instObj = await Institute.findById(instituteId);
          } else {
            instObj = await Institute.findOne({ instituteName: { $regex: safeRegex } });
            console.log('[REGISTER] Found existing institute:', instObj ? instObj.instituteName : 'None');
            if (!instObj) {
              try {
                const code = finalInstName.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                instObj = await Institute.create({ instituteName: finalInstName, code, city: 'Main Campus' });
                console.log('[REGISTER] Created new institute:', instObj.instituteName);
              } catch (createErr) {
                console.error('[REGISTER] Institute create failed, trying findOne:', createErr.message);
                instObj = await Institute.findOne({ instituteName: { $regex: safeRegex } });
              }
            }
          }
          if (instObj) {
            finalInstId = instObj._id;
            finalInstName = instObj.instituteName;
          }
        } else {
          let instObj = memoryStore.institutes.find(i => i.instituteName.toLowerCase() === finalInstName.toLowerCase());
          if (!instObj) {
            const code = finalInstName.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
            instObj = { _id: generateId(), instituteName: finalInstName, code, city: 'Main Campus', createdAt: new Date() };
            memoryStore.institutes.push(instObj);
          }
          if (instObj) { finalInstId = instObj._id; finalInstName = instObj.instituteName; }
        }
      } catch (err) {
        console.error('[REGISTER] Institute assignment error:', err);
      }
    }

    console.log('[REGISTER] After institute resolution — finalInstName:', finalInstName, 'finalInstId:', finalInstId);

    // Step 2: Check teacher collision + find existing student
    let existingStudent = null;
    let isTeacherEmail = false;
    if (getIsConnected()) {
      existingStudent = await Student.findOne({ email: email.toLowerCase() });
      const teacherExist = await Teacher.findOne({ email: email.toLowerCase() });
      if (teacherExist) isTeacherEmail = true;
    } else {
      existingStudent = memoryStore.students.find(s => s.email.toLowerCase() === email.toLowerCase());
      isTeacherEmail = memoryStore.teachers.some(t => t.email.toLowerCase() === email.toLowerCase());
    }

    if (isTeacherEmail) {
      return res.status(400).json({ message: 'This email is registered as a Teacher account and cannot be registered as a Student.' });
    }

    let student = null;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingStudent) {
      console.log('[REGISTER] Updating EXISTING student with instituteName:', finalInstName);
      if (getIsConnected()) {
        existingStudent.set({ name, rollNo, passwordHash, instituteId: finalInstId, instituteName: finalInstName });
        student = await existingStudent.save();
        // Re-fetch to ensure latest DB values
        const refreshed = await Student.findById(student._id);
        if (refreshed) student = refreshed;
      } else {
        existingStudent.name = name;
        existingStudent.rollNo = rollNo;
        existingStudent.passwordHash = passwordHash;
        existingStudent.instituteId = finalInstId;
        existingStudent.instituteName = finalInstName;
        student = existingStudent;
      }
    } else {
      console.log('[REGISTER] Creating NEW student with instituteName:', finalInstName);
      const newStudentData = {
        email: email.toLowerCase(), name, rollNo, passwordHash,
        instituteId: finalInstId, instituteName: finalInstName,
        isActive: true, totalTestsTaken: 0, createdAt: new Date()
      };
      if (getIsConnected()) {
        student = await Student.create(newStudentData);
      } else {
        student = { _id: generateId(), ...newStudentData };
        memoryStore.students.push(student);
      }
    }

    console.log('[REGISTER] student.instituteName after save:', student.instituteName);

    const token = jwt.sign(
      {
        id: student._id.toString(),
        email: student.email,
        name: student.name,
        role: 'student',
        instituteId: student.instituteId ? student.instituteId.toString() : null,
        instituteName: student.instituteName || finalInstName || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseInstName = student.instituteName || finalInstName || null;
    console.log('[REGISTER] Response instituteName:', responseInstName);

    res.status(201).json({
      message: 'Student registered successfully!',
      token,
      user: {
        id: student._id,
        email: student.email,
        name: student.name,
        rollNo: student.rollNo,
        role: 'student',
        instituteId: student.instituteId,
        instituteName: responseInstName
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// --- STUDENT LOGIN ---
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let student = null;
    let isTeacherAccount = false;

    if (getIsConnected()) {
      student = await Student.findOne({ email: email.toLowerCase() });
      if (!student) {
        const teacherExist = await Teacher.findOne({ email: email.toLowerCase() });
        if (teacherExist) isTeacherAccount = true;
      }
    } else {
      student = memoryStore.students.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (!student) {
        isTeacherAccount = memoryStore.teachers.some(t => t.email.toLowerCase() === email.toLowerCase());
      }
    }

    if (isTeacherAccount) {
      return res.status(401).json({ message: 'This email belongs to a Teacher account. Please use the Teacher Login portal.' });
    }

    if (!student) {
      return res.status(401).json({ message: 'Invalid student credentials.' });
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: student._id.toString(),
        email: student.email,
        name: student.name,
        role: 'student',
        instituteId: student.instituteId ? student.instituteId.toString() : null,
        instituteName: student.instituteName || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Student login successful',
      token,
      user: {
        id: student._id,
        email: student.email,
        name: student.name,
        rollNo: student.rollNo,
        role: 'student',
        instituteId: student.instituteId,
        instituteName: student.instituteName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- TEACHER LOGIN ---
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let teacher = null;
    let isStudentAccount = false;

    if (getIsConnected()) {
      teacher = await Teacher.findOne({ email: email.toLowerCase() });
      if (!teacher) {
        const studentExist = await Student.findOne({ email: email.toLowerCase() });
        if (studentExist) isStudentAccount = true;
      }
    } else {
      teacher = memoryStore.teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (!teacher) {
        isStudentAccount = memoryStore.students.some(s => s.email.toLowerCase() === email.toLowerCase());
      }
    }

    if (isStudentAccount) {
      return res.status(401).json({ message: 'This email belongs to a Student account. Please use the Student Login portal.' });
    }

    if (!teacher) {
      return res.status(401).json({ message: 'Invalid teacher credentials. Note: Teacher accounts are created by Admin.' });
    }

    const isMatch = await bcrypt.compare(password, teacher.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid teacher credentials.' });
    }

    const token = jwt.sign(
      {
        id: teacher._id.toString(),
        email: teacher.email,
        fullName: teacher.fullName,
        role: 'teacher',
        instituteId: teacher.instituteId ? teacher.instituteId.toString() : null,
        instituteName: teacher.instituteName || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Teacher login successful',
      token,
      user: {
        id: teacher._id,
        email: teacher.email,
        fullName: teacher.fullName,
        role: 'teacher',
        instituteId: teacher.instituteId,
        instituteName: teacher.instituteName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during teacher login' });
  }
});

// --- ADMIN LOGIN ---
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === 'admin@testhub.com' && (password === 'admin123' || password === 'admin')) {
      const token = jwt.sign(
        { id: 'admin_root', email, fullName: 'Platform Admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        message: 'Admin authentication successful',
        token,
        user: { id: 'admin_root', email, fullName: 'Platform Admin', role: 'admin' }
      });
    }
    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- GET PUBLIC LIST OF INSTITUTES FOR DROPDOWN ---
router.get('/institutes', async (req, res) => {
  try {
    let list = [];
    if (getIsConnected()) {
      list = await Institute.find({ isActive: true }).select('_id instituteName code city');
    } else {
      list = memoryStore.institutes
        .filter(i => i.isActive)
        .map(i => ({ _id: i._id, instituteName: i.instituteName, code: i.code, city: i.city }));
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve institutes' });
  }
});

module.exports = router;
