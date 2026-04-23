/**
 * Result — Value Object that stores the outcome of a single exam attempt.
 *
 * This is a dedicated Result class (as required by the OOP spec).
 * It is created exclusively by ExamAttempt.getPerformanceSummary().
 * It carries no mutable state — all properties are read-only.
 *
 * OOP Role: Separates result representation from attempt logic.
 */
class Result {
  #attemptId;
  #studentId;
  #examId;
  #score;
  #total;
  #percentage;
  #status;       // 'Pass' | 'Fail'
  #timeTaken;    // milliseconds
  #questionBreakdown; // array of per-question objects

  constructor(attemptId, studentId, examId, score, total, percentage, status, timeTaken, questionBreakdown) {
    this.#attemptId         = attemptId;
    this.#studentId         = studentId;
    this.#examId            = examId;
    this.#score             = score;
    this.#total             = total;
    this.#percentage        = percentage;
    this.#status            = status;
    this.#timeTaken         = timeTaken;
    this.#questionBreakdown = questionBreakdown;
  }

  get attemptId()          { return this.#attemptId; }
  get studentId()          { return this.#studentId; }
  get examId()             { return this.#examId; }
  get score()              { return this.#score; }
  get total()              { return this.#total; }
  get percentage()         { return this.#percentage; }
  get status()             { return this.#status; }
  get timeTaken()          { return this.#timeTaken; }
  get questionBreakdown()  { return this.#questionBreakdown; }

  /** Formats timeTaken (ms) as "Xm Ys" */
  get formattedTime() {
    const totalSecs = Math.floor(this.#timeTaken / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  }

  isPassed() { return this.#status === 'Pass'; }

  /** Serialize to a plain object (for display or logging) */
  toObject() {
    return {
      attemptId:         this.#attemptId,
      studentId:         this.#studentId,
      examId:            this.#examId,
      score:             this.#score,
      total:             this.#total,
      percentage:        this.#percentage,
      status:            this.#status,
      timeTaken:         this.#timeTaken,
      questionBreakdown: this.#questionBreakdown
    };
  }
}
