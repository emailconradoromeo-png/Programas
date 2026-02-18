const { Product, Category, InventoryMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.summary = async (req, res) => {
  try {
    const totalProductos = await Product.count({ where: { activo: true } });
    const valorInventario = await Product.sum(
      sequelize.literal('"precio" * "stock"'),
      { where: { activo: true } }
    );
    const bajoStock = await Product.count({
      where: { activo: true, stock: { [Op.between]: [1, 5] } },
    });
    const sinStock = await Product.count({
      where: { activo: true, stock: 0 },
    });

    res.json({
      totalProductos,
      valorInventario: parseFloat(valorInventario || 0).toFixed(2),
      bajoStock,
      sinStock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.status = async (req, res) => {
  try {
    const where = { activo: true };

    if (req.query.search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${req.query.search}%` } },
        { codigo: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }

    if (req.query.stock_filter) {
      switch (req.query.stock_filter) {
        case 'sin_stock':
          where.stock = 0;
          break;
        case 'bajo':
          where.stock = { [Op.between]: [1, 5] };
          break;
        case 'normal':
          where.stock = { [Op.gt]: 5 };
          break;
      }
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
      order: [['stock', 'ASC'], ['nombre', 'ASC']],
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.movements = async (req, res) => {
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

    if (req.query.tipo) {
      where.tipo = req.query.tipo;
    }

    if (req.query.product_id) {
      where.product_id = req.query.product_id;
    }

    const movements = await InventoryMovement.findAll({
      where,
      include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.entry = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { product_id, cantidad, nota } = req.body;

    if (!product_id) {
      await t.rollback();
      return res.status(400).json({ error: 'Producto es obligatorio' });
    }
    if (!cantidad || cantidad <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    const product = await Product.findByPk(product_id, { transaction: t, lock: true });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = product.stock;
    const stockNuevo = stockAnterior + parseInt(cantidad);

    await product.update({ stock: stockNuevo }, { transaction: t });

    const movement = await InventoryMovement.create({
      product_id,
      tipo: 'entrada',
      cantidad: parseInt(cantidad),
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia: 'Entrada de mercancía',
      nota: nota || null,
    }, { transaction: t });

    await t.commit();

    const full = await InventoryMovement.findByPk(movement.id, {
      include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
    });

    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.adjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { product_id, stock_real, nota } = req.body;

    if (!product_id) {
      await t.rollback();
      return res.status(400).json({ error: 'Producto es obligatorio' });
    }
    if (stock_real === undefined || stock_real === null || stock_real < 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El stock real debe ser un número no negativo' });
    }

    const product = await Product.findByPk(product_id, { transaction: t, lock: true });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = product.stock;
    const stockNuevo = parseInt(stock_real);
    const diferencia = stockNuevo - stockAnterior;

    if (diferencia === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El stock real es igual al stock actual' });
    }

    await product.update({ stock: stockNuevo }, { transaction: t });

    const movement = await InventoryMovement.create({
      product_id,
      tipo: 'ajuste',
      cantidad: diferencia,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia: `Ajuste de inventario (${diferencia > 0 ? '+' : ''}${diferencia})`,
      nota: nota || null,
    }, { transaction: t });

    await t.commit();

    const full = await InventoryMovement.findByPk(movement.id, {
      include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
    });

    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};
