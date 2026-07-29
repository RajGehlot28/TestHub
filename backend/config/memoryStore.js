// In-Memory fallback store for zero-config runnability when MongoDB server is not running locally.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateId = () => crypto.randomBytes(12).toString('hex');

const memoryStore = {
  institutes: [],
  teachers: [
    {
      _id: 'teach_1',
      email: 'teacher@apex.edu',
      passwordHash: bcrypt.hashSync('teacher123', 10),
      fullName: 'Dr. Sarah Jenkins',
      instituteId: 'inst_1',
      instituteName: 'Apex Institute of Technology',
      createdBy: 'admin@testhub.com',
      isActive: true,
      totalTestsCreated: 2,
      createdAt: new Date()
    },
    {
      _id: 'teach_2',
      email: 'teacher.independent@gmail.com',
      passwordHash: bcrypt.hashSync('teacher123', 10),
      fullName: 'Prof. Robert Langdon',
      instituteId: null, // No Institute Teacher
      instituteName: null,
      createdBy: 'admin@testhub.com',
      isActive: true,
      totalTestsCreated: 1,
      createdAt: new Date()
    }
  ],
  students: [
    {
      _id: 'stud_1',
      email: 'student@apex.edu',
      name: 'Alex Johnson',
      rollNo: 'CS-2024-042',
      passwordHash: bcrypt.hashSync('student123', 10),
      instituteId: 'inst_1',
      instituteName: 'Apex Institute of Technology',
      isActive: true,
      totalTestsTaken: 2,
      createdAt: new Date()
    },
    {
      _id: 'stud_2',
      email: 'student@gsa.edu',
      name: 'Priya Sharma',
      rollNo: 'GSA-8819',
      passwordHash: bcrypt.hashSync('student123', 10),
      instituteId: 'inst_2',
      instituteName: 'Global Science Academy',
      isActive: true,
      totalTestsTaken: 1,
      createdAt: new Date()
    },
    {
      _id: 'stud_3',
      email: 'free.student@gmail.com',
      name: 'Jordan Lee',
      rollNo: 'IND-9001',
      passwordHash: bcrypt.hashSync('student123', 10),
      instituteId: null, // No Institute Student
      instituteName: null,
      isActive: true,
      totalTestsTaken: 0,
      createdAt: new Date()
    }
  ],
  tests: [
    {
      _id: 'test_101',
      testCode: 'APEX101',
      teacherId: 'teach_1',
      teacherName: 'Dr. Sarah Jenkins',
      instituteId: 'inst_1',
      instituteName: 'Apex Institute of Technology',
      testName: 'Advanced Data Structures & Algorithms',
      description: 'MCQ Assessment covering Binary Trees, Graph Traversal, and Dynamic Programming',
      totalQuestions: 5,
      maxMarks: 5,
      marksPerQuestion: 1,
      duration: 15,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 86400000), // tomorrow
      testDate: new Date().toISOString().split('T')[0],
      pdfSourceNames: ['DSA_Lecture_Notes.pdf'],
      status: 'active',
      createdAt: new Date(),
      questions: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
          options: [
            { optionId: 'A', optionText: 'O(1)' },
            { optionId: 'B', optionText: 'O(log n)' },
            { optionId: 'C', optionText: 'O(n)' },
            { optionId: 'D', optionText: 'O(n log n)' }
          ],
          correctAnswer: 'B',
          marks: 1
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Which data structure follows the Last-In-First-Out (LIFO) principle?',
          options: [
            { optionId: 'A', optionText: 'Queue' },
            { optionId: 'B', optionText: 'Array' },
            { optionId: 'C', optionText: 'Stack' },
            { optionId: 'D', optionText: 'Linked List' }
          ],
          correctAnswer: 'C',
          marks: 1
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Which graph algorithm is used to find the shortest path from a single source node in non-negative weighted graphs?',
          options: [
            { optionId: 'A', optionText: 'Dijkstra\'s Algorithm' },
            { optionId: 'B', optionText: 'Kruskal\'s Algorithm' },
            { optionId: 'C', optionText: 'Bellman-Ford Algorithm' },
            { optionId: 'D', optionText: 'Floyd-Warshall Algorithm' }
          ],
          correctAnswer: 'A',
          marks: 1
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'In dynamic programming, storing the results of expensive function calls to avoid recomputation is called:',
          options: [
            { optionId: 'A', optionText: 'Recursion' },
            { optionId: 'B', optionText: 'Memoization' },
            { optionId: 'C', optionText: 'Backtracking' },
            { optionId: 'D', optionText: 'Greedy Choice' }
          ],
          correctAnswer: 'B',
          marks: 1
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Which sorting algorithm has a worst-case time complexity of O(n^2) but an average-case of O(n log n)?',
          options: [
            { optionId: 'A', optionText: 'Merge Sort' },
            { optionId: 'B', optionText: 'Heap Sort' },
            { optionId: 'C', optionText: 'Quick Sort' },
            { optionId: 'D', optionText: 'Counting Sort' }
          ],
          correctAnswer: 'C',
          marks: 1
        }
      ]
    },
    {
      _id: 'test_102',
      testCode: 'OPEN202',
      teacherId: 'teach_2', // Independent Teacher (no institute)
      teacherName: 'Prof. Robert Langdon',
      instituteId: null,
      instituteName: null,
      testName: 'General Logic & Critical Thinking',
      description: 'Open Assessment accessible to students from any or no institute.',
      totalQuestions: 3,
      maxMarks: 3,
      marksPerQuestion: 1,
      duration: 10,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() + 86400000),
      testDate: new Date().toISOString().split('T')[0],
      pdfSourceNames: ['Logic_Fundamentals.pdf'],
      status: 'active',
      createdAt: new Date(),
      questions: [
        {
          questionId: 'q201',
          questionNumber: 1,
          questionText: 'If all A are B, and all B are C, then:',
          options: [
            { optionId: 'A', optionText: 'All A are C' },
            { optionId: 'B', optionText: 'No A are C' },
            { optionId: 'C', optionText: 'Some A are not C' },
            { optionId: 'D', optionText: 'None of the above' }
          ],
          correctAnswer: 'A',
          marks: 1
        },
        {
          questionId: 'q202',
          questionNumber: 2,
          questionText: 'Which of the following is an example of deductive reasoning?',
          options: [
            { optionId: 'A', optionText: 'Observing 10 white swans and concluding all swans are white' },
            { optionId: 'B', optionText: 'All mammals have hearts; whales are mammals; therefore whales have hearts' },
            { optionId: 'C', optionText: 'Guessing the weather based on a feeling' },
            { optionId: 'D', optionText: 'Predicting stock market trends using historical charts' }
          ],
          correctAnswer: 'B',
          marks: 1
        },
        {
          questionId: 'q203',
          questionNumber: 3,
          questionText: 'Identify the logical fallacy: "You can\'t prove aliens don\'t exist, so they must exist."',
          options: [
            { optionId: 'A', optionText: 'Ad Hominem' },
            { optionId: 'B', optionText: 'Straw Man' },
            { optionId: 'C', optionText: 'Appeal to Ignorance' },
            { optionId: 'D', optionText: 'False Dilemma' }
          ],
          correctAnswer: 'C',
          marks: 1
        }
      ]
    }
  ],
  results: [
    {
      _id: 'res_1',
      testId: 'test_101',
      teacherId: 'teach_1',
      studentId: 'stud_1',
      studentName: 'Alex Johnson',
      studentEmail: 'student@apex.edu',
      rollNo: 'CS-2024-042',
      instituteId: 'inst_1',
      instituteName: 'Apex Institute of Technology',
      answers: [
        { questionId: 'q1', studentAnswer: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q2', studentAnswer: 'C', isCorrect: true, marksObtained: 1 },
        { questionId: 'q3', studentAnswer: 'A', isCorrect: true, marksObtained: 1 },
        { questionId: 'q4', studentAnswer: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q5', studentAnswer: 'A', isCorrect: false, marksObtained: 0 }
      ],
      totalMarksObtained: 4,
      maxMarks: 5,
      percentage: 80,
      startedAt: new Date(Date.now() - 1800000),
      submittedAt: new Date(Date.now() - 1200000),
      timeTaken: 600,
      status: 'submitted',
      createdAt: new Date()
    }
  ]
};

module.exports = { memoryStore, generateId };
