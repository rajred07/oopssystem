/**
 * Exam — Encapsulates all exam metadata, questions, and assignment data.
 *
 * Responsibilities:
 *  - Store course details, duration, passing criteria
 *  - Manage a list of Question objects (array)
 *  - Track which students are assigned
 *  - Calculate total marks and validate invariants
 */
class Exam {
  #examId;
  #courseName;
  #questions = [];      // Question[] — ordered array
  #totalMarks = 0;
  #duration;            // minutes
  #passingMarks;        // percentage (0–100)
  #assignedStudents = [];  // studentId string[]
  #createdAt;

  constructor(courseName, duration, passingMarks, examId = null, createdAt = null) {
    this.#examId       = examId || Exam.generateExamId();
    this.#courseName   = courseName;
    this.#duration     = Number(duration);
    this.#passingMarks = Number(passingMarks);
    this.#createdAt    = createdAt || Date.now();
  }

  // ── Getters ────────────────────────────────────────────────
  get examId()          { return this.#examId; }
  get courseName()      { return this.#courseName; }
  get duration()        { return this.#duration; }
  get passingMarks()    { return this.#passingMarks; }
  get totalMarks()      { return this.#totalMarks; }
  get questions()       { return [...this.#questions]; }
  get assignedStudents(){ return [...this.#assignedStudents]; }
  get createdAt()       { return this.#createdAt; }

  // ── Setters (admin edits) ───────────────────────────────────
  set courseName(val)   { this.#courseName = val; }
  set duration(val)     { this.#duration = Number(val); }
  set passingMarks(val) { this.#passingMarks = Number(val); }

  /** Static: generate a unique exam ID */
  static generateExamId() {
    return 'EX-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  // ── Question Management ────────────────────────────────────
  addQuestion(question) {
    if (!(question instanceof Question)) {
      throw new Error('Only Question instances can be added to an exam.');
    }
    this.#questions.push(question);
    this.#recalcTotalMarks();
  }

  removeQuestion(questionId) {
    const idx = this.#questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      this.#questions.splice(idx, 1);
      this.#recalcTotalMarks();
      return true;
    }
    return false;
  }

  #recalcTotalMarks() {
    this.#totalMarks = this.#questions.reduce((sum, q) => sum + q.marks, 0);
  }

  // ── Student Assignment ─────────────────────────────────────
  assignStudent(studentId) {
    if (!this.#assignedStudents.includes(studentId)) {
      this.#assignedStudents.push(studentId);
    }
  }

  unassignStudent(studentId) {
    this.#assignedStudents = this.#assignedStudents.filter(id => id !== studentId);
  }

  isStudentAssigned(studentId) {
    return this.#assignedStudents.includes(studentId);
  }

  // ── Serialisation ──────────────────────────────────────────
  toJSON() {
    return {
      examId:           this.#examId,
      courseName:       this.#courseName,
      questions:        this.#questions.map(q => q.toJSON()),
      totalMarks:       this.#totalMarks,
      duration:         this.#duration,
      passingMarks:     this.#passingMarks,
      assignedStudents: this.#assignedStudents,
      createdAt:        this.#createdAt
    };
  }

  static fromJSON(data) {
    const exam = new Exam(
      data.courseName, data.duration, data.passingMarks,
      data.examId, data.createdAt
    );
    exam.#assignedStudents = data.assignedStudents || [];
    (data.questions || []).forEach(qData => {
      exam.#questions.push(Question.fromJSON(qData));
    });
    exam.#totalMarks = data.totalMarks || 0;
    return exam;
  }
}
