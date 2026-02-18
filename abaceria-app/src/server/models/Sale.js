const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  items_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nota: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'sales',
  timestamps: true,
});

module.exports = Sale;
