const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const seed = require('./config/seeders');

const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const inventoryRoutes = require('./routes/inventory');
const dailySalesRoutes = require('./routes/dailySales');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.SERVER_PORT || 3456;

app.use(cors());
app.use(express.json());

app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/daily-sales', dailySalesRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'renderer')));

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a la base de datos establecida.');
    await sequelize.sync();
    console.log('Tablas sincronizadas.');
    await seed();
    app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`));
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
