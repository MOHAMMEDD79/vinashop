/**
 * Seed Admin User Script
 * Creates a default admin user for development/testing
 *
 * Run: node backend/scripts/seed-admin.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function seedAdmin() {
  let connection;

  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vinashop',
    });

    console.log('Connected to database');

    // Default admin credentials
    const email = 'admin@vinashop.com';
    const password = 'Admin123!';
    const username = 'admin';
    const fullName = 'Super Admin';
    const role = 'super_admin';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT admin_id FROM admin_users WHERE email = ?',
      [email]
    );

    if (existingAdmin.length > 0) {
      console.log(`Admin with email ${email} already exists`);

      // Update password
      await connection.execute(
        'UPDATE admin_users SET password_hash = ?, is_active = 1 WHERE email = ?',
        [passwordHash, email]
      );
      console.log('Password updated');
    } else {
      // Insert new admin
      await connection.execute(
        `INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [username, email, passwordHash, fullName, role]
      );
      console.log('Admin user created');
    }

    // Also insert into admins table if it exists
    try {
      const [existingAdminAlt] = await connection.execute(
        'SELECT admin_id FROM admins WHERE email = ?',
        [email]
      );

      if (existingAdminAlt.length > 0) {
        await connection.execute(
          'UPDATE admins SET password = ?, is_active = 1 WHERE email = ?',
          [passwordHash, email]
        );
      } else {
        await connection.execute(
          `INSERT INTO admins (email, password, first_name, last_name, role, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [email, passwordHash, 'Super', 'Admin', role]
        );
      }
    } catch (err) {
      // admins table might not exist, ignore
    }

    console.log('\n========================================');
    console.log('Admin user ready!');
    console.log('========================================');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedAdmin();
