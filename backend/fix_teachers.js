require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

async function fixTeachers() {
  await mongoose.connect(process.env.MONGODB_URI);

  const teachers = await Teacher.find({});
  console.log('=== ALL TEACHERS ===');
  teachers.forEach(t => console.log('email:', t.email, 'fullName:', t.fullName, 'id:', t._id.toString()));

  // Reset both teachers to known passwords
  const hash1 = await bcrypt.hash('teacher123', 10);
  await Teacher.updateOne({ email: 'raj@mail.com' }, { passwordHash: hash1 });
  console.log('\nReset raj@mail.com password to: teacher123');

  const hash2 = await bcrypt.hash('raj123', 10);
  await Teacher.updateOne({ email: 'raj1@mail.com' }, { passwordHash: hash2 });
  console.log('Reset raj1@mail.com password to: raj123');

  // Verify
  const t1 = await Teacher.findOne({ email: 'raj@mail.com' });
  const t2 = await Teacher.findOne({ email: 'raj1@mail.com' });

  const m1 = await bcrypt.compare('teacher123', t1.passwordHash);
  const m2 = await bcrypt.compare('raj123', t2.passwordHash);

  console.log('\n=== VERIFICATION ===');
  console.log('raj@mail.com + teacher123 =>', m1 ? 'PASS' : 'FAIL');
  console.log('raj1@mail.com + raj123 =>', m2 ? 'PASS' : 'FAIL');

  await mongoose.disconnect();
}
fixTeachers().catch(console.error);
