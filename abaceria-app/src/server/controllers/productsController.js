const { Product, Category, InventoryMovement } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${req.query.search}%` } },
        { codigo: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }
    if (req.query.category_id) {
      where.category_id = req.query.category_id;
    }
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true';
    }
    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, category_id, codigo, activo } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (precio === undefined || precio === null) return res.status(400).json({ error: 'El precio es obligatorio' });
    if (Number(precio) < 0) return res.status(400).json({ error: 'El precio no puede ser negativo' });
    const initialStock = stock || 0;
    const product = await Product.create({ nombre, descripcion, precio, stock: initialStock, category_id, codigo: codigo || null, activo });
    if (initialStock > 0) {
      await InventoryMovement.create({
        product_id: product.id,
        tipo: 'entrada',
        cantidad: initialStock,
        stock_anterior: 0,
        stock_nuevo: initialStock,
        referencia: 'Stock inicial al crear producto',
      });
    }
    const full = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
    });
    res.status(201).json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    const { nombre, descripcion, precio, stock, category_id, codigo, activo } = req.body;
    if (precio !== undefined && Number(precio) < 0) return res.status(400).json({ error: 'El precio no puede ser negativo' });
    const stockAnterior = product.stock;
    await product.update({ nombre, descripcion, precio, stock, category_id, codigo: codigo || null, activo });
    if (stock !== undefined && stock !== stockAnterior) {
      const diferencia = stock - stockAnterior;
      await InventoryMovement.create({
        product_id: product.id,
        tipo: 'ajuste',
        cantidad: diferencia,
        stock_anterior: stockAnterior,
        stock_nuevo: stock,
        referencia: `Ajuste por edición de producto (${diferencia > 0 ? '+' : ''}${diferencia})`,
      });
    }
    const full = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
    });
    res.json(full);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await product.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
