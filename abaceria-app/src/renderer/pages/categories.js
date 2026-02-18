(async function initCategories() {
  await loadCategories();
})();

async function loadCategories() {
  const tbody = document.getElementById('categories-table');
  tbody.innerHTML = `<tr><td colspan="5"><div class="loading-spinner"></div></td></tr>`;

  try {
    const categories = await api.get('/categories');
    const products = await api.get('/products');
    const countMap = {};
    products.forEach(p => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });

    if (categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('categories.noCategories')}</td></tr>`;
      return;
    }
    tbody.innerHTML = categories.map(c => `
      <tr>
        <td>${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td>${c.descripcion || '-'}</td>
        <td>${countMap[c.id] || 0}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editCategory(${c.id})">${t('products.edit')}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id}, '${c.nombre.replace(/'/g, "\\'")}')">${t('products.delete')}</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '';
    showAlert(document.getElementById('categories-alerts'), err.message);
  }
}

function openCategoryModal(category = null) {
  clearValidation(document.getElementById('category-modal'));
  document.getElementById('category-modal-title').textContent = category ? t('categories.modalTitleEdit') : t('categories.modalTitleNew');
  document.getElementById('category-edit-id').value = category ? category.id : '';
  document.getElementById('category-nombre').value = category ? category.nombre : '';
  document.getElementById('category-descripcion').value = category ? (category.descripcion || '') : '';
  document.getElementById('category-modal').classList.add('active');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
}

async function editCategory(id) {
  try {
    const category = await api.get(`/categories/${id}`);
    openCategoryModal(category);
  } catch (err) {
    showAlert(document.getElementById('categories-alerts'), err.message);
  }
}

async function saveCategory() {
  const id = document.getElementById('category-edit-id').value;
  const nombreInput = document.getElementById('category-nombre');
  const data = {
    nombre: nombreInput.value.trim(),
    descripcion: document.getElementById('category-descripcion').value.trim() || null,
  };

  // Validation
  if (!validateField(nombreInput, data.nombre, t('categories.nameRequired'))) return;

  const btn = document.querySelector('#category-modal .modal-footer .btn-primary');
  setButtonLoading(btn, true);

  try {
    if (id) {
      await api.put(`/categories/${id}`, data);
    } else {
      await api.post('/categories', data);
    }
    closeCategoryModal();
    showAlert(document.getElementById('categories-alerts'), id ? t('categories.updated') : t('categories.created'), 'success');
    await loadCategories();
  } catch (err) {
    showAlert(document.getElementById('categories-alerts'), err.message);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function deleteCategory(id, nombre) {
  const confirmed = await showConfirm(
    t('products.delete'),
    t('categories.confirmDelete', { name: nombre }),
    t('products.delete'),
    'btn-danger'
  );
  if (!confirmed) return;
  try {
    await api.delete(`/categories/${id}`);
    showAlert(document.getElementById('categories-alerts'), t('categories.deleted'), 'success');
    await loadCategories();
  } catch (err) {
    showAlert(document.getElementById('categories-alerts'), err.message);
  }
}
