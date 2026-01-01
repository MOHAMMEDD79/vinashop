-- =====================================================
-- VinaShop Admin - Phase 2 Sample Data (FINAL)
-- Matches actual database schema from vinashop.sql
-- =====================================================
-- Run AFTER phase2_migration.sql has been executed
--
-- IMPORTANT:
-- - workers and worker_attendance already have data (SKIPPED)
-- - This script only inserts missing data
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. BILL SEQUENCES (already exist - update only)
-- =====================================================
-- Columns: sequence_id, sequence_type, prefix, current_year, last_number, updated_at

UPDATE bill_sequences SET last_number = 5 WHERE sequence_type = 'customer_bill' AND current_year = 2025;
UPDATE bill_sequences SET last_number = 7 WHERE sequence_type = 'wholesaler_order' AND current_year = 2025;

-- =====================================================
-- 2. WORKERS - SKIP (already have data)
-- =====================================================
-- Workers already inserted: Ahmad Khalil, Sara Hassan, Mohammed Ali, Layla Omar, Khaled Yusuf

-- =====================================================
-- 3. WORKER ATTENDANCE - SKIP (already have data)
-- =====================================================
-- Attendance records already exist for December 2025
-- Note: hours_worked is GENERATED column - cannot be inserted

-- =====================================================
-- 4. WORKER SALARIES - Sample Salary Records
-- =====================================================
-- Actual columns: salary_id, worker_id, month, year, calculation_type, working_days_in_month,
--                 days_worked, hours_worked, base_salary, calculated_amount, bonus, deductions,
--                 payment_status, payment_date, notes, created_by
-- Note: net_salary is GENERATED - do NOT include
-- Note: NO payment_method column in actual DB

INSERT INTO worker_salaries (worker_id, month, year, calculation_type, working_days_in_month, days_worked, hours_worked, base_salary, calculated_amount, bonus, deductions, payment_status, payment_date, notes, created_by) VALUES
-- November 2025 salaries (all paid)
(1, 11, 2025, 'fixed', 26, 24, 192.00, 5500.00, 5500.00, 500.00, 0.00, 'paid', '2025-11-30', 'Performance bonus', 6),
(2, 11, 2025, 'fixed', 26, 23, 184.00, 3500.00, 3500.00, 0.00, 100.00, 'paid', '2025-11-30', 'Late deduction', 6),
(3, 11, 2025, 'days_worked', 26, 20, 160.00, 120.00, 2400.00, 0.00, 0.00, 'paid', '2025-11-30', NULL, 6),
(4, 11, 2025, 'fixed', 26, 25, 200.00, 3200.00, 3200.00, 0.00, 0.00, 'paid', '2025-11-30', NULL, 6),
(5, 11, 2025, 'fixed', 26, 24, 192.00, 3800.00, 3800.00, 200.00, 0.00, 'paid', '2025-11-30', 'Fuel allowance', 6),

-- December 2025 salaries (pending)
(1, 12, 2025, 'fixed', 26, 18, 144.00, 5500.00, 5500.00, 0.00, 0.00, 'pending', NULL, 'In progress', 6),
(2, 12, 2025, 'fixed', 26, 16, 128.00, 3500.00, 3500.00, 0.00, 0.00, 'pending', NULL, 'In progress', 6);

-- =====================================================
-- 5. TRADERS - Sample Suppliers
-- =====================================================
-- Actual columns: trader_id, company_name, contact_person, phone, email, address,
--                 tax_number, payment_terms, credit_limit, current_balance, status, notes

