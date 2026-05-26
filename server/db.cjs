const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

const sslRequired = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vinyardburgerbar1',
  port: Number(process.env.DB_PORT || 3306),
  ssl: sslRequired ? { rejectUnauthorized } : undefined,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  multipleStatements: false
};

const pool = mysql.createPool(dbConfig);

module.exports = { pool, dbConfig };
