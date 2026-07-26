require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');

const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const testRoutes = require('./routes/testRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));


// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const { getDbDiagnostics } = require('./config/db');
  res.json({
    status: 'online',
    service: 'TestHub SaaS Engine',
    db: getDbDiagnostics(),
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`TestHub Backend Server active on port ${PORT}`);
});