INSERT INTO traders (company_name, contact_person, phone, email, address, tax_number, payment_terms, credit_limit, current_balance, status, notes) VALUES
('Al-Quds Tobacco Co.', 'Mahmoud Saleh', '022234567', 'sales@alquds-tobacco.ps', 'Industrial Zone, Ramallah', 'PS-12345678', 30, 50000.00, 0.00, 'active', 'Main tobacco supplier'),
('Palestine Vape Supplies', 'Rami Nasser', '092345678', 'info@ps-vape.com', 'Nablus Commercial Center', 'PS-23456789', 45, 30000.00, 0.00, 'active', 'Vape products and accessories'),
('Golden Leaf Trading', 'Ayman Farid', '022876543', 'golden.leaf@email.com', 'Hebron Industrial Area', 'PS-34567890', 15, 25000.00, 0.00, 'active', 'Premium tobacco products'),
('Mediterranean Imports', 'Hani Jabbar', '042987654', 'med.imports@gmail.com', 'Gaza Strip', 'PS-45678901', 60, 40000.00, 0.00, 'active', 'International tobacco brands'),
('Local Accessories Ltd.', 'Sami Barakat', '098765432', 'local.acc@hotmail.com', 'Bethlehem', 'PS-56789012', 30, 15000.00, 0.00, 'inactive', 'Smoking accessories');

-- =====================================================
-- 6. TRADER BILLS - Sample Supplier Invoices
-- =====================================================
-- Actual columns: bill_id, trader_id, bill_number, bill_date, due_date, subtotal, tax_amount,
--                 total_amount, amount_paid, payment_status, bill_image, notes, created_by
-- Note: amount_due is GENERATED
-- Note: Trigger auto-updates trader.current_balance

INSERT INTO trader_bills (trader_id, bill_number, bill_date, due_date, subtotal, tax_amount, total_amount, amount_paid, payment_status, bill_image, notes, created_by) VALUES
-- Al-Quds Tobacco Co. bills
(1, 'INV-2025-001', '2025-11-01', '2025-12-01', 8000.00, 1280.00, 9280.00, 9280.00, 'paid', NULL, 'Monthly tobacco shipment', 6),
(1, 'INV-2025-015', '2025-12-01', '2025-12-31', 12000.00, 1920.00, 13920.00, 5000.00, 'partial', NULL, 'December shipment', 6),

-- Palestine Vape Supplies bills
(2, 'PVS-1234', '2025-11-15', '2025-12-30', 5500.00, 880.00, 6380.00, 0.00, 'unpaid', NULL, 'Vape devices order', 6),
(2, 'PVS-1235', '2025-12-10', '2026-01-24', 3200.00, 512.00, 3712.00, 0.00, 'unpaid', NULL, 'E-liquids order', 6),

-- Golden Leaf Trading bills
(3, 'GL-5678', '2025-10-20', '2025-11-04', 4500.00, 720.00, 5220.00, 5220.00, 'paid', NULL, 'Premium cigars', 6),

-- Mediterranean Imports bills
(4, 'MI-2025-089', '2025-11-20', '2026-01-19', 18000.00, 2880.00, 20880.00, 10000.00, 'partial', NULL, 'International brands shipment', 6);

-- =====================================================
-- 7. TRADER BILL ITEMS - Sample Bill Line Items
-- =====================================================
-- Actual columns: item_id, bill_id, product_id, description, quantity, unit_cost, total_cost

INSERT INTO trader_bill_items (bill_id, product_id, description, quantity, unit_cost, total_cost) VALUES
-- INV-2025-001 items (bill_id = 1)
(1, NULL, 'Marlboro Red Cartons (10 packs)', 50, 80.00, 4000.00),
(1, NULL, 'Marlboro Gold Cartons (10 packs)', 30, 80.00, 2400.00),
(1, NULL, 'Winston Blue Cartons (10 packs)', 20, 80.00, 1600.00),

-- INV-2025-015 items (bill_id = 2)
(2, NULL, 'Marlboro Red Cartons (10 packs)', 80, 80.00, 6400.00),
(2, NULL, 'Camel Original Cartons (10 packs)', 40, 75.00, 3000.00),
(2, NULL, 'Parliament Cartons (10 packs)', 26, 100.00, 2600.00),

