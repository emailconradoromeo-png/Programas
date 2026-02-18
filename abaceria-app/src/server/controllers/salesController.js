const { Sale, SaleItem, Product, InventoryMovement, sequelize } = require('../models');
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
    const sales = await Sale.findAll({
      where,
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
    });
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, nota } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ error: `Producto con ID ${item.product_id} no encontrado` });
      }
      if (!product.activo) {
        await t.rollback();
        return res.status(400).json({ error: `El producto "${product.nombre}" no está activo` });
      }
      if (product.stock < item.cantidad) {
        await t.rollback();
        return res.status(400).json({ error: `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}` });
      }

      const precio_unit = parseFloat(product.precio);
      const subtotal = parseFloat((precio_unit * item.cantidad).toFixed(2));
      total += subtotal;

      const stockAnterior = product.stock;
      const stockNuevo = stockAnterior - item.cantidad;

      saleItems.push({
        product_id: product.id,
        cantidad: item.cantidad,
        precio_unit,
        subtotal,
        _stock_anterior: stockAnterior,
        _stock_nuevo: stockNuevo,
      });

      await product.update({ stock: stockNuevo }, { transaction: t });
    }

    const sale = await Sale.create({
      total: parseFloat(total.toFixed(2)),
      items_count: saleItems.reduce((sum, i) => sum + i.cantidad, 0),
      nota: nota || null,
    }, { transaction: t });

    const inventoryMovements = [];
    for (const si of saleItems) {
      si.sale_id = sale.id;
      inventoryMovements.push({
        product_id: si.product_id,
        tipo: 'salida',
        cantidad: -si.cantidad,
        stock_anterior: si._stock_anterior,
        stock_nuevo: si._stock_nuevo,
        referencia: `Venta #${sale.id}`,
        sale_id: sale.id,
      });
      delete si._stock_anterior;
      delete si._stock_nuevo;
    }
    await SaleItem.bulkCreate(saleItems, { transaction: t });
    await InventoryMovement.bulkCreate(inventoryMovements, { transaction: t });

    await t.commit();

    const fullSale = await Sale.findByPk(sale.id, {
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      }],
    });
    res.status(201).json(fullSale);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};
