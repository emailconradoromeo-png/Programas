async function initDailySales() {
  document.getElementById('ds-date').value = todayISO();
  await loadDailySales();
}

async function loadDailySales() {
  try {
    const date = document.getElementById('ds-date').value;
    const [data, returns] = await Promise.all([
      api.get(`/daily-sales?date=${date}`),
      api.get(`/returns?from=${date}&to=${date}`),
    ]);

    document.getElementById('ds-total-ventas').textContent = data.totalVentas;
    document.getElementById('ds-total-ingresos').textContent = formatCurrency(data.totalIngresos);
    document.getElementById('ds-total-items').textContent = data.totalItems;

    const totalRefunds = returns.reduce((sum, r) => sum + parseFloat(r.total), 0);
    document.getElementById('ds-total-reembolsos').textContent = formatCurrency(totalRefunds);

    renderSalesList(data.ventas);
  } catch (err) {
    console.error('Error loading daily sales:', err);
  }
}

function renderSalesList(ventas) {
  const container = document.getElementById('ds-sales-list');
  if (!ventas || ventas.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">&#128722;</div><p>${t('dailySales.noSales')}</p></div>`;
    return;
  }

  container.innerHTML = ventas.map((v, idx) => {
    const hora = formatDateTime(v.createdAt).split(',').pop().trim() || formatDateTime(v.createdAt);
    const itemsHtml = v.items.map(item =>
      `<tr>
        <td>${item.product ? item.product.nombre : t('table.product')}</td>
        <td>${item.product ? (item.product.codigo || '-') : '-'}</td>
        <td style="text-align:center">${item.cantidad}</td>
        <td style="text-align:right">${formatCurrency(item.precio_unit)}</td>
        <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
      </tr>`
    ).join('');

    return `<div class="sale-card">
      <div class="sale-card-header" onclick="toggleSaleDetail(${idx})">
        <h4>${t('table.sales')} #${v.id} &mdash; ${formatDateTime(v.createdAt)}</h4>
        <div>
          <span class="badge badge-info">${v.items_count} ${t('table.items').toLowerCase()}</span>
          <span class="sale-total">${formatCurrency(v.total)}</span>
        </div>
      </div>
      <div class="sale-card-details" id="sale-detail-${idx}">
        <table>
          <thead>
            <tr>
              <th>${t('table.product')}</th>
              <th>${t('table.code')}</th>
              <th style="text-align:center">${t('table.qty')}</th>
              <th style="text-align:right">${t('table.unitPrice')}</th>
              <th style="text-align:right">${t('table.subtotal')}</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right;font-weight:700;">${t('table.total')}:</td>
              <td style="text-align:right;font-weight:700;color:var(--success)">${formatCurrency(v.total)}</td>
            </tr>
          </tfoot>
        </table>
        ${v.nota ? `<p style="margin-top:8px;font-size:13px;color:var(--gray-500)">${v.nota}</p>` : ''}
        <div style="margin-top:8px;text-align:right">
          <button class="btn btn-secondary" onclick="window.location.hash='returns?sale=${v.id}'" style="font-size:13px;padding:4px 12px">${t('returns.returnBtn')}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleSaleDetail(idx) {
  const el = document.getElementById(`sale-detail-${idx}`);
  el.classList.toggle('open');
}

function changeDay(delta) {
  const input = document.getElementById('ds-date');
  const d = new Date(input.value);
  d.setDate(d.getDate() + delta);
  input.value = d.toISOString().split('T')[0];
  loadDailySales();
}

function goToday() {
  document.getElementById('ds-date').value = todayISO();
  loadDailySales();
}

async function showCierre() {
  // Switch to cierre tab
  document.querySelectorAll('#tab-ventas, #tab-cierre').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-cierre').classList.add('active');
  document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tabs .tab-btn')[1].classList.add('active');

  try {
    const date = document.getElementById('ds-date').value;
    const data = await api.get(`/daily-sales/cierre?date=${date}`);
    renderCierre(data);
  } catch (err) {
    document.getElementById('ds-cierre-content').innerHTML =
      `<div class="alert alert-danger">${t('dailySales.errorCierre')}: ${err.message}</div>`;
  }
}

function renderCierre(data) {
  const container = document.getElementById('ds-cierre-content');

  const horasHtml = data.desglosePorHora.length > 0
    ? `<table>
        <thead><tr><th>${t('table.hour')}</th><th style="text-align:center">${t('table.sales')}</th><th style="text-align:right">${t('table.income')}</th></tr></thead>
        <tbody>
          ${data.desglosePorHora.map(h => `<tr>
            <td>${h.hora}</td>
            <td style="text-align:center">${h.ventas}</td>
            <td style="text-align:right">${formatCurrency(h.ingresos)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr>
          <td style="font-weight:700">${t('table.total')}</td>
          <td style="text-align:center;font-weight:700">${data.totalVentas}</td>
          <td style="text-align:right;font-weight:700;color:var(--success)">${formatCurrency(data.totalIngresos)}</td>
        </tr></tfoot>
      </table>`
    : `<p class="empty-state">${t('dailySales.noSalesRegistered')}</p>`;

  const topHtml = data.topProductos.length > 0
    ? `<table>
        <thead><tr><th>${t('table.product')}</th><th>${t('table.code')}</th><th style="text-align:center">${t('table.sold')}</th><th style="text-align:right">${t('table.income')}</th></tr></thead>
        <tbody>
          ${data.topProductos.map(p => `<tr>
            <td>${p.nombre}</td>
            <td>${p.codigo || '-'}</td>
            <td style="text-align:center">${p.total_vendido}</td>
            <td style="text-align:right">${formatCurrency(p.total_ingresos)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : `<p class="empty-state">${t('dailySales.noProductsSold')}</p>`;

  container.innerHTML = `
    <div class="cards-grid" style="margin-bottom:20px">
      <div class="card">
        <div class="card-label">${t('table.date')}</div>
        <div class="card-value" style="font-size:18px">${data.fecha}</div>
      </div>
      <div class="card">
        <div class="card-label">${t('reports.totalSales')}</div>
        <div class="card-value">${data.totalVentas}</div>
      </div>
      <div class="card">
        <div class="card-label">${t('reports.totalIncome')}</div>
        <div class="card-value success">${formatCurrency(data.totalIngresos)}</div>
      </div>
      <div class="card">
        <div class="card-label">${t('reports.itemsSold')}</div>
        <div class="card-value">${data.totalItems}</div>
      </div>
    </div>
    <div class="cierre-section">
      <h3>${t('dailySales.hourBreakdown')}</h3>
      <div class="table-container">${horasHtml}</div>
    </div>
    <div class="cierre-section">
      <h3>${t('dailySales.topDayProducts')}</h3>
      <div class="table-container">${topHtml}</div>
    </div>
  `;
}

function switchDsTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

initDailySales();
