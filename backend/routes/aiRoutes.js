const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parsePDFText, generateMCQsFromText } = require('../services/aiService');
const { verifyToken, requireRole } = require('../middleware/auth');

// Configure Multer memory storage(Max 10MB per file)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed!'), false);
    }
  }
});

router.post('/generate-mcqs', verifyToken, requireRole('teacher'), upload.array('pdfFiles', 5), async (req, res) => {
  try {
    const files = req.files;
    const { questionCount = 5, marksPerQuestion = 1 } = req.body;

    let combinedText = '';
    const pdfSourceNames = [];

    if (files && files.length > 0) {
      for (const file of files) {
        pdfSourceNames.push(file.originalname);
        const extracted = await parsePDFText(file.buffer);
        combinedText += `\n --- Source File: ${file.originalname} ---\n` + extracted;
      }
    } else if (req.body.sampleText) {
      combinedText = req.body.sampleText;
      pdfSourceNames.push('Sample_Syllabus.pdf');
    } else {
      return res.status(400).json({ message: 'No PDF files or sample text provided for AI generation.' });
    }

    const mcqs = await generateMCQsFromText(combinedText, Number(questionCount), Number(marksPerQuestion));

    res.json({
      message: 'MCQs generated successfully',
      pdfSourceNames,
      questions: mcqs,
      totalQuestions: mcqs.length
    });
  } catch (error) {
    console.error('MCQ Generation Endpoint Error:', error);
    res.status(500).json({ message: 'Error generating MCQs from PDF', error: error.message });
  }
});

module.exports = router;
