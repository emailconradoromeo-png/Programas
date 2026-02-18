const { Sale, SaleItem, Product, Category, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/analytics/alerts
exports.alerts = async (req, res) => {
  try {
    const outOfStock = await Product.count({
      where: { activo: true, stock: 0 },
    });

    // Calculate velocity-based restock alerts (30-day window)
    const from30 = daysAgo(30);
    const products = await Product.findAll({
      where: { activo: true, stock: { [Op.gt]: 0 } },
      attributes: ['id', 'stock'],
      raw: true,
    });

    const velocities = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: from30 } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const velMap = {};
    velocities.forEach(v => {
      velMap[v.product_id] = parseInt(v.total_vendido) / 30;
    });

    let criticalRestock = 0;
    let warningRestock = 0;
    products.forEach(p => {
      const vel = velMap[p.id] || 0;
      if (vel <= 0) return;
      const daysLeft = p.stock / vel;
      if (daysLeft < 3) criticalRestock++;
      else if (daysLeft < 7) warningRestock++;
    });

    // Products not selling in 30 days with stock > 0
    const productIdsWithSales = velocities.map(v => v.product_id);
    const notSelling = await Product.count({
      where: {
        activo: true,
        stock: { [Op.gt]: 0 },
        ...(productIdsWithSales.length > 0
          ? { id: { [Op.notIn]: productIdsWithSales } }
          : {}),
      },
    });

    const totalAlerts = outOfStock + criticalRestock + warningRestock + notSelling;
    res.json({ outOfStock, criticalRestock, warningRestock, notSelling, totalAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/product-velocity?from=&to=
exports.productVelocity = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : daysAgo(30);
    const to = req.query.to ? (() => { const d = new Date(req.query.to); d.setHours(23, 59, 59, 999); return d; })() : endOfToday();

    const totalDays = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));
    const midDate = new Date(from.getTime() + (to - from) / 2);

    // Get all active products with category
    const products = await Product.findAll({
      where: { activo: true },
      include: [{ model: Category, as: 'category', attributes: ['nombre'] }],
      raw: true,
      nest: true,
    });

    // Sales per product in full period
    const salesData = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
        [fn('SUM', col('subtotal')), 'total_ingresos'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: from, [Op.lte]: to } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const salesMap = {};
    salesData.forEach(s => {
      salesMap[s.product_id] = {
        total_vendido: parseInt(s.total_vendido),
        total_ingresos: parseFloat(s.total_ingresos),
      };
    });

    // Sales first half
    const firstHalf = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'vendido'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: from, [Op.lt]: midDate } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const firstMap = {};
    firstHalf.forEach(s => { firstMap[s.product_id] = parseInt(s.vendido); });

    // Sales second half
    const secondHalf = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'vendido'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: midDate, [Op.lte]: to } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const secondMap = {};
    secondHalf.forEach(s => { secondMap[s.product_id] = parseInt(s.vendido); });

    // Total income for percentage
    const totalIncome = salesData.reduce((sum, s) => sum + parseFloat(s.total_ingresos), 0);

    const result = products.map(p => {
      const sales = salesMap[p.id] || { total_vendido: 0, total_ingresos: 0 };
      const first = firstMap[p.id] || 0;
      const second = secondMap[p.id] || 0;

      let tendencia = 'sin_datos';
      if (first > 0 || second > 0) {
        if (first === 0 && second > 0) tendencia = 'creciente';
        else if (first > 0 && second === 0) tendencia = 'decreciente';
        else {
          const change = (second - first) / first;
          if (change > 0.15) tendencia = 'creciente';
          else if (change < -0.15) tendencia = 'decreciente';
          else tendencia = 'estable';
        }
      }

      return {
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        categoria: p.category ? p.category.nombre : null,
        stock: p.stock,
        total_vendido: sales.total_vendido,
        total_ingresos: parseFloat(sales.total_ingresos.toFixed(2)),
        porcentaje_ingresos: totalIncome > 0 ? parseFloat((sales.total_ingresos / totalIncome * 100).toFixed(1)) : 0,
        velocidad_diaria: parseFloat((sales.total_vendido / totalDays).toFixed(2)),
        tendencia,
      };
    });

    result.sort((a, b) => b.total_vendido - a.total_vendido);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/restock
