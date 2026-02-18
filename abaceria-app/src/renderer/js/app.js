const routes = {
  dashboard: { title: 'Dashboard', file: 'pages/dashboard.html', init: 'initDashboard' },
  products: { title: 'Productos', file: 'pages/products.html', init: 'initProducts' },
  categories: { title: 'Categorías', file: 'pages/categories.html', init: 'initCategories' },
  pos: { title: 'Punto de Venta', file: 'pages/pos.html', init: 'initPOS' },
  reports: { title: 'Reportes', file: 'pages/reports.html', init: 'initReports' },
  inventory: { title: 'Inventario', file: 'pages/inventory.html', init: 'initInventory' },
  'daily-sales': { title: 'Registro Diario', file: 'pages/daily-sales.html', init: 'initDailySales' },
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
  document.getElementById('page-title').textContent = route.title;

  // Load page content
  try {
    const res = await fetch(route.file);
    const html = await res.text();
    document.getElementById('content-body').innerHTML = html;

    // Load and run page script
    const script = document.createElement('script');
    script.src = route.file.replace('.html', '.js') + '?t=' + Date.now();
    document.getElementById('content-body').appendChild(script);
  } catch (err) {
    document.getElementById('content-body').innerHTML =
      `<div class="alert alert-danger">Error al cargar la página: ${err.message}</div>`;
  }
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  navigateTo(hash);
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);

// Utility functions
function formatCurrency(amount) {
  return parseFloat(amount).toFixed(2);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
