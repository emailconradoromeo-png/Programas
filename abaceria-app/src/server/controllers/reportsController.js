const { Sale, SaleItem, Product, Category, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

function buildDateFilter(query) {
  const where = {};
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = to;
    }
  }
  return where;
}

exports.summary = async (req, res) => {
  try {
    const where = buildDateFilter(req.query);
    const sales = await Sale.findAll({ where, attributes: ['total', 'items_count'] });
    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items_count, 0);
    const productosEnStock = await Product.count({ where: { stock: { [Op.gt]: 0 }, activo: true } });
    const productosBajoStock = await Product.count({ where: { stock: { [Op.lte]: 5 }, stock: { [Op.gt]: 0 }, activo: true } });
    res.json({
      totalVentas,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalItems,
      productosEnStock,
      productosBajoStock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.byDay = async (req, res) => {
  try {
    const where = buildDateFilter(req.query);
    const results = await Sale.findAll({
      where,
      attributes: [
        [fn('DATE', col('Sale.createdAt')), 'fecha'],
        [fn('COUNT', col('Sale.id')), 'ventas'],
        [fn('SUM', col('total')), 'ingresos'],
      ],
      group: [fn('DATE', col('Sale.createdAt'))],
      order: [[fn('DATE', col('Sale.createdAt')), 'DESC']],
      raw: true,
    });
    res.json(results.map(r => ({
      fecha: r.fecha,
      ventas: parseInt(r.ventas),
      ingresos: parseFloat(parseFloat(r.ingresos).toFixed(2)),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.topProducts = async (req, res) => {
  try {
    const saleWhere = buildDateFilter(req.query);
    const results = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
        [fn('SUM', col('subtotal')), 'total_ingresos'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['nombre', 'codigo'],
        },
        {
          model: Sale,
          attributes: [],
          where: saleWhere,
        },
      ],
      group: ['product_id', 'product.id'],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      limit: 10,
      raw: true,
      nest: true,
    });
    res.json(results.map(r => ({
      product_id: r.product_id,
      nombre: r.product.nombre,
      codigo: r.product.codigo,
      total_vendido: parseInt(r.total_vendido),
      total_ingresos: parseFloat(parseFloat(r.total_ingresos).toFixed(2)),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.byCategory = async (req, res) => {
  try {
    const saleWhere = buildDateFilter(req.query);
    const results = await SaleItem.findAll({
      attributes: [
        [fn('SUM', col('cantidad')), 'total_vendido'],
        [fn('SUM', col('subtotal')), 'total_ingresos'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [],
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'nombre'],
          }],
        },
        {
          model: Sale,
          attributes: [],
          where: saleWhere,
        },
      ],
      group: ['product.category.id'],
      order: [[fn('SUM', col('subtotal')), 'DESC']],
      raw: true,
      nest: true,
    });
    res.json(results.map(r => ({
      category_id: r.product.category.id,
      categoria: r.product.category.nombre,
      total_vendido: parseInt(r.total_vendido),
      total_ingresos: parseFloat(parseFloat(r.total_ingresos).toFixed(2)),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
