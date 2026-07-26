const readline = require('readline');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
const bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));

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

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testhub');
  console.log('Connected to MongoDB\n');

  const fullName = (await ask('Teacher Full Name: ')).trim();
  const email = (await ask('Teacher Email: ')).trim().toLowerCase();
  const passwordInput = (await ask('Password (default: teacher123): ')).trim();
  const password = passwordInput || 'teacher123';
  const instituteName = (await ask('Institute Name (press ENTER to skip): ')).trim() || null;

  const existing = await Teacher.findOne({ email });
  if (existing) {
    console.log(`\nError: A teacher with email "${email}" already exists.`);
    rl.close();
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await Teacher.create({
    fullName,
    email,
    passwordHash,
    instituteName,
    createdBy: 'cli_admin',
    isActive: true,
    totalTestsCreated: 0
  });

  console.log('\nTeacher created successfully!');
  console.log(`Name      : ${teacher.fullName}`);
  console.log(`Email     : ${teacher.email}`);
  console.log(`Password  : ${password}`);
  console.log(`Institute : ${teacher.instituteName || 'None'}`);

  rl.close();
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
