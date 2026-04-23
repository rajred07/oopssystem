/**
 * StudentUI — Renders the Student Portal as a Single-Page Application.
 *
 * Tabs:
 *  1. Dashboard — personal stats, recent results
 *  2. My Exams  — exam lobby: start, resume, or view completed exams
 *  3. Results   — full result history with detailed breakdown viewer
 */
window.StudentUI = {

  render: function(mountPoint) {
    const mgr = ExamManager.getInstance();
    if (mgr.currentUserType !== 'student') return;
    const st = mgr.currentUser;

    mountPoint.innerHTML = `
      <div class="portal-layout">
        <aside class="sidebar">
          <div class="app-header">
            <div class="app-logo">🎓</div>
            <h1>ExamSphere</h1>
            <small style="color:var(--text-muted); font-size:0.725rem;">Student Portal</small>
          </div>

          <div class="student-profile-card">
            <div class="avatar">${st.name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${st.name}</strong>
              <small>${st.email}</small>
            </div>
          </div>

          <nav class="sidebar-nav">
            <a class="nav-item active" data-tab="dashboard">
              <span class="nav-icon">📊</span> My Dashboard
            </a>
            <a class="nav-item" data-tab="exams">
              <span class="nav-icon">📝</span> My Exams
            </a>
            <a class="nav-item" data-tab="results">
              <span class="nav-icon">📈</span> My Results
            </a>
          </nav>

          <a class="nav-item btn-logout" id="student-logout">
            <span class="nav-icon">🚪</span> Logout
          </a>
        </aside>

        <main class="main-content">
          <div id="tab-dashboard" class="tab-content active"></div>
          <div id="tab-exams"     class="tab-content"></div>
          <div id="tab-results"   class="tab-content"></div>
        </main>
      </div>
    `;

    mountPoint.querySelectorAll('.nav-item[data-tab]').forEach(nav => {
      nav.addEventListener('click', e => {
        mountPoint.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        mountPoint.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const tab = e.currentTarget.getAttribute('data-tab');
        document.getElementById(`tab-${tab}`).classList.add('active');
        const method = 'render' + tab.charAt(0).toUpperCase() + tab.slice(1);
        this[method]();
      });
    });

    document.getElementById('student-logout').addEventListener('click', () => {
      mgr.logout();
      window.App.renderLogin();
    });

    this.renderDashboard();
  },

  // ── DASHBOARD ────────────────────────────────────────────────
  renderDashboard: function() {
    const mgr    = ExamManager.getInstance();
    const st     = mgr.currentUser;
    const report = mgr.getStudentReport(st.studentId);

    const attCount  = report.length;
    const avgScore  = attCount ? (report.reduce((a, r) => a + r.percentage, 0) / attCount) : 0;
    const passCount = report.filter(r => r.status === 'Pass').length;
    const assigned  = mgr.getExamsForStudent(st.studentId);
    const pending   = assigned.filter(e => !mgr.hasCompletedAttempt(st.studentId, e.examId)).length;

    document.getElementById('tab-dashboard').innerHTML = `
      <div class="page-header">
        <h2>Welcome back, ${st.name.split(' ')[0]}! 👋</h2>
        <p class="page-subtitle">Here&apos;s your performance overview</p>
      </div>

      <div class="dashboard-grid">
        <div class="stat-card purple">
          <div class="stat-icon">📝</div>
          <div><h3>Exams Attempted</h3><p>${attCount}</p></div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">📊</div>
          <div><h3>Average Score</h3><p>${avgScore.toFixed(1)}%</p></div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">✅</div>
          <div><h3>Exams Passed</h3><p>${passCount}</p></div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">⏳</div>
          <div><h3>Pending Exams</h3><p>${pending}</p></div>
        </div>
      </div>

      <h3>Recent Results</h3>
      <table class="data-table" style="margin-top:1rem;">
        <thead><tr><th>Exam Name</th><th>Score</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>
          ${report.slice().reverse().slice(0, 5).map(r => `
            <tr>
              <td><strong>${r.examName}</strong></td>
              <td>${r.score} / ${r.total} <small>(${r.percentage.toFixed(1)}%)</small></td>
              <td><span class="badge ${r.status === 'Pass' ? 'success' : 'danger'}">${r.status}</span></td>
              <td>${new Date(r.date).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="window.StudentUI.viewResult('${r.attemptId}')">
                  View →
                </button>
              </td>
            </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No completed exams yet. Head to "My Exams" to start!</td></tr>`}
        </tbody>
      </table>

      ${pending > 0 ? `
        <div class="info-banner" style="margin-top:2rem;">
          📚 You have <strong>${pending}</strong> exam${pending > 1 ? 's' : ''} waiting.
          <button class="btn btn-primary btn-sm" style="margin-left:1rem;"
            onclick="document.querySelector('.nav-item[data-tab=exams]').click()">
            Go to My Exams →
          </button>
        </div>` : ''}
    `;
  },

  // ── EXAMS (Lobby) ────────────────────────────────────────────
  renderExams: function() {
    const mgr       = ExamManager.getInstance();
    const st        = mgr.currentUser;
    const assigned  = mgr.getExamsForStudent(st.studentId);

    let html = `
      <div class="page-header">
        <h2>My Exam Lobby</h2>
        <p class="page-subtitle">All exams assigned to you</p>
      </div>`;

    if (assigned.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No Exams Assigned</h3>
          <p>Ask your administrator to assign exams to your account.</p>
        </div>`;
    } else {
      html += `<div class="exam-cards-grid">`;
      assigned.forEach(ex => {
        const attempt = mgr.attempts.find(
          a => a.examId === ex.examId && a.studentId === st.studentId
        );
        let statusBadge = '<span class="badge status-available">Available</span>';
        let btn = `<button class="btn btn-primary" onclick="window.StudentUI.startExam('${ex.examId}')">Start Exam →</button>`;

        if (attempt) {
          if (attempt.status === 'Completed') {
            statusBadge = '<span class="badge success">Completed ✓</span>';
            btn = `<button class="btn btn-secondary" onclick="window.StudentUI.viewResult('${attempt.attemptId}')">View Result</button>`;
          } else if (attempt.status === 'Timeout') {
            statusBadge = '<span class="badge danger">Time Expired</span>';
            btn = `<button class="btn btn-secondary" onclick="window.StudentUI.viewResult('${attempt.attemptId}')">View Result</button>`;
          } else if (attempt.status === 'Pending') {
            statusBadge = '<span class="badge warning">In Progress</span>';
            btn = `<button class="btn btn-primary" onclick="window.StudentUI.startExam('${ex.examId}')">Resume →</button>`;
          }
        }

        const totalMarks = ex.totalMarks;
        html += `
          <div class="exam-card">
            <div class="exam-card-header">
              <span class="exam-card-title">${ex.courseName}</span>
              ${statusBadge}
            </div>
            <div class="exam-card-meta">
              <span>⏱ ${ex.duration} mins</span>
              <span>🎯 Pass: ${ex.passingMarks}%</span>
              <span>📋 ${ex.questions.length} questions</span>
              <span>💯 ${totalMarks} marks</span>
            </div>
            <div class="exam-card-footer">
              ${btn}
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('tab-exams').innerHTML = html;
  },

  startExam: function(examId) {
    try {
      const mgr       = ExamManager.getInstance();
      const attemptId = mgr.startAttempt(mgr.currentUser.studentId, examId);
      window.ExamUI.launch(attemptId);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // ── RESULTS (History) ────────────────────────────────────────
  renderResults: function() {
    const mgr    = ExamManager.getInstance();
    const st     = mgr.currentUser;
    const report = mgr.getStudentReport(st.studentId).slice().reverse();

    let html = `
      <div class="page-header">
        <h2>My Results</h2>
        <p class="page-subtitle">Complete exam history and performance reports</p>
      </div>`;

    if (report.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>No Results Yet</h3>
          <p>Complete an exam to see your results here.</p>
        </div>`;
    } else {
      html += `
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr><th>Exam Name</th><th>Date</th><th>Score</th><th>%</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${report.map(r => `
                <tr>
                  <td><strong>${r.examName}</strong></td>
                  <td>${new Date(r.date).toLocaleString()}</td>
                  <td>${r.score} / ${r.total}</td>
                  <td><strong>${r.percentage.toFixed(1)}%</strong></td>
                  <td><span class="badge ${r.status === 'Pass' ? 'success' : 'danger'}">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.StudentUI.viewResult('${r.attemptId}')">
                      Detailed Report →
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    document.getElementById('tab-results').innerHTML = html;
  },

  // ── RESULT DETAIL VIEW ───────────────────────────────────────
  viewResult: function(attemptId) {
    const result = ExamManager.getInstance().getAttemptResult(attemptId);
    if (!result) {
      Toast.show('Result not found', 'error');
      return;
    }

    const qBreakdown = result.questionBreakdown;
    const mcqCount  = qBreakdown.filter(q => q.type === 'mcq').length;
    const tfCount   = qBreakdown.filter(q => q.type === 'truefalse').length;
    const descCount = qBreakdown.filter(q => q.type === 'descriptive').length;

    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;">
        <div>
          <h2>Exam Report</h2>
          <p class="page-subtitle">Time taken: ${result.formattedTime}</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.StudentUI.renderResults()">
          ← Back to Results
        </button>
      </div>

      <div class="result-banner ${result.status === 'Pass' ? 'pass' : 'fail'}">
        <div class="result-banner-inner">
          <div class="result-verdict">${result.status === 'Pass' ? '🎉 PASSED' : '❌ FAILED'}</div>
          <div class="result-score">${result.score} / ${result.total}</div>
          <div class="result-pct">${result.percentage}%</div>
        </div>
        <div class="result-meta-grid">
          <div class="result-meta-item">
            <span>MCQ Questions</span>
            <strong>${mcqCount}</strong>
          </div>
          <div class="result-meta-item">
            <span>True/False</span>
            <strong>${tfCount}</strong>
          </div>
          <div class="result-meta-item">
            <span>Descriptive</span>
            <strong>${descCount}</strong>
          </div>
          <div class="result-meta-item">
            <span>Time Taken</span>
            <strong>${result.formattedTime}</strong>
          </div>
        </div>
      </div>

      <h3 style="margin-top:2rem;">Question-by-Question Breakdown</h3>
      <div style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
        ${qBreakdown.map((q, i) => {
          const earned  = q.earned;
          const correct = earned === q.marks;
          const partial = earned > 0 && earned < q.marks;
          const wrong   = earned === 0;

          let ansDisplay = q.studentAnswer;
          let corrDisplay = q.correctAnswer;

          if (q.type === 'mcq') {
            ansDisplay  = q.studentAnswer !== undefined ? `Option ${String.fromCharCode(65 + Number(q.studentAnswer))}` : '<em style="color:var(--text-muted)">Skipped</em>';
            corrDisplay = `Option ${String.fromCharCode(65 + Number(q.correctAnswer))}`;
          } else if (q.type === 'truefalse') {
            ansDisplay  = q.studentAnswer !== undefined ? (q.studentAnswer === true || q.studentAnswer === 'true' ? 'True' : 'False') : '<em style="color:var(--text-muted)">Skipped</em>';
            corrDisplay = q.correctAnswer ? 'True' : 'False';
          } else {
            ansDisplay  = q.studentAnswer || '<em style="color:var(--text-muted)">Skipped</em>';
            corrDisplay = `Keywords: ${q.correctAnswer}`;
          }

          return `
            <div class="breakdown-card ${correct ? 'correct' : partial ? 'partial' : wrong && q.studentAnswer === undefined ? 'skipped' : 'wrong'}">
              <div class="breakdown-header">
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                  <span class="q-num">Q${i+1}</span>
                  <span class="badge type-${q.type}">${q.type.toUpperCase()}</span>
                  <span style="font-size:0.875rem;color:var(--text-muted);">${q.text}</span>
                </div>
                <div class="breakdown-score ${correct ? 'text-success' : partial ? 'text-warning' : 'text-danger'}">
                  ${earned} / ${q.marks} pts
                </div>
              </div>
              <div class="breakdown-answers">
                <div class="answer-row">
                  <span class="answer-label">Your Answer:</span>
                  <span>${ansDisplay}</span>
                </div>
                ${q.type !== 'descriptive' ? `
                  <div class="answer-row">
                    <span class="answer-label">Correct Answer:</span>
                    <span style="color:var(--secondary);font-weight:600;">${corrDisplay}</span>
                  </div>` : `
                  <div class="answer-row">
                    <span class="answer-label">Keywords needed:</span>
                    <span style="color:var(--text-muted);font-size:0.85rem;">${corrDisplay}</span>
                  </div>`}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;

    // Ensure results tab is active
    const resultsTab = document.getElementById('tab-results');
    if (!resultsTab.classList.contains('active')) {
      document.querySelector('.nav-item[data-tab="results"]').click();
    }
    document.getElementById('tab-results').innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