-- PVS-1234 items (bill_id = 3)
(3, NULL, 'Vape Pen Starter Kit', 25, 120.00, 3000.00),
(3, NULL, 'Replacement Coils Pack', 100, 15.00, 1500.00),
(3, NULL, 'USB Chargers', 50, 20.00, 1000.00),

-- PVS-1235 items (bill_id = 4)
(4, NULL, 'E-Liquid 50ml Mixed Flavors', 80, 25.00, 2000.00),
(4, NULL, 'E-Liquid 30ml Premium', 48, 25.00, 1200.00),

-- GL-5678 items (bill_id = 5)
(5, NULL, 'Cuban Style Cigars Box (25)', 10, 300.00, 3000.00),
(5, NULL, 'Premium Cigar Singles', 50, 30.00, 1500.00),

-- MI-2025-089 items (bill_id = 6)
(6, NULL, 'Dunhill International Cartons', 100, 90.00, 9000.00),
(6, NULL, 'Kent Original Cartons', 80, 85.00, 6800.00),
(6, NULL, 'Lucky Strike Cartons', 22, 100.00, 2200.00);

-- =====================================================
-- 8. TRADER PAYMENTS - Sample Supplier Payments
-- =====================================================
-- Actual columns: payment_id, trader_id, bill_id, amount, payment_method, payment_date,
--                 reference_number, notes, created_by
-- Note: Trigger auto-updates trader.current_balance and bill.amount_paid

INSERT INTO trader_payments (trader_id, bill_id, amount, payment_method, payment_date, reference_number, notes, created_by) VALUES
(1, 1, 9280.00, 'bank_transfer', '2025-11-28', 'TRF-2025-001', 'Full payment for INV-2025-001', 6),
(1, 2, 5000.00, 'cash', '2025-12-15', NULL, 'Partial payment for INV-2025-015', 6),
(3, 5, 5220.00, 'check', '2025-11-02', 'CHK-78901', 'Full payment', 6),
(4, 6, 10000.00, 'bank_transfer', '2025-12-01', 'TRF-2025-045', 'First installment', 6);

-- =====================================================
-- 9. WHOLESALERS - Sample Wholesale Customers
-- =====================================================
-- Actual columns: wholesaler_id, company_name, contact_person, phone, email, address,
--                 tax_number, discount_percentage, credit_limit, current_balance, status, notes

INSERT INTO wholesalers (company_name, contact_person, phone, email, address, tax_number, discount_percentage, credit_limit, current_balance, status, notes) VALUES
('Ramallah Mini Markets', 'Fadi Mansour', '0599111222', 'fadi@ramallah-markets.ps', '15 Main Street, Ramallah', 'WS-11111111', 10.00, 20000.00, 0.00, 'active', 'Chain of 5 mini markets'),
('Nablus Wholesale Center', 'Tariq Awad', '0598222333', 'tariq.awad@gmail.com', 'Commercial District, Nablus', 'WS-22222222', 12.00, 35000.00, 0.00, 'active', 'Large wholesale operation'),
('Bethlehem Tobacco Shops', 'George Hanna', '0597333444', 'george.h@bethlehem-tobacco.ps', 'Star Street, Bethlehem', 'WS-33333333', 8.00, 15000.00, 0.00, 'active', '3 retail locations'),
('Hebron Kiosk Network', 'Yousef Tamimi', '0596444555', 'ytamimi@email.com', 'Old City, Hebron', 'WS-44444444', 15.00, 25000.00, 0.00, 'active', 'Network of 12 kiosks'),
('Gaza Trading Co.', 'Ahmed Masri', '0595555666', 'gaza.trading@hotmail.com', 'Gaza City', 'WS-55555555', 10.00, 10000.00, 0.00, 'inactive', 'Operations paused');

-- =====================================================
-- 10. WHOLESALER ORDERS - Sample Wholesale Orders
-- =====================================================
-- Actual columns: order_id, wholesaler_id, order_number, order_date, subtotal, discount_amount,
--                 tax_amount, total_amount, amount_paid, payment_status, order_status, notes, created_by
-- Note: amount_due is GENERATED
-- Note: Trigger auto-updates wholesaler.current_balance

