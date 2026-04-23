/**
 * AdminUI — Renders the entire Admin Portal as a Single-Page Application.
 *
 * Tabs:
 *  1. Dashboard   — stats, top performers, low scorers, system analytics
 *  2. Students    — add, search, delete, view profile
 *  3. Exams       — create, edit, add/remove questions, assign students
 *  4. Results     — merit list, sort, export CSV, score distribution bar chart
 *  5. Settings    — seed demo data, clear all data
 */
window.AdminUI = {

  render: function(mountPoint) {
    mountPoint.innerHTML = `
      <div class="portal-layout">
        <aside class="sidebar">
          <div class="app-header">
            <div class="app-logo">📋</div>
            <h1>ExamSphere</h1>
            <small style="color:var(--text-muted); font-size:0.725rem;">Admin Portal</small>
          </div>
          <nav class="sidebar-nav">
            <a class="nav-item active" data-tab="dashboard">
              <span class="nav-icon">📊</span> Dashboard
            </a>
            <a class="nav-item" data-tab="students">
              <span class="nav-icon">👥</span> Manage Students
            </a>
            <a class="nav-item" data-tab="exams">
              <span class="nav-icon">📝</span> Manage Exams
            </a>
            <a class="nav-item" data-tab="results">
              <span class="nav-icon">🏆</span> Results &amp; Reports
            </a>
            <a class="nav-item" data-tab="settings">
              <span class="nav-icon">⚙️</span> Settings
            </a>
          </nav>
          <a class="nav-item btn-logout" id="admin-logout">
            <span class="nav-icon">🚪</span> Logout
          </a>
        </aside>
        <main class="main-content">
          <div id="tab-dashboard" class="tab-content active"></div>
          <div id="tab-students"  class="tab-content"></div>
          <div id="tab-exams"     class="tab-content"></div>
          <div id="tab-results"   class="tab-content"></div>
          <div id="tab-settings"  class="tab-content"></div>
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

    document.getElementById('admin-logout').addEventListener('click', () => {
      ExamManager.getInstance().logout();
      window.App.renderLogin();
    });

    this.renderDashboard();
  },

  // ── DASHBOARD ───────────────────────────────────────────────
  renderDashboard: function() {
    const mgr       = ExamManager.getInstance();
    const analytics = mgr.getAnalytics();
    const top       = mgr.getTopPerformers(5);
    const low       = mgr.getLowScorers(40);

    document.getElementById('tab-dashboard').innerHTML = `
      <div class="page-header">
        <h2>Dashboard Overview</h2>
        <p class="page-subtitle">System-wide statistics and performance highlights</p>
      </div>

      <div class="dashboard-grid">
        <div class="stat-card blue">
          <div class="stat-icon">👥</div>
          <div>
            <h3>Total Students</h3>
            <p>${analytics.totalStudents}</p>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon">📝</div>
          <div>
            <h3>Total Exams</h3>
            <p>${analytics.totalExams}</p>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">✅</div>
          <div>
            <h3>Completed Attempts</h3>
            <p>${analytics.completed}</p>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">📈</div>
          <div>
            <h3>Pass Rate</h3>
            <p>${analytics.passRate}%</p>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; flex-wrap:wrap; margin-top:2rem;">
        <div>
          <h3>🏆 Top Performers</h3>
          <table class="data-table" style="margin-top:1rem;">
            <thead><tr><th>Rank</th><th>Name</th><th>Avg Score</th><th>Exams</th></tr></thead>
            <tbody>
              ${top.length ? top.map((p, i) => `
                <tr>
                  <td><span class="rank-badge rank-${i+1}">#${i+1}</span></td>
                  <td>${p.name}</td>
                  <td><strong>${p.avg.toFixed(1)}%</strong></td>
                  <td>${p.attempts}</td>
                </tr>`).join('')
                : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No data yet — seed some data first</td></tr>`}
            </tbody>
          </table>
        </div>

        <div>
          <h3>⚠️ At-Risk Students <small style="font-size:0.8rem;color:var(--text-muted);">(avg &lt; 40%)</small></h3>
          <table class="data-table" style="margin-top:1rem;">
            <thead><tr><th>Name</th><th>Avg Score</th></tr></thead>
            <tbody>
              ${low.length ? low.map(l => `
                <tr>
                  <td>${l.student.name}</td>
                  <td><span class="badge danger">${l.avg.toFixed(1)}%</span></td>
                </tr>`).join('')
                : `<tr><td colspan="2" style="text-align:center;color:var(--text-muted);">No at-risk students found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ── STUDENTS ────────────────────────────────────────────────
  renderStudents: function() {
    const mgr = ExamManager.getInstance();
    document.getElementById('tab-students').innerHTML = `
      <div class="page-header">
        <h2>Manage Students</h2>
        <p class="page-subtitle">Register, search, and remove student accounts</p>
      </div>
      <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-start;">
        <div style="flex:1; min-width:280px;">
          <div class="panel">
            <h3>Add New Student</h3>
            <form id="add-student-form" style="margin-top:1rem;">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="stu-name" class="form-control" placeholder="e.g. Alice Johnson" required>
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="stu-email" class="form-control" placeholder="student@example.com" required>
              </div>
              <div class="form-group">
                <label>Password <small>(min 6 chars)</small></label>
                <input type="password" id="stu-pass" class="form-control" minlength="6" required>
              </div>
              <button class="btn btn-primary" type="submit" style="width:100%;">
                + Register Student
              </button>
            </form>
          </div>
        </div>

        <div style="flex:2; min-width:360px;">
          <div style="display:flex; gap:1rem; margin-bottom:1rem; align-items:center;">
            <input type="text" id="student-search" class="form-control" placeholder="🔍 Search by name or email...">
          </div>
          <div id="student-table-container"></div>
        </div>
      </div>
    `;

    const renderTable = (query = '') => {
      const students = mgr.students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
      );

      const tbody = students.map(s => {
        const report       = mgr.getStudentReport(s.studentId);
        const assigned     = mgr.getExamsForStudent(s.studentId).length;
        const avgScore     = report.length
          ? (report.reduce((acc, r) => acc + r.percentage, 0) / report.length).toFixed(1)
          : null;
        const passCount    = report.filter(r => r.status === 'Pass').length;
        return `
          <tr>
            <td><code style="font-size:0.7rem;color:var(--text-muted);">${s.studentId.slice(-8)}</code></td>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td>${assigned}</td>
            <td>${report.length}</td>
            <td>${avgScore !== null ? `<strong>${avgScore}%</strong>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${passCount} / ${report.length}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="window.AdminUI.deleteStudent('${s.studentId}')">Delete</button>
            </td>
          </tr>`;
      }).join('');

      document.getElementById('student-table-container').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Assigned</th>
                <th>Attempts</th><th>Avg Score</th><th>Passed</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tbody || `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No students found</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    };

    renderTable();
    document.getElementById('student-search').addEventListener('input', e => renderTable(e.target.value));
    document.getElementById('add-student-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        mgr.registerStudent(
          document.getElementById('stu-name').value,
          document.getElementById('stu-email').value,
          document.getElementById('stu-pass').value
        );
        Toast.show('Student registered successfully');
        e.target.reset();
        renderTable();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  },

  deleteStudent: function(id) {
    if (confirm('Delete this student? Their exam history will also be removed.')) {
      ExamManager.getInstance().deleteStudent(id);
      Toast.show('Student deleted');
      this.renderStudents();
    }
  },

  // ── EXAMS ───────────────────────────────────────────────────
  renderExams: function() {
    const mgr = ExamManager.getInstance();
    document.getElementById('tab-exams').innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2>Manage Exams</h2>
          <p class="page-subtitle">Create exams, add questions, and assign to students</p>
        </div>
        <button class="btn btn-primary" id="btn-create-exam-modal">+ Create Exam</button>
      </div>

      <form id="create-exam-form" class="panel" style="display:none; margin-bottom:2rem;">
        <h3>Create New Exam</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-top:1rem;">
          <div class="form-group">
            <label>Course Name</label>
            <input type="text" id="ex-name" class="form-control" placeholder="e.g. Web Technologies" required>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" id="ex-dur" class="form-control" min="1" placeholder="60" required>
          </div>
          <div class="form-group">
            <label>Passing Marks (%)</label>
            <input type="number" id="ex-pass" class="form-control" min="1" max="100" placeholder="50" required>
          </div>
        </div>
        <div style="display:flex; gap:0.75rem; margin-top:1rem;">
          <button class="btn btn-primary" type="submit">Save Exam</button>
          <button class="btn btn-secondary" type="button" id="btn-cancel-create-exam">Cancel</button>
        </div>
      </form>

      <div id="exams-list-container"></div>
      <div id="exam-detail-view" style="display:none; margin-top:2rem; border-top:2px solid var(--border); padding-top:2rem;"></div>
    `;

    const renderTable = () => {
      const exams = mgr.exams;
      const tbody = exams.map(e => {
        const attempts = mgr.attempts.filter(a => a.examId === e.examId && (a.status === 'Completed' || a.status === 'Timeout'));
        return `
          <tr>
            <td><code style="font-size:0.7rem;color:var(--text-muted);">${e.examId.slice(-8)}</code></td>
            <td><strong>${e.courseName}</strong></td>
            <td>${e.questions.length}</td>
            <td>${e.totalMarks} pts</td>
            <td>${e.duration} min</td>
            <td>${e.passingMarks}%</td>
            <td>${e.assignedStudents.length}</td>
            <td>${attempts.length}</td>
            <td class="action-buttons">
              <button class="btn btn-primary btn-sm" onclick="window.AdminUI.openExamDetail('${e.examId}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="window.AdminUI.deleteExam('${e.examId}')">Delete</button>
            </td>
          </tr>`;
      }).join('');

      document.getElementById('exams-list-container').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Course</th><th>Questions</th><th>Total</th>
                <th>Duration</th><th>Pass %</th><th>Assigned</th><th>Attempts</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tbody || `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">No exams yet. Create one above!</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    };

    renderTable();

    document.getElementById('btn-create-exam-modal').addEventListener('click', () => {
      document.getElementById('create-exam-form').style.display = 'block';
      document.getElementById('exam-detail-view').style.display = 'none';
      document.getElementById('create-exam-form').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btn-cancel-create-exam').addEventListener('click', () => {
      document.getElementById('create-exam-form').style.display = 'none';
    });
    document.getElementById('create-exam-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        mgr.createExam(
          document.getElementById('ex-name').value,
          document.getElementById('ex-dur').value,
          document.getElementById('ex-pass').value
        );
        Toast.show('Exam created successfully');
        e.target.reset();
        e.target.style.display = 'none';
        renderTable();
      } catch (err) { Toast.show(err.message, 'error'); }
    });
  },

  deleteExam: function(id) {
    if (confirm('Delete this exam and ALL its attempts? This cannot be undone.')) {
      ExamManager.getInstance().deleteExam(id);
      Toast.show('Exam deleted');
      this.renderExams();
      document.getElementById('exam-detail-view').style.display = 'none';
    }
  },

  openExamDetail: function(examId) {
    const mgr  = ExamManager.getInstance();
    const exam = mgr.getExamById(examId);
    if (!exam) return;

    document.getElementById('create-exam-form').style.display = 'none';
    const container = document.getElementById('exam-detail-view');
    container.style.display = 'block';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h2>✏️ ${exam.courseName}</h2>
          <p class="page-subtitle">${exam.questions.length} questions · ${exam.totalMarks} total marks · ${exam.duration} min · Pass: ${exam.passingMarks}%</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('exam-detail-view').style.display='none'">✕ Close</button>
      </div>

      <div style="display:grid; grid-template-columns:2fr 1fr; gap:2rem; flex-wrap:wrap;">

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3>Questions (${exam.questions.length})</h3>
            <span class="badge">${exam.totalMarks} total marks</span>
          </div>

          <div id="questions-list">
            ${exam.questions.map((q, i) => `
              <div class="question-item">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                  <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
                      <span class="q-num">Q${i+1}</span>
                      <span class="badge type-${q.type}">${q.type.toUpperCase()}</span>
                      <span class="badge" style="background:var(--primary-light);color:var(--primary);">${q.marks} mark${q.marks > 1 ? 's' : ''}</span>
                    </div>
                    <p style="color:var(--text-main);font-size:0.9rem;line-height:1.5;">${q.text}</p>
                    ${q.type === 'mcq' ? `<div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.5rem;">${q.options.map((o, idx) => `<span class="option-pill ${idx === q.correctOption ? 'correct' : ''}">${String.fromCharCode(65+idx)}. ${o}</span>`).join('')}</div>` : ''}
                    ${q.type === 'truefalse' ? `<p style="margin-top:0.5rem;color:var(--secondary);font-size:0.85rem;">✓ Correct: <strong>${q.correctAnswer ? 'True' : 'False'}</strong></p>` : ''}
                    ${q.type === 'descriptive' ? `<p style="margin-top:0.5rem;color:var(--text-muted);font-size:0.8rem;">Keywords: <em>${q.keywords.join(', ')}</em></p>` : ''}
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="window.AdminUI.deleteQuestion('${examId}','${q.id}')">✕</button>
                </div>
              </div>
            `).join('') || '<p style="color:var(--text-muted);padding:1rem;">No questions added yet.</p>'}
          </div>

          <div class="panel" style="margin-top:1.5rem;">
            <h4>Add New Question</h4>
            <div class="form-group" style="margin-top:1rem;">
              <label>Question Type</label>
              <select id="q-type" class="form-control" onchange="window.AdminUI.toggleQuestionFields()">
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="truefalse">True / False</option>
                <option value="descriptive">Descriptive</option>
              </select>
            </div>
            <div class="form-group">
              <label>Question Text</label>
              <textarea id="q-text" class="form-control" rows="3" placeholder="Enter your question here..."></textarea>
            </div>
            <div class="form-group">
              <label>Marks</label>
              <input type="number" id="q-marks" class="form-control" min="1" value="2">
            </div>

            <div id="q-fields-mcq">
              ${[0,1,2,3].map(i => `
                <div class="form-group">
                  <label>Option ${String.fromCharCode(65+i)}</label>
                  <input type="text" id="q-opt-${i}" class="form-control" placeholder="Option ${String.fromCharCode(65+i)}">
                </div>`).join('')}
              <div class="form-group">
                <label>Correct Option</label>
                <select id="q-mcq-correct" class="form-control">
                  ${[0,1,2,3].map(i => `<option value="${i}">Option ${String.fromCharCode(65+i)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="q-fields-tf" style="display:none;">
              <div class="form-group">
                <label>Correct Answer</label>
                <select id="q-tf-correct" class="form-control">
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>

            <div id="q-fields-desc" style="display:none;">
              <div class="form-group">
                <label>Keywords <small>(comma-separated — used for auto-grading)</small></label>
                <input type="text" id="q-desc-key" class="form-control" placeholder="e.g. class, object, inherit, method">
              </div>
              <div class="form-group">
                <label>Model Answer <small>(shown to students in report)</small></label>
                <textarea id="q-desc-model" class="form-control" rows="2" placeholder="Ideal answer..."></textarea>
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.AdminUI.addQuestion('${examId}')">+ Add Question</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div class="panel">
            <h3>Exam Settings</h3>
            <div class="form-group" style="margin-top:1rem;">
              <label>Course Name</label>
              <input type="text" id="upd-name" class="form-control" value="${exam.courseName}">
            </div>
            <div class="form-group">
              <label>Duration (minutes)</label>
              <input type="number" id="upd-dur" class="form-control" value="${exam.duration}">
            </div>
            <div class="form-group">
              <label>Passing Marks (%)</label>
              <input type="number" id="upd-pass" class="form-control" value="${exam.passingMarks}">
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.AdminUI.updateExamSettings('${examId}')" style="width:100%;">Update Settings</button>
          </div>

          <div class="panel">
            <h3>Assigned Students <span class="badge" style="margin-left:0.5rem;">${exam.assignedStudents.length}</span></h3>
            <div style="margin-top:1rem; display:flex; flex-direction:column; gap:0.5rem; max-height:300px; overflow-y:auto;">
              ${mgr.students.map(s => `
                <label class="student-checkbox-row">
                  <input type="checkbox"
                    onchange="window.AdminUI.toggleStudentAssignment('${examId}', '${s.studentId}', this.checked)"
                    ${exam.isStudentAssigned(s.studentId) ? 'checked' : ''}>
                  <div>
                    <strong>${s.name}</strong>
                    <br><small style="color:var(--text-muted);">${s.email}</small>
                  </div>
                </label>
              `).join('') || '<p style="color:var(--text-muted);">No students registered yet.</p>'}
            </div>
          </div>
        </div>

      </div>
    `;

    container.scrollIntoView({ behavior: 'smooth' });
  },

  toggleStudentAssignment: function(examId, studentId, isChecked) {
    const mgr = ExamManager.getInstance();
    try {
      if (isChecked) mgr.assignExamToStudent(examId, studentId);
      else           mgr.unassignExamFromStudent(examId, studentId);
      // Refresh just the assigned count in the table  
      this.renderExams();
      this.openExamDetail(examId);
    } catch (err) {
      Toast.show(err.message, 'error');
      this.openExamDetail(examId);
    }
  },

  updateExamSettings: function(examId) {
    try {
      ExamManager.getInstance().updateExamSettings(
        examId,
        document.getElementById('upd-name').value,
        document.getElementById('upd-dur').value,
        document.getElementById('upd-pass').value
      );
      Toast.show('Exam settings updated');
      this.renderExams();
      this.openExamDetail(examId);
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  deleteQuestion: function(examId, questionId) {
    ExamManager.getInstance().removeQuestionFromExam(examId, questionId);
    Toast.show('Question removed');
    this.renderExams();
    this.openExamDetail(examId);
  },

  toggleQuestionFields: function() {
    const type = document.getElementById('q-type').value;
    document.getElementById('q-fields-mcq').style.display  = type === 'mcq'         ? 'block' : 'none';
    document.getElementById('q-fields-tf').style.display   = type === 'truefalse'   ? 'block' : 'none';
    document.getElementById('q-fields-desc').style.display = type === 'descriptive' ? 'block' : 'none';
  },

  addQuestion: function(examId) {
    const type  = document.getElementById('q-type').value;
    const text  = document.getElementById('q-text').value;
    const marks = parseInt(document.getElementById('q-marks').value);
    const data  = { type, text, marks };

    if (type === 'mcq') {
      data.options       = [0,1,2,3].map(i => document.getElementById(`q-opt-${i}`).value);
      data.correctOption = parseInt(document.getElementById('q-mcq-correct').value);
    } else if (type === 'truefalse') {
      data.correctAnswer = document.getElementById('q-tf-correct').value === 'true';
    } else if (type === 'descriptive') {
      data.keywords      = document.getElementById('q-desc-key').value;
      data.modelAnswer   = document.getElementById('q-desc-model').value;
    }

    try {
      ExamManager.getInstance().addQuestionToExam(examId, data);
      Toast.show('Question added');
      this.renderExams();
      this.openExamDetail(examId);
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  // ── RESULTS ─────────────────────────────────────────────────
  renderResults: function() {
    const mgr  = ExamManager.getInstance();
    const opts = mgr.exams.map(e => `<option value="${e.examId}">${e.courseName}</option>`).join('');

    document.getElementById('tab-results').innerHTML = `
      <div class="page-header">
        <h2>Results &amp; Reports</h2>
        <p class="page-subtitle">Merit lists, score distribution, and CSV exports</p>
      </div>

      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:2rem;">
        <select id="res-exam-select" class="form-control" style="max-width:280px;">
          ${opts || '<option value="">No exams available</option>'}
        </select>
        <select id="res-sort" class="form-control" style="max-width:240px;">
          <option value="score">Sort by Score (Highest First)</option>
          <option value="time">Sort by Submission Time</option>
        </select>
        <button class="btn btn-primary" id="btn-export-csv" ${opts ? '' : 'disabled'}>⬇ Export CSV</button>
      </div>

      <div id="res-table-container"></div>

      <h3 style="margin-top:2.5rem;">Score Distribution</h3>
      <div id="res-chart-container" class="chart-container"></div>
    `;

    const renderTable = () => {
      const examId = document.getElementById('res-exam-select').value;
      if (!examId) return;
      const exam = mgr.getExamById(examId);
      let data;

      if (document.getElementById('res-sort').value === 'score') {
        data = mgr.getMeritList(examId);
        document.getElementById('res-table-container').innerHTML = `
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Rank</th><th>Name</th><th>Score</th><th>%</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                ${data.map(d => `
                  <tr>
                    <td><span class="rank-badge rank-${d.rank}">#${d.rank}</span></td>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.score} / ${d.total}</td>
                    <td><strong>${d.percentage.toFixed(1)}%</strong></td>
                    <td><span class="badge ${d.status === 'Pass' ? 'success' : 'danger'}">${d.status}</span></td>
                    <td>${d.timeSubmitted ? new Date(d.timeSubmitted).toLocaleString() : '—'}</td>
                  </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No completed attempts yet.</td></tr>`}
              </tbody>
            </table>
          </div>`;
      } else {
        const attempts = mgr.getAttemptsSortedBySubmissionTime(examId);
        data = mgr.getMeritList(examId); // for chart
        document.getElementById('res-table-container').innerHTML = `
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Score</th><th>%</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                ${attempts.map(a => {
                  const st   = mgr.getStudentById(a.studentId);
                  const pc   = exam.totalMarks ? (a.score / exam.totalMarks) * 100 : 0;
                  const pass = a.isPassed(exam);
                  return `
                    <tr>
                      <td><strong>${st ? st.name : 'Unknown'}</strong></td>
                      <td>${a.score} / ${exam.totalMarks}</td>
                      <td>${pc.toFixed(1)}%</td>
                      <td><span class="badge ${pass ? 'success' : 'danger'}">${pass ? 'Pass' : 'Fail'}</span></td>
                      <td>${new Date(a.submissionTime).toLocaleString()}</td>
                    </tr>`;
                }).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No completed attempts yet.</td></tr>`}
              </tbody>
            </table>
          </div>`;
      }

      // Score distribution bar chart
      const chart = document.getElementById('res-chart-container');
      if (data.length > 0) {
        const ranges = { '0–40%': 0, '41–60%': 0, '61–80%': 0, '81–100%': 0 };
        data.forEach(d => {
          const p = d.percentage;
          if (p <= 40) ranges['0–40%']++;
          else if (p <= 60) ranges['41–60%']++;
          else if (p <= 80) ranges['61–80%']++;
          else ranges['81–100%']++;
        });
        const maxCount = Math.max(...Object.values(ranges), 1);
        chart.innerHTML = `
          <div class="chart-bars">
            ${Object.entries(ranges).map(([label, count]) => {
              const heightPct = (count / maxCount) * 100;
              const colorClass = label.startsWith('0') ? 'bar-danger' : label.startsWith('4') ? 'bar-warning' : label.startsWith('6') ? 'bar-info' : 'bar-success';
              return `
                <div class="chart-bar-wrap">
                  <span class="bar-count">${count}</span>
                  <div class="chart-bar ${colorClass}" style="height:${heightPct}%;"></div>
                  <span class="bar-label">${label}</span>
                </div>`;
            }).join('')}
          </div>`;
      } else {
        chart.innerHTML = `<p style="color:var(--text-muted);padding:1rem;">No data to chart — complete some attempts first.</p>`;
      }
    };

    document.getElementById('res-exam-select').addEventListener('change', renderTable);
    document.getElementById('res-sort').addEventListener('change', renderTable);
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      const examId = document.getElementById('res-exam-select').value;
      if (!examId) return;
      const data = mgr.getMeritList(examId);
      let csv = 'Rank,Student Name,Score,Total Marks,Percentage,Status,Time Submitted\n';
      data.forEach(d => {
        csv += `${d.rank},"${d.name}",${d.score},${d.total},${d.percentage.toFixed(2)},${d.status},"${d.timeSubmitted ? new Date(d.timeSubmitted).toLocaleString() : ''}"\n`;
      });
      const blob   = new Blob([csv], { type: 'text/csv' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `merit_list_${examId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    if (opts) renderTable();
  },

  // ── SETTINGS ────────────────────────────────────────────────
  renderSettings: function() {
    document.getElementById('tab-settings').innerHTML = `
      <div class="page-header">
        <h2>System Settings</h2>
        <p class="page-subtitle">Manage demo data and system operations</p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:2rem;">
        <div class="panel">
          <h3>🌱 Seed Demo Data</h3>
          <p style="color:var(--text-muted);margin:1rem 0;">
            Populate the system with <strong>5 students</strong>, <strong>3 exams</strong>,
            and rich question sets. Perfect for quick demonstrations.
          </p>
          <ul style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1.5rem;padding-left:1.25rem;line-height:2;">
            <li>Students: alice@test.com, bob@test.com, carol@test.com, david@test.com, eva@test.com</li>
            <li>Password for all: <code>pass123</code></li>
          </ul>
          <button class="btn btn-primary" onclick="window.AdminUI.seedData()" style="width:100%;">Seed Demo Data</button>
        </div>

        <div class="panel" style="border: 2px solid var(--danger-light);">
          <h3 style="color:var(--danger);">⚠️ Danger Zone</h3>
          <p style="color:var(--text-muted);margin:1rem 0;">
            This will permanently delete <strong>all students, exams, and results</strong>.
            This action cannot be undone.
          </p>
          <button class="btn btn-danger" onclick="window.AdminUI.clearData()" style="width:100%;">Clear All Data</button>
        </div>
      </div>
    `;
  },

  seedData: function() {
    try {
      ExamManager.getInstance().seedDemoData();
      this.renderDashboard();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  clearData: function() {
    if (confirm('⚠️ DANGER! This will permanently wipe ALL data. Are you sure?')) {
      ExamManager.getInstance().clearAllData();
      window.location.reload();
    }
  }
};
