const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 5432,
        database: process.env.DB_NAME     || 'smart_erp_db',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123',
      }
);

pool.connect()
  .then(() => console.log('✅ Connecté à PostgreSQL'))
  .catch(err => console.error('❌ Erreur PostgreSQL:', err.message));

module.exports = pool;