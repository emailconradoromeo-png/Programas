let returnSaleData = null;
let returnAlreadyReturned = {};

async function initReturns() {
  // Set date filters to today
  const today = todayISO();
  document.getElementById('ret-from').value = today;
  document.getElementById('ret-to').value = today;

  // Check if there's a pre-loaded sale ID from hash
  const hash = window.location.hash;
  const match = hash.match(/returns\?sale=(\d+)/);
  if (match) {
    document.getElementById('return-sale-id').value = match[1];
    await searchSaleForReturn();
  }

  await loadReturns();
}

async function searchSaleForReturn() {
  const saleId = document.getElementById('return-sale-id').value;
  if (!saleId) {
    showAlert(document.getElementById('returns-alerts'), t('returns.enterSaleId'));
    return;
  }

  try {
    const [sale, saleReturns] = await Promise.all([
      api.get(`/sales/${saleId}`),
      api.get(`/returns/sale/${saleId}`),
    ]);

    returnSaleData = sale;

    // Calculate already returned quantities per sale_item_id
    returnAlreadyReturned = {};
    for (const ret of saleReturns) {
      for (const ri of ret.items) {
        returnAlreadyReturned[ri.sale_item_id] = (returnAlreadyReturned[ri.sale_item_id] || 0) + ri.cantidad;
      }
    }

    renderSaleForReturn(sale);
  } catch (err) {
    document.getElementById('return-sale-detail').innerHTML =
      `<div class="alert alert-danger">${t('returns.saleNotFound')}</div>`;
  }
}

function renderSaleForReturn(sale) {
  const container = document.getElementById('return-sale-detail');
  const allFullyReturned = sale.items.every(item => {
    const returned = returnAlreadyReturned[item.id] || 0;
    return returned >= item.cantidad;
  });

  const itemsHtml = sale.items.map(item => {
    const returned = returnAlreadyReturned[item.id] || 0;
    const available = item.cantidad - returned;
    const fullyReturned = available <= 0;

    return `<tr style="${fullyReturned ? 'opacity:0.5' : ''}">
      <td>${item.product ? item.product.nombre : '-'}</td>
      <td>${item.product ? (item.product.codigo || '-') : '-'}</td>
      <td style="text-align:center">${item.cantidad}</td>
      <td style="text-align:right">${formatCurrency(item.precio_unit)}</td>
      <td style="text-align:center"><span class="badge badge-${returned > 0 ? 'warning' : 'info'}">${returned}</span></td>
      <td style="text-align:center"><span class="badge badge-${fullyReturned ? 'danger' : 'success'}">${available}</span></td>
      <td style="text-align:center">
        ${fullyReturned
          ? `<em style="font-size:12px;color:var(--gray-500)">${t('returns.fullyReturned')}</em>`
          : `<input type="number" class="form-control return-qty-input" data-sale-item-id="${item.id}" data-max="${available}" min="0" max="${available}" value="0" style="width:70px;display:inline-block">`
        }
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="sale-card" style="margin-top:12px">
      <div class="sale-card-header">
        <h4>${t('table.sales')} #${sale.id} &mdash; ${formatDateTime(sale.createdAt)}</h4>
        <span class="sale-total">${formatCurrency(sale.total)}</span>
      </div>
      <div class="sale-card-details open">
        <table>
          <thead>
            <tr>
              <th>${t('table.product')}</th>
              <th>${t('table.code')}</th>
              <th style="text-align:center">${t('table.qty')}</th>
              <th style="text-align:right">${t('table.unitPrice')}</th>
              <th style="text-align:center">${t('returns.alreadyReturned')}</th>
              <th style="text-align:center">${t('returns.returnable')}</th>
              <th style="text-align:center">${t('returns.qtyToReturn')}</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        ${!allFullyReturned ? `
          <div style="margin-top:12px">
            <div class="form-group">
              <label data-i18n="returns.reason">${t('returns.reason')}</label>
              <textarea class="form-control" id="return-motivo" rows="2"></textarea>
            </div>
            <button class="btn btn-primary" onclick="processReturn()" data-i18n="returns.processReturn">${t('returns.processReturn')}</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function processReturn() {
  const inputs = document.querySelectorAll('.return-qty-input');
  const items = [];
  let totalRefund = 0;

  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    if (qty > 0) {
      const saleItemId = parseInt(input.dataset.saleItemId);
      const saleItem = returnSaleData.items.find(i => i.id === saleItemId);
      const subtotal = parseFloat(saleItem.precio_unit) * qty;
      items.push({
        sale_item_id: saleItemId,
        cantidad: qty,
        nombre: saleItem.product ? saleItem.product.nombre : '-',
        subtotal,
      });
      totalRefund += subtotal;
    }
  });

  if (items.length === 0) {
    showAlert(document.getElementById('returns-alerts'), t('returns.noItemsSelected'));
    return;
  }

  // Show confirmation modal
  const summaryHtml = `
    <table style="width:100%;margin-top:8px">
      <thead><tr><th>${t('table.product')}</th><th style="text-align:center">${t('table.qty')}</th><th style="text-align:right">${t('table.subtotal')}</th></tr></thead>
      <tbody>
        ${items.map(i => `<tr><td>${i.nombre}</td><td style="text-align:center">${i.cantidad}</td><td style="text-align:right">${formatCurrency(i.subtotal)}</td></tr>`).join('')}
      </tbody>
      <tfoot><tr><td colspan="2" style="text-align:right;font-weight:700">${t('table.total')}:</td><td style="text-align:right;font-weight:700;color:var(--danger)">${formatCurrency(totalRefund)}</td></tr></tfoot>
    </table>
  `;

  document.getElementById('return-confirm-summary').innerHTML = summaryHtml;
  document.getElementById('return-confirm-modal').classList.add('active');
}

async function confirmReturn() {
  const inputs = document.querySelectorAll('.return-qty-input');
  const items = [];
  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    if (qty > 0) {
      items.push({
        sale_item_id: parseInt(input.dataset.saleItemId),
        cantidad: qty,
      });
    }
  });

  const motivo = document.getElementById('return-motivo') ? document.getElementById('return-motivo').value : '';

  try {
    await api.post('/returns', {
      sale_id: returnSaleData.id,
      items,
      motivo,
    });

    closeReturnModal();
    showAlert(document.getElementById('returns-alerts'), t('returns.success'), 'success');

    // Refresh the sale view and returns list
    await searchSaleForReturn();
    await loadReturns();
  } catch (err) {
    closeReturnModal();
    showAlert(document.getElementById('returns-alerts'), err.message);
  }
}

