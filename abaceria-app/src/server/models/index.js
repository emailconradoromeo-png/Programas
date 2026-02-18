const sequelize = require('../config/database');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const InventoryMovement = require('./InventoryMovement');

// Asociaciones
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'saleItems' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(InventoryMovement, { foreignKey: 'product_id', as: 'movements' });
InventoryMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Sale.hasMany(InventoryMovement, { foreignKey: 'sale_id', as: 'movements' });
InventoryMovement.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

module.exports = { sequelize, Category, Product, Sale, SaleItem, InventoryMovement };
