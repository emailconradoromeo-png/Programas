let allCategories = [];
let searchTimeout = null;

(async function initProducts() {
  await loadCategories();
  await loadProducts();

  document.getElementById('products-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadProducts, 300);
  });
  document.getElementById('products-category-filter').addEventListener('change', loadProducts);
})();

async function loadCategories() {
  try {
    allCategories = await api.get('/categories');
    const filter = document.getElementById('products-category-filter');
    const modal = document.getElementById('product-category');
    filter.innerHTML = `<option value="">${t('products.allCategories')}</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    modal.innerHTML = `<option value="">${t('products.noCategory')}</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  } catch (err) {
    showAlert(document.getElementById('products-alerts'), err.message);
  }
}

async function loadProducts() {
  const search = document.getElementById('products-search').value;
  const category_id = document.getElementById('products-category-filter').value;
  let query = '?';
  if (search) query += `search=${encodeURIComponent(search)}&`;
  if (category_id) query += `category_id=${category_id}&`;

  const tbody = document.getElementById('products-table');
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"></div></td></tr>`;

  try {
    const products = await api.get(`/products${query}`);
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('products.noProducts')}</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => {
      const stockClass = p.stock <= 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : 'badge-success';
      const statusBadge = p.activo
        ? `<span class="badge badge-success">${t('products.active')}</span>`
        : `<span class="badge badge-danger">${t('products.inactive')}</span>`;
      return `
        <tr>
          <td>${p.codigo || '-'}</td>
          <td>${p.nombre}</td>
          <td>${p.category ? p.category.nombre : '-'}</td>
          <td>${formatCurrency(p.precio)}</td>
          <td><span class="badge ${stockClass}">${p.stock}</span></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})">${t('products.edit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">${t('products.delete')}</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '';
    showAlert(document.getElementById('products-alerts'), err.message);
  }
}

function openProductModal(product = null) {
  clearValidation(document.getElementById('product-modal'));
  document.getElementById('product-modal-title').textContent = product ? t('products.modalTitleEdit') : t('products.modalTitleNew');
  document.getElementById('product-edit-id').value = product ? product.id : '';
  document.getElementById('product-nombre').value = product ? product.nombre : '';
  document.getElementById('product-codigo').value = product ? (product.codigo || '') : '';
  document.getElementById('product-category').value = product ? (product.category_id || '') : '';
  document.getElementById('product-precio').value = product ? product.precio : '';
  document.getElementById('product-stock').value = product ? product.stock : 0;
  document.getElementById('product-descripcion').value = product ? (product.descripcion || '') : '';
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

async function editProduct(id) {
  try {
    const product = await api.get(`/products/${id}`);
    openProductModal(product);
  } catch (err) {
    showAlert(document.getElementById('products-alerts'), err.message);
  }
}

async function saveProduct() {
  const id = document.getElementById('product-edit-id').value;
  const nombreInput = document.getElementById('product-nombre');
  const precioInput = document.getElementById('product-precio');

  const data = {
    nombre: nombreInput.value.trim(),
    codigo: document.getElementById('product-codigo').value.trim() || null,
    category_id: document.getElementById('product-category').value || null,
    precio: parseFloat(precioInput.value),
    stock: parseInt(document.getElementById('product-stock').value) || 0,
    descripcion: document.getElementById('product-descripcion').value.trim() || null,
  };

  // Validation
  let valid = true;
  valid = validateField(nombreInput, data.nombre, t('products.nameRequired')) && valid;
  valid = validateField(precioInput, !isNaN(data.precio) && data.precio >= 0, t('products.invalidPrice')) && valid;
  if (!valid) return;

  const btn = document.querySelector('#product-modal .modal-footer .btn-primary');
  setButtonLoading(btn, true);

  try {
    if (id) {
      await api.put(`/products/${id}`, data);
    } else {
      await api.post('/products', data);
    }
    closeProductModal();
    showAlert(document.getElementById('products-alerts'), id ? t('products.updated') : t('products.created'), 'success');
    await loadProducts();
  } catch (err) {
    showAlert(document.getElementById('products-alerts'), err.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function deleteProduct(id, nombre) {
  const confirmed = await showConfirm(
    t('products.delete'),
    t('products.confirmDelete', { name: nombre }),
    t('products.delete'),
    'btn-danger'
  );
  if (!confirmed) return;
  try {
    await api.delete(`/products/${id}`);
    showAlert(document.getElementById('products-alerts'), t('products.deleted'), 'success');
    await loadProducts();
  } catch (err) {
    showAlert(document.getElementById('products-alerts'), err.message);
  }
}