INSERT INTO wholesaler_orders (wholesaler_id, order_number, order_date, subtotal, discount_amount, tax_amount, total_amount, amount_paid, payment_status, order_status, notes, created_by) VALUES
(1, 'WS-2025-00001', '2025-12-01 10:00:00', 5000.00, 500.00, 720.00, 5220.00, 5220.00, 'paid', 'delivered', 'Monthly stock order', 6),
(1, 'WS-2025-00002', '2025-12-15 14:30:00', 3500.00, 350.00, 504.00, 3654.00, 1500.00, 'partial', 'delivered', 'Mid-month restock', 6),
(2, 'WS-2025-00003', '2025-12-03 09:00:00', 12000.00, 1440.00, 1689.60, 12249.60, 0.00, 'unpaid', 'processing', 'Large bulk order', 6),
(2, 'WS-2025-00004', '2025-12-10 11:00:00', 8000.00, 960.00, 1126.40, 8166.40, 8166.40, 'paid', 'delivered', NULL, 6),
(3, 'WS-2025-00005', '2025-12-05 16:00:00', 2500.00, 200.00, 368.00, 2668.00, 2668.00, 'paid', 'delivered', NULL, 6),
(4, 'WS-2025-00006', '2025-12-07 08:00:00', 6500.00, 975.00, 884.00, 6409.00, 3000.00, 'partial', 'shipped', 'Distributed to multiple kiosks', 6),
(4, 'WS-2025-00007', '2025-12-18 15:00:00', 4200.00, 630.00, 571.20, 4141.20, 0.00, 'unpaid', 'pending', 'Awaiting confirmation', 6);

-- =====================================================
-- 11. WHOLESALER ORDER ITEMS - Sample Order Line Items
-- =====================================================
-- Actual columns: item_id, order_id, product_id, variant_id, quantity, unit_price, discount_percent, total_price
-- Note: product_id is required (NOT NULL) - using product_id 2 which exists

INSERT INTO wholesaler_order_items (order_id, product_id, variant_id, quantity, unit_price, discount_percent, total_price) VALUES
-- WS-2025-00001 items (order_id = 1)
(1, 2, NULL, 20, 85.00, 10.00, 1530.00),
(1, 2, NULL, 15, 90.00, 10.00, 1215.00),
(1, 2, NULL, 30, 75.00, 10.00, 2025.00),

-- WS-2025-00002 items (order_id = 2)
(2, 2, NULL, 15, 85.00, 10.00, 1147.50),
(2, 2, NULL, 20, 80.00, 10.00, 1440.00),

-- WS-2025-00003 items (order_id = 3)
(3, 2, NULL, 50, 85.00, 12.00, 3740.00),
(3, 2, NULL, 40, 90.00, 12.00, 3168.00),
(3, 2, NULL, 60, 75.00, 12.00, 3960.00),

-- WS-2025-00004 items (order_id = 4)
(4, 2, NULL, 35, 85.00, 12.00, 2618.00),
(4, 2, NULL, 30, 90.00, 12.00, 2376.00),
(4, 2, NULL, 40, 75.00, 12.00, 2640.00),

-- WS-2025-00005 items (order_id = 5)
(5, 2, NULL, 12, 85.00, 8.00, 938.40),
(5, 2, NULL, 10, 90.00, 8.00, 828.00),

-- WS-2025-00006 items (order_id = 6)
(6, 2, NULL, 30, 85.00, 15.00, 2167.50),
(6, 2, NULL, 25, 90.00, 15.00, 1912.50),

-- WS-2025-00007 items (order_id = 7)
(7, 2, NULL, 20, 85.00, 15.00, 1445.00),
(7, 2, NULL, 18, 90.00, 15.00, 1377.00);

