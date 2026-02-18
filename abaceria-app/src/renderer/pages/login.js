async function doLogin(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errorDiv.style.display = 'none';

  if (!email || !password) {
    errorDiv.textContent = t('login.required');
    errorDiv.style.display = 'block';
    return;
  }

  setButtonLoading(btn, true);

  try {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('abaceria-token', data.token);
    localStorage.setItem('abaceria-user', JSON.stringify(data.user));
    updateUserInfo();
    window.location.hash = '#dashboard';
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  } finally {
    setButtonLoading(btn, false);
  }
}

function initLogin() {
  applyTranslations();
  const emailInput = document.getElementById('login-email');
  if (emailInput) emailInput.focus();
}

initLogin();
