let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  showLoading(tbody.parentElement.parentElement);

  try {
    allUsers = await api.get('/users');
    renderUsers();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  if (allUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('users.noUsers')}</td></tr>`;
    return;
  }

  tbody.innerHTML = allUsers.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.nombre}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.rol === 'admin' ? 'badge-info' : 'badge-secondary'}">${u.rol === 'admin' ? 'Admin' : 'Cajero'}</span></td>
      <td><span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">${u.activo ? t('products.active') : t('products.inactive')}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editUser(${u.id})">${t('products.edit')}</button>
        <button class="btn btn-sm btn-secondary" onclick="openResetModal(${u.id}, '${u.nombre.replace(/'/g, "\\'")}')">${t('users.resetBtn')}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id}, '${u.nombre.replace(/'/g, "\\'")}')">${t('products.delete')}</button>
      </td>
    </tr>
  `).join('');
}

function openUserModal(user) {
  clearValidation(document.getElementById('user-modal'));
  document.getElementById('user-id').value = user ? user.id : '';
  document.getElementById('user-nombre').value = user ? user.nombre : '';
  document.getElementById('user-email').value = user ? user.email : '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-rol').value = user ? user.rol : 'cajero';

  const isEdit = !!user;
  document.getElementById('user-modal-title').textContent = isEdit ? t('users.editUser') : t('users.newUser');
  document.getElementById('user-password-group').style.display = isEdit ? 'none' : 'block';
  document.getElementById('user-activo-group').style.display = isEdit ? 'block' : 'none';
  if (isEdit) {
    document.getElementById('user-activo').value = String(user.activo);
  }

  document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

async function saveUser() {
  const id = document.getElementById('user-id').value;
  const nombre = document.getElementById('user-nombre').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;
  const rol = document.getElementById('user-rol').value;
  const btn = document.getElementById('user-save-btn');

  const modal = document.getElementById('user-modal');
  clearValidation(modal);

  let valid = true;
  valid = validateField(document.getElementById('user-nombre'), nombre, t('products.nameRequired')) && valid;
  valid = validateField(document.getElementById('user-email'), email, t('users.emailRequired')) && valid;
  if (!id) {
    valid = validateField(document.getElementById('user-password'), password && password.length >= 6, t('users.passwordMin')) && valid;
  }
  if (!valid) return;

  setButtonLoading(btn, true);

  try {
    if (id) {
      const activo = document.getElementById('user-activo').value === 'true';
      await api.put(`/users/${id}`, { nombre, email, rol, activo });
      showToast(t('users.updated'), 'success');
    } else {
      await api.post('/users', { nombre, email, password, rol });
      showToast(t('users.created'), 'success');
    }
    closeUserModal();
    loadUsers();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    setButtonLoading(btn, false);
  }
}

function editUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (user) openUserModal(user);
}

async function deleteUser(id, name) {
  const confirmed = await showConfirm(
    t('users.confirmDeleteTitle'),
    t('users.confirmDelete', { name }),
    t('products.delete'),
    'btn-danger'
  );
  if (!confirmed) return;

  try {
    await api.delete(`/users/${id}`);
    showToast(t('users.deleted'), 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function openResetModal(id, name) {
  document.getElementById('reset-user-id').value = id;
  document.getElementById('reset-user-name').textContent = name;
  document.getElementById('reset-password').value = '';
  document.getElementById('reset-modal').classList.add('active');
}

function closeResetModal() {
  document.getElementById('reset-modal').classList.remove('active');
}

async function doResetPassword() {
  const id = document.getElementById('reset-user-id').value;
  const newPassword = document.getElementById('reset-password').value;
  const btn = document.getElementById('reset-save-btn');

  if (!newPassword || newPassword.length < 6) {
    showToast(t('users.passwordMin'), 'danger');
    return;
  }

  setButtonLoading(btn, true);

  try {
    await api.put(`/users/${id}/reset`, { newPassword });
    showToast(t('users.passwordReset'), 'success');
    closeResetModal();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    setButtonLoading(btn, false);
  }
}

function initUsers() {
  applyTranslations();
  loadUsers();
}

initUsers();