exports.restock = async (req, res) => {
  try {
    const from30 = daysAgo(30);

    const products = await Product.findAll({
      where: { activo: true },
      include: [{ model: Category, as: 'category', attributes: ['nombre'] }],
      raw: true,
      nest: true,
    });

    const velocities = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: from30 } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const velMap = {};
    velocities.forEach(v => {
      velMap[v.product_id] = parseInt(v.total_vendido) / 30;
    });

    // Last inventory entry per product
    const { InventoryMovement } = require('../models');
    const lastEntries = await InventoryMovement.findAll({
      attributes: [
        'product_id',
        [fn('MAX', col('InventoryMovement.createdAt')), 'ultima_entrada'],
      ],
      where: { tipo: 'entrada' },
      group: ['product_id'],
      raw: true,
    });
    const entryMap = {};
    lastEntries.forEach(e => { entryMap[e.product_id] = e.ultima_entrada; });

    const result = [];
    products.forEach(p => {
      const vel = velMap[p.id] || 0;
      if (vel <= 0) return;

      const diasHastaAgotarse = p.stock / vel;
      let prioridad;
      if (diasHastaAgotarse < 3) prioridad = 'critico';
      else if (diasHastaAgotarse < 7) prioridad = 'alerta';
      else if (diasHastaAgotarse < 14) prioridad = 'vigilar';
      else return; // ok, skip

      const cantidadSugerida = Math.max(0, Math.ceil(vel * 14) - p.stock);

      result.push({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        categoria: p.category ? p.category.nombre : null,
        stock: p.stock,
        velocidad_diaria: parseFloat(vel.toFixed(2)),
        dias_hasta_agotarse: parseFloat(diasHastaAgotarse.toFixed(1)),
        cantidad_sugerida: cantidadSugerida,
        prioridad,
        ultima_entrada: entryMap[p.id] || null,
      });
    });

    // Sort: critico first, then alerta, then vigilar
    const order = { critico: 0, alerta: 1, vigilar: 2 };
    result.sort((a, b) => order[a.prioridad] - order[b.prioridad] || a.dias_hasta_agotarse - b.dias_hasta_agotarse);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/dead-stock?days=30
exports.deadStock = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = daysAgo(days);

    // Products with stock > 0
    const products = await Product.findAll({
      where: { activo: true, stock: { [Op.gt]: 0 } },
      include: [{ model: Category, as: 'category', attributes: ['nombre'] }],
      raw: true,
      nest: true,
    });

    // Products that had sales since cutoff
    const recentSales = await SaleItem.findAll({
      attributes: ['product_id'],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: since } },
      }],
      group: ['product_id'],
      raw: true,
    });
    const recentIds = new Set(recentSales.map(s => s.product_id));

    // Last sale date per product (all time)
    const lastSales = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('MAX', col('Sale.createdAt')), 'ultima_venta'],
      ],
      include: [{ model: Sale, attributes: [] }],
      group: ['product_id'],
      raw: true,
    });
    const lastSaleMap = {};
    lastSales.forEach(s => { lastSaleMap[s.product_id] = s.ultima_venta; });

    const now = new Date();
    const result = products
      .filter(p => !recentIds.has(p.id))
      .map(p => {
        const ultimaVenta = lastSaleMap[p.id] || null;
        const diasSinVender = ultimaVenta
          ? Math.floor((now - new Date(ultimaVenta)) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          categoria: p.category ? p.category.nombre : null,
          stock: p.stock,
          precio: parseFloat(p.precio),
          valor_inmovilizado: parseFloat((p.stock * parseFloat(p.precio)).toFixed(2)),
          ultima_venta: ultimaVenta,
          dias_sin_vender: diasSinVender,
        };
      });

    result.sort((a, b) => b.valor_inmovilizado - a.valor_inmovilizado);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/category-performance?from=&to=
