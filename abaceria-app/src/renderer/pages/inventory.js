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
  try {
    const search = document.getElementById('inv-search').value;
    const stockFilter = document.getElementById('inv-stock-filter').value;
    let url = '/inventory/status?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (stockFilter) url += `stock_filter=${stockFilter}&`;
    const products = await api.get(url);
    const tbody = document.getElementById('inv-stock-body');
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No se encontraron productos</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => {
      let stockClass = 'stock-ok';
      let estadoBadge = '<span class="badge badge-success">Normal</span>';
      if (p.stock === 0) {
        stockClass = 'stock-zero';
        estadoBadge = '<span class="badge badge-danger">Sin stock</span>';
      } else if (p.stock <= 5) {
        stockClass = 'stock-low';
        estadoBadge = '<span class="badge badge-warning">Bajo</span>';
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
    console.error('Error loading inventory status:', err);
  }
}

async function loadMovements() {
  try {
    const from = document.getElementById('mov-from').value;
    const to = document.getElementById('mov-to').value;
    const tipo = document.getElementById('mov-tipo').value;
    let url = '/inventory/movements?';
    if (from) url += `from=${from}&`;
    if (to) url += `to=${to}&`;
    if (tipo) url += `tipo=${tipo}&`;
    const movements = await api.get(url);
    const tbody = document.getElementById('inv-movements-body');
    if (movements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay movimientos en este período</td></tr>';
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
  select.innerHTML = '<option value="">-- Seleccionar producto --</option>' +
    invProducts.map(p => `<option value="${p.id}" data-stock="${p.stock}">${p.nombre} (Stock: ${p.stock})</option>`).join('');
}

function openEntryModal() {
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
  const product_id = document.getElementById('entry-product').value;
  const cantidad = parseInt(document.getElementById('entry-cantidad').value);
  const nota = document.getElementById('entry-nota').value;

  if (!product_id) {
    showAlert(document.getElementById('entry-alert'), 'Seleccione un producto');
    return;
  }
  if (!cantidad || cantidad <= 0) {
    showAlert(document.getElementById('entry-alert'), 'La cantidad debe ser mayor a 0');
    return;
  }

  try {
    await api.post('/inventory/entry', { product_id: parseInt(product_id), cantidad, nota });
    closeEntryModal();
    await Promise.all([loadInventorySummary(), loadInventoryStatus(), loadAllProducts()]);
    showAlert(document.getElementById('content-body'), 'Entrada registrada exitosamente', 'success');
  } catch (err) {
    showAlert(document.getElementById('entry-alert'), err.message || 'Error al registrar entrada');
  }
}

function openAdjustmentModal() {
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
  const product_id = document.getElementById('adj-product').value;
  const stock_real = parseInt(document.getElementById('adj-stock-real').value);
  const nota = document.getElementById('adj-nota').value;

  if (!product_id) {
    showAlert(document.getElementById('adjustment-alert'), 'Seleccione un producto');
    return;
  }
  if (isNaN(stock_real) || stock_real < 0) {
    showAlert(document.getElementById('adjustment-alert'), 'El stock real debe ser un número no negativo');
    return;
  }

  try {
    await api.post('/inventory/adjustment', { product_id: parseInt(product_id), stock_real, nota });
    closeAdjustmentModal();
    await Promise.all([loadInventorySummary(), loadInventoryStatus(), loadAllProducts()]);
    showAlert(document.getElementById('content-body'), 'Ajuste aplicado exitosamente', 'success');
  } catch (err) {
    showAlert(document.getElementById('adjustment-alert'), err.message || 'Error al aplicar ajuste');
  }
}

initInventory();
