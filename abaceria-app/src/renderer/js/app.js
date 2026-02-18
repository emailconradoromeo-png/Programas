const routes = {
  dashboard: { titleKey: 'nav.dashboard', file: 'pages/dashboard.html', init: 'initDashboard' },
  products: { titleKey: 'nav.products', file: 'pages/products.html', init: 'initProducts' },
  categories: { titleKey: 'nav.categories', file: 'pages/categories.html', init: 'initCategories' },
  pos: { titleKey: 'nav.pos', file: 'pages/pos.html', init: 'initPOS' },
  reports: { titleKey: 'nav.reports', file: 'pages/reports.html', init: 'initReports' },
  inventory: { titleKey: 'nav.inventory', file: 'pages/inventory.html', init: 'initInventory' },
  'daily-sales': { titleKey: 'nav.dailySales', file: 'pages/daily-sales.html', init: 'initDailySales' },
  analytics: { titleKey: 'nav.analytics', file: 'pages/analytics.html', init: 'initAnalytics' },
};

let currentPage = null;

async function navigateTo(page) {
  const route = routes[page];
  if (!route) return navigateTo('dashboard');

  currentPage = page;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
  });

  // Update header
  document.getElementById('page-title').textContent = t(route.titleKey);

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    toggleSidebar();
  }

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
  handleHashChange();
  // Load alert badge and start polling
  updateAlertBadge();
  setInterval(updateAlertBadge, 5 * 60 * 1000);
});

async function updateAlertBadge() {
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

function showAlert(container, message, type = 'danger') {
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = message;
  container.prepend(div);
  setTimeout(() => div.remove(), 4000);
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
