const { Pool } = require('pg');
const { DATABASE_URL } = require('./config');

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on('connect', () => {
  console.log('数据库连接成功');
});

pool.on('error', (err) => {
  console.error('数据库连接错误:', err);
});

module.exports = pool;
