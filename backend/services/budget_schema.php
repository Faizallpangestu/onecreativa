<?php
function install_budget_schema(mysqli $db): void {
    if (!$db->query("SHOW COLUMNS FROM finance_records LIKE 'source'")->num_rows) $db->query('ALTER TABLE finance_records ADD COLUMN source VARCHAR(255) NULL');
    $db->query("CREATE TABLE IF NOT EXISTS budget_requests (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        request_key CHAR(36) NOT NULL UNIQUE,
        title VARCHAR(180) NOT NULL, period DATE NOT NULL, notes TEXT,
        status ENUM('draft','submitted','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
        total_amount DECIMAL(15,2) NOT NULL,
        created_by INT UNSIGNED NOT NULL, created_by_name VARCHAR(255) NOT NULL,
        reviewed_by INT UNSIGNED NULL, reviewed_by_name VARCHAR(255) NULL, review_note TEXT,
        submitted_at DATETIME NULL, reviewed_at DATETIME NULL,
        version INT UNSIGNED NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_budget_period_status(period,status), INDEX idx_budget_submitted(submitted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    foreach (['attachment_key' => 'CHAR(32) NULL', 'attachment_name' => 'VARCHAR(255) NULL', 'attachment_link' => 'VARCHAR(2048) NULL'] as $name => $definition) {
        if (!$db->query("SHOW COLUMNS FROM budget_requests LIKE '$name'")->num_rows) $db->query("ALTER TABLE budget_requests ADD COLUMN $name $definition");
    }
    $db->query("CREATE TABLE IF NOT EXISTS budget_request_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, budget_request_id INT UNSIGNED NOT NULL,
        category VARCHAR(100) NOT NULL, description VARCHAR(500) NOT NULL,
        quantity INT UNSIGNED NOT NULL, unit VARCHAR(40) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL, total_amount DECIMAL(15,2) NOT NULL,
        CONSTRAINT fk_budget_items_request FOREIGN KEY(budget_request_id) REFERENCES budget_requests(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $db->query("CREATE TABLE IF NOT EXISTS budget_request_history (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, budget_request_id INT UNSIGNED NOT NULL,
        action VARCHAR(30) NOT NULL, from_status VARCHAR(20) NULL, to_status VARCHAR(20) NOT NULL,
        actor_id INT UNSIGNED NOT NULL, actor_name VARCHAR(255) NOT NULL, actor_role VARCHAR(50) NOT NULL,
        note TEXT, snapshot_json LONGTEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_budget_history_request FOREIGN KEY(budget_request_id) REFERENCES budget_requests(id),
        INDEX idx_budget_history_request(budget_request_id,id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $column = $db->query("SHOW COLUMNS FROM finance_records LIKE 'budget_request_id'");
    if (!$column->num_rows) {
        $db->query("ALTER TABLE finance_records ADD COLUMN budget_request_id INT UNSIGNED NULL,
            ADD UNIQUE KEY uq_finance_budget_request(budget_request_id),
            ADD CONSTRAINT fk_finance_budget_request FOREIGN KEY(budget_request_id) REFERENCES budget_requests(id)");
    }
}
