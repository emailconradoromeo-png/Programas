async function initAnalytics() {
  // Setup tabs
  document.querySelectorAll('#analytics-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#analytics-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');

      // Lazy load tab data
      if (btn.dataset.tab === 'tab-restock' && !btn._loaded) {
        btn._loaded = true;
        loadRestock();
      } else if (btn.dataset.tab === 'tab-dead' && !btn._loaded) {
        btn._loaded = true;
        loadDeadStock();
      } else if (btn.dataset.tab === 'tab-anomalies' && !btn._loaded) {
        btn._loaded = true;
        loadAnomalies();
      }
    });
  });

  // Set default date range (30 days)
  setVelPreset(30);

  // Load alerts + initial velocity data
  loadAlerts();
  loadVelocity();
}

function setVelPreset(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  document.getElementById('vel-from').value = from.toISOString().split('T')[0];
  document.getElementById('vel-to').value = to.toISOString().split('T')[0];
}

async function loadAlerts() {
  try {
    const data = await api.get('/analytics/alerts');
    document.getElementById('alert-out-of-stock').textContent = data.outOfStock;
    document.getElementById('alert-critical').textContent = data.criticalRestock;
    document.getElementById('alert-warning').textContent = data.warningRestock;
    document.getElementById('alert-not-selling').textContent = data.notSelling;
  } catch (err) {
    console.error('Error loading alerts:', err);
  }
}

function trendBadge(tendencia) {
  const map = {
    creciente: { cls: 'badge-success', label: t('analytics.trendUp') },
    estable: { cls: 'badge-info', label: t('analytics.trendStable') },
    decreciente: { cls: 'badge-danger', label: t('analytics.trendDown') },
    sin_datos: { cls: 'badge-secondary', label: t('analytics.trendNoData') },
  };
  const info = map[tendencia] || map.sin_datos;
  return `<span class="badge ${info.cls}">${info.label}</span>`;
}

function priorityBadge(prioridad) {
  const map = {
    critico: 'badge-danger',
    alerta: 'badge-warning',
    vigilar: 'badge-info',
  };
  const labels = {
    critico: t('analytics.critical'),
    alerta: t('analytics.warning'),
    vigilar: t('analytics.watch'),
  };
  return `<span class="badge ${map[prioridad]}">${labels[prioridad]}</span>`;
}

async function loadVelocity() {
  const from = document.getElementById('vel-from').value;
  const to = document.getElementById('vel-to').value;

  // Show loading spinners
  document.getElementById('velocity-tbody').innerHTML = `<tr><td colspan="9"><div class="loading-spinner"></div></td></tr>`;
  document.getElementById('category-perf-tbody').innerHTML = `<tr><td colspan="7"><div class="loading-spinner"></div></td></tr>`;

  try {
    const [products, categories] = await Promise.all([
      api.get(`/analytics/product-velocity?from=${from}&to=${to}`),
      api.get(`/analytics/category-performance?from=${from}&to=${to}`),
    ]);

    // Product velocity table
    const tbody = document.getElementById('velocity-tbody');
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">${t('reports.noData')}</td></tr>`;
    } else {
      tbody.innerHTML = products.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td>${p.codigo || '-'}</td>
          <td>${p.categoria || '-'}</td>
          <td>${p.total_vendido}</td>
          <td>${formatCurrency(p.total_ingresos)}</td>
          <td>${p.porcentaje_ingresos}%</td>
          <td>${p.velocidad_diaria}</td>
          <td>${trendBadge(p.tendencia)}</td>
        </tr>
      `).join('');
    }

    // Category performance table
    const catBody = document.getElementById('category-perf-tbody');
    if (categories.length === 0) {
      catBody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('reports.noData')}</td></tr>`;
    } else {
      catBody.innerHTML = categories.map(c => `
        <tr>
          <td>${c.categoria || '-'}</td>
          <td>${c.num_productos}</td>
          <td>${c.total_vendido}</td>
          <td>${formatCurrency(c.total_ingresos)}</td>
          <td>${c.porcentaje_ingresos}%</td>
          <td>${c.velocidad_promedio}</td>
          <td>${trendBadge(c.tendencia)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading velocity:', err);
  }
}

async function loadRestock() {
  const tbody = document.getElementById('restock-tbody');
  tbody.innerHTML = `<tr><td colspan="8"><div class="loading-spinner"></div></td></tr>`;

  try {
    const data = await api.get('/analytics/restock');
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${t('analytics.noRestockNeeded')}</td></tr>`;
    } else {
      tbody.innerHTML = data.map(r => `
        <tr class="restock-${r.prioridad}">
          <td>${priorityBadge(r.prioridad)}</td>
          <td>${r.nombre}</td>
          <td>${r.codigo || '-'}</td>
          <td>${r.stock}</td>
          <td>${r.velocidad_diaria}</td>
          <td>${r.dias_hasta_agotarse}</td>
          <td><strong>${r.cantidad_sugerida}</strong></td>
          <td>${r.ultima_entrada ? formatDate(r.ultima_entrada) : '-'}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading restock:', err);
  }
}

async function loadDeadStock() {
  const days = document.getElementById('dead-days').value || 30;
  const tbody = document.getElementById('dead-tbody');
  tbody.innerHTML = `<tr><td colspan="8"><div class="loading-spinner"></div></td></tr>`;

  try {
    const data = await api.get(`/analytics/dead-stock?days=${days}`);
    const totalFrozen = data.reduce((sum, d) => sum + d.valor_inmovilizado, 0);
    document.getElementById('dead-total-label').textContent =
      `${t('analytics.totalFrozenCapital')}: ${formatCurrency(totalFrozen)}`;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${t('analytics.noDeadStock')}</td></tr>`;
    } else {
      tbody.innerHTML = data.map(d => `
        <tr>
          <td>${d.nombre}</td>
          <td>${d.codigo || '-'}</td>
          <td>${d.categoria || '-'}</td>
          <td>${d.stock}</td>
          <td>${formatCurrency(d.precio)}</td>
          <td><strong>${formatCurrency(d.valor_inmovilizado)}</strong></td>
          <td>${d.ultima_venta ? formatDate(d.ultima_venta) : t('analytics.never')}</td>
          <td>${d.dias_sin_vender !== null ? d.dias_sin_vender : '-'}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading dead stock:', err);
  }
}

async function loadAnomalies() {
  const days = document.getElementById('anomaly-days').value || 7;
  const tbody = document.getElementById('anomalies-tbody');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"></div></td></tr>`;

  try {
    const data = await api.get(`/analytics/anomalies?days=${days}`);
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('analytics.noAnomalies')}</td></tr>`;
    } else {
      tbody.innerHTML = data.map(a => {
        const typeBadge = a.tipo === 'spike'
          ? `<span class="badge badge-danger">${t('analytics.spike')}</span>`
          : `<span class="badge badge-warning">${t('analytics.drop')}</span>`;
        return `
          <tr>
            <td>${formatDate(a.fecha)}</td>
            <td>${a.nombre}</td>
            <td>${typeBadge}</td>
            <td>${a.vendido}</td>
            <td>${a.promedio_diario}</td>
            <td>${a.desviacion}x</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading anomalies:', err);
  }
}

initAnalytics();
