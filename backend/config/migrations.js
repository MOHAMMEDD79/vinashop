/**
 * Database Migration System
 * @module config/migrations
 *
 * Automatically runs pending migrations on server startup
 * Tracks executed migrations in the database
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

/**
 * Initialize the migrations table if it doesn't exist
 */
const initMigrationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64),
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.execute(sql);
  console.log('✅ Migrations table initialized');
};

/**
 * Get list of executed migrations
 */
const getExecutedMigrations = async () => {
  const [rows] = await pool.execute('SELECT name FROM migrations ORDER BY id');
  return rows.map(row => row.name);
};

/**
 * Get all migration files from the migrations directory
 */
const getMigrationFiles = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log('📁 Created migrations directory');
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure execution order

  return files;
};

/**
 * Calculate checksum for a migration file
 */
const calculateChecksum = (content) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 64);
};

/**
 * Execute a single migration
 */
const executeMigration = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const checksum = calculateChecksum(content);

  // Remove DELIMITER commands and handle procedures differently
  // For simple migrations, split by semicolons
  let cleanContent = content
    .replace(/DELIMITER\s+\/\//gi, '')
    .replace(/DELIMITER\s+;/gi, '')
    .replace(/\/\//g, ';');

  // Split by semicolons but be careful with quotes
  const statements = cleanContent
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/g)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^--/) && !s.match(/^\/\*/));

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const statement of statements) {
      if (statement.trim() && statement.trim().length > 5) {
        try {
          await connection.query(statement);
        } catch (stmtError) {
          // Log but continue for non-critical errors
          const ignorableErrors = [
            'ER_DUP_KEYNAME',      // Duplicate index name
            'ER_DUP_FIELDNAME',    // Duplicate column name
            'ER_DUP_KEY',          // Duplicate key
            'ER_CANT_DROP_FIELD_OR_KEY', // Can't drop non-existent field/key
          ];
          if (ignorableErrors.includes(stmtError.code) || stmtError.message.includes('Duplicate')) {
            console.log(`     (skipped: ${stmtError.message.substring(0, 60)}...)`);
          } else {
            throw stmtError;
          }
        }
      }
    }

    // Record the migration
    await connection.execute(
      'INSERT INTO migrations (name, checksum) VALUES (?, ?)',
      [filename, checksum]
    );

    await connection.commit();
    console.log(`   ✓ Executed: ${filename}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`   ✗ Failed: ${filename}`);
    console.error(`     Error: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Run all pending migrations
 */
const runMigrations = async () => {
  console.log('\n🔄 Checking for database migrations...');

  try {
    // Initialize migrations table
    await initMigrationsTable();

    // Get executed migrations
    const executed = await getExecutedMigrations();

    // Get all migration files
    const files = getMigrationFiles();

    // Find pending migrations
    const pending = files.filter(file => !executed.includes(file));

    if (pending.length === 0) {
      console.log('✅ Database is up to date - no migrations needed\n');
      return { success: true, executed: 0 };
    }

    console.log(`📋 Found ${pending.length} pending migration(s):`);
    pending.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // Execute pending migrations
    let executedCount = 0;
    for (const file of pending) {
      await executeMigration(file);
      executedCount++;
    }

    console.log(`\n✅ Successfully executed ${executedCount} migration(s)\n`);
    return { success: true, executed: executedCount };
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get migration status
 */
const getMigrationStatus = async () => {
  await initMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter(file => !executed.includes(file));

  return {
    total: files.length,
    executed: executed.length,
    pending: pending.length,
    pendingFiles: pending,
    executedFiles: executed
  };
};

/**
 * Create a new migration file
 */
const createMigration = (name) => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
  const filename = `${timestamp}_${name}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add description here

-- Add your SQL statements below
-- Each statement should end with a semicolon

`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Created migration file: ${filename}`);
  return filename;
};

module.exports = {
  runMigrations,
  getMigrationStatus,
  createMigration,
  initMigrationsTable
};
