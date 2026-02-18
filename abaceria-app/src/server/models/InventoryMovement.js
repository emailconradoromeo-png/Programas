const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryMovement = sequelize.define('InventoryMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'devolucion'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stock_anterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stock_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  referencia: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  nota: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  return_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'inventory_movements',
  timestamps: true,
});

module.exports = InventoryMovement;
