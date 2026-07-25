require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const TestResult = require('./models/TestResult');
const Test = require('./models/Test');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Check teacher Raj Gehlot
  const teacher = await Teacher.findOne({ email: 'raj@mail.com' });
  console.log('=== TEACHER ===');
  console.log('ID:', teacher ? teacher._id.toString() : 'NOT FOUND', 'Email:', teacher ? teacher.email : 'N/A');

  if (!teacher) {
    await mongoose.disconnect();
    return;
  }

  // Tests by this teacher
  const tests = await Test.find({ teacherId: teacher._id });
  console.log('\n=== TEACHER TESTS ===');
  tests.forEach(t => console.log(t._id.toString(), t.testName));
  const testIds = tests.map(t => t._id);

  // Results for those tests
  const results = await TestResult.find({ testId: { $in: testIds } });
  console.log('\n=== TEACHER TEST RESULTS ===');
  results.forEach(r => console.log('pct:', r.percentage, 'testId:', r.testId ? r.testId.toString() : 'null'));

  // Simulate calculation
  const totalStudentsEvaluated = results.length;
  const overallAverage = results.length > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
    : 0;

  console.log('\n=== SIMULATION RESULT ===');
  console.log('Total students evaluated:', totalStudentsEvaluated);
  console.log('Overall average:', overallAverage + '%');

  await mongoose.disconnect();
}
debug().catch(console.error);
