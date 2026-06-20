-- ============================================
-- Migration: Tambah kolom 'photo' ke tabel employees
-- Database: hris_creativa
-- ============================================
-- 
-- CARA MANUAL via phpMyAdmin:
-- 1. Buka browser → http://localhost/phpmyadmin
-- 2. Klik database "hris_creativa" di panel kiri
-- 3. Klik tabel "employees"
-- 4. Klik tab "SQL" di bagian atas
-- 5. Paste query di bawah ini, lalu klik "Go"
--
-- CARA via command line (MySQL CLI):
-- mysql -u root -p hris_creativa < add_photo_column.sql
-- ============================================

ALTER TABLE employees
ADD COLUMN photo VARCHAR(255) DEFAULT NULL
AFTER email;
