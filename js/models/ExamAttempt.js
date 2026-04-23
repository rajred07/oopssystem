/**
 * ExamAttempt — Tracks a single student sitting for a single exam.
 *
 * OOP Concepts:
 *  - Full encapsulation of attempt state
 *  - Composes a Stack for answer-undo functionality (LIFO)
 *  - calculateScore() uses polymorphic Question.evaluate()
 *
 * Fields stored per-attempt:
 *  - attemptId, studentId, examId
 *  - answers (object keyed by questionId)
 *  - score, submissionTime, status, startTime, timeRemaining
 *  - answerStack (for undo)
 */
class ExamAttempt {
  #attemptId;
  #studentId;
  #examId;
  #answers = {};         // { [questionId]: answer }
  #score = 0;
  #submissionTime = null;
  #status;               // 'Pending' | 'Completed' | 'Timeout'
  #answerStack;          // Stack of { questionId, answer, prev, timestamp }
  #startTime;
  #timeRemaining;        // milliseconds remaining

  /**
   * @param {string} studentId
   * @param {string} examId
   * @param {string} status
   * @param {string|null} attemptId - supply when rehydrating from storage
   */
  constructor(studentId, examId, status = 'Pending', attemptId = null) {
    this.#studentId  = studentId;
    this.#examId     = examId;
    this.#status     = status;
    this.#attemptId  = attemptId || ExamAttempt.generateAttemptId();
    this.#answerStack = new Stack();
    this.#startTime  = Date.now();
  }

  // ── Getters ────────────────────────────────────────────────
  get attemptId()      { return this.#attemptId; }
  get studentId()      { return this.#studentId; }
  get examId()         { return this.#examId; }
  get answers()        { return { ...this.#answers }; }
  get score()          { return this.#score; }
  get submissionTime() { return this.#submissionTime; }
  get status()         { return this.#status; }
  get timeRemaining()  { return this.#timeRemaining; }
  get startTime()      { return this.#startTime; }

  set timeRemaining(val) { this.#timeRemaining = val; }

  /** Static: produce a unique attempt ID */
  static generateAttemptId() {
    return 'ATT-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  // ── Answer Management ──────────────────────────────────────
  /**
   * Save or update the student's answer for a question.
   * Pushes an undo-able record onto the answer stack.
   */
  saveAnswer(questionId, answer) {
    this.#answerStack.push({
      questionId,
      answer,
      prev: this.#answers[questionId],
      timestamp: Date.now()
    });
    this.#answers[questionId] = answer;
  }

  /**
   * Undo the most recent answer change (LIFO – pops the stack).
   * Restores the previous answer or removes the answer if it was the first selection.
   * @returns {object|null} the popped stack frame, or null if nothing to undo
   */
  undoLastAnswer() {
    const last = this.#answerStack.pop();
    if (!last) return null;

    if (last.prev !== undefined) {
      this.#answers[last.questionId] = last.prev;
    } else {
      delete this.#answers[last.questionId];
    }
    return last;
  }

  /** Count how many questions have been answered */
  answeredCount() { return Object.keys(this.#answers).length; }

  // ── Scoring ────────────────────────────────────────────────
  /**
   * Auto-grade the attempt using polymorphic Question.evaluate().
   * Called by processSubmissionQueue after the attempt is finalised.
   * @param {Exam} exam
   */
  calculateScore(exam) {
    this.#score = 0;
    exam.questions.forEach(q => {
      const studentAns = this.#answers[q.id];
      if (studentAns !== undefined) {
        this.#score += q.evaluate(studentAns);
      }
    });
  }

  /**
   * Determine pass/fail using the exam's passingMarks percentage.
   * @param {Exam} exam
   * @returns {boolean}
   */
  isPassed(exam) {
    if (exam.totalMarks === 0) return false;
    const pc = (this.#score / exam.totalMarks) * 100;
    return pc >= exam.passingMarks;
  }

  setSubmissionTime(time) { this.#submissionTime = time; }
  setStatus(status)       { this.#status = status; }

  // ── Performance Summary ────────────────────────────────────
  /**
   * Returns a detailed per-question breakdown used by the result screen.
   * @param {Exam} exam
   * @returns {Result}
   */
  getPerformanceSummary(exam) {
    const pc = exam.totalMarks > 0 ? (this.#score / exam.totalMarks) * 100 : 0;
    const breakdown = exam.questions.map(q => {
      const studentAnswer = this.#answers[q.id];
      let correctAnswer;
      if (q.type === 'mcq')         correctAnswer = q.correctOption;
      else if (q.type === 'truefalse') correctAnswer = q.correctAnswer;
      else                           correctAnswer = (q.keywords || []).join(', ');

      return {
        questionId:    q.id,
        text:          q.text,
        type:          q.type,
        marks:         q.marks,
        studentAnswer,
        correctAnswer,
        earned: studentAnswer !== undefined ? q.evaluate(studentAnswer) : 0
      };
    });

    return new Result(
      this.#attemptId,
      this.#studentId,
      this.#examId,
      this.#score,
      exam.totalMarks,
      parseFloat(pc.toFixed(2)),
      this.isPassed(exam) ? 'Pass' : 'Fail',
      this.#submissionTime ? (this.#submissionTime - this.#startTime) : 0,
      breakdown
    );
  }

  // ── Serialisation ──────────────────────────────────────────
  toJSON() {
    return {
      attemptId:      this.#attemptId,
      studentId:      this.#studentId,
      examId:         this.#examId,
      answers:        this.#answers,
      score:          this.#score,
      submissionTime: this.#submissionTime,
      status:         this.#status,
      startTime:      this.#startTime,
      timeRemaining:  this.#timeRemaining,
      stack:          this.#answerStack.toArray()
    };
  }

  static fromJSON(data) {
    const att = new ExamAttempt(data.studentId, data.examId, data.status, data.attemptId);
    att.#answers        = data.answers || {};
    att.#score          = data.score || 0;
    att.#submissionTime = data.submissionTime || null;
    att.#startTime      = data.startTime || Date.now();
    att.#timeRemaining  = data.timeRemaining != null ? data.timeRemaining : null;
    if (Array.isArray(data.stack)) {
      data.stack.forEach(frame => att.#answerStack.push(frame));
    }
    return att;
  }
}