-- =====================================================
-- 12. WHOLESALER PAYMENTS - Sample Wholesale Payments
-- =====================================================
-- Actual columns: payment_id, wholesaler_id, order_id, amount, payment_method, payment_date,
--                 reference_number, notes, created_by
-- Note: Trigger auto-updates wholesaler.current_balance and order.amount_paid

INSERT INTO wholesaler_payments (wholesaler_id, order_id, amount, payment_method, payment_date, reference_number, notes, created_by) VALUES
(1, 1, 5220.00, 'bank_transfer', '2025-12-05', 'WP-001', 'Full payment for WS-2025-00001', 6),
(1, 2, 1500.00, 'cash', '2025-12-16', NULL, 'Partial payment', 6),
(2, 4, 8166.40, 'check', '2025-12-12', 'CHK-56789', 'Full payment', 6),
(3, 5, 2668.00, 'cash', '2025-12-06', NULL, 'Paid on delivery', 6),
(4, 6, 3000.00, 'bank_transfer', '2025-12-10', 'WP-004', 'First installment', 6);

-- =====================================================
-- 13. CUSTOMER BILLS - Sample Customer Invoices
-- =====================================================
-- Actual columns: bill_id, user_id, order_id, bill_number, bill_date, subtotal, tax_amount,
--                 discount_amount, total_amount, amount_paid, payment_status, notes, created_by
-- Note: amount_due is GENERATED
-- Using existing users: user_id 2, 3, 4

INSERT INTO customer_bills (user_id, order_id, bill_number, bill_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, payment_status, notes, created_by) VALUES
(2, NULL, 'BILL-2025-00001', '2025-12-01 10:30:00', 250.00, 40.00, 0.00, 290.00, 290.00, 'paid', 'Walk-in customer purchase', 6),
(3, NULL, 'BILL-2025-00002', '2025-12-05 14:15:00', 180.00, 28.80, 18.00, 190.80, 100.00, 'partial', 'Regular customer - partial payment', 6),
(2, NULL, 'BILL-2025-00003', '2025-12-10 09:00:00', 450.00, 72.00, 45.00, 477.00, 0.00, 'unpaid', 'Large order - credit extended', 6),
(4, NULL, 'BILL-2025-00004', '2025-12-12 16:45:00', 85.00, 13.60, 0.00, 98.60, 98.60, 'paid', NULL, 6),
(3, NULL, 'BILL-2025-00005', '2025-12-15 11:20:00', 320.00, 51.20, 32.00, 339.20, 339.20, 'paid', 'Loyalty discount applied', 6);

-- =====================================================
-- 14. CUSTOMER BILL ITEMS - Sample Bill Line Items
-- =====================================================
-- Actual columns: item_id, bill_id, product_id, variant_id, description, quantity, unit_price,
--                 discount_percent, total_price

INSERT INTO customer_bill_items (bill_id, product_id, variant_id, description, quantity, unit_price, discount_percent, total_price) VALUES
-- BILL-2025-00001 items (bill_id = 1)
(1, NULL, NULL, 'Marlboro Red Pack', 5, 25.00, 0.00, 125.00),
(1, NULL, NULL, 'Lighter 3-pack', 2, 15.00, 0.00, 30.00),
(1, NULL, NULL, 'Vape E-Liquid 30ml', 2, 47.50, 0.00, 95.00),

-- BILL-2025-00002 items (bill_id = 2)
(2, NULL, NULL, 'Winston Blue Pack', 4, 22.00, 0.00, 88.00),
(2, NULL, NULL, 'Rolling Papers', 3, 8.00, 0.00, 24.00),
(2, NULL, NULL, 'Filters 200pcs', 2, 34.00, 0.00, 68.00),

-- BILL-2025-00003 items (bill_id = 3)
(3, NULL, NULL, 'Marlboro Carton (10 packs)', 3, 120.00, 0.00, 360.00),
(3, NULL, NULL, 'Premium Cigar Box', 1, 90.00, 0.00, 90.00),

