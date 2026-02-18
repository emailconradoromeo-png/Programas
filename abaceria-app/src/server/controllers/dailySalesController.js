const { Sale, SaleItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getByDate = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: { createdAt: { [Op.between]: [from, to] } },
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
      order: [['createdAt', 'DESC']],
    });

    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items_count, 0);

    res.json({
      fecha: date,
      totalVentas,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalItems,
      ventas: sales,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cierre = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: { createdAt: { [Op.between]: [from, to] } },
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
      order: [['createdAt', 'ASC']],
    });

    // Desglose por hora
    const porHora = {};
    for (let h = 0; h < 24; h++) {
      const key = String(h).padStart(2, '0') + ':00';
      porHora[key] = { hora: key, ventas: 0, ingresos: 0 };
    }
    sales.forEach(s => {
      const h = new Date(s.createdAt).getHours();
      const key = String(h).padStart(2, '0') + ':00';
      porHora[key].ventas++;
      porHora[key].ingresos += parseFloat(s.total);
    });
    const desglosePorHora = Object.values(porHora).filter(h => h.ventas > 0);

    // Top productos del dia
    const productMap = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const pid = item.product_id;
        if (!productMap[pid]) {
          productMap[pid] = {
            product_id: pid,
            nombre: item.product ? item.product.nombre : 'Desconocido',
            codigo: item.product ? item.product.codigo : null,
            total_vendido: 0,
            total_ingresos: 0,
          };
        }
        productMap[pid].total_vendido += item.cantidad;
        productMap[pid].total_ingresos += parseFloat(item.subtotal);
      });
    });
    const topProductos = Object.values(productMap)
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, 10);

    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items_count, 0);

    res.json({
      fecha: date,
      totalVentas,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalItems,
      desglosePorHora,
      topProductos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