function closeReturnModal() {
  document.getElementById('return-confirm-modal').classList.remove('active');
}

async function loadReturns() {
  const from = document.getElementById('ret-from').value;
  const to = document.getElementById('ret-to').value;
  let query = '';
  if (from) query += `?from=${from}`;
  if (to) query += `${query ? '&' : '?'}to=${to}`;

  try {
    const returns = await api.get(`/returns${query}`);
    renderReturnsList(returns);
  } catch (err) {
    console.error('Error loading returns:', err);
  }
}

function renderReturnsList(returns) {
  const container = document.getElementById('returns-list');
  if (!returns || returns.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${t('returns.noReturns')}</p></div>`;
    return;
  }

  container.innerHTML = returns.map((ret, idx) => {
    const itemsHtml = ret.items.map(item =>
      `<tr>
        <td>${item.product ? item.product.nombre : '-'}</td>
        <td>${item.product ? (item.product.codigo || '-') : '-'}</td>
        <td style="text-align:center">${item.cantidad}</td>
        <td style="text-align:right">${formatCurrency(item.precio_unit)}</td>
        <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
      </tr>`
    ).join('');

    return `<div class="sale-card">
      <div class="sale-card-header" onclick="toggleReturnDetail(${idx})">
        <h4>${t('returns.return')} #${ret.id} &mdash; ${t('table.sales')} #${ret.sale_id} &mdash; ${formatDateTime(ret.createdAt)}</h4>
        <div>
          <span class="badge badge-warning">${ret.items_count} ${t('table.items').toLowerCase()}</span>
          <span class="sale-total" style="color:var(--danger)">${formatCurrency(ret.total)}</span>
        </div>
      </div>
      <div class="sale-card-details" id="return-detail-${idx}">
        ${ret.motivo ? `<p style="margin-bottom:8px;font-size:13px;color:var(--gray-500)"><strong>${t('returns.reason')}:</strong> ${ret.motivo}</p>` : ''}
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
              <td colspan="4" style="text-align:right;font-weight:700">${t('table.total')}:</td>
              <td style="text-align:right;font-weight:700;color:var(--danger)">${formatCurrency(ret.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
  }).join('');
}

function toggleReturnDetail(idx) {
  const el = document.getElementById(`return-detail-${idx}`);
  el.classList.toggle('open');
}

initReturns();