exports.categoryPerformance = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : daysAgo(30);
    const to = req.query.to ? (() => { const d = new Date(req.query.to); d.setHours(23, 59, 59, 999); return d; })() : endOfToday();
    const totalDays = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));
    const midDate = new Date(from.getTime() + (to - from) / 2);

    // Sales by category
    const salesData = await SaleItem.findAll({
      attributes: [
        [fn('SUM', col('cantidad')), 'total_vendido'],
        [fn('SUM', col('subtotal')), 'total_ingresos'],
        [fn('COUNT', literal('DISTINCT "SaleItem"."product_id"')), 'num_productos'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [],
          include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
        },
        {
          model: Sale,
          attributes: [],
          where: { createdAt: { [Op.gte]: from, [Op.lte]: to } },
        },
      ],
      group: ['product.category.id'],
      raw: true,
      nest: true,
    });

    // First half by category
    const firstHalf = await SaleItem.findAll({
      attributes: [
        [fn('SUM', col('cantidad')), 'vendido'],
      ],
      include: [
        {
          model: Product, as: 'product', attributes: [],
          include: [{ model: Category, as: 'category', attributes: ['id'] }],
        },
        { model: Sale, attributes: [], where: { createdAt: { [Op.gte]: from, [Op.lt]: midDate } } },
      ],
      group: ['product.category.id'],
      raw: true,
      nest: true,
    });
    const firstMap = {};
    firstHalf.forEach(s => { firstMap[s.product.category.id] = parseInt(s.vendido); });

    // Second half by category
    const secondHalf = await SaleItem.findAll({
      attributes: [
        [fn('SUM', col('cantidad')), 'vendido'],
      ],
      include: [
        {
          model: Product, as: 'product', attributes: [],
          include: [{ model: Category, as: 'category', attributes: ['id'] }],
        },
        { model: Sale, attributes: [], where: { createdAt: { [Op.gte]: midDate, [Op.lte]: to } } },
      ],
      group: ['product.category.id'],
      raw: true,
      nest: true,
    });
    const secondMap = {};
    secondHalf.forEach(s => { secondMap[s.product.category.id] = parseInt(s.vendido); });

    const totalIncome = salesData.reduce((sum, s) => sum + parseFloat(s.total_ingresos), 0);

    const result = salesData.map(s => {
      const catId = s.product.category.id;
      const first = firstMap[catId] || 0;
      const second = secondMap[catId] || 0;
      const totalVendido = parseInt(s.total_vendido);

      let tendencia = 'sin_datos';
      if (first > 0 || second > 0) {
        if (first === 0 && second > 0) tendencia = 'creciente';
        else if (first > 0 && second === 0) tendencia = 'decreciente';
        else {
          const change = (second - first) / first;
          if (change > 0.15) tendencia = 'creciente';
          else if (change < -0.15) tendencia = 'decreciente';
          else tendencia = 'estable';
        }
      }

      return {
        category_id: catId,
        categoria: s.product.category.nombre,
        num_productos: parseInt(s.num_productos),
        total_vendido: totalVendido,
        total_ingresos: parseFloat(parseFloat(s.total_ingresos).toFixed(2)),
        porcentaje_ingresos: totalIncome > 0 ? parseFloat((parseFloat(s.total_ingresos) / totalIncome * 100).toFixed(1)) : 0,
        velocidad_promedio: parseFloat((totalVendido / totalDays).toFixed(2)),
        tendencia,
      };
    });

    result.sort((a, b) => b.total_ingresos - a.total_ingresos);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/anomalies?days=7
exports.anomalies = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const recentFrom = daysAgo(days);
    const baselineFrom = daysAgo(60);

    // Baseline: average daily sales per product over 60 days
    const baseline = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
      ],
      include: [{
        model: Sale,
        attributes: [],
        where: { createdAt: { [Op.gte]: baselineFrom } },
      }],
      group: ['product_id'],
      raw: true,
    });

    const avgMap = {};
    baseline.forEach(b => {
      avgMap[b.product_id] = parseInt(b.total_vendido) / 60;
    });

    // Recent daily sales per product per day
    const recent = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('DATE', col('Sale.createdAt')), 'fecha'],
        [fn('SUM', col('cantidad')), 'vendido'],
      ],
      include: [
        {
          model: Sale,
          attributes: [],
          where: { createdAt: { [Op.gte]: recentFrom } },
        },
        {
          model: Product,
          as: 'product',
          attributes: ['nombre', 'codigo'],
        },
      ],
      group: ['product_id', fn('DATE', col('Sale.createdAt')), 'product.id'],
      raw: true,
      nest: true,
    });

    const anomalies = [];
    recent.forEach(r => {
      const avg = avgMap[r.product_id] || 0;
      if (avg <= 0) return;

      const vendido = parseInt(r.vendido);
      const ratio = vendido / avg;

      if (ratio >= 3) {
        anomalies.push({
          fecha: r.fecha,
          product_id: r.product_id,
          nombre: r.product.nombre,
          codigo: r.product.codigo,
          tipo: 'spike',
          vendido,
          promedio_diario: parseFloat(avg.toFixed(2)),
          desviacion: parseFloat(ratio.toFixed(1)),
        });
      } else if (ratio <= 0.3 && vendido > 0) {
        anomalies.push({
          fecha: r.fecha,
          product_id: r.product_id,
          nombre: r.product.nombre,
          codigo: r.product.codigo,
          tipo: 'drop',
          vendido,
          promedio_diario: parseFloat(avg.toFixed(2)),
          desviacion: parseFloat(ratio.toFixed(1)),
        });
      }
    });

    anomalies.sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.desviacion - a.desviacion);
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
