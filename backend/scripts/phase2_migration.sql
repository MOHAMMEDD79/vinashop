-- =====================================================
-- VinaShop Admin - Phase 2 Database Migration
-- Customer Bills, Debts, Workers, Traders, Wholesalers
-- =====================================================
-- Run this script in phpMyAdmin on vinashop database
-- Created: December 2025
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. CUSTOMER BILLS SYSTEM
-- =====================================================

-- 1.1 Customer Bills Table
CREATE TABLE IF NOT EXISTS customer_bills (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    notes TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE RESTRICT,
    INDEX idx_bill_user (user_id),
    INDEX idx_bill_status (payment_status),
    INDEX idx_bill_date (bill_date),
    INDEX idx_bill_number (bill_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Customer Bill Items Table
CREATE TABLE IF NOT EXISTS customer_bill_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    product_id INT NULL,
    variant_id INT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES customer_bills(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_bill_item_bill (bill_id),
    INDEX idx_bill_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CUSTOMER DEBT TRACKING SYSTEM
-- =====================================================

-- 2.1 Customer Debts Table
CREATE TABLE IF NOT EXISTS customer_debts (
    debt_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bill_id INT NULL,
    order_id INT NULL,
    total_debt DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    remaining_debt DECIMAL(10,2) GENERATED ALWAYS AS (total_debt - amount_paid) STORED,
    status ENUM('pending', 'partial', 'settled') DEFAULT 'pending',
    due_date DATE NULL,
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (bill_id) REFERENCES customer_bills(bill_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_debt_user (user_id),
    INDEX idx_debt_status (status),
    INDEX idx_debt_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Debt Payments Table
CREATE TABLE IF NOT EXISTS debt_payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    debt_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'other') DEFAULT 'cash',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    receipt_number VARCHAR(50),
    notes TEXT,
    recorded_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES customer_debts(debt_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (recorded_by) REFERENCES admins(admin_id) ON DELETE RESTRICT,
    INDEX idx_payment_debt (debt_id),
    INDEX idx_payment_user (user_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. WORKERS MANAGEMENT SYSTEM (Super Admin Only)
-- =====================================================

-- 3.1 Workers Table
CREATE TABLE IF NOT EXISTS workers (
    worker_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    id_number VARCHAR(20),
    address TEXT,
    position VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    salary_type ENUM('monthly', 'daily', 'hourly') DEFAULT 'monthly',
    status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_worker_status (status),
    INDEX idx_worker_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Worker Attendance Table
CREATE TABLE IF NOT EXISTS worker_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    hours_worked DECIMAL(4,2) NULL,
    status ENUM('present', 'absent', 'late', 'half_day', 'holiday', 'leave') DEFAULT 'present',
    notes TEXT,
    recorded_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    UNIQUE KEY unique_worker_date (worker_id, work_date),
    INDEX idx_attendance_worker (worker_id),
    INDEX idx_attendance_date (work_date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 Worker Salaries Table
CREATE TABLE IF NOT EXISTS worker_salaries (
    salary_id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    calculation_type ENUM('fixed', 'days_worked') NOT NULL DEFAULT 'fixed',
    working_days_in_month INT DEFAULT 26,
    days_worked INT DEFAULT 0,
    hours_worked DECIMAL(6,2) DEFAULT 0,
    base_salary DECIMAL(10,2) NOT NULL,
    calculated_amount DECIMAL(10,2) NOT NULL,
    bonus DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) GENERATED ALWAYS AS (calculated_amount + bonus - deductions) STORED,
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    payment_date DATE NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check') DEFAULT 'cash',
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    UNIQUE KEY unique_worker_month (worker_id, month, year),
    INDEX idx_salary_worker (worker_id),
    INDEX idx_salary_period (year, month),
    INDEX idx_salary_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TRADERS SYSTEM (Product Suppliers)
-- =====================================================

-- 4.1 Traders Table
CREATE TABLE IF NOT EXISTS traders (
    trader_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    payment_terms INT DEFAULT 30,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trader_status (status),
    INDEX idx_trader_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 Trader Bills Table
CREATE TABLE IF NOT EXISTS trader_bills (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    trader_id INT NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    bill_image VARCHAR(255) NULL,
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trader_id) REFERENCES traders(trader_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_trader_bill_trader (trader_id),
    INDEX idx_trader_bill_status (payment_status),
    INDEX idx_trader_bill_date (bill_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3 Trader Bill Items Table
CREATE TABLE IF NOT EXISTS trader_bill_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    product_id INT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES trader_bills(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    INDEX idx_trader_item_bill (bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.4 Trader Payments Table
CREATE TABLE IF NOT EXISTS trader_payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    trader_id INT NOT NULL,
    bill_id INT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer', 'other') DEFAULT 'cash',
    payment_date DATE NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trader_id) REFERENCES traders(trader_id) ON DELETE RESTRICT,
    FOREIGN KEY (bill_id) REFERENCES trader_bills(bill_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_trader_payment_trader (trader_id),
    INDEX idx_trader_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. WHOLESALERS SYSTEM
-- =====================================================

-- 5.1 Wholesalers Table
CREATE TABLE IF NOT EXISTS wholesalers (
    wholesaler_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wholesaler_status (status),
    INDEX idx_wholesaler_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 Wholesaler Orders Table
CREATE TABLE IF NOT EXISTS wholesaler_orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    wholesaler_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(wholesaler_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_ws_order_wholesaler (wholesaler_id),
    INDEX idx_ws_order_status (order_status),
    INDEX idx_ws_order_payment (payment_status),
    INDEX idx_ws_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3 Wholesaler Order Items Table
CREATE TABLE IF NOT EXISTS wholesaler_order_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES wholesaler_orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_ws_item_order (order_id),
    INDEX idx_ws_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.4 Wholesaler Payments Table
CREATE TABLE IF NOT EXISTS wholesaler_payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    wholesaler_id INT NOT NULL,
    order_id INT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer', 'other') DEFAULT 'cash',
    payment_date DATE NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(wholesaler_id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES wholesaler_orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_ws_payment_wholesaler (wholesaler_id),
    INDEX idx_ws_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. BILL NUMBER SEQUENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bill_sequences (
    sequence_id INT PRIMARY KEY AUTO_INCREMENT,
    sequence_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    current_year INT NOT NULL,
    last_number INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_sequence_year (sequence_type, current_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial sequences
INSERT INTO bill_sequences (sequence_type, prefix, current_year, last_number) VALUES
('customer_bill', 'BILL', 2025, 0),
('wholesaler_order', 'WS', 2025, 0)
ON DUPLICATE KEY UPDATE sequence_type = sequence_type;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to generate customer bill number (BILL-YYYY-XXXXX)
DELIMITER //

CREATE FUNCTION IF NOT EXISTS generate_bill_number()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE new_number INT;
    DECLARE bill_num VARCHAR(50);
    DECLARE current_yr INT;

    SET current_yr = YEAR(CURDATE());

    -- Get and increment the sequence
    UPDATE bill_sequences
    SET last_number = last_number + 1,
        current_year = current_yr
    WHERE sequence_type = 'customer_bill' AND current_year = current_yr;

    -- If no row was updated (new year), insert new row
    IF ROW_COUNT() = 0 THEN
        INSERT INTO bill_sequences (sequence_type, prefix, current_year, last_number)
        VALUES ('customer_bill', 'BILL', current_yr, 1)
        ON DUPLICATE KEY UPDATE last_number = 1;
        SET new_number = 1;
    ELSE
        SELECT last_number INTO new_number
        FROM bill_sequences
        WHERE sequence_type = 'customer_bill' AND current_year = current_yr;
    END IF;

    SET bill_num = CONCAT('BILL-', current_yr, '-', LPAD(new_number, 5, '0'));

    RETURN bill_num;
END //

-- Function to generate wholesaler order number (WS-YYYY-XXXXX)
CREATE FUNCTION IF NOT EXISTS generate_wholesaler_order_number()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE new_number INT;
    DECLARE order_num VARCHAR(50);
    DECLARE current_yr INT;

    SET current_yr = YEAR(CURDATE());

    UPDATE bill_sequences
    SET last_number = last_number + 1,
        current_year = current_yr
    WHERE sequence_type = 'wholesaler_order' AND current_year = current_yr;

    IF ROW_COUNT() = 0 THEN
        INSERT INTO bill_sequences (sequence_type, prefix, current_year, last_number)
        VALUES ('wholesaler_order', 'WS', current_yr, 1)
        ON DUPLICATE KEY UPDATE last_number = 1;
        SET new_number = 1;
    ELSE
        SELECT last_number INTO new_number
        FROM bill_sequences
        WHERE sequence_type = 'wholesaler_order' AND current_year = current_yr;
    END IF;

    SET order_num = CONCAT('WS-', current_yr, '-', LPAD(new_number, 5, '0'));

    RETURN order_num;
END //

DELIMITER ;

-- =====================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

DELIMITER //

-- Trigger to update customer debt status when payment is made
CREATE TRIGGER IF NOT EXISTS after_debt_payment_insert
AFTER INSERT ON debt_payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE total_debt DECIMAL(10,2);

    -- Calculate total payments for this debt
    SELECT SUM(amount) INTO total_paid
    FROM debt_payments
    WHERE debt_id = NEW.debt_id;

    -- Get total debt amount
    SELECT total_debt INTO total_debt
    FROM customer_debts
    WHERE debt_id = NEW.debt_id;

    -- Update debt record
    UPDATE customer_debts
    SET amount_paid = total_paid,
        status = CASE
            WHEN total_paid >= total_debt THEN 'settled'
            WHEN total_paid > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE debt_id = NEW.debt_id;
END //

-- Trigger to update customer bill status when payment is recorded
CREATE TRIGGER IF NOT EXISTS after_bill_payment_update
AFTER UPDATE ON customer_bills
FOR EACH ROW
BEGIN
    IF NEW.amount_paid != OLD.amount_paid THEN
        UPDATE customer_bills
        SET payment_status = CASE
            WHEN NEW.amount_paid >= NEW.total_amount THEN 'paid'
            WHEN NEW.amount_paid > 0 THEN 'partial'
            ELSE 'unpaid'
        END
        WHERE bill_id = NEW.bill_id;
    END IF;
END //

-- Trigger to update trader balance when bill is created
CREATE TRIGGER IF NOT EXISTS after_trader_bill_insert
AFTER INSERT ON trader_bills
FOR EACH ROW
BEGIN
    UPDATE traders
    SET current_balance = current_balance + NEW.total_amount
    WHERE trader_id = NEW.trader_id;
END //

-- Trigger to update trader balance when payment is made
CREATE TRIGGER IF NOT EXISTS after_trader_payment_insert
AFTER INSERT ON trader_payments
FOR EACH ROW
BEGIN
    -- Update trader balance
    UPDATE traders
    SET current_balance = current_balance - NEW.amount
    WHERE trader_id = NEW.trader_id;

    -- Update bill payment status if bill_id is provided
    IF NEW.bill_id IS NOT NULL THEN
        UPDATE trader_bills tb
        SET amount_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM trader_payments
            WHERE bill_id = NEW.bill_id
        )
        WHERE tb.bill_id = NEW.bill_id;

        -- Update payment status
        UPDATE trader_bills tb
        SET payment_status = CASE
            WHEN tb.amount_paid >= tb.total_amount THEN 'paid'
            WHEN tb.amount_paid > 0 THEN 'partial'
            ELSE 'unpaid'
        END
        WHERE tb.bill_id = NEW.bill_id;
    END IF;
END //

-- Trigger to update wholesaler balance when order is created
CREATE TRIGGER IF NOT EXISTS after_wholesaler_order_insert
AFTER INSERT ON wholesaler_orders
FOR EACH ROW
BEGIN
    UPDATE wholesalers
    SET current_balance = current_balance + NEW.total_amount
    WHERE wholesaler_id = NEW.wholesaler_id;
END //

-- Trigger to update wholesaler balance when payment is made
CREATE TRIGGER IF NOT EXISTS after_wholesaler_payment_insert
AFTER INSERT ON wholesaler_payments
FOR EACH ROW
BEGIN
    -- Update wholesaler balance
    UPDATE wholesalers
    SET current_balance = current_balance - NEW.amount
    WHERE wholesaler_id = NEW.wholesaler_id;

    -- Update order payment status if order_id is provided
    IF NEW.order_id IS NOT NULL THEN
        UPDATE wholesaler_orders wo
        SET amount_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM wholesaler_payments
            WHERE order_id = NEW.order_id
        )
        WHERE wo.order_id = NEW.order_id;

        -- Update payment status
        UPDATE wholesaler_orders wo
        SET payment_status = CASE
            WHEN wo.amount_paid >= wo.total_amount THEN 'paid'
            WHEN wo.amount_paid > 0 THEN 'partial'
            ELSE 'unpaid'
        END
        WHERE wo.order_id = NEW.order_id;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 9. VIEWS FOR REPORTING
-- =====================================================

-- View for customer debt summary
CREATE OR REPLACE VIEW v_customer_debt_summary AS
SELECT
    u.user_id,
    u.full_name,
    u.email,
    u.phone_number,
    COUNT(DISTINCT cd.debt_id) as total_debts,
    COALESCE(SUM(cd.total_debt), 0) as total_debt_amount,
    COALESCE(SUM(cd.amount_paid), 0) as total_paid,
    COALESCE(SUM(cd.remaining_debt), 0) as total_remaining,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.user_id) as total_orders
FROM users u
LEFT JOIN customer_debts cd ON u.user_id = cd.user_id
GROUP BY u.user_id, u.full_name, u.email, u.phone_number;

-- View for worker monthly summary
CREATE OR REPLACE VIEW v_worker_monthly_summary AS
SELECT
    w.worker_id,
    w.full_name,
    w.position,
    w.base_salary,
    ws.month,
    ws.year,
    ws.days_worked,
    ws.calculated_amount,
    ws.bonus,
    ws.deductions,
    ws.net_salary,
    ws.payment_status
FROM workers w
LEFT JOIN worker_salaries ws ON w.worker_id = ws.worker_id
WHERE w.status = 'active';

-- View for trader balance summary
CREATE OR REPLACE VIEW v_trader_balance_summary AS
SELECT
    t.trader_id,
    t.company_name,
    t.contact_person,
    t.phone,
    t.credit_limit,
    t.current_balance,
    COUNT(DISTINCT tb.bill_id) as total_bills,
    COALESCE(SUM(CASE WHEN tb.payment_status = 'unpaid' THEN tb.total_amount ELSE 0 END), 0) as unpaid_amount,
    COALESCE(SUM(CASE WHEN tb.payment_status = 'partial' THEN tb.amount_due ELSE 0 END), 0) as partial_due
FROM traders t
LEFT JOIN trader_bills tb ON t.trader_id = tb.trader_id
GROUP BY t.trader_id, t.company_name, t.contact_person, t.phone, t.credit_limit, t.current_balance;

-- View for wholesaler balance summary
CREATE OR REPLACE VIEW v_wholesaler_balance_summary AS
SELECT
    ws.wholesaler_id,
    ws.company_name,
    ws.contact_person,
    ws.phone,
    ws.discount_percentage,
    ws.credit_limit,
    ws.current_balance,
    COUNT(DISTINCT wo.order_id) as total_orders,
    COALESCE(SUM(CASE WHEN wo.payment_status = 'unpaid' THEN wo.total_amount ELSE 0 END), 0) as unpaid_amount,
    COALESCE(SUM(CASE WHEN wo.payment_status = 'partial' THEN wo.amount_due ELSE 0 END), 0) as partial_due
FROM wholesalers ws
LEFT JOIN wholesaler_orders wo ON ws.wholesaler_id = wo.wholesaler_id
GROUP BY ws.wholesaler_id, ws.company_name, ws.contact_person, ws.phone,
         ws.discount_percentage, ws.credit_limit, ws.current_balance;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables Created: 15
-- Functions Created: 2
-- Triggers Created: 6
-- Views Created: 4
-- =====================================================
