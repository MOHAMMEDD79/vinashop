/**
 * Database Configuration
 * @module config/database
 */

const mysql = require('mysql2/promise');

/**
 * Database connection pool configuration
 */
const poolConfig = {
  host: process.env.DB_HOST || '45.159.160.5',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vinashop',
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  maxIdle: parseInt(process.env.DB_MAX_IDLE, 10) || 10,
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 60000,
  queueLimit: 0,
  
  // Connection settings
  connectTimeout: 10000,
  
  // Enable named placeholders
  namedPlaceholders: true,
  
  // Timezone
  timezone: '+00:00',
  
  // Character set
  charset: 'utf8mb4',
  
  // Enable multiple statements (use with caution)
  multipleStatements: false,
  
  // Date handling
  dateStrings: false,
  
  // Support big numbers
  supportBigNumbers: true,
  bigNumberStrings: false,
  
  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true',
};

/**
 * Create connection pool
 */
const pool = mysql.createPool(poolConfig);

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${poolConfig.host}`);
    console.log(`   Database: ${poolConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Execute a query with automatic connection handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 *
 * Note: Using pool.query() instead of pool.execute() to avoid mysql2
 * prepared statement issues with LIMIT/OFFSET parameters
 */
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', sql);
    console.error('Params:', params);
    throw error;
  }
};

/**
 * Execute a query and return results with fields info
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} [results, fields]
 */
const queryWithFields = async (sql, params = []) => {
  try {
    return await pool.query(sql, params);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function receiving connection
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get a single row from query results
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params);
  return results[0] || null;
};

/**
 * Insert a row and return the insert ID
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<number>} Insert ID
 */
const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const result = await query(sql, values);
  
  return result.insertId;
};

/**
 * Insert multiple rows
 * @param {string} table - Table name
 * @param {Array<Object>} dataArray - Array of data objects
 * @returns {Promise<Object>} Insert result
 */
const insertMany = async (table, dataArray) => {
  if (!dataArray.length) return { affectedRows: 0 };
  
  const keys = Object.keys(dataArray[0]);
  const placeholders = dataArray.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
  const values = dataArray.flatMap(data => Object.values(data));
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders}`;
  return await query(sql, values);
};

/**
 * Update rows in a table
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Update result
 */
const update = async (table, data, where) => {
  const setKeys = Object.keys(data);
  const setValues = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const setClause = setKeys.map(key => `${key} = ?`).join(', ');
  const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  return await query(sql, [...setValues, ...whereValues]);
};

/**
 * Delete rows from a table
 * @param {string} table - Table name
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Delete result
 */
const remove = async (table, where) => {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
  
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  return await query(sql, whereValues);
};

/**
 * Count rows in a table
 * @param {string} table - Table name
 * @param {Object} where - Optional where conditions
 * @returns {Promise<number>} Row count
 */
const count = async (table, where = {}) => {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  
  if (whereKeys.length) {
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    sql += ` WHERE ${whereClause}`;
  }
  
  const result = await queryOne(sql, whereValues);
  return result ? result.count : 0;
};

/**
 * Check if a row exists
 * @param {string} table - Table name
 * @param {Object} where - Where conditions
 * @returns {Promise<boolean>} True if exists
 */
const exists = async (table, where) => {
  const total = await count(table, where);
  return total > 0;
};

/**
 * Find a row by ID
 * @param {string} table - Table name
 * @param {string} idColumn - ID column name
 * @param {any} id - ID value
 * @returns {Promise<Object|null>} Row or null
 */
const findById = async (table, idColumn, id) => {
  const sql = `SELECT * FROM ${table} WHERE ${idColumn} = ?`;
  return await queryOne(sql, [id]);
};

/**
 * Find rows with pagination
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results
 */
const findWithPagination = async (table, options = {}) => {
  const {
    select = '*',
    where = {},
    orderBy = 'created_at',
    order = 'DESC',
    page = 1,
    limit = 10,
  } = options;
  
  const offset = (page - 1) * limit;
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  let sql = `SELECT ${select} FROM ${table}`;
  let countSql = `SELECT COUNT(*) as total FROM ${table}`;
  
  if (whereKeys.length) {
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    sql += ` WHERE ${whereClause}`;
    countSql += ` WHERE ${whereClause}`;
  }
  
  sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
  
  const [data, countResult] = await Promise.all([
    query(sql, [...whereValues, limit, offset]),
    queryOne(countSql, whereValues),
  ]);
  
  const total = countResult ? countResult.total : 0;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Close the connection pool
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
  }
};

/**
 * Get pool statistics
 */
const getPoolStats = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    acquiringConnections: pool.pool._acquiringConnections.length,
    connectionQueue: pool.pool._connectionQueue.length,
  };
};

// Handle process termination gracefully (avoid process.exit for Passenger/cPanel)
process.on('SIGINT', async () => {
  try {
    await closePool();
  } catch (e) {
    console.error('Error closing pool on SIGINT:', e);
  }
});

process.on('SIGTERM', async () => {
  try {
    await closePool();
  } catch (e) {
    console.error('Error closing pool on SIGTERM:', e);
  }
});

module.exports = {
  pool,
  query,
  queryWithFields,
  queryOne,
  transaction,
  insert,
  insertMany,
  update,
  remove,
  count,
  exists,
  findById,
  findWithPagination,
  testConnection,
  closePool,
  getPoolStats,
};