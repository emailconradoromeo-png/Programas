(function initReports() {
  setPreset('month');
})();

function setPreset(preset) {
  const today = new Date();
  const to = todayISO();
  let from;

  switch (preset) {
    case 'today':
      from = to;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      from = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      from = monthAgo.toISOString().split('T')[0];
      break;
  }

  document.getElementById('report-from').value = from;
  document.getElementById('report-to').value = to;
  loadReports();
}

async function loadReports() {
  const from = document.getElementById('report-from').value;
  const to = document.getElementById('report-to').value;
  if (!from || !to) {
    showAlert(document.getElementById('reports-alerts'), t('reports.selectBothDates'));
    return;
  }

  const query = `?from=${from}&to=${to}`;

  // Show loading in summary cards and tables
  document.querySelectorAll('#report-summary .card-value').forEach(el => { el.textContent = '...'; });
  document.getElementById('rpt-by-day').innerHTML = `<tr><td colspan="3"><div class="loading-spinner"></div></td></tr>`;
  document.getElementById('rpt-top-products').innerHTML = `<tr><td colspan="5"><div class="loading-spinner"></div></td></tr>`;
  document.getElementById('rpt-by-category').innerHTML = `<tr><td colspan="3"><div class="loading-spinner"></div></td></tr>`;

  try {
    const [summary, byDay, topProducts, byCategory, returns] = await Promise.all([
      api.get(`/reports/summary${query}`),
      api.get(`/reports/by-day${query}`),
      api.get(`/reports/top-products${query}`),
      api.get(`/reports/by-category${query}`),
      api.get(`/returns${query}`),
    ]);

    // Summary
    document.getElementById('rpt-total-ventas').textContent = summary.totalVentas;
    document.getElementById('rpt-total-ingresos').textContent = formatCurrency(summary.totalIngresos);
    document.getElementById('rpt-total-items').textContent = summary.totalItems;

    // Returns
    const totalRefunds = returns.reduce((sum, r) => sum + parseFloat(r.total), 0);
    document.getElementById('rpt-total-devoluciones').textContent = formatCurrency(totalRefunds);

    // By Day
    const byDayBody = document.getElementById('rpt-by-day');
    if (byDay.length === 0) {
      byDayBody.innerHTML = `<tr><td colspan="3" class="empty-state">${t('reports.noData')}</td></tr>`;
    } else {
      byDayBody.innerHTML = byDay.map(d => `
        <tr>
          <td>${formatDate(d.fecha)}</td>
          <td>${d.ventas}</td>
          <td>${formatCurrency(d.ingresos)}</td>
        </tr>
      `).join('');
    }

    // Top Products
    const topBody = document.getElementById('rpt-top-products');
    if (topProducts.length === 0) {
      topBody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('reports.noData')}</td></tr>`;
    } else {
      topBody.innerHTML = topProducts.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td>${p.codigo || '-'}</td>
          <td>${p.total_vendido}</td>
          <td>${formatCurrency(p.total_ingresos)}</td>
        </tr>
      `).join('');
    }

    // By Category
    const catBody = document.getElementById('rpt-by-category');
    if (byCategory.length === 0) {
      catBody.innerHTML = `<tr><td colspan="3" class="empty-state">${t('reports.noData')}</td></tr>`;
    } else {
      catBody.innerHTML = byCategory.map(c => `
        <tr>
          <td>${c.categoria}</td>
          <td>${c.total_vendido}</td>
          <td>${formatCurrency(c.total_ingresos)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showAlert(document.getElementById('reports-alerts'), err.message);
  }
}
