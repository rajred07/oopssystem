/**
 * App Entry Point — initialises the ExamManager and renders the login screen.
 */
window.App = {

  init: function() {
    ExamManager.getInstance().load();
    this.renderLogin();
  },

  renderLogin: function() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-container">
        <div class="login-wrapper">

          <div class="login-hero">
            <div class="login-hero-icon">📋</div>
            <h1 class="login-hero-title">ExamSphere</h1>
            <p class="login-hero-sub">Secure · Smart · Scalable Online Examination</p>
            <div class="login-features">
              <div class="login-feature"><span>✓</span> MCQ, True/False &amp; Descriptive</div>
              <div class="login-feature"><span>✓</span> Real-time countdown timer</div>
              <div class="login-feature"><span>✓</span> Auto-grading &amp; merit lists</div>
              <div class="login-feature"><span>✓</span> Undo answer (Stack-based)</div>
              <div class="login-feature"><span>✓</span> CSV export &amp; analytics</div>
            </div>
          </div>

          <div class="login-card">
            <h2>Sign In</h2>
            <p style="color:var(--text-muted);margin-bottom:2rem;font-size:0.9rem;">Access your portal below</p>

            <div class="form-group">
              <label>Portal Type</label>
              <select id="login-type" class="form-control" onchange="window.App.toggleLoginFields()">
                <option value="student">🎓 Student Portal</option>
                <option value="admin">🔐 Admin Portal</option>
              </select>
            </div>

            <form id="login-form">
              <div id="email-group" class="form-group">
                <label>Email Address</label>
                <input type="email" id="login-email" class="form-control"
                  placeholder="student@example.com" required autocomplete="email">
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="login-pass" class="form-control"
                  placeholder="Enter password" required autocomplete="current-password">
              </div>
              <button class="btn btn-primary" type="submit" id="btn-signin" style="width:100%;font-size:1.05rem;padding:1rem;">
                Sign In →
              </button>
            </form>

            <div class="login-hint" id="login-hint-student">
              <strong>Demo credentials:</strong><br>
              Email: alice@test.com &nbsp;|&nbsp; Password: pass123<br>
              <em style="font-size:0.8rem;">First run "Seed Demo Data" from Admin → Settings</em>
            </div>
            <div class="login-hint" id="login-hint-admin" style="display:none;">
              <strong>Admin password:</strong> admin123
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const type = document.getElementById('login-type').value;
      const pass = document.getElementById('login-pass').value;
      const mgr  = ExamManager.getInstance();

      if (type === 'admin') {
        if (mgr.adminLogin(pass)) {
          window.AdminUI.render(document.getElementById('app'));
        } else {
          Toast.show('Invalid admin password', 'error');
        }
      } else {
        const email = document.getElementById('login-email').value.trim();
        if (mgr.studentLogin(email, pass)) {
          window.StudentUI.render(document.getElementById('app'));
        } else {
          Toast.show('Invalid email or password', 'error');
        }
      }
    });
  },

  toggleLoginFields: function() {
    const type          = document.getElementById('login-type').value;
    const emailGroup    = document.getElementById('email-group');
    const emailInput    = document.getElementById('login-email');
    const hintStudent   = document.getElementById('login-hint-student');
    const hintAdmin     = document.getElementById('login-hint-admin');

    if (type === 'admin') {
      emailGroup.style.display  = 'none';
      emailInput.removeAttribute('required');
      hintStudent.style.display = 'none';
      hintAdmin.style.display   = 'block';
    } else {
      emailGroup.style.display  = 'block';
      emailInput.setAttribute('required', 'true');
      hintStudent.style.display = 'block';
      hintAdmin.style.display   = 'none';
    }
  }
};

window.onload = () => window.App.init();
