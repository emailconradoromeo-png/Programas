const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Return = sequelize.define('Return', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  items_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'returns',
  timestamps: true,
});

module.exports = Return;
