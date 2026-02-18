const { Return, ReturnItem, Sale, SaleItem, Product, InventoryMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = to;
      }
    }
    const returns = await Return.findAll({
      where,
      include: [{
        model: ReturnItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ret = await Return.findByPk(req.params.id, {
      include: [{
        model: ReturnItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
    });
    if (!ret) return res.status(404).json({ error: 'Devolucion no encontrada' });
    res.json(ret);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBySale = async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { sale_id: req.params.saleId },
      include: [{
        model: ReturnItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { sale_id, items, motivo } = req.body;

    if (!sale_id) {
      await t.rollback();
      return res.status(400).json({ error: 'sale_id es requerido' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No hay items para devolver' });
    }

    // Load sale with items
    const sale = await Sale.findByPk(sale_id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t,
    });
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Load existing returns for this sale to know already-returned quantities
    const existingReturnItems = await ReturnItem.findAll({
      include: [{
        model: Return,
        as: 'Return',
        where: { sale_id },
        attributes: [],
      }],
      transaction: t,
    });

    // Map of sale_item_id -> already returned quantity
    const alreadyReturned = {};
    for (const ri of existingReturnItems) {
      alreadyReturned[ri.sale_item_id] = (alreadyReturned[ri.sale_item_id] || 0) + ri.cantidad;
    }

    let total = 0;
    const returnItems = [];
    const inventoryMovements = [];

    for (const item of items) {
      if (!item.sale_item_id || !item.cantidad || item.cantidad <= 0) continue;

      const saleItem = sale.items.find(si => si.id === item.sale_item_id);
      if (!saleItem) {
        await t.rollback();
        return res.status(400).json({ error: `Item de venta #${item.sale_item_id} no encontrado en esta venta` });
      }

      const returned = alreadyReturned[saleItem.id] || 0;
      const available = saleItem.cantidad - returned;

      if (item.cantidad > available) {
        await t.rollback();
        return res.status(400).json({
          error: `No se puede devolver ${item.cantidad} unidades del item #${saleItem.id}. Disponible: ${available}`,
        });
      }

      // Lock and update product stock
      const product = await Product.findByPk(saleItem.product_id, { transaction: t, lock: true });
      const stockAnterior = product.stock;
      const stockNuevo = stockAnterior + item.cantidad;
      await product.update({ stock: stockNuevo }, { transaction: t });

      const precio_unit = parseFloat(saleItem.precio_unit);
      const subtotal = parseFloat((precio_unit * item.cantidad).toFixed(2));
      total += subtotal;

      returnItems.push({
        sale_item_id: saleItem.id,
        product_id: saleItem.product_id,
        cantidad: item.cantidad,
        precio_unit,
        subtotal,
        _stock_anterior: stockAnterior,
        _stock_nuevo: stockNuevo,
      });
    }

    if (returnItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No hay items validos para devolver' });
    }

    const ret = await Return.create({
      sale_id,
      total: parseFloat(total.toFixed(2)),
      items_count: returnItems.reduce((sum, i) => sum + i.cantidad, 0),
      motivo: motivo || null,
    }, { transaction: t });

    for (const ri of returnItems) {
      ri.return_id = ret.id;
      inventoryMovements.push({
        product_id: ri.product_id,
        tipo: 'devolucion',
        cantidad: ri.cantidad,
        stock_anterior: ri._stock_anterior,
        stock_nuevo: ri._stock_nuevo,
        referencia: `Devolucion #${ret.id} (Venta #${sale_id})`,
        return_id: ret.id,
      });
      delete ri._stock_anterior;
      delete ri._stock_nuevo;
    }

    await ReturnItem.bulkCreate(returnItems, { transaction: t });
    await InventoryMovement.bulkCreate(inventoryMovements, { transaction: t });

    await t.commit();

    const fullReturn = await Return.findByPk(ret.id, {
      include: [{
        model: ReturnItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
    });
    res.status(201).json(fullReturn);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};
