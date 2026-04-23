/**
 * seed.js — Pre-loads realistic demo data into localStorage on first visit.
 *
 * This runs BEFORE app.js initializes ExamManager.
 * If data already exists, it does nothing (won't overwrite a logged-in session).
 *
 * Pre-seeded state:
 *  - 5 students (Alice is the "star" demo student)
 *  - 3 exams (Web Tech, DSA, OOP)
 *  - Completed attempts for all students on Exam 1 & 2
 *  - Alice's detailed Web Tech result is ready to view
 */
(function() {
  const STORAGE_KEY = 'examSystemData_v2';

  // Don't overwrite if data already exists
  if (localStorage.getItem(STORAGE_KEY)) return;

  /* ──────────────────────────────────────────────
     FIXED IDs (so everything cross-links correctly)
  ────────────────────────────────────────────── */
  const IDs = {
    // Students
    S_ALICE:  'STU-1714000000000-1001',
    S_BOB:    'STU-1714000000001-1002',
    S_CAROL:  'STU-1714000000002-1003',
    S_DAVID:  'STU-1714000000003-1004',
    S_EVA:    'STU-1714000000004-1005',

    // Exams
    E_WEB:    'EX-1714000000010-2001',
    E_DSA:    'EX-1714000000011-2002',
    E_OOP:    'EX-1714000000012-2003',

    // Questions — Web Tech
    Q_W1: 'Q-1714000000020-3001',
    Q_W2: 'Q-1714000000021-3002',
    Q_W3: 'Q-1714000000022-3003',
    Q_W4: 'Q-1714000000023-3004',
    Q_W5: 'Q-1714000000024-3005',
    Q_W6: 'Q-1714000000025-3006',

    // Questions — DSA
    Q_D1: 'Q-1714000000030-3007',
    Q_D2: 'Q-1714000000031-3008',
    Q_D3: 'Q-1714000000032-3009',
    Q_D4: 'Q-1714000000033-3010',
    Q_D5: 'Q-1714000000034-3011',

    // Questions — OOP
    Q_O1: 'Q-1714000000040-3012',
    Q_O2: 'Q-1714000000041-3013',
    Q_O3: 'Q-1714000000042-3014',
    Q_O4: 'Q-1714000000043-3015',

    // Attempts
    A_ALICE_WEB:  'ATT-1714000000050-4001',
    A_ALICE_DSA:  'ATT-1714000000051-4002',
    A_ALICE_OOP:  'ATT-1714000000052-4003',
    A_BOB_WEB:    'ATT-1714000000053-4004',
    A_BOB_DSA:    'ATT-1714000000054-4005',
    A_CAROL_WEB:  'ATT-1714000000055-4006',
    A_CAROL_DSA:  'ATT-1714000000056-4007',
    A_CAROL_OOP:  'ATT-1714000000057-4008',
    A_DAVID_WEB:  'ATT-1714000000058-4009',
    A_DAVID_OOP:  'ATT-1714000000059-4010',
    A_EVA_WEB:    'ATT-1714000000060-4011',
    A_EVA_DSA:    'ATT-1714000000061-4012',
  };

  /* ──────────────────────────────────────────────
     HELPER — creates submission timestamps spread
     across the last 7 days for realism
  ────────────────────────────────────────────── */
  const daysAgo = (d, extraMs = 0) => Date.now() - (d * 86400000) + extraMs;

  /* ──────────────────────────────────────────────
     STUDENTS  (password = btoa("pass123"))
  ────────────────────────────────────────────── */
  const students = [
    {
      studentId: IDs.S_ALICE, name: 'Alice Johnson', email: 'alice@test.com',
      password: btoa('pass123'),
      enrolledCourses: [],
      attemptHistory: [IDs.A_ALICE_WEB, IDs.A_ALICE_DSA, IDs.A_ALICE_OOP]
    },
    {
      studentId: IDs.S_BOB, name: 'Bob Smith', email: 'bob@test.com',
      password: btoa('pass123'),
      enrolledCourses: [],
      attemptHistory: [IDs.A_BOB_WEB, IDs.A_BOB_DSA]
    },
    {
      studentId: IDs.S_CAROL, name: 'Carol White', email: 'carol@test.com',
      password: btoa('pass123'),
      enrolledCourses: [],
      attemptHistory: [IDs.A_CAROL_WEB, IDs.A_CAROL_DSA, IDs.A_CAROL_OOP]
    },
    {
      studentId: IDs.S_DAVID, name: 'David Kumar', email: 'david@test.com',
      password: btoa('pass123'),
      enrolledCourses: [],
      attemptHistory: [IDs.A_DAVID_WEB, IDs.A_DAVID_OOP]
    },
    {
      studentId: IDs.S_EVA, name: 'Eva Martinez', email: 'eva@test.com',
      password: btoa('pass123'),
      enrolledCourses: [],
      attemptHistory: [IDs.A_EVA_WEB, IDs.A_EVA_DSA]
    }
  ];

  /* ──────────────────────────────────────────────
     EXAMS & QUESTIONS
  ────────────────────────────────────────────── */

  // ── EXAM 1: Advanced Web Technologies ──────────
  // Total marks = 14, Passing = 50%
  const webQuestions = [
    {
      id: IDs.Q_W1, type: 'mcq', marks: 2,
      text: 'Which of the following is NOT a modern JavaScript framework?',
      options: ['React', 'Vue', 'Laravel', 'Angular'],
      correctOption: 2  // Laravel
    },
    {
      id: IDs.Q_W2, type: 'truefalse', marks: 2,
      text: 'Promise.all() waits for all promises to resolve, or rejects as soon as any rejects.',
      correctAnswer: true
    },
    {
      id: IDs.Q_W3, type: 'mcq', marks: 2,
      text: 'What does the "C" in CSS stand for?',
      options: ['Cascading', 'Colorful', 'Computer', 'Creative'],
      correctOption: 0  // Cascading
    },
    {
      id: IDs.Q_W4, type: 'mcq', marks: 2,
      text: 'Which HTTP method is used for partial resource update?',
      options: ['GET', 'POST', 'PATCH', 'DELETE'],
      correctOption: 2  // PATCH
    },
    {
      id: IDs.Q_W5, type: 'descriptive', marks: 4,
      text: 'Explain the concept of Closures in JavaScript and provide a brief use-case.',
      modelAnswer: 'A closure is a function that retains access to its enclosing lexical scope.',
      keywords: ['closure', 'function', 'scope', 'lexical', 'variable', 'access']
    },
    {
      id: IDs.Q_W6, type: 'truefalse', marks: 2,
      text: 'The async/await syntax in JavaScript is built on top of Promises.',
      correctAnswer: true
    }
  ];

  // ── EXAM 2: Data Structures & Algorithms ───────
  // Total marks = 14, Passing = 60%
  const dsaQuestions = [
    {
      id: IDs.Q_D1, type: 'mcq', marks: 2,
      text: 'Which data structure operates on a Last In, First Out (LIFO) principle?',
      options: ['Queue', 'Linked List', 'Stack', 'Tree'],
      correctOption: 2  // Stack
    },
    {
      id: IDs.Q_D2, type: 'truefalse', marks: 2,
      text: 'Binary search can be applied to an unsorted array.',
      correctAnswer: false
    },
    {
      id: IDs.Q_D3, type: 'mcq', marks: 3,
      text: 'What is the time complexity of Merge Sort in the worst case?',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
      correctOption: 1  // O(n log n)
    },
    {
      id: IDs.Q_D4, type: 'descriptive', marks: 5,
      text: 'Describe how a Queue differs from a Stack and give a real-world use-case for each.',
      modelAnswer: 'Stack is LIFO (e.g. undo). Queue is FIFO (e.g. print jobs).',
      keywords: ['stack', 'queue', 'lifo', 'fifo', 'undo', 'schedule', 'print']
    },
    {
      id: IDs.Q_D5, type: 'mcq', marks: 2,
      text: 'Which sorting algorithm has the best average-case time complexity?',
      options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'],
      correctOption: 2  // Quick Sort
    }
  ];

  // ── EXAM 3: Object-Oriented Programming ────────
  // Total marks = 10, Passing = 55%
  const oopQuestions = [
    {
      id: IDs.Q_O1, type: 'mcq', marks: 2,
      text: 'Which OOP principle hides the internal implementation of a class?',
      options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
      correctOption: 2  // Encapsulation
    },
    {
      id: IDs.Q_O2, type: 'truefalse', marks: 2,
      text: 'In JavaScript, a class is syntactic sugar over prototype-based inheritance.',
      correctAnswer: true
    },
    {
      id: IDs.Q_O3, type: 'mcq', marks: 2,
      text: 'Which keyword calls the parent class constructor in JavaScript?',
      options: ['this()', 'parent()', 'super()', 'base()'],
      correctOption: 2  // super()
    },
    {
      id: IDs.Q_O4, type: 'descriptive', marks: 4,
      text: 'Explain polymorphism with a JavaScript example.',
      modelAnswer: 'Polymorphism allows different objects to be treated uniformly through shared interfaces.',
      keywords: ['polymorphism', 'method', 'override', 'class', 'inherit', 'type', 'behavior']
    }
  ];

  const exams = [
    {
      examId: IDs.E_WEB,
      courseName: 'Advanced Web Technologies',
      questions: webQuestions,
      totalMarks: 14,
      duration: 60,
      passingMarks: 50,
      assignedStudents: [IDs.S_ALICE, IDs.S_BOB, IDs.S_CAROL, IDs.S_DAVID, IDs.S_EVA],
      createdAt: daysAgo(10)
    },
    {
      examId: IDs.E_DSA,
      courseName: 'Data Structures & Algorithms',
      questions: dsaQuestions,
      totalMarks: 14,
      duration: 45,
      passingMarks: 60,
      assignedStudents: [IDs.S_ALICE, IDs.S_BOB, IDs.S_CAROL, IDs.S_EVA],
      createdAt: daysAgo(8)
    },
    {
      examId: IDs.E_OOP,
      courseName: 'Object-Oriented Programming',
      questions: oopQuestions,
      totalMarks: 10,
      duration: 30,
      passingMarks: 55,
      assignedStudents: [IDs.S_ALICE, IDs.S_CAROL, IDs.S_DAVID],
      createdAt: daysAgo(6)
    }
  ];

  /* ──────────────────────────────────────────────
     ATTEMPTS with pre-computed scores

     SCORING GUIDE:
       MCQ:         correct option index matched → full marks
       TrueFalse:   boolean match → full marks
       Descriptive: ratio of matched keywords × marks

     Alice's answers (WEB TECH, score = 12/14 = 85.7% → PASS):
       Q_W1 MCQ:  "2" (Laravel) = correct = 2/2  ✓
       Q_W2 T/F:  true          = correct = 2/2  ✓
       Q_W3 MCQ:  "0" (Cascading)= correct= 2/2  ✓
       Q_W4 MCQ:  "2" (PATCH)   = correct = 2/2  ✓
       Q_W5 Desc: mentions 4/6 keywords = 4×(4/6) ≈ 2.5/4
       Q_W6 T/F:  true          = correct = 2/2  ✓
       Total ≈ 12.5 → rounded = 12/14
  ────────────────────────────────────────────── */

  const attempts = [

    // ── ALICE — Web Tech (PASS 85.7%) ─────────────
    {
      attemptId: IDs.A_ALICE_WEB,
      studentId: IDs.S_ALICE, examId: IDs.E_WEB,
      status: 'Completed',
      score: 12,
      startTime: daysAgo(5, -2700000),
      submissionTime: daysAgo(5),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_W1]: '2',     // Laravel — correct ✓
        [IDs.Q_W2]: true,    // correct ✓
        [IDs.Q_W3]: '0',     // Cascading — correct ✓
        [IDs.Q_W4]: '2',     // PATCH — correct ✓
        [IDs.Q_W5]: 'A closure in JavaScript allows a function to retain access to its enclosing scope and lexical variable environment even after the outer function has returned.',
        [IDs.Q_W6]: true     // correct ✓
      }
    },

    // ── ALICE — DSA (PASS 78.6%) ──────────────────
    {
      attemptId: IDs.A_ALICE_DSA,
      studentId: IDs.S_ALICE, examId: IDs.E_DSA,
      status: 'Completed',
      score: 11,
      startTime: daysAgo(4, -2400000),
      submissionTime: daysAgo(4),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_D1]: '2',     // Stack — correct ✓
        [IDs.Q_D2]: false,   // correct ✓
        [IDs.Q_D3]: '1',     // O(n log n) — correct ✓
        [IDs.Q_D4]: 'A Stack is LIFO (Last In First Out) — examples include undo history in editors and function call stack. A Queue is FIFO (First In First Out) — examples include print job scheduling and task queues.',
        [IDs.Q_D5]: '2'      // Quick Sort — correct ✓
      }
    },

    // ── ALICE — OOP (PASS 90%) ───────────────────
    {
      attemptId: IDs.A_ALICE_OOP,
      studentId: IDs.S_ALICE, examId: IDs.E_OOP,
      status: 'Completed',
      score: 9,
      startTime: daysAgo(2, -1500000),
      submissionTime: daysAgo(2),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_O1]: '2',     // Encapsulation — correct ✓
        [IDs.Q_O2]: true,    // correct ✓
        [IDs.Q_O3]: '2',     // super() — correct ✓
        [IDs.Q_O4]: 'Polymorphism allows objects of different classes to be treated as instances of the same base class. Method overriding in a subclass is an example — the same method name behaves differently based on the object type and class inherit structure.'
      }
    },

    // ── BOB — Web Tech (FAIL 42.9%) ──────────────
    {
      attemptId: IDs.A_BOB_WEB,
      studentId: IDs.S_BOB, examId: IDs.E_WEB,
      status: 'Completed',
      score: 6,
      startTime: daysAgo(5, -1800000),
      submissionTime: daysAgo(5, 600000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_W1]: '0',     // React — wrong ✗
        [IDs.Q_W2]: false,   // wrong ✗
        [IDs.Q_W3]: '0',     // correct ✓ 2
        [IDs.Q_W4]: '1',     // POST — wrong ✗
        [IDs.Q_W5]: 'A closure is some kind of function concept.',
        [IDs.Q_W6]: true     // correct ✓ 2
      }
    },

    // ── BOB — DSA (PASS 64.3%) ───────────────────
    {
      attemptId: IDs.A_BOB_DSA,
      studentId: IDs.S_BOB, examId: IDs.E_DSA,
      status: 'Completed',
      score: 9,
      startTime: daysAgo(4, -2000000),
      submissionTime: daysAgo(4, 200000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_D1]: '2',     // correct ✓ 2
        [IDs.Q_D2]: false,   // correct ✓ 2
        [IDs.Q_D3]: '1',     // correct ✓ 3
        [IDs.Q_D4]: 'Stack uses LIFO. Queue uses FIFO.',
        [IDs.Q_D5]: '1'      // Insertion Sort — wrong ✗
      }
    },

    // ── CAROL — Web Tech (PASS 71.4%) ────────────
    {
      attemptId: IDs.A_CAROL_WEB,
      studentId: IDs.S_CAROL, examId: IDs.E_WEB,
      status: 'Completed',
      score: 10,
      startTime: daysAgo(5, -2200000),
      submissionTime: daysAgo(5, 900000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_W1]: '2',     // correct ✓ 2
        [IDs.Q_W2]: true,    // correct ✓ 2
        [IDs.Q_W3]: '0',     // correct ✓ 2
        [IDs.Q_W4]: '3',     // DELETE — wrong ✗
        [IDs.Q_W5]: 'Closures are functions that close over variables in their outer scope.',
        [IDs.Q_W6]: false    // wrong ✗
      }
    },

    // ── CAROL — DSA (FAIL 50%) ───────────────────
    {
      attemptId: IDs.A_CAROL_DSA,
      studentId: IDs.S_CAROL, examId: IDs.E_DSA,
      status: 'Timeout',
      score: 7,
      startTime: daysAgo(4, -3000000),
      submissionTime: daysAgo(4, 600000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_D1]: '2',     // correct ✓ 2
        [IDs.Q_D2]: true,    // wrong ✗
        [IDs.Q_D3]: '1',     // correct ✓ 3
        [IDs.Q_D4]: 'Queue is different from stack in ordering.',
        [IDs.Q_D5]: '0'      // wrong ✗
      }
    },

    // ── CAROL — OOP (PASS 70%) ───────────────────
    {
      attemptId: IDs.A_CAROL_OOP,
      studentId: IDs.S_CAROL, examId: IDs.E_OOP,
      status: 'Completed',
      score: 7,
      startTime: daysAgo(2, -1200000),
      submissionTime: daysAgo(2, 600000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_O1]: '2',     // correct ✓ 2
        [IDs.Q_O2]: true,    // correct ✓ 2
        [IDs.Q_O3]: '0',     // wrong ✗
        [IDs.Q_O4]: 'Polymorphism means many forms. Different classes can override the same method differently.'
      }
    },

    // ── DAVID — Web Tech (PASS 57.1%) ────────────
    {
      attemptId: IDs.A_DAVID_WEB,
      studentId: IDs.S_DAVID, examId: IDs.E_WEB,
      status: 'Completed',
      score: 8,
      startTime: daysAgo(5, -1600000),
      submissionTime: daysAgo(5, 1200000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_W1]: '2',     // correct ✓ 2
        [IDs.Q_W2]: true,    // correct ✓ 2
        [IDs.Q_W3]: '1',     // wrong ✗
        [IDs.Q_W4]: '2',     // correct ✓ 2
        [IDs.Q_W5]: 'A closure captures variables from outer scope.',
        // Q_W6 skipped
      }
    },

    // ── DAVID — OOP (FAIL 40%) ──────────────────
    {
      attemptId: IDs.A_DAVID_OOP,
      studentId: IDs.S_DAVID, examId: IDs.E_OOP,
      status: 'Completed',
      score: 4,
      startTime: daysAgo(2, -900000),
      submissionTime: daysAgo(2, 900000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_O1]: '0',     // wrong ✗
        [IDs.Q_O2]: true,    // correct ✓ 2
        [IDs.Q_O3]: '2',     // correct ✓ 2
        // Q_O4 skipped
      }
    },

    // ── EVA — Web Tech (PASS 78.6%) ──────────────
    {
      attemptId: IDs.A_EVA_WEB,
      studentId: IDs.S_EVA, examId: IDs.E_WEB,
      status: 'Completed',
      score: 11,
      startTime: daysAgo(5, -2000000),
      submissionTime: daysAgo(5, 1800000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_W1]: '2',     // correct ✓ 2
        [IDs.Q_W2]: true,    // correct ✓ 2
        [IDs.Q_W3]: '0',     // correct ✓ 2
        [IDs.Q_W4]: '2',     // correct ✓ 2
        [IDs.Q_W5]: 'Closures allow a function to access outer scope variables even after the outer function has returned. A use case is data privacy through encapsulation.',
        [IDs.Q_W6]: false    // wrong ✗
      }
    },

    // ── EVA — DSA (PASS 71.4%) ───────────────────
    {
      attemptId: IDs.A_EVA_DSA,
      studentId: IDs.S_EVA, examId: IDs.E_DSA,
      status: 'Completed',
      score: 10,
      startTime: daysAgo(4, -1800000),
      submissionTime: daysAgo(4, 1800000),
      timeRemaining: 0,
      stack: [],
      answers: {
        [IDs.Q_D1]: '2',     // correct ✓ 2
        [IDs.Q_D2]: false,   // correct ✓ 2
        [IDs.Q_D3]: '1',     // correct ✓ 3
        [IDs.Q_D4]: 'Stack is LIFO, used for undo operations. Queue is FIFO, used for task scheduling and print queues.',
        [IDs.Q_D5]: '0'      // wrong ✗
      }
    }
  ];

  /* ──────────────────────────────────────────────
     WRITE TO LOCALSTORAGE
  ────────────────────────────────────────────── */
  const payload = { students, exams, attempts };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.log('[ExamSphere] ✅ Seed data loaded successfully.');
    console.log(`  → ${students.length} students | ${exams.length} exams | ${attempts.length} attempts`);
  } catch (e) {
    console.warn('[ExamSphere] Could not seed data:', e.message);
  }
})();
