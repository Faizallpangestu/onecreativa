<?php
require_once __DIR__ . '/../services/budget_schema.php';
require_once __DIR__ . '/../services/salary_schema.php';
function install_salary_test_fixture(mysqli $db, string $month): void {
    $db->query("SET time_zone='+07:00'");
    $db->query('CREATE TABLE roles(id INT PRIMARY KEY,name VARCHAR(50)) ENGINE=InnoDB');
    $db->query('CREATE TABLE users(id INT PRIMARY KEY,role_id INT,is_active INT DEFAULT 1,email VARCHAR(100),password_hash VARCHAR(255)) ENGINE=InnoDB');
    $db->query('CREATE TABLE employees(id INT UNSIGNED PRIMARY KEY,user_id INT,employee_code VARCHAR(20),full_name VARCHAR(150),position VARCHAR(100),base_salary DECIMAL(15,2),join_date DATE,bank_name VARCHAR(100),bank_account VARCHAR(100),gender VARCHAR(20),photo_url VARCHAR(255),department_id INT NULL) ENGINE=InnoDB');
    $db->query('CREATE TABLE positions(id INT PRIMARY KEY,name VARCHAR(100),base_salary DECIMAL(15,2)) ENGINE=InnoDB');
    $db->query('CREATE TABLE attendance_logs(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT,date DATE,status VARCHAR(50),check_in_at TIMESTAMP NULL,check_out_at TIMESTAMP NULL) ENGINE=InnoDB');
    $db->query("CREATE TABLE payslips(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT,month VARCHAR(10),status VARCHAR(20),base_salary DECIMAL(15,2),total_salary DECIMAL(15,2),late_penalty DECIMAL(15,2) DEFAULT 0,overtime_pay DECIMAL(15,2) DEFAULT 0,published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $db->query('CREATE TABLE leaves(id INT PRIMARY KEY,employee_id INT,status VARCHAR(20),start_date DATE) ENGINE=InnoDB');
    $db->query("CREATE TABLE finance_records(id INT AUTO_INCREMENT PRIMARY KEY,type ENUM('income','expense'),category VARCHAR(100),amount DECIMAL(15,2),description TEXT,source VARCHAR(255),transaction_date DATE,created_by INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $db->query("INSERT INTO roles VALUES(1,'finance'),(2,'admin'),(3,'ga'),(4,'karyawan'),(5,'hrd'),(6,'super_admin'),(7,'staff')");
    $db->query("INSERT INTO users(id,role_id,is_active,email) VALUES(1,1,1,'finance@test'),(2,2,1,'admin@test'),(3,3,1,'ga@test'),(4,4,1,'employee@test'),(5,4,1,'second@test'),(6,7,1,'staff@test'),(7,5,1,'hrd@test'),(8,4,0,'inactive@test'),(9,6,1,'super@test')");
    $statement=$db->prepare('UPDATE users SET password_hash=?');$hash=password_hash('isolated-test-only',PASSWORD_DEFAULT);$statement->bind_param('s',$hash);$statement->execute();
    $db->query("INSERT INTO positions VALUES(1,'Staff',2500000)");
    $db->query("INSERT INTO employees(id,user_id,employee_code,full_name,position,base_salary,join_date,bank_name,bank_account) VALUES
        (1,4,'TEST001','Karyawan Uji Satu','Staff',3000000.25,'2000-01-01','Bank Uji','001234'),
        (2,5,'TEST002','Karyawan Uji Dua','Staff',4500000.50,'2000-01-01','',''),
        (3,6,'TEST003','Staff Uji','Staff',0,'$month-03','Bank Uji','003456'),
        (4,8,'TEST004','Karyawan Nonaktif','Staff',4000000,'2000-01-01','Bank Uji','004567'),
        (5,3,'TEST005','GA Uji','Staff',4000000,'2000-01-01','Bank Uji','005678')");
    $db->query('ALTER TABLE employees ADD COLUMN bpjs_tk VARCHAR(50) NULL, ADD COLUMN bpjs_kes VARCHAR(50) NULL');
    $db->query("UPDATE employees SET bpjs_tk='0011223344',bpjs_kes='0009988776' WHERE id=1");
    $db->query("UPDATE users SET email='employee@example.test' WHERE id=4");
    $db->query("UPDATE users SET email='staff@example.test' WHERE id=6");
    $db->query("INSERT INTO attendance_logs(employee_id,date,status,check_in_at) VALUES
        (1,'$month-01','present','$month-01 08:00:00'),(1,'$month-01','present','$month-01 08:01:00'),
        (1,'$month-02','late','$month-02 08:30:00'),(1,'$month-03','dinas',NULL),
        (1,'$month-04','absent','$month-04 08:00:00'),(1,'$month-05','leave',NULL),(1,'$month-06','izin',NULL),
        (1,'$month-07','','$month-07 08:00:00'),(3,'$month-02','present','$month-02 08:00:00'),(3,'$month-03','present','$month-03 08:00:00')");
    install_budget_schema($db); install_salary_schema($db); install_salary_schema($db);
}
