const sequelize = require('../config/database');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const InventoryMovement = require('./InventoryMovement');
const Return = require('./Return');
const ReturnItem = require('./ReturnItem');
const User = require('./User');

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

// Return associations
Sale.hasMany(Return, { foreignKey: 'sale_id', as: 'returns' });
Return.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

Return.hasMany(ReturnItem, { foreignKey: 'return_id', as: 'items', onDelete: 'CASCADE' });
ReturnItem.belongsTo(Return, { foreignKey: 'return_id' });

Product.hasMany(ReturnItem, { foreignKey: 'product_id', as: 'returnItems' });
ReturnItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

SaleItem.hasMany(ReturnItem, { foreignKey: 'sale_item_id', as: 'returnItems' });
ReturnItem.belongsTo(SaleItem, { foreignKey: 'sale_item_id', as: 'saleItem' });

Return.hasMany(InventoryMovement, { foreignKey: 'return_id', as: 'movements' });
InventoryMovement.belongsTo(Return, { foreignKey: 'return_id', as: 'return' });

module.exports = { sequelize, Category, Product, Sale, SaleItem, InventoryMovement, Return, ReturnItem, User };
