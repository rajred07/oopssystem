/**
 * Question — Abstract base class using OOP polymorphism.
 * Subclasses override evaluate() with their own scoring logic.
 *
 * Hierarchy:
 *   Question (base)
 *   ├── MCQQuestion      (Multiple Choice)
 *   ├── TrueFalseQuestion (True/False)
 *   └── DescriptiveQuestion (Keyword-based partial scoring)
 */
class Question {
  #id; #text; #marks; #type;

  constructor(text, marks, type, id = null) {
    if (new.target === Question) {
      throw new Error('Question is an abstract class and cannot be instantiated directly.');
    }
    this.#text = text;
    this.#marks = Number(marks);
    this.#type = type;
    this.#id = id || Question.generateId();
  }

  get id()    { return this.#id; }
  get text()  { return this.#text; }
  get marks() { return this.#marks; }
  get type()  { return this.#type; }

  /** Static utility — generates a unique Question ID */
  static generateId() {
    return 'Q-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  /**
   * Polymorphic evaluate — overridden by each subclass.
   * @param {*} answer — the student's submitted answer
   * @returns {number} marks earned
   */
  evaluate(answer) { return 0; }

  toJSON() {
    return { id: this.#id, text: this.#text, marks: this.#marks, type: this.#type };
  }

  /** Factory method — reconstructs the correct subclass from persisted JSON */
  static fromJSON(data) {
    switch (data.type) {
      case 'mcq':         return MCQQuestion.fromJSON(data);
      case 'truefalse':   return TrueFalseQuestion.fromJSON(data);
      case 'descriptive': return DescriptiveQuestion.fromJSON(data);
      default: throw new Error(`Unknown question type: "${data.type}"`);
    }
  }
}

/* ─────────────────────────────────────────────────────────── */
/* MCQQuestion — Multiple Choice, single correct answer        */
/* ─────────────────────────────────────────────────────────── */
class MCQQuestion extends Question {
  #options;        // string[]
  #correctOption;  // index (0–3)

  constructor(text, marks, options, correctOption, id = null) {
    super(text, marks, 'mcq', id);
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error('MCQ must have at least 2 options');
    }
    this.#options = options;
    this.#correctOption = Number(correctOption);
  }

  get options()       { return [...this.#options]; }
  get correctOption() { return this.#correctOption; }

  /** Returns full marks if the selected option index matches, else 0 */
  evaluate(answer) {
    return Number(answer) === this.#correctOption ? this.marks : 0;
  }

  toJSON() {
    return { ...super.toJSON(), options: this.#options, correctOption: this.#correctOption };
  }

  static fromJSON(data) {
    return new MCQQuestion(data.text, data.marks, data.options, data.correctOption, data.id);
  }
}

/* ─────────────────────────────────────────────────────────── */
/* TrueFalseQuestion — binary true/false answer                */
/* ─────────────────────────────────────────────────────────── */
class TrueFalseQuestion extends Question {
  #correctAnswer; // boolean

  constructor(text, marks, correctAnswer, id = null) {
    super(text, marks, 'truefalse', id);
    this.#correctAnswer = Boolean(correctAnswer);
  }

  get correctAnswer() { return this.#correctAnswer; }

  evaluate(answer) {
    const ansBool = answer === 'true' || answer === true;
    return ansBool === this.#correctAnswer ? this.marks : 0;
  }

  toJSON() {
    return { ...super.toJSON(), correctAnswer: this.#correctAnswer };
  }

  static fromJSON(data) {
    return new TrueFalseQuestion(data.text, data.marks, data.correctAnswer, data.id);
  }
}

/* ─────────────────────────────────────────────────────────── */
/* DescriptiveQuestion — keyword-matching partial scoring      */
/* ─────────────────────────────────────────────────────────── */
class DescriptiveQuestion extends Question {
  #modelAnswer;
  #keywords; // string[] — must appear in student's answer

  constructor(text, marks, modelAnswer, keywords, id = null) {
    super(text, marks, 'descriptive', id);
    this.#modelAnswer = modelAnswer;
    this.#keywords = Array.isArray(keywords)
      ? keywords.map(k => k.toLowerCase().trim()).filter(k => k)
      : keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
  }

  get modelAnswer() { return this.#modelAnswer; }
  get keywords()    { return [...this.#keywords]; }

  /**
   * Partial scoring: score = (matched_keywords / total_keywords) × marks
   * Rounded to nearest 0.5.
   */
  evaluate(answer) {
    if (!answer || typeof answer !== 'string' || this.#keywords.length === 0) return 0;
    const ansLower = answer.toLowerCase();
    const matches = this.#keywords.filter(kw => ansLower.includes(kw)).length;
    const ratio = matches / this.#keywords.length;
    return Math.round(ratio * this.marks * 2) / 2; // nearest 0.5
  }

  toJSON() {
    return { ...super.toJSON(), modelAnswer: this.#modelAnswer, keywords: this.#keywords };
  }

  static fromJSON(data) {
    return new DescriptiveQuestion(data.text, data.marks, data.modelAnswer, data.keywords, data.id);
  }
}
