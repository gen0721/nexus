const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect:  'postgres',
  protocol: 'postgres',
  logging:  false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require:true, rejectUnauthorized:false }
      : false,
  },
});

const User = sequelize.define('User', {
  id:               { type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  telegramId:       { type:DataTypes.STRING(50), unique:true, allowNull:true },
  username:         { type:DataTypes.STRING(50), unique:true, allowNull:true },
  firstName:        { type:DataTypes.STRING(100), allowNull:true },
  lastName:         { type:DataTypes.STRING(100), allowNull:true },
  email:            { type:DataTypes.STRING(200), unique:true, allowNull:true },
  password:         { type:DataTypes.STRING(200), allowNull:true },
  avatarUrl:        { type:DataTypes.TEXT, allowNull:true },
  balance:          { type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  frozenBalance:    { type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  totalDeposited:   { type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  totalWithdrawn:   { type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  totalSales:       { type:DataTypes.INTEGER, defaultValue:0 },
  totalPurchases:   { type:DataTypes.INTEGER, defaultValue:0 },
  rating:           { type:DataTypes.DECIMAL(3,2), defaultValue:5.0 },
  reviewCount:      { type:DataTypes.INTEGER, defaultValue:0 },
  isAdmin:          { type:DataTypes.BOOLEAN, defaultValue:false },
  isSubAdmin:       { type:DataTypes.BOOLEAN, defaultValue:false },
  isBanned:         { type:DataTypes.BOOLEAN, defaultValue:false },
  banUntil:         { type:DataTypes.DATE, allowNull:true },
  banReason:        { type:DataTypes.STRING(500), allowNull:true },
  isVerified:       { type:DataTypes.BOOLEAN, defaultValue:false },
  lastActive:       { type:DataTypes.DATE, allowNull:true },
  referralCode:     { type:DataTypes.STRING(20), unique:true, allowNull:true },
  referredBy:       { type:DataTypes.UUID, allowNull:true },
  referralEarnings: { type:DataTypes.DECIMAL(12,2), defaultValue:0 },
}, { tableName:'Users', timestamps:true });

module.exports = { sequelize, User };
