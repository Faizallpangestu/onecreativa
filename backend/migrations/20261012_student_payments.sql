-- Student receipts are requests for review, never verified money or journal postings.
CREATE TABLE student_payment_submissions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 invoice_link_id BIGINT UNSIGNED NOT NULL,
 student_id INT NOT NULL,
 amount DECIMAL(15,2) NOT NULL,
 transfer_date DATE NOT NULL,
 reference VARCHAR(180) NOT NULL,
 proof_file VARCHAR(255) NOT NULL,
 request_key VARCHAR(100) NOT NULL UNIQUE,
 status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
 transaction_id BIGINT UNSIGNED NULL UNIQUE,
 review_notes TEXT NULL,
 reviewed_by INT UNSIGNED NULL,
 reviewed_at DATETIME NULL,
 submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(invoice_link_id) REFERENCES student_invoice_links(id) ON DELETE RESTRICT,
 FOREIGN KEY(student_id) REFERENCES peserta_intensif(id) ON DELETE RESTRICT,
 FOREIGN KEY(transaction_id) REFERENCES accounting_transactions(id) ON DELETE RESTRICT,
 FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK(amount>0),
 CHECK((status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND transaction_id IS NULL) OR (status='accepted' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND transaction_id IS NOT NULL) OR (status='rejected' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND transaction_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
