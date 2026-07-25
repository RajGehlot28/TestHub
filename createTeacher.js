const readline = require('readline');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Load dependencies from backend/node_modules
let mongoose, bcrypt;
try {
  mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
  bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));
} catch (e) {
  mongoose = require('mongoose');
  bcrypt = require('bcryptjs');
}

// Schemas
const instituteSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  code: { type: String, required: true },
  city: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const teacherSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
  instituteName: { type: String, default: null },
  createdBy: { type: String, default: 'cli_admin' },
  isActive: { type: Boolean, default: true },
  totalTestsCreated: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Institute = mongoose.models.Institute || mongoose.model('Institute', instituteSchema);
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/testhub';
  
  let isDbConnected = false;
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    isDbConnected = true;
    console.log(`Connected to MongoDB at ${mongoUri}\n`);
  } catch (err) {
    console.log(`Local MongoDB service is offline or unreachable.`);
  }

  // Fetch existing institutes if DB connected
  let existingInstitutes = [];
  if (isDbConnected) {
    try {
      existingInstitutes = await Institute.find();
    } catch (err) {}
  }

  // 1. Full Name
  let fullName = '';
  while (!fullName.trim()) {
    fullName = await askQuestion('Enter Teacher Full Name (e.g. Dr. Raj Gehlot): ');
  }

  // 2. Email Address
  let email = '';
  while (!email.trim()) {
    email = await askQuestion('Enter Teacher Email Address: ');
  }
  email = email.trim().toLowerCase();

  // Check if exists in Teacher or Student collection
  if (isDbConnected) {
    const StudentModel = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ email: String }));
    const existingStudent = await StudentModel.findOne({ email });
    if (existingStudent) {
      console.log(`\nError: A student account with email "${email}" already exists. Teachers and Students must use distinct emails.`);
      rl.close();
      await mongoose.disconnect();
      return;
    }

    const existing = await Teacher.findOne({ email });
    if (existing) {
      console.log(`\nError: A teacher with email "${email}" already exists in MongoDB.`);
      rl.close();
      await mongoose.disconnect();
      return;
    }
  }

  // 3. Password
  let rawPassword = await askQuestion('Enter Password (default: teacher123): ');
  let password = rawPassword.trim() || 'teacher123';

  // 4. Institute Assignment (Optional)
  console.log('\nInstitute Association (Optional):');
  if (existingInstitutes.length > 0) {
    console.log('Existing Institutes in Database:');
    existingInstitutes.forEach((inst, idx) => {
      console.log(`  [${idx + 1}] ${inst.instituteName} (${inst.code})`);
    });
    console.log(`  [0] None / Independent Teacher (No Institute)`);
    console.log(`  [N] Create New Institute`);
  } else {
    console.log('  Enter Institute Name, or press ENTER for None (Independent Teacher).');
  }

  let selectedInstituteId = null;
  let selectedInstituteName = null;

  const instChoice = await askQuestion('\nChoice / Institute Name: ');
  const trimmedChoice = instChoice.trim();

  if (trimmedChoice) {
    const numChoice = parseInt(trimmedChoice, 10);
    if (!isNaN(numChoice) && numChoice > 0 && numChoice <= existingInstitutes.length) {
      const selected = existingInstitutes[numChoice - 1];
      selectedInstituteId = selected._id;
      selectedInstituteName = selected.instituteName;
    } else if (trimmedChoice.toLowerCase() !== '0' && trimmedChoice.toLowerCase() !== 'none') {
      // User typed a custom Institute Name
      selectedInstituteName = trimmedChoice;

      if (isDbConnected) {
        let instObj = await Institute.findOne({ instituteName: selectedInstituteName });
        if (!instObj) {
          const code = selectedInstituteName.substring(0, 4).toUpperCase() + Math.floor(10 + Math.random() * 90);
          instObj = await Institute.create({
            instituteName: selectedInstituteName,
            code,
            city: 'Main Campus'
          });
          console.log(`Created new Institute record: "${selectedInstituteName}" (Code: ${code})`);
        }
        selectedInstituteId = instObj._id;
      }
    }
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newTeacherObj = {
    fullName: fullName.trim(),
    email,
    passwordHash,
    instituteId: selectedInstituteId,
    instituteName: selectedInstituteName || null,
    createdBy: 'cli_admin',
    isActive: true,
    totalTestsCreated: 0,
    createdAt: new Date()
  };

  if (isDbConnected) {
    const createdTeacher = await Teacher.create(newTeacherObj);
    console.log('SUCCESS: Teacher Account Created in MongoDB Database!');
    console.log(`Teacher ID    : ${createdTeacher._id}`);
    console.log(`Full Name     : ${createdTeacher.fullName}`);
    console.log(`Email        : ${createdTeacher.email}`);
    console.log(`Password     : ${password}`);
    console.log(`Institute     : ${createdTeacher.instituteName || 'None (Independent Teacher)'}`);
  } else {
    console.log('SUCCESS: Teacher Account Credentials Prepared!');
    console.log(`Full Name  : ${newTeacherObj.fullName}`);
    console.log(`Email     : ${newTeacherObj.email}`);
    console.log(`Password  : ${password}`);
    console.log(`Institute  : ${newTeacherObj.instituteName || 'None (Independent Teacher)'}`);
  }

  console.log('Next Step: You can now log into the web application as this teacher at:');
  console.log('http://localhost:3000/login-teacher\n');

  rl.close();
  if (isDbConnected) {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Error running createTeacher script:', err);
  rl.close();
  process.exit(1);
});
