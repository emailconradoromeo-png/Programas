let invProducts = [];

async function initInventory() {
  const today = todayISO();
  document.getElementById('mov-from').value = today;
  document.getElementById('mov-to').value = today;
  await Promise.all([loadInventorySummary(), loadInventoryStatus(), loadAllProducts()]);
}

async function loadInventorySummary() {
  try {
    const data = await api.get('/inventory/summary');
    document.getElementById('inv-total').textContent = data.totalProductos;
    document.getElementById('inv-valor').textContent = formatCurrency(data.valorInventario);
    document.getElementById('inv-bajo').textContent = data.bajoStock;
    document.getElementById('inv-sin').textContent = data.sinStock;
  } catch (err) {
    console.error('Error loading inventory summary:', err);
  }
}

async function loadInventoryStatus() {
  const tbody = document.getElementById('inv-stock-body');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-spinner"></div></td></tr>`;

  try {
    const search = document.getElementById('inv-search').value;
    const stockFilter = document.getElementById('inv-stock-filter').value;
    let url = '/inventory/status?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (stockFilter) url += `stock_filter=${stockFilter}&`;
    const products = await api.get(url);
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('inventory.noProducts')}</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => {
      let stockClass = 'stock-ok';
      let estadoBadge = `<span class="badge badge-success">${t('inventory.normal')}</span>`;
      if (p.stock === 0) {
        stockClass = 'stock-zero';
        estadoBadge = `<span class="badge badge-danger">${t('inventory.noStock')}</span>`;
      } else if (p.stock <= 5) {
        stockClass = 'stock-low';
        estadoBadge = `<span class="badge badge-warning">${t('inventory.low')}</span>`;
      }
      return `<tr>
        <td>${p.codigo || '-'}</td>
        <td>${p.nombre}</td>
        <td>${p.category ? p.category.nombre : '-'}</td>
        <td>${formatCurrency(p.precio)}</td>
        <td class="${stockClass}">${p.stock}</td>
        <td>${estadoBadge}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '';
    console.error('Error loading inventory status:', err);
  }
}

async function loadMovements() {
  const tbody = document.getElementById('inv-movements-body');
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"></div></td></tr>`;

  try {
    const from = document.getElementById('mov-from').value;
    const to = document.getElementById('mov-to').value;
    const tipo = document.getElementById('mov-tipo').value;
    let url = '/inventory/movements?';
    if (from) url += `from=${from}&`;
    if (to) url += `to=${to}&`;
    if (tipo) url += `tipo=${tipo}&`;
    const movements = await api.get(url);
    if (movements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('inventory.noMovements')}</td></tr>`;
      return;
    }
    tbody.innerHTML = movements.map(m => {
      const tipoBadge = `<span class="badge badge-${m.tipo}">${m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}</span>`;
      const cantClass = m.cantidad >= 0 ? 'movement-positive' : 'movement-negative';
      const cantDisplay = m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad;
      return `<tr>
        <td>${formatDateTime(m.createdAt)}</td>
        <td>${m.product ? m.product.nombre : '-'}</td>
        <td>${tipoBadge}</td>
        <td class="${cantClass}">${cantDisplay}</td>
        <td>${m.stock_anterior}</td>
        <td>${m.stock_nuevo}</td>
        <td>${m.referencia || '-'}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '';
    console.error('Error loading movements:', err);
  }
}

async function loadAllProducts() {
  try {
    invProducts = await api.get('/products?activo=true');
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function switchInvTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  event.target.classList.add('active');
  if (tab === 'movements') loadMovements();
}

function populateProductSelect(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${t('inventory.selectProduct')}</option>` +
    invProducts.map(p => `<option value="${p.id}" data-stock="${p.stock}">${p.nombre} (${t('pos.stock')}: ${p.stock})</option>`).join('');
}

function openEntryModal() {
  clearValidation(document.getElementById('entry-modal'));
  populateProductSelect('entry-product');
  document.getElementById('entry-cantidad').value = 1;
  document.getElementById('entry-nota').value = '';
  document.getElementById('entry-alert').innerHTML = '';
  document.getElementById('entry-modal').classList.add('active');
}

function closeEntryModal() {
  document.getElementById('entry-modal').classList.remove('active');
}

async function submitEntry() {
  const productSelect = document.getElementById('entry-product');
  const cantidadInput = document.getElementById('entry-cantidad');
  const product_id = productSelect.value;
  const cantidad = parseInt(cantidadInput.value);
  const nota = document.getElementById('entry-nota').value;

  // Validation
  let valid = true;
  valid = validateField(productSelect, product_id, t('inventory.selectRequired')) && valid;
  valid = validateField(cantidadInput, cantidad && cantidad > 0, t('inventory.qtyRequired')) && valid;
  if (!valid) return;

  const btn = document.querySelector('#entry-modal .modal-footer .btn-success');
  setButtonLoading(btn, true);

  try {
    await api.post('/inventory/entry', { product_id: parseInt(product_id), cantidad, nota });
    closeEntryModal();
    await Promise.all([loadInventorySummary(), loadInventoryStatus(), loadAllProducts()]);
    showAlert(document.getElementById('content-body'), t('inventory.entrySuccess'), 'success');
  } catch (err) {
    showAlert(document.getElementById('entry-alert'), err.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

function openAdjustmentModal() {
  clearValidation(document.getElementById('adjustment-modal'));
  populateProductSelect('adj-product');
  document.getElementById('adj-stock-actual').value = '';
  document.getElementById('adj-stock-real').value = 0;
  document.getElementById('adj-nota').value = '';
  document.getElementById('adjustment-alert').innerHTML = '';
  document.getElementById('adjustment-modal').classList.add('active');
}

function closeAdjustmentModal() {
  document.getElementById('adjustment-modal').classList.remove('active');
}

function showCurrentStock() {
  const select = document.getElementById('adj-product');
  const option = select.options[select.selectedIndex];
  const stock = option ? option.getAttribute('data-stock') : '';
  document.getElementById('adj-stock-actual').value = stock || '';
}

async function submitAdjustment() {
  const productSelect = document.getElementById('adj-product');
  const stockRealInput = document.getElementById('adj-stock-real');
  const product_id = productSelect.value;
  const stock_real = parseInt(stockRealInput.value);
  const nota = document.getElementById('adj-nota').value;

  // Validation
  let valid = true;
  valid = validateField(productSelect, product_id, t('inventory.selectRequired')) && valid;
  valid = validateField(stockRealInput, !isNaN(stock_real) && stock_real >= 0, t('inventory.realStockRequired')) && valid;
  if (!valid) return;

  const btn = document.querySelector('#adjustment-modal .modal-footer .btn-primary');
  setButtonLoading(btn, true);

  try {
    await api.post('/inventory/adjustment', { product_id: parseInt(product_id), stock_real, nota });
    closeAdjustmentModal();
    await Promise.all([loadInventorySummary(), loadInventoryStatus(), loadAllProducts()]);
    showAlert(document.getElementById('content-body'), t('inventory.adjustmentSuccess'), 'success');
  } catch (err) {
    showAlert(document.getElementById('adjustment-alert'), err.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

initInventory();
