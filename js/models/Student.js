/**
 * Student — Encapsulates student identity, credentials, and history.
 *
 * OOP Concepts:
 *  - Encapsulation: all fields are private (#)
 *  - password stored as base-64 encoded (lightweight obfuscation)
 *  - Static factory methods: generateStudentId(), fromJSON()
 */
class Student {
  #studentId;
  #name;
  #email;
  #password;           // base-64 encoded
  #enrolledCourses = [];
  #attemptHistory = []; // attemptId[]

  /**
   * @param {string} name
   * @param {string} email
   * @param {string} password - plain-text (will be encoded) OR already-encoded if fromJSON
   * @param {string|null} studentId - supply when rehydrating from storage
   */
  constructor(name, email, password, studentId = null) {
    this.#name     = name;
    this.#email    = email;
    // If a studentId is given, assume password is already encoded (fromJSON path)
    this.#password = studentId ? password : btoa(password);
    this.#studentId = studentId || Student.generateStudentId();
  }

  // ── Getters ────────────────────────────────────────────────
  get studentId() { return this.#studentId; }
  get name()      { return this.#name; }
  get email()     { return this.#email; }

  set name(val)   { this.#name = val; }

  /** Static: produce a unique student ID string */
  static generateStudentId() {
    return 'STU-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  // ── Auth ───────────────────────────────────────────────────
  /** Returns true if the supplied plain-text password matches stored hash */
  authenticate(password) {
    return btoa(password) === this.#password;
  }

  /** Change this student's password (provide their current plain-text password first) */
  changePassword(currentPlain, newPlain) {
    if (!this.authenticate(currentPlain)) throw new Error('Current password is incorrect');
    if (newPlain.length < 6) throw new Error('New password must be at least 6 characters');
    this.#password = btoa(newPlain);
  }

  // ── Attempt History ────────────────────────────────────────
  addAttempt(attemptId) {
    if (!this.#attemptHistory.includes(attemptId)) {
      this.#attemptHistory.push(attemptId);
    }
  }

  getAttemptHistory() { return [...this.#attemptHistory]; }

  // ── Serialisation ──────────────────────────────────────────
  toJSON() {
    return {
      studentId:       this.#studentId,
      name:            this.#name,
      email:           this.#email,
      password:        this.#password,
      enrolledCourses: this.#enrolledCourses,
      attemptHistory:  this.#attemptHistory
    };
  }

  static fromJSON(data) {
    const st = new Student(data.name, data.email, data.password, data.studentId);
    st.#enrolledCourses = data.enrolledCourses || [];
    st.#attemptHistory  = data.attemptHistory  || [];
    return st;
  }
}
