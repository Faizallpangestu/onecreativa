<?php
function install_salary_schema(mysqli $db): void {
    $db->query("CREATE TABLE IF NOT EXISTS salary_base_rates (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, employee_id INT UNSIGNED NOT NULL,
        effective_month CHAR(7) NOT NULL, amount DECIMAL(15,2) NOT NULL, reason VARCHAR(1000) NOT NULL,
        actor_id INT UNSIGNED NOT NULL, actor_name VARCHAR(255) NOT NULL, actor_role VARCHAR(50) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_salary_base_effective(employee_id,effective_month,id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $db->query("CREATE TABLE IF NOT EXISTS salary_requests (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, employee_id INT UNSIGNED NOT NULL, month CHAR(7) NOT NULL,
        employee_code VARCHAR(20) NOT NULL, employee_name VARCHAR(150) NOT NULL, position_name VARCHAR(100) NOT NULL,
        period_start DATE NOT NULL, period_end DATE NOT NULL, payday DATE NOT NULL,
        base_salary DECIMAL(15,2) NOT NULL, salary_source VARCHAR(20) NOT NULL,
        work_days INT UNSIGNED NOT NULL, meal_rate DECIMAL(15,2) NOT NULL, transport_rate DECIMAL(15,2) NOT NULL,
        meal_allowance DECIMAL(15,2) NOT NULL, transport_allowance DECIMAL(15,2) NOT NULL, total_salary DECIMAL(15,2) NOT NULL,
        attendance_json LONGTEXT NOT NULL, bank_name VARCHAR(100) NOT NULL DEFAULT '', account_name VARCHAR(150) NOT NULL DEFAULT '', account_number VARCHAR(100) NOT NULL DEFAULT '',
        status ENUM('draft','submitted','approved','rejected','paid') NOT NULL DEFAULT 'draft',
        version INT UNSIGNED NOT NULL DEFAULT 1, created_by INT UNSIGNED NOT NULL, created_by_name VARCHAR(255) NOT NULL,
        submitted_by INT UNSIGNED NULL, submitted_by_name VARCHAR(255) NULL, submitted_at DATETIME NULL,
        reviewed_by INT UNSIGNED NULL, reviewed_by_name VARCHAR(255) NULL, reviewed_at DATETIME NULL, review_note TEXT,
        paid_by INT UNSIGNED NULL, paid_by_name VARCHAR(255) NULL, paid_at DATETIME NULL, paid_date DATE NULL, transfer_reference VARCHAR(180) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_salary_employee_month(employee_id,month), INDEX idx_salary_month_status(month,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $db->query("CREATE TABLE IF NOT EXISTS salary_request_history (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, salary_request_id INT UNSIGNED NOT NULL, action VARCHAR(30) NOT NULL,
        actor_id INT UNSIGNED NOT NULL, actor_name VARCHAR(255) NOT NULL, actor_role VARCHAR(50) NOT NULL,
        note TEXT, snapshot_json LONGTEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_salary_history FOREIGN KEY(salary_request_id) REFERENCES salary_requests(id), INDEX idx_salary_history(salary_request_id,id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    foreach (['base_salary_rate_id'=>'INT UNSIGNED NULL', 'base_salary_effective_month'=>'CHAR(7) NULL'] as $column=>$definition) {
        if (!$db->query("SHOW COLUMNS FROM salary_requests LIKE '$column'")->num_rows) $db->query("ALTER TABLE salary_requests ADD COLUMN $column $definition");
    }
    // Add zero-value manual components without recalculating existing approved payments.
    foreach (['employee_join_date'=>'DATE NULL', 'thr_amount'=>'DECIMAL(15,2) NOT NULL DEFAULT 0',
        'kasbon_deduction'=>'DECIMAL(15,2) NOT NULL DEFAULT 0', 'bpjs_tk_deduction'=>'DECIMAL(15,2) NOT NULL DEFAULT 0',
        'bpjs_kes_deduction'=>'DECIMAL(15,2) NOT NULL DEFAULT 0', 'leave_deduction'=>'DECIMAL(15,2) NOT NULL DEFAULT 0',
        'gross_salary'=>'DECIMAL(15,2) NULL', 'total_deductions'=>'DECIMAL(15,2) NOT NULL DEFAULT 0',
        'adjustment_note'=>"VARCHAR(2000) NOT NULL DEFAULT ''"] as $column=>$definition) {
        if (!$db->query("SHOW COLUMNS FROM salary_requests LIKE '$column'")->num_rows) $db->query("ALTER TABLE salary_requests ADD COLUMN $column $definition");
    }
    $db->query("CREATE TABLE IF NOT EXISTS salary_slips (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, salary_request_id INT UNSIGNED NOT NULL,
        employee_id INT UNSIGNED NOT NULL, user_id INT UNSIGNED NOT NULL, recipient_email VARCHAR(191) NOT NULL,
        snapshot_json LONGTEXT NOT NULL, published_by INT UNSIGNED NOT NULL, published_by_name VARCHAR(255) NOT NULL,
        published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        email_status ENUM('pending','sending','sent','failed') NOT NULL DEFAULT 'pending', email_attempts INT UNSIGNED NOT NULL DEFAULT 0,
        email_sent_at DATETIME NULL, email_error VARCHAR(500) NULL, email_message_id VARCHAR(255) NULL,
        UNIQUE KEY uq_salary_slip_request(salary_request_id), INDEX idx_salary_slip_owner(user_id,employee_id),
        CONSTRAINT fk_salary_slip_request FOREIGN KEY(salary_request_id) REFERENCES salary_requests(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $db->query("CREATE TABLE IF NOT EXISTS salary_slip_events (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, salary_slip_id INT UNSIGNED NOT NULL,
        action VARCHAR(30) NOT NULL, actor_id INT UNSIGNED NOT NULL, actor_name VARCHAR(255) NOT NULL,
        note VARCHAR(500) NOT NULL DEFAULT '', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_salary_slip_events(salary_slip_id,id),
        CONSTRAINT fk_salary_slip_event FOREIGN KEY(salary_slip_id) REFERENCES salary_slips(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    foreach (['source' => 'VARCHAR(255) NULL', 'bank_name' => 'VARCHAR(255) NULL', 'account_name' => 'VARCHAR(255) NULL', 'account_number' => 'VARCHAR(100) NULL'] as $column => $definition) {
        if (!$db->query("SHOW COLUMNS FROM finance_records LIKE '$column'")->num_rows) $db->query("ALTER TABLE finance_records ADD COLUMN $column $definition");
    }
    if (!$db->query("SHOW COLUMNS FROM finance_records LIKE 'salary_request_id'")->num_rows) {
        $db->query('ALTER TABLE finance_records ADD COLUMN salary_request_id INT UNSIGNED NULL,
            ADD UNIQUE KEY uq_finance_salary_request(salary_request_id),
            ADD CONSTRAINT fk_finance_salary_request FOREIGN KEY(salary_request_id) REFERENCES salary_requests(id)');
    }
}
