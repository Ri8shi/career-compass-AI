/**
 * public/js/auth.js
 * Handles login, register forms, navbar user state, and history UI.
 */

// ────────────────────────────────────────────────────────────────────────────
// Shared utilities
// ────────────────────────────────────────────────────────────────────────────

function showAlert(el, message, type = 'error') {
  el.className = `auth-alert auth-alert--${type}`;
  el.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}"></i> ${message}`;
  el.style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function hideAlert(el) {
  el.style.display = 'none';
}

function setLoading(btn, loaderEl, textEl, loading) {
  btn.disabled = loading;
  loaderEl.style.display = loading ? 'block' : 'none';
  textEl.style.opacity = loading ? '0' : '1';
}

// ────────────────────────────────────────────────────────────────────────────
// Login page
// ────────────────────────────────────────────────────────────────────────────

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const alert = document.getElementById('authAlert');
  const btn = document.getElementById('loginBtn');
  const loader = document.getElementById('loginLoader');
  const btnText = document.getElementById('loginBtnText');
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPassword');
  const eyeIcon = document.getElementById('eyeIcon');

  // Password visibility toggle
  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const email = document.getElementById('loginEmail').value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      return showAlert(alert, 'Please fill in all fields.');
    }

    setLoading(btn, loader, btnText, true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert(alert, data.error || 'Login failed.');
      } else {
        showAlert(alert, 'Login successful! Redirecting…', 'success');
        setTimeout(() => (window.location.href = '/'), 800);
      }
    } catch {
      showAlert(alert, 'Network error. Please try again.');
    } finally {
      setLoading(btn, loader, btnText, false);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Register page
// ────────────────────────────────────────────────────────────────────────────

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0–4
}

