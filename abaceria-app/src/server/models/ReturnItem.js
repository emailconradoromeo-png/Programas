const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnItem = sequelize.define('ReturnItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  return_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sale_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  precio_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'return_items',
  timestamps: true,
});

module.exports = ReturnItem;
