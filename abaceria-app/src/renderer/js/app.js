const routes = {
  dashboard: { titleKey: 'nav.dashboard', file: 'pages/dashboard.html', init: 'initDashboard' },
  products: { titleKey: 'nav.products', file: 'pages/products.html', init: 'initProducts' },
  categories: { titleKey: 'nav.categories', file: 'pages/categories.html', init: 'initCategories' },
  pos: { titleKey: 'nav.pos', file: 'pages/pos.html', init: 'initPOS' },
  reports: { titleKey: 'nav.reports', file: 'pages/reports.html', init: 'initReports' },
  inventory: { titleKey: 'nav.inventory', file: 'pages/inventory.html', init: 'initInventory' },
  'daily-sales': { titleKey: 'nav.dailySales', file: 'pages/daily-sales.html', init: 'initDailySales' },
  analytics: { titleKey: 'nav.analytics', file: 'pages/analytics.html', init: 'initAnalytics' },
  returns: { titleKey: 'nav.returns', file: 'pages/returns.html', init: 'initReturns' },
  users: { titleKey: 'nav.users', file: 'pages/users.html', init: 'initUsers', adminOnly: true },
  login: { titleKey: 'login.title', file: 'pages/login.html', init: 'initLogin', public: true },
};

let currentPage = null;

function isLoggedIn() {
  return !!localStorage.getItem('abaceria-token');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('abaceria-user'));
  } catch { return null; }
}

function updateUserInfo() {
  const user = getCurrentUser();
  const nameEl = document.getElementById('user-display-name');
  const rolEl = document.getElementById('user-display-rol');
  const userSection = document.getElementById('sidebar-user-section');
  const usersLink = document.getElementById('nav-users-link');

  if (user && isLoggedIn()) {
    if (nameEl) nameEl.textContent = user.nombre;
    if (rolEl) rolEl.textContent = user.rol === 'admin' ? 'Admin' : 'Cajero';
    if (userSection) userSection.style.display = 'block';
    if (usersLink) usersLink.style.display = user.rol === 'admin' ? 'flex' : 'none';
  } else {
    if (userSection) userSection.style.display = 'none';
    if (usersLink) usersLink.style.display = 'none';
  }
}

function doLogout() {
  localStorage.removeItem('abaceria-token');
  localStorage.removeItem('abaceria-user');
  window.location.hash = '#login';
}

async function navigateTo(page) {
  const route = routes[page];
  if (!route) return navigateTo('dashboard');

  // Auth guard
  if (!route.public && !isLoggedIn()) {
    return navigateTo('login');
  }

  // If logged in and trying to go to login, redirect to dashboard
  if (page === 'login' && isLoggedIn()) {
    return navigateTo('dashboard');
  }

  // Admin-only pages
  if (route.adminOnly) {
    const user = getCurrentUser();
    if (!user || user.rol !== 'admin') {
      return navigateTo('dashboard');
    }
  }

  currentPage = page;

  // Show/hide sidebar and header on login page
  const sidebar = document.getElementById('sidebar');
  const mainHeader = document.querySelector('.content-header');
  const hamburger = document.getElementById('hamburger-btn');
  const isLogin = page === 'login';

  if (sidebar) sidebar.style.display = isLogin ? 'none' : '';
  if (mainHeader) mainHeader.style.display = isLogin ? 'none' : '';
  if (hamburger) hamburger.style.display = isLogin ? 'none' : '';

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
  });

  // Update header
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = t(route.titleKey);

  // Close mobile sidebar
  if (sidebar && sidebar.classList.contains('open')) {
    toggleSidebar();
  }

  // Update user info
  updateUserInfo();

  // Load page content
  try {
    const res = await fetch(route.file);
    const html = await res.text();
    document.getElementById('content-body').innerHTML = html;

    // Apply i18n to loaded content
    applyTranslations();

    // Load and run page script
    const script = document.createElement('script');
    script.src = route.file.replace('.html', '.js') + '?t=' + Date.now();
    document.getElementById('content-body').appendChild(script);
  } catch (err) {
    document.getElementById('content-body').innerHTML =
      `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  navigateTo(hash);
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', () => {
  // Set language selector to current language
  const sel = document.getElementById('lang-selector');
  if (sel) sel.value = getLanguage();
  // Apply translations to static elements
  applyTranslations();
  // Update user info in sidebar
  updateUserInfo();
  handleHashChange();
  // Load alert badge and start polling
  if (isLoggedIn()) {
    updateAlertBadge();
    setInterval(updateAlertBadge, 5 * 60 * 1000);
  }
});

async function updateAlertBadge() {
  if (!isLoggedIn()) return;
  try {
    const data = await api.get('/analytics/alerts');
    const count = data.outOfStock + data.criticalRestock + data.warningRestock;
    const badge = document.getElementById('analytics-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    // Silently ignore badge errors
  }
}

// Utility functions
function formatCurrency(amount) {
  const num = Math.round(Number(amount));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' FCFA';
}

function getLocale() {
  const lang = getLanguage();
  const locales = { es: 'es-ES', fr: 'fr-FR', en: 'en-US' };
  return locales[lang] || 'es-ES';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Toast Notification System ---
function showToast(message, type = 'danger', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Limit to 3 visible toasts
  while (container.children.length >= 3) {
    container.firstChild.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-text">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(toast);

  const timer = setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);

  toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
}

// Backward-compatible showAlert → now calls showToast
function showAlert(container, message, type = 'danger') {
  showToast(message, type);
}

// --- Loading States ---
function showLoading(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn._originalText = btn.textContent;
  } else {
    btn.classList.remove('loading');
  }
}

// --- Global Confirm Dialog ---
let confirmResolve = null;
function showConfirm(title, message, actionLabel = 'Confirmar', btnClass = 'btn-danger') {
  return new Promise(resolve => {
    confirmResolve = resolve;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    const actionBtn = document.getElementById('confirm-action-btn');
    actionBtn.textContent = actionLabel;
    actionBtn.className = `btn ${btnClass}`;
    document.getElementById('global-confirm').classList.add('active');
  });
}

function resolveConfirm(value) {
  document.getElementById('global-confirm').classList.remove('active');
  if (confirmResolve) {
    confirmResolve(value);
    confirmResolve = null;
  }
}

// --- Form Validation ---
function validateField(input, condition, errorMsg) {
  const existing = input.parentElement.querySelector('.form-error');
  if (existing) existing.remove();
  if (!condition) {
    input.classList.add('error');
    const err = document.createElement('div');
    err.className = 'form-error';
    err.textContent = errorMsg;
    input.parentElement.appendChild(err);
    return false;
  }
  input.classList.remove('error');
  return true;
}

function clearValidation(container) {
  container.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  container.querySelectorAll('.form-error').forEach(el => el.remove());
}

function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// --- Escape key to close modals ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close global confirm first
    const gc = document.getElementById('global-confirm');
    if (gc && gc.classList.contains('active')) {
      resolveConfirm(false);
      return;
    }
    // Close any active modal overlay
    const activeModal = document.querySelector('.modal-overlay.active, .confirm-overlay.active');
    if (activeModal) {
      activeModal.classList.remove('active');
    }
  }
});

// --- Focus trap for modals ---
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const activeModal = document.querySelector('.modal-overlay.active .modal, .confirm-overlay.active .confirm-box');
  if (!activeModal) return;
  const focusable = activeModal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
