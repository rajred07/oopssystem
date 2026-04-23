/**
 * ExamUI — Full-screen exam-taking interface.
 *
 * Features:
 *  - Countdown timer (auto-submit on expiry)
 *  - Question navigator with answered/current indicators
 *  - MCQ, True/False, Descriptive input rendering
 *  - Answer saving (Stack-based, with Undo)
 *  - Confirm submission dialog with unanswered question warning
 *  - Auto-saves to localStorage every 5 seconds
 */
window.ExamUI = {
  activeAttemptId:       null,
  timerInterval:         null,
  currentQuestionIndex:  0,

  launch: function(attemptId) {
    this.activeAttemptId      = attemptId;
    this.currentQuestionIndex = 0;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const mgr     = ExamManager.getInstance();
    const attempt = mgr.getAttemptById(attemptId);
    const exam    = mgr.getExamById(attempt.examId);

    document.getElementById('app').innerHTML = `
      <div class="exam-overlay" id="exam-overlay">
        <div class="exam-topbar">
          <div class="exam-topbar-left">
            <span class="exam-course-name">📝 ${exam.courseName}</span>
          </div>
          <div class="timer-wrap">
            <span class="timer-label">Time Left</span>
            <div class="timer" id="exam-timer">--:--</div>
          </div>
          <div class="exam-topbar-right">
            <span id="progress-text" style="font-size:0.875rem;color:var(--text-muted);"></span>
            <button class="btn btn-danger" onclick="window.ExamUI.confirmSubmit()">Submit Exam</button>
          </div>
        </div>

        <div class="exam-body">
          <nav class="exam-sidebar">
            <h3>Navigator</h3>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;">Click a question number to jump to it</p>
            <div class="question-grid" id="q-navigator"></div>
            <div style="margin-top:1.5rem;font-size:0.8rem;color:var(--text-muted);">
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
                <span style="width:18px;height:18px;border-radius:4px;background:var(--secondary);display:inline-block;"></span> Answered
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
                <span style="width:18px;height:18px;border-radius:4px;background:var(--primary);display:inline-block;"></span> Current
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="width:18px;height:18px;border-radius:4px;background:var(--border);display:inline-block;"></span> Not answered
              </div>
            </div>
          </nav>

          <div class="exam-main">
            <div class="exam-main-inner" id="exam-workspace"></div>
          </div>
        </div>
      </div>
    `;

    this.renderNavigator();
    this.renderQuestion();
    this.startTimer();
  },

  // ── NAVIGATOR ────────────────────────────────────────────────
  renderNavigator: function() {
    const mgr     = ExamManager.getInstance();
    const attempt = mgr.getAttemptById(this.activeAttemptId);
    const exam    = mgr.getExamById(attempt.examId);

    const html = exam.questions.map((q, i) => {
      let cls = 'q-btn';
      if (attempt.answers[q.id] !== undefined) cls += ' answered';
      if (i === this.currentQuestionIndex)     cls += ' current';
      return `<button class="${cls}" onclick="window.ExamUI.goToQuestion(${i})" title="Question ${i+1}">${i+1}</button>`;
    }).join('');

    document.getElementById('q-navigator').innerHTML = html;

    // Update progress text
    const answered = attempt.answeredCount();
    const total    = exam.questions.length;
    const progressEl = document.getElementById('progress-text');
    if (progressEl) progressEl.textContent = `${answered} / ${total} answered`;
  },

  goToQuestion: function(index) {
    const mgr   = ExamManager.getInstance();
    const exam  = mgr.getExamById(mgr.getAttemptById(this.activeAttemptId).examId);
    if (index >= 0 && index < exam.questions.length) {
      this.currentQuestionIndex = index;
      this.renderNavigator();
      this.renderQuestion();
    }
  },

  // ── QUESTION RENDERER ────────────────────────────────────────
  renderQuestion: function() {
    const mgr     = ExamManager.getInstance();
    const attempt = mgr.getAttemptById(this.activeAttemptId);
    const exam    = mgr.getExamById(attempt.examId);
    const q       = exam.questions[this.currentQuestionIndex];
    const ans     = attempt.answers[q.id];

    let inputHtml = '';

    if (q.type === 'mcq') {
      inputHtml = q.options.map((opt, idx) => `
        <label class="option-label ${ans == idx ? 'selected' : ''}">
          <input type="radio" name="q_ans" value="${idx}" ${ans == idx ? 'checked' : ''}
            onchange="window.ExamUI.saveAnswer('${q.id}', this.value)">
          <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
          <span>${opt}</span>
        </label>
      `).join('');

    } else if (q.type === 'truefalse') {
      const isTrue  = ans === true  || ans === 'true';
      const isFalse = ans === false || ans === 'false';
      inputHtml = `
        <label class="option-label tf-option ${isTrue ? 'selected' : ''}">
          <input type="radio" name="q_ans" value="true" ${isTrue ? 'checked' : ''}
            onchange="window.ExamUI.saveAnswer('${q.id}', true)">
          <span class="tf-icon">✓</span><span>True</span>
        </label>
        <label class="option-label tf-option ${isFalse ? 'selected' : ''}">
          <input type="radio" name="q_ans" value="false" ${isFalse ? 'checked' : ''}
            onchange="window.ExamUI.saveAnswer('${q.id}', false)">
          <span class="tf-icon">✗</span><span>False</span>
        </label>
      `;

    } else if (q.type === 'descriptive') {
      inputHtml = `
        <textarea
          class="descriptive-input"
          id="desc-textarea"
          placeholder="Type your answer here. Keywords and relevant terminology improve your score."
          onblur="window.ExamUI.saveAnswer('${q.id}', this.value)">${ans || ''}</textarea>
        <p class="desc-hint">💡 Auto-graded based on keywords. Write clearly and completely.</p>
      `;
    }

    const isFirst = this.currentQuestionIndex === 0;
    const isLast  = this.currentQuestionIndex === exam.questions.length - 1;

    document.getElementById('exam-workspace').innerHTML = `
      <div class="question-container">
        <div class="question-meta">
          <span>Question ${this.currentQuestionIndex + 1} of ${exam.questions.length}</span>
          <div style="display:flex;gap:0.5rem;">
            <span class="badge type-${q.type}">${q.type.toUpperCase()}</span>
            <span class="badge" style="background:var(--primary-light);color:var(--primary);">${q.marks} mark${q.marks > 1 ? 's' : ''}</span>
          </div>
        </div>

        <h3 class="question-text">${q.text}</h3>

        <div class="options-container">
          ${inputHtml}
        </div>
      </div>

      <div class="exam-bottombar">
        <button class="btn btn-secondary"
          onclick="window.ExamUI.goToQuestion(${this.currentQuestionIndex - 1})"
          ${isFirst ? 'disabled' : ''}>
          ← Previous
        </button>

        <button class="btn btn-warning" onclick="window.ExamUI.undoAnswer()">
          ↩ Undo Answer
        </button>

        <button class="btn btn-primary"
          onclick="window.ExamUI.goToQuestion(${this.currentQuestionIndex + 1})"
          ${isLast ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `;
  },

  // ── ANSWER MANAGEMENT ────────────────────────────────────────
  saveAnswer: function(qId, val) {
    if (val === undefined || val === '') return;
    const attempt = ExamManager.getInstance().getAttemptById(this.activeAttemptId);
    // Avoid duplicate saves for identical values (especially descriptive)
    if (attempt.answers[qId] === val) return;
    attempt.saveAnswer(qId, val);
    ExamManager.getInstance().persist();
    this.renderNavigator();

    // Re-render options to update "selected" styling without full re-render
    const q = ExamManager.getInstance().getExamById(attempt.examId).questions[this.currentQuestionIndex];
    if (q.id === qId && (q.type === 'mcq' || q.type === 'truefalse')) {
      document.querySelectorAll('.option-label').forEach(label => label.classList.remove('selected'));
      const checked = document.querySelector('input[name="q_ans"]:checked');
      if (checked) checked.closest('.option-label').classList.add('selected');
    }
  },

  undoAnswer: function() {
    const mgr     = ExamManager.getInstance();
    const attempt = mgr.getAttemptById(this.activeAttemptId);
    const popped  = attempt.undoLastAnswer();
    if (popped) {
      mgr.persist();
      const exam = mgr.getExamById(attempt.examId);
      // Refresh current question if it's the one that was undone
      if (exam.questions[this.currentQuestionIndex].id === popped.questionId) {
        this.renderQuestion();
      }
      this.renderNavigator();
      Toast.show('Last answer undone ↩', 'success');
    } else {
      Toast.show('Nothing to undo', 'error');
    }
  },

  // ── TIMER ────────────────────────────────────────────────────
  startTimer: function() {
    const attempt = ExamManager.getInstance().getAttemptById(this.activeAttemptId);
    const timerEl = document.getElementById('exam-timer');
    let saveCounter = 0;

    const tick = () => {
      if (attempt.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.forceSubmit();
        return;
      }

      attempt.timeRemaining -= 1000;
      const totalSecs = Math.floor(attempt.timeRemaining / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Visual warning when under 5 minutes / under 1 minute
      if (mins < 1) {
        timerEl.className = 'timer danger pulse';
      } else if (mins < 5) {
        timerEl.className = 'timer danger';
      } else {
        timerEl.className = 'timer';
      }

      // Persist every ~5 seconds
      saveCounter++;
      if (saveCounter % 5 === 0) ExamManager.getInstance().persist();
    };

    tick(); // immediate first call
    this.timerInterval = setInterval(tick, 1000);
  },

  // ── SUBMIT ───────────────────────────────────────────────────
  confirmSubmit: function() {
    const mgr     = ExamManager.getInstance();
    const attempt = mgr.getAttemptById(this.activeAttemptId);
    const exam    = mgr.getExamById(attempt.examId);
    const unanswered = exam.questions.length - attempt.answeredCount();

    let msg = '📋 Are you sure you want to submit your exam?';
    if (unanswered > 0) {
      msg += `\n\n⚠️ Warning: You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}!`;
    }

    if (confirm(msg)) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      mgr.submitAttempt(this.activeAttemptId, 'manual');
      this.showResultScreen();
    }
  },

  forceSubmit: function() {
    ExamManager.getInstance().submitAttempt(this.activeAttemptId, 'timeout');
    Toast.show('⏰ Time expired — exam auto-submitted', 'error');
    this.showResultScreen();
  },

  showResultScreen: function() {
    // Allow the submission queue processor (setTimeout 0) to complete first
    setTimeout(() => {
      const overlay = document.getElementById('exam-overlay');
      if (overlay) overlay.remove();
      window.StudentUI.render(document.getElementById('app'));
      window.StudentUI.viewResult(this.activeAttemptId);
    }, 600);
  }
};
