const bcrypt = require('bcryptjs');
const { Category, User } = require('../models');

const defaultCategories = [
  { nombre: 'Granos', descripcion: 'Arroz, frijoles, lentejas y otros granos' },
  { nombre: 'Lácteos', descripcion: 'Leche, queso, mantequilla y derivados' },
  { nombre: 'Bebidas', descripcion: 'Jugos, refrescos, agua y bebidas en general' },
  { nombre: 'Limpieza', descripcion: 'Productos de limpieza para el hogar' },
  { nombre: 'Carnes', descripcion: 'Carnes rojas, pollo, cerdo y embutidos' },
  { nombre: 'Frutas y Verduras', descripcion: 'Frutas frescas y vegetales' },
  { nombre: 'Enlatados', descripcion: 'Conservas y productos enlatados' },
  { nombre: 'Otros', descripcion: 'Productos varios' },
];

async function seed() {
  const catCount = await Category.count();
  if (catCount === 0) {
    await Category.bulkCreate(defaultCategories);
    console.log('Categorías por defecto creadas.');
  }

  const userCount = await User.count();
  if (userCount === 0) {
    const password_hash = await bcrypt.hash('admin123', 10);
    await User.create({
      nombre: 'Administrador',
      email: 'admin@abaceria.com',
      password_hash,
      rol: 'admin',
      activo: true,
    });
    console.log('Usuario administrador por defecto creado (admin@abaceria.com / admin123).');
  }
}

module.exports = seed;