function updateStrengthUI(password) {
  const strengthEl = document.getElementById('passwordStrength');
  const labelEl = document.getElementById('strengthLabel');
  const bars = [
    document.getElementById('strengthBar1'),
    document.getElementById('strengthBar2'),
    document.getElementById('strengthBar3'),
    document.getElementById('strengthBar4'),
  ];

  if (!password) {
    strengthEl.style.display = 'none';
    return;
  }

  strengthEl.style.display = 'flex';
  const score = getPasswordStrength(password);
  const levels = ['active-weak', 'active-fair', 'active-good', 'active-strong'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  bars.forEach((bar, i) => {
    bar.className = 'password-strength__bar';
    if (i < score) bar.classList.add(levels[Math.max(score - 1, 0)]);
  });
  labelEl.textContent = score ? labels[score - 1] : 'Weak';
}

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const alert = document.getElementById('authAlert');
  const btn = document.getElementById('registerBtn');
  const loader = document.getElementById('registerLoader');
  const btnText = document.getElementById('registerBtnText');
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('regPassword');
  const eyeIcon = document.getElementById('eyeIcon');

  // Password visibility toggle
  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  // Password strength
  passwordInput?.addEventListener('input', () => {
    updateStrengthUI(passwordInput.value);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = passwordInput.value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (!name || !email || !password || !passwordConfirm) {
      return showAlert(alert, 'Please fill in all fields.');
    }
    if (password.length < 6) {
      return showAlert(alert, 'Password must be at least 6 characters.');
    }
    if (password !== passwordConfirm) {
      return showAlert(alert, 'Passwords do not match.');
    }

    setLoading(btn, loader, btnText, true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert(alert, data.error || 'Registration failed.');
      } else {
        showAlert(alert, 'Account created! Redirecting to login…', 'success');
        setTimeout(() => (window.location.href = '/login.html'), 1200);
      }
    } catch {
      showAlert(alert, 'Network error. Please try again.');
    } finally {
      setLoading(btn, loader, btnText, false);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Navbar auth state (runs on index.html)
// ────────────────────────────────────────────────────────────────────────────

async function initNavAuth() {
  const nav = document.getElementById('headerNav');
  if (!nav) return;

  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();

    if (data.user) {
      // Show clickable user pill with dropdown (logout)
      const initials = data.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const wrapper = document.createElement('div');
      wrapper.className = 'user-pill-wrapper';
      wrapper.id = 'userPillWrapper';

      wrapper.innerHTML = `
        <div class="user-pill" id="userPill" role="button" aria-haspopup="true" aria-expanded="false" tabindex="0">
          <div class="user-pill__avatar">${initials}</div>
          <span>${data.user.name.split(' ')[0]}</span>
          <svg class="user-pill__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="profile-dropdown" id="profileDropdown" role="menu">
          <div class="profile-dropdown__header">
            <div class="profile-dropdown__name">${data.user.name}</div>
            <div class="profile-dropdown__email">${data.user.email || ''}</div>
          </div>
          <button class="profile-dropdown__item profile-dropdown__item--danger" id="btnLogout" role="menuitem">
            <i data-lucide="log-out"></i>
            Logout
          </button>
        </div>
      `;

      // Toggle dropdown
      const pill = wrapper.querySelector('#userPill');
      const dropdown = wrapper.querySelector('#profileDropdown');
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle('open');
        pill.setAttribute('aria-expanded', isOpen);
      });
      // Keyboard support
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); }
        if (e.key === 'Escape') wrapper.classList.remove('open');
      });
      // Close on outside click
      document.addEventListener('click', () => wrapper.classList.remove('open'));
      dropdown.addEventListener('click', (e) => e.stopPropagation());

      // Logout action
      wrapper.querySelector('#btnLogout').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.reload();
      });

      nav.prepend(wrapper);

      // Store user globally for other scripts
      window.currentUser = data.user;

      // Load history
      loadHistory();
    } else {
      // Show login/register links
      const loginLink = document.createElement('a');
      loginLink.href = '/login.html';
      loginLink.className = 'btn btn--ghost';
      loginLink.innerHTML = '<i data-lucide="log-in"></i> Log In';

      const registerLink = document.createElement('a');
      registerLink.href = '/register.html';
      registerLink.className = 'btn btn--primary';
      registerLink.innerHTML = '<i data-lucide="user-plus"></i> Sign Up';

      nav.prepend(loginLink);
      nav.appendChild(registerLink);

      window.currentUser = null;
    }

    lucide.createIcons();
  } catch (err) {
    console.warn('Auth check failed:', err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// History section (runs on index.html when authenticated)
// ────────────────────────────────────────────────────────────────────────────

async function loadHistory() {
  const existingSection = document.getElementById('historySection');
  if (existingSection) existingSection.remove();

  try {
    const res = await fetch('/api/history', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();

    if (!data.history || data.history.length === 0) return;

    const section = document.createElement('section');
    section.className = 'history-section';
    section.id = 'historySection';

    section.innerHTML = `
      <div class="history-section__header">
        <h2 class="history-section__title">
          <i data-lucide="history"></i>
          Your Past Analyses
        </h2>
      </div>
      <div class="history-grid" id="historyGrid"></div>
    `;

    const grid = section.querySelector('#historyGrid');

    data.history.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'history-card glass-card';
      card.style.animationDelay = `${i * 60}ms`;

      const date = new Date(item.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      card.innerHTML = `
        <p class="history-card__role">${escapeHtml(item.target_role)}</p>
        <div class="history-card__meta">
          <i data-lucide="file-text"></i>
          <span>${escapeHtml(item.file_name || 'Unknown file')}</span>
          <span>·</span>
          <i data-lucide="calendar"></i>
          <span>${date}</span>
        </div>
        <div class="history-card__actions">
          <button class="history-card__btn" data-view="${item.id}">
            <i data-lucide="eye"></i> View
          </button>
          <button class="history-card__btn history-card__btn--danger" data-delete="${item.id}">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </div>
      `;

      // View button
      card.querySelector(`[data-view="${item.id}"]`).addEventListener('click', () => viewHistory(item.id));
      // Delete button
      card.querySelector(`[data-delete="${item.id}"]`).addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistory(item.id, card);
      });

      grid.appendChild(card);
    });

    // Insert above footer
    const footer = document.querySelector('footer');
    footer ? footer.before(section) : document.body.appendChild(section);
    lucide.createIcons();
  } catch (err) {
    console.warn('Failed to load history:', err);
  }
}

async function viewHistory(id) {
  try {
    const res = await fetch(`/api/history/${id}`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();

    // Dispatch a custom event — the main app.js / dashboard.js listens for this
    window.dispatchEvent(new CustomEvent('loadHistoryAnalysis', { detail: data.analysis }));

    // Scroll to dashboard
    document.getElementById('dashboardSection')?.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.warn('Failed to load analysis:', err);
  }
}

async function deleteHistory(id, cardEl) {
  if (!confirm('Delete this saved analysis?')) return;
  try {
    const res = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.9)';
      setTimeout(() => {
        cardEl.remove();
        // If grid empty, remove section
        if (document.querySelector('#historyGrid')?.children.length === 0) {
          document.getElementById('historySection')?.remove();
        }
      }, 300);
    }
  } catch (err) {
    console.warn('Failed to delete analysis:', err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Save confirmation toast
// ────────────────────────────────────────────────────────────────────────────

function showSaveToast(role) {
  let toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.innerHTML = `<i data-lucide="check-circle"></i> Analysis saved for "${escapeHtml(role)}"`;
  document.body.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str ?? ''));
  return d.innerHTML;
}

// Expose for use by app.js / dashboard.js
window.AuthModule = { showSaveToast, loadHistory, escapeHtml };
