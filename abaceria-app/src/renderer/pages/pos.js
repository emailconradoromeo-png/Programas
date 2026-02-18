let posCart = [];
let posSearchTimeout = null;
let lastAddedProductId = null;
let posCurrentProducts = [];

(function initPOS() {
  const searchInput = document.getElementById('pos-search');
  searchInput.addEventListener('input', () => {
    clearTimeout(posSearchTimeout);
    posSearchTimeout = setTimeout(searchPOSProducts, 300);
  });

  // Enter shortcut: if exactly 1 product visible, add it to cart
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && posCurrentProducts.length === 1) {
      const p = posCurrentProducts[0];
      addToCart(p.id, p.nombre, p.precio, p.stock);
    }
  });

  loadPOSProducts();
})();

async function loadPOSProducts() {
  try {
    const products = await api.get('/products?activo=true');
    posCurrentProducts = products;
    renderPOSProducts(products);
  } catch (err) {
    showAlert(document.getElementById('pos-alerts'), err.message);
  }
}

async function searchPOSProducts() {
  const search = document.getElementById('pos-search').value.trim();
  const container = document.getElementById('pos-products-list');
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const query = search ? `?search=${encodeURIComponent(search)}&activo=true` : '?activo=true';
    const products = await api.get(`/products${query}`);
    posCurrentProducts = products;
    renderPOSProducts(products);
  } catch (err) {
    showAlert(document.getElementById('pos-alerts'), err.message);
  }
}

function renderPOSProducts(products) {
  const container = document.getElementById('pos-products-list');
  if (products.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('pos.noProducts')}</div>`;
    return;
  }
  container.innerHTML = products.map(p => {
    const stockClass = p.stock <= 0 ? 'pos-stock-zero' : p.stock <= 5 ? 'pos-stock-low' : 'pos-stock-ok';
    return `
    <div class="pos-product-item" onclick="addToCart(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, ${p.stock})">
      <div class="pos-product-info">
        <h4>${p.nombre}</h4>
        <small>${p.codigo || t('products.noCode')} | ${t('pos.stock')}: <span class="${stockClass}">${p.stock}</span></small>
      </div>
      <div class="pos-product-price">${formatCurrency(p.precio)}</div>
    </div>
  `;
  }).join('');
}

function addToCart(productId, nombre, precio, stock) {
  const existing = posCart.find(i => i.product_id === productId);
  if (existing) {
    if (existing.cantidad >= stock) {
      showAlert(document.getElementById('pos-alerts'), t('pos.stockInsufficient', { name: nombre, stock: stock }));
      return;
    }
    existing.cantidad++;
    existing.subtotal = Math.round(existing.cantidad * existing.precio);
  } else {
    if (stock <= 0) {
      showAlert(document.getElementById('pos-alerts'), t('pos.noStock', { name: nombre }));
      return;
    }
    posCart.push({
      product_id: productId,
      nombre,
      precio: Math.round(Number(precio)),
      cantidad: 1,
      subtotal: Math.round(Number(precio)),
      stock,
    });
  }
  lastAddedProductId = productId;
  renderCart();
}

function updateCartQty(productId, delta) {
  const item = posCart.find(i => i.product_id === productId);
  if (!item) return;
  const newQty = item.cantidad + delta;
  if (newQty <= 0) {
    posCart = posCart.filter(i => i.product_id !== productId);
  } else if (newQty > item.stock) {
    showAlert(document.getElementById('pos-alerts'), t('pos.stockInsufficient', { name: item.nombre, stock: item.stock }));
    return;
  } else {
    item.cantidad = newQty;
    item.subtotal = Math.round(item.cantidad * item.precio);
  }
  renderCart();
}

function removeFromCart(productId) {
  posCart = posCart.filter(i => i.product_id !== productId);
  renderCart();
}

function renderCart() {
  const container = document.getElementById('pos-cart-items');
  const countBadge = document.getElementById('pos-cart-count');

  if (posCart.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('pos.cartEmpty')}</div>`;
    document.getElementById('pos-total').textContent = '0 FCFA';
    if (countBadge) countBadge.textContent = '0';
    return;
  }

  const totalItems = posCart.reduce((sum, i) => sum + i.cantidad, 0);
  if (countBadge) countBadge.textContent = totalItems;

  container.innerHTML = posCart.map(item => {
    const flashClass = item.product_id === lastAddedProductId ? 'cart-item-added' : '';
    return `
    <div class="pos-cart-item ${flashClass}">
      <div class="pos-cart-item-name">${item.nombre}<br><small style="color:var(--gray-400)">${formatCurrency(item.precio)} ${t('pos.perUnit')}</small></div>
      <div class="pos-cart-item-qty">
        <button onclick="updateCartQty(${item.product_id}, -1)">-</button>
        <span>${item.cantidad}</span>
        <button onclick="updateCartQty(${item.product_id}, 1)">+</button>
      </div>
      <div class="pos-cart-item-subtotal">${formatCurrency(item.subtotal)}</div>
      <button class="pos-cart-item-remove" onclick="removeFromCart(${item.product_id})">&#10005;</button>
    </div>
  `;
  }).join('');

  // Reset flash after render
  lastAddedProductId = null;

  const total = posCart.reduce((sum, i) => sum + i.subtotal, 0);
  document.getElementById('pos-total').textContent = formatCurrency(total);
}

function processSale() {
  if (posCart.length === 0) {
    showAlert(document.getElementById('pos-alerts'), t('pos.cartEmpty'));
    return;
  }
  const total = posCart.reduce((sum, i) => sum + i.subtotal, 0);
  const itemsCount = posCart.reduce((sum, i) => sum + i.cantidad, 0);
  document.getElementById('pos-confirm-msg').textContent =
    t('pos.confirmSaleMsg', { count: itemsCount, total: formatCurrency(total) });
  document.getElementById('pos-confirm').classList.add('active');
}

function closeConfirm() {
  document.getElementById('pos-confirm').classList.remove('active');
}

async function confirmSale() {
  const btn = document.querySelector('#pos-confirm .btn-success');
  setButtonLoading(btn, true);

  closeConfirm();
  const saleData = {
    items: posCart.map(i => ({ product_id: i.product_id, cantidad: i.cantidad })),
  };

  try {
    await api.post('/sales', saleData);
    showAlert(document.getElementById('pos-alerts'), t('pos.saleSuccess'), 'success');
    posCart = [];
    renderCart();
    await loadPOSProducts();
  } catch (err) {
    showAlert(document.getElementById('pos-alerts'), err.message);
  } finally {
    setButtonLoading(btn, false);
  }
}
