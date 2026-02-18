const { Category, Product } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['nombre', 'ASC']] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const category = await Category.create({ nombre, descripcion });
    res.status(201).json(category);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    const { nombre, descripcion } = req.body;
    await category.update({ nombre, descripcion });
    res.json(category);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(400).json({ error: `No se puede eliminar: tiene ${productCount} producto(s) asociado(s)` });
    }
    await category.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
