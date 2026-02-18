(async function initDashboard() {
  try {
    const today = todayISO();
    const [summary, sales, returns] = await Promise.all([
      api.get(`/reports/summary?from=${today}&to=${today}`),
      api.get(`/sales?from=${today}&to=${today}`),
      api.get(`/returns?from=${today}&to=${today}`),
    ]);

    document.getElementById('card-ventas-hoy').textContent = summary.totalVentas;
    document.getElementById('card-ingresos-hoy').textContent = formatCurrency(summary.totalIngresos);
    document.getElementById('card-productos-stock').textContent = summary.productosEnStock;
    document.getElementById('card-bajo-stock').textContent = summary.productosBajoStock;

    // Returns data
    const totalReturns = returns.length;
    const totalRefunds = returns.reduce((sum, r) => sum + parseFloat(r.total), 0);
    document.getElementById('card-devoluciones-hoy').textContent = totalReturns;
    document.getElementById('card-reembolsos-hoy').textContent = formatCurrency(totalRefunds);

    const tbody = document.getElementById('dashboard-last-sales');
    const recent = sales.slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('dashboard.noSalesToday')}</td></tr>`;
    } else {
      tbody.innerHTML = recent.map(s => `
        <tr>
          <td>${s.id}</td>
          <td>${formatDateTime(s.createdAt)}</td>
          <td>${s.items_count}</td>
          <td>${formatCurrency(s.total)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showAlert(document.getElementById('dashboard-alerts'), err.message);
  }
})();
