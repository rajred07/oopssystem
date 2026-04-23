/**
 * ExamManager — Singleton service layer (core business logic).
 *
 * OOP Concepts:
 *  - Singleton Pattern via static #instance
 *  - Encapsulation: all data arrays are private
 *  - Composes Queue (FIFO) for async-simulated submission pipeline
 *
 * Responsibilities:
 *  - Student & Exam CRUD
 *  - Auth (admin + student)
 *  - Attempt lifecycle (start, save, submit, process)
 *  - Scoring, pass/fail determination
 *  - Report generation (merit list, student report, analytics)
 *  - Persistence via localStorage
 *  - Sorting via SortUtils
 */
class ExamManager {
  static #instance = null;

  #students = [];         // Student[]
  #exams    = [];         // Exam[]
  #attempts = [];         // ExamAttempt[]
  #submissionQueue = new Queue();  // FIFO — queued on submit, drained by processor
  #currentUser     = null;         // Student | 'admin'
  #currentUserType = null;         // 'student' | 'admin'

  // ── Singleton ──────────────────────────────────────────────
  constructor() {
    if (ExamManager.#instance) return ExamManager.#instance;
    ExamManager.#instance = this;
  }

  static getInstance() {
    if (!ExamManager.#instance) {
      ExamManager.#instance = new ExamManager();
    }
    return ExamManager.#instance;
  }

  // ── Accessors ──────────────────────────────────────────────
  get currentUser()     { return this.#currentUser; }
  get currentUserType() { return this.#currentUserType; }
  get students()        { return this.#students; }
  get exams()           { return this.#exams; }
  get attempts()        { return this.#attempts; }

  // ──────────────────────────────────────────────────────────
  // AUTH
  // ──────────────────────────────────────────────────────────
  /** Admin login — hardcoded password for demo */
  adminLogin(password) {
    if (password === 'admin123') {
      this.#currentUser     = 'admin';
      this.#currentUserType = 'admin';
      return true;
    }
    return false;
  }

  studentLogin(email, password) {
    const student = this.#students.find(s => s.email === email);
    if (student && student.authenticate(password)) {
      this.#currentUser     = student;
      this.#currentUserType = 'student';
      return true;
    }
    return false;
  }

  logout() {
    this.#currentUser     = null;
    this.#currentUserType = null;
  }

  // ──────────────────────────────────────────────────────────
  // STUDENT CRUD
  // ──────────────────────────────────────────────────────────
  registerStudent(name, email, password) {
    if (!name || !name.trim()) throw new Error('Student name is required');
    if (this.#students.some(s => s.email === email))
      throw new Error('This email is already registered');
    if (password.length < 6)
      throw new Error('Password must be at least 6 characters');

    const student = new Student(name.trim(), email.toLowerCase().trim(), password);
    this.#students.push(student);
    this.persist();
    return student;
  }

  getStudentById(id) { return this.#students.find(s => s.studentId === id) || null; }
  getAllStudents()    { return [...this.#students]; }

  updateStudentName(studentId, newName) {
    const student = this.getStudentById(studentId);
    if (!student) throw new Error('Student not found');
    if (!newName || !newName.trim()) throw new Error('Name cannot be empty');
    student.name = newName.trim();
    this.persist();
  }

  deleteStudent(studentId) {
    this.#students = this.#students.filter(s => s.studentId !== studentId);
    this.persist();
  }

  // ──────────────────────────────────────────────────────────
  // EXAM CRUD
  // ──────────────────────────────────────────────────────────
  createExam(courseName, duration, passingMarks) {
    if (!courseName || !courseName.trim()) throw new Error('Course name is required');
    duration     = Number(duration);
    passingMarks = Number(passingMarks);
    if (duration <= 0)                        throw new Error('Duration must be greater than 0 minutes');
    if (passingMarks <= 0 || passingMarks > 100) throw new Error('Passing marks must be between 1% and 100%');

    const exam = new Exam(courseName.trim(), duration, passingMarks);
    this.#exams.push(exam);
    this.persist();
    return exam;
  }

  getExamById(id) { return this.#exams.find(e => e.examId === id) || null; }

  deleteExam(examId) {
    this.#attempts = this.#attempts.filter(a => a.examId !== examId);
    this.#exams    = this.#exams.filter(e => e.examId !== examId);
    this.persist();
  }

  updateExamSettings(examId, courseName, duration, passingMarks) {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found');
    duration     = Number(duration);
    passingMarks = Number(passingMarks);
    if (!courseName || !courseName.trim()) throw new Error('Course name is required');
    if (duration <= 0)                        throw new Error('Duration must be greater than 0 minutes');
    if (passingMarks <= 0 || passingMarks > 100) throw new Error('Passing marks must be 1–100%');

    exam.courseName   = courseName.trim();
    exam.duration     = duration;
    exam.passingMarks = passingMarks;
    this.persist();
  }

  // ──────────────────────────────────────────────────────────
  // QUESTION MANAGEMENT
  // ──────────────────────────────────────────────────────────
  addQuestionToExam(examId, questionData) {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found');
    if (!questionData.text || !questionData.text.trim()) throw new Error('Question text is required');
    if (!questionData.marks || Number(questionData.marks) <= 0) throw new Error('Question marks must be greater than 0');

    let q;
    if (questionData.type === 'mcq') {
      const opts = (questionData.options || []).map(o => (o || '').trim());
      if (opts.some(o => !o)) throw new Error('All 4 MCQ options must be filled in');
      if (questionData.correctOption === undefined || questionData.correctOption === null || questionData.correctOption === '')
        throw new Error('Correct option must be selected');
      q = new MCQQuestion(questionData.text.trim(), questionData.marks, opts, questionData.correctOption);

    } else if (questionData.type === 'truefalse') {
      if (questionData.correctAnswer === undefined) throw new Error('Correct answer must be specified');
      q = new TrueFalseQuestion(questionData.text.trim(), questionData.marks, questionData.correctAnswer);

    } else if (questionData.type === 'descriptive') {
      if (!questionData.keywords || !questionData.keywords.toString().trim())
        throw new Error('At least one keyword is required for descriptive questions');
      q = new DescriptiveQuestion(
        questionData.text.trim(), questionData.marks,
        questionData.modelAnswer || '', questionData.keywords
      );
    } else {
      throw new Error(`Unknown question type: "${questionData.type}"`);
    }

    exam.addQuestion(q);
    this.persist();
    return q;
  }

  removeQuestionFromExam(examId, questionId) {
    const exam = this.getExamById(examId);
    if (exam) {
      exam.removeQuestion(questionId);
      this.persist();
    }
  }

  // ──────────────────────────────────────────────────────────
  // STUDENT–EXAM ASSIGNMENT
  // ──────────────────────────────────────────────────────────
  assignExamToStudent(examId, studentId) {
    const exam    = this.getExamById(examId);
    const student = this.getStudentById(studentId);
    if (!exam)    throw new Error('Exam not found');
    if (!student) throw new Error('Student not found');
    if (exam.questions.length === 0) throw new Error('Cannot assign an exam with no questions');
    exam.assignStudent(studentId);
    this.persist();
  }

  unassignExamFromStudent(examId, studentId) {
    const exam = this.getExamById(examId);
    if (exam) { exam.unassignStudent(studentId); this.persist(); }
  }

  getExamsForStudent(studentId) {
    return this.#exams.filter(e => e.isStudentAssigned(studentId));
  }

  // ──────────────────────────────────────────────────────────
  // ATTEMPT LIFECYCLE
  // ──────────────────────────────────────────────────────────
  /** 
   * Edge-case handling:
   *  - Duplicate attempt prevention (Completed/Timeout)
   *  - Resume a Pending attempt if time still remains
   *  - Auto-timeout a Pending attempt whose time has elapsed
   */
  hasCompletedAttempt(studentId, examId) {
    return this.#attempts.some(
      a => a.studentId === studentId && a.examId === examId &&
           (a.status === 'Completed' || a.status === 'Timeout')
    );
  }

  startAttempt(studentId, examId) {
    if (this.hasCompletedAttempt(studentId, examId))
      throw new Error('You have already completed this exam. Duplicate attempts are not allowed.');

    // Check for a resumable Pending attempt
    const existing = this.#attempts.find(
      a => a.studentId === studentId && a.examId === examId && a.status === 'Pending'
    );
    if (existing) {
      const exam    = this.getExamById(examId);
      const elapsed = Date.now() - existing.startTime;
      const remainMs = (exam.duration * 60000) - elapsed;
      if (remainMs <= 0) {
        this.submitAttempt(existing.attemptId, 'timeout');
        throw new Error('Your time for this exam has already expired.');
      }
      existing.timeRemaining = remainMs;
      return existing.attemptId;
    }

    // New attempt
    const exam = this.getExamById(examId);
    if (!exam)                            throw new Error('Exam not found');
    if (!exam.isStudentAssigned(studentId)) throw new Error('This exam is not assigned to you');
    if (exam.questions.length === 0)      throw new Error('Exam has no questions');

    const attempt = new ExamAttempt(studentId, examId, 'Pending');
    attempt.timeRemaining = exam.duration * 60000;
    this.#attempts.push(attempt);

    const student = this.getStudentById(studentId);
    student.addAttempt(attempt.attemptId);
    this.persist();

    return attempt.attemptId;
  }

  getAttemptById(id) { return this.#attempts.find(a => a.attemptId === id) || null; }

  /**
   * Finalise an attempt and enqueue it for async score processing.
   * @param {string} attemptId
   * @param {'manual'|'timeout'} triggerType
   */
  submitAttempt(attemptId, triggerType) {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return;

    attempt.setStatus(triggerType === 'timeout' ? 'Timeout' : 'Completed');
    this.#submissionQueue.enqueue({
      attemptId:   attempt.attemptId,
      studentId:   attempt.studentId,
      examId:      attempt.examId,
      submittedAt: Date.now()
    });

    // Simulate async backend queue processing
    setTimeout(() => this.processSubmissionQueue(), 0);
  }

  /**
   * Drains the submission queue (FIFO).
   * Calculates scores and sets submission timestamps.
   */
  processSubmissionQueue() {
    while (!this.#submissionQueue.isEmpty()) {
      const job     = this.#submissionQueue.dequeue();
      const attempt = this.getAttemptById(job.attemptId);
      const exam    = this.getExamById(job.examId);
      if (attempt && exam) {
        attempt.calculateScore(exam);
        attempt.setSubmissionTime(job.submittedAt);
      }
      this.persist();
    }
  }

  // ──────────────────────────────────────────────────────────
  // RESULTS & REPORTS
  // ──────────────────────────────────────────────────────────
  /** Returns a Result object for a given attempt */
  getAttemptResult(attemptId) {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return null;
    const exam = this.getExamById(attempt.examId);
    if (!exam) return null;
    return attempt.getPerformanceSummary(exam);
  }

  /** Returns an array of result summaries for all completed attempts by a student */
  getStudentReport(studentId) {
    return this.#attempts
      .filter(a => a.studentId === studentId && (a.status === 'Completed' || a.status === 'Timeout'))
      .map(a => {
        const exam = this.getExamById(a.examId);
        if (!exam) return null;
        const pc = exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0;
        return {
          attemptId:  a.attemptId,
          examId:     a.examId,
          examName:   exam.courseName,
          score:      a.score,
          total:      exam.totalMarks,
          percentage: pc,
          status:     a.isPassed(exam) ? 'Pass' : 'Fail',
          date:       a.submissionTime
        };
      })
      .filter(Boolean);
  }

  // ──────────────────────────────────────────────────────────
  // SORTING & ANALYTICS
  // ──────────────────────────────────────────────────────────
  /** Merit list — students sorted by score DESC for a given exam (mergeSort) */
  getMeritList(examId) {
    const exam = this.getExamById(examId);
    if (!exam) return [];
    const completed = this.#attempts.filter(
      a => a.examId === examId && (a.status === 'Completed' || a.status === 'Timeout')
    );
    const sorted = SortUtils.mergeSort(completed, (a, b) => b.score - a.score);
    return sorted.map((a, index) => {
      const student = this.getStudentById(a.studentId);
      const pc = exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0;
      return {
        rank:          index + 1,
        name:          student ? student.name : 'Unknown',
        studentId:     a.studentId,
        score:         a.score,
        total:         exam.totalMarks,
        percentage:    pc,
        status:        a.isPassed(exam) ? 'Pass' : 'Fail',
        timeSubmitted: a.submissionTime
      };
    });
  }

  /** Sort attempts by submission time ASC for a given exam (insertionSort) */
  getAttemptsSortedBySubmissionTime(examId) {
    const attempts = this.#attempts.filter(a => a.examId === examId && a.submissionTime);
    return SortUtils.insertionSort(attempts, (a, b) => a.submissionTime - b.submissionTime);
  }

  /** Top N students by average score across all exams (mergeSort) */
  getTopPerformers(n = 5) {
    const averages = this.#students.map(student => {
      const report = this.getStudentReport(student.studentId);
      const avg = report.length
        ? report.reduce((acc, r) => acc + r.percentage, 0) / report.length
        : 0;
      return { name: student.name, studentId: student.studentId, avg, attempts: report.length };
    });
    return SortUtils.mergeSort(averages, (a, b) => b.avg - a.avg).slice(0, n);
  }

  /** Students below a given average % threshold — potential at-risk students */
  getLowScorers(threshold = 40) {
    const averages = this.#students.map(student => {
      const report = this.getStudentReport(student.studentId);
      if (report.length === 0) return null;
      const avg = report.reduce((acc, r) => acc + r.percentage, 0) / report.length;
      return { student, avg };
    }).filter(x => x && x.avg < threshold && x.avg >= 0);
    return SortUtils.mergeSort(averages, (a, b) => a.avg - b.avg);
  }

  /** System-wide analytics summary */
  getAnalytics() {
    const completed = this.#attempts.filter(a => a.status === 'Completed' || a.status === 'Timeout');
    let passCount = 0;
    completed.forEach(a => {
      const exam = this.getExamById(a.examId);
      if (exam && a.isPassed(exam)) passCount++;
    });
    const passRate = completed.length ? ((passCount / completed.length) * 100).toFixed(1) : 0;
    return {
      totalStudents: this.#students.length,
      totalExams:    this.#exams.length,
      totalAttempts: this.#attempts.length,
      completed:     completed.length,
      passRate
    };
  }

  // ──────────────────────────────────────────────────────────
  // PERSISTENCE
  // ──────────────────────────────────────────────────────────
  persist() {
    try {
      const data = {
        students: this.#students.map(s => s.toJSON()),
        exams:    this.#exams.map(e => e.toJSON()),
        attempts: this.#attempts.map(a => a.toJSON())
      };
      localStorage.setItem('examSystemData_v2', JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        Toast.show('Storage full — please export and clear old data', 'error');
      }
    }
  }

  load() {
    try {
      const dataStr = localStorage.getItem('examSystemData_v2')
                   || localStorage.getItem('examSystemData'); // legacy key migration
      if (dataStr) {
        const parsed      = JSON.parse(dataStr);
        this.#students    = (parsed.students || []).map(s => Student.fromJSON(s));
        this.#exams       = (parsed.exams    || []).map(e => Exam.fromJSON(e));
        this.#attempts    = (parsed.attempts || []).map(a => ExamAttempt.fromJSON(a));
      }
    } catch (e) {
      console.warn('Could not load stored data, starting fresh.', e);
    }
  }

  clearAllData() {
    this.#students = [];
    this.#exams    = [];
    this.#attempts = [];
    localStorage.removeItem('examSystemData_v2');
    localStorage.removeItem('examSystemData');
    this.logout();
  }

  // ──────────────────────────────────────────────────────────
  // SEED DATA — Rich demo dataset for testing
  // ──────────────────────────────────────────────────────────
  seedDemoData() {
    // ── Students ──────────────────────────────────────────────
    const s1 = this.registerStudent('Alice Johnson',  'alice@test.com',  'pass123');
    const s2 = this.registerStudent('Bob Smith',      'bob@test.com',    'pass123');
    const s3 = this.registerStudent('Carol White',    'carol@test.com',  'pass123');
    const s4 = this.registerStudent('David Kumar',    'david@test.com',  'pass123');
    const s5 = this.registerStudent('Eva Martinez',   'eva@test.com',    'pass123');

    // ── Exam 1: Web Technologies ──────────────────────────────
    const e1 = this.createExam('Advanced Web Technologies', 60, 50);
    this.addQuestionToExam(e1.examId, {
      type: 'mcq', marks: 2,
      text: 'Which of the following is NOT a modern JavaScript framework?',
      options: ['React', 'Vue', 'Laravel', 'Angular'], correctOption: 2
    });
    this.addQuestionToExam(e1.examId, {
      type: 'truefalse', marks: 2,
      text: 'Promise.all() waits for all promises to resolve, or rejects as soon as any rejects.',
      correctAnswer: true
    });
    this.addQuestionToExam(e1.examId, {
      type: 'mcq', marks: 2,
      text: 'What does the "C" in CSS stand for?',
      options: ['Cascading', 'Colorful', 'Computer', 'Creative'], correctOption: 0
    });
    this.addQuestionToExam(e1.examId, {
      type: 'mcq', marks: 2,
      text: 'Which HTTP method is used to update an existing resource (partial update)?',
      options: ['GET', 'POST', 'PATCH', 'DELETE'], correctOption: 2
    });
    this.addQuestionToExam(e1.examId, {
      type: 'descriptive', marks: 4,
      text: 'Explain the concept of Closures in JavaScript and provide a brief use-case.',
      modelAnswer: 'A closure is a function that retains access to its enclosing scope even after the scope has closed.',
      keywords: 'closure,function,scope,lexical,variable,access'
    });
    this.addQuestionToExam(e1.examId, {
      type: 'truefalse', marks: 2,
      text: 'The "async/await" syntax in JavaScript is built on top of Promises.',
      correctAnswer: true
    });
    [s1, s2, s3, s4, s5].forEach(s => this.assignExamToStudent(e1.examId, s.studentId));

    // ── Exam 2: Data Structures & Algorithms ──────────────────
    const e2 = this.createExam('Data Structures & Algorithms', 45, 60);
    this.addQuestionToExam(e2.examId, {
      type: 'mcq', marks: 2,
      text: 'Which data structure operates on a Last In, First Out (LIFO) principle?',
      options: ['Queue', 'Linked List', 'Stack', 'Tree'], correctOption: 2
    });
    this.addQuestionToExam(e2.examId, {
      type: 'truefalse', marks: 2,
      text: 'Binary search can be applied to an unsorted array.',
      correctAnswer: false
    });
    this.addQuestionToExam(e2.examId, {
      type: 'mcq', marks: 3,
      text: 'What is the time complexity of Merge Sort in the worst case?',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctOption: 1
    });
    this.addQuestionToExam(e2.examId, {
      type: 'descriptive', marks: 5,
      text: 'Describe how a Queue differs from a Stack and give a real-world use-case for each.',
      modelAnswer: 'A Stack is LIFO (e.g. undo history). A Queue is FIFO (e.g. print jobs, task scheduling).',
      keywords: 'stack,queue,lifo,fifo,undo,schedule,print'
    });
    this.addQuestionToExam(e2.examId, {
      type: 'mcq', marks: 2,
      text: 'Which sorting algorithm has the best average-case time complexity?',
      options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'], correctOption: 2
    });
    [s1, s2, s3, s4].forEach(s => this.assignExamToStudent(e2.examId, s.studentId));

    // ── Exam 3: OOP Principles ────────────────────────────────
    const e3 = this.createExam('Object-Oriented Programming', 30, 55);
    this.addQuestionToExam(e3.examId, {
      type: 'mcq', marks: 2,
      text: 'Which OOP principle hides the internal implementation of a class?',
      options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'], correctOption: 2
    });
    this.addQuestionToExam(e3.examId, {
      type: 'truefalse', marks: 2,
      text: 'In JavaScript, a class is syntactic sugar over prototype-based inheritance.',
      correctAnswer: true
    });
    this.addQuestionToExam(e3.examId, {
      type: 'mcq', marks: 2,
      text: 'Which keyword is used to call the parent class constructor in JavaScript?',
      options: ['this()', 'parent()', 'super()', 'base()'], correctOption: 2
    });
    this.addQuestionToExam(e3.examId, {
      type: 'descriptive', marks: 4,
      text: 'Explain polymorphism with an example in JavaScript.',
      modelAnswer: 'Polymorphism allows objects of different types to be treated as the same base type. A method can behave differently based on the object calling it.',
      keywords: 'polymorphism,method,override,class,inherit,type,behavior'
    });
    [s1, s3, s5].forEach(s => this.assignExamToStudent(e3.examId, s.studentId));

    Toast.show('🎉 Demo data seeded! Login as alice@test.com / pass123 to explore.', 'success');
  }
}
