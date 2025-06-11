require('dotenv').config({ path: './secret_key.env' });

const { Sequelize } = require('sequelize');

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: 3306,
    showWarnings: true,
    connectTimeout: 10000,
});

module.exports = db;
