const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tradux_user',
    password: process.env.DB_PASS || '12345',
    database: process.env.DB_NAME || 'tradux',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { db };