-- BILL-2025-00004 items (bill_id = 4)
(4, NULL, NULL, 'Camel Pack', 3, 23.00, 0.00, 69.00),
(4, NULL, NULL, 'Ashtray', 1, 16.00, 0.00, 16.00),

-- BILL-2025-00005 items (bill_id = 5)
(5, NULL, NULL, 'Parliament Pack', 6, 28.00, 0.00, 168.00),
(5, NULL, NULL, 'Vape Starter Kit', 1, 110.00, 0.00, 110.00),
(5, NULL, NULL, 'Replacement Coils', 2, 21.00, 0.00, 42.00);

-- =====================================================
-- 15. CUSTOMER DEBTS - Sample Debt Records
-- =====================================================
-- Actual columns: debt_id, user_id, bill_id, order_id, total_debt, amount_paid, status,
--                 due_date, notes (NO created_by column!)
-- Note: remaining_debt is GENERATED

INSERT INTO customer_debts (user_id, bill_id, order_id, total_debt, amount_paid, status, due_date, notes) VALUES
(3, 2, NULL, 190.80, 100.00, 'partial', '2025-12-20', 'Payment plan agreed'),
(2, 3, NULL, 477.00, 0.00, 'pending', '2025-12-25', 'Awaiting payment'),
(4, NULL, NULL, 150.00, 150.00, 'settled', NULL, 'Historical debt - cleared'),
(3, NULL, NULL, 200.00, 75.00, 'partial', '2025-12-30', 'Old balance from November');

-- =====================================================
-- 16. DEBT PAYMENTS - Sample Debt Payment Records
-- =====================================================
-- Actual columns: payment_id, debt_id, user_id, amount, payment_method, payment_date,
--                 receipt_number, notes, recorded_by
-- Note: Trigger auto-updates customer_debts.amount_paid and status

INSERT INTO debt_payments (debt_id, user_id, amount, payment_method, payment_date, receipt_number, notes, recorded_by) VALUES
(1, 3, 100.00, 'cash', '2025-12-05 14:20:00', 'RCP-001', 'Initial payment on BILL-2025-00002', 6),
(3, 4, 150.00, 'bank_transfer', '2025-12-08 10:00:00', 'RCP-002', 'Debt cleared in full', 6),
(4, 3, 75.00, 'cash', '2025-12-10 15:30:00', 'RCP-003', 'Partial payment on old balance', 6);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES (Uncomment to run)
-- =====================================================
/*
SELECT 'bill_sequences' as tbl, COUNT(*) as cnt FROM bill_sequences
UNION ALL SELECT 'workers', COUNT(*) FROM workers
UNION ALL SELECT 'worker_attendance', COUNT(*) FROM worker_attendance
UNION ALL SELECT 'worker_salaries', COUNT(*) FROM worker_salaries
UNION ALL SELECT 'traders', COUNT(*) FROM traders
UNION ALL SELECT 'trader_bills', COUNT(*) FROM trader_bills
UNION ALL SELECT 'trader_bill_items', COUNT(*) FROM trader_bill_items
UNION ALL SELECT 'trader_payments', COUNT(*) FROM trader_payments
UNION ALL SELECT 'wholesalers', COUNT(*) FROM wholesalers
UNION ALL SELECT 'wholesaler_orders', COUNT(*) FROM wholesaler_orders
UNION ALL SELECT 'wholesaler_order_items', COUNT(*) FROM wholesaler_order_items
UNION ALL SELECT 'wholesaler_payments', COUNT(*) FROM wholesaler_payments
UNION ALL SELECT 'customer_bills', COUNT(*) FROM customer_bills
UNION ALL SELECT 'customer_bill_items', COUNT(*) FROM customer_bill_items
UNION ALL SELECT 'customer_debts', COUNT(*) FROM customer_debts
UNION ALL SELECT 'debt_payments', COUNT(*) FROM debt_payments;
*/

-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================
