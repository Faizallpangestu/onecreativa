const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'one-creativa'
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '20261014_matching_jobs.sql'), 'utf8');
    await db.query(sql);
    console.log('✅ matching_jobs table created or verified.');

    const [colsJob] = await db.query("SHOW COLUMNS FROM lpk_matching_job LIKE 'job_id'");
    if (colsJob.length === 0) {
      await db.query("ALTER TABLE lpk_matching_job ADD COLUMN job_id INT NULL DEFAULT NULL AFTER bidang, ADD INDEX idx_candidate_job (job_id)");
      console.log('✅ Column job_id added to lpk_matching_job.');
    } else {
      console.log('ℹ️ Column job_id already exists in lpk_matching_job.');
    }

    const [colsBiaya] = await db.query("SHOW COLUMNS FROM lpk_matching_job LIKE 'biaya_matching'");
    if (colsBiaya.length === 0) {
      await db.query("ALTER TABLE lpk_matching_job ADD COLUMN biaya_matching DECIMAL(15,2) NULL DEFAULT NULL AFTER job_id, ADD COLUMN include_fasilitas TEXT NULL DEFAULT NULL AFTER biaya_matching");
      console.log('✅ Columns biaya_matching and include_fasilitas added to lpk_matching_job.');
    } else {
      console.log('ℹ️ Columns biaya_matching and include_fasilitas already exist.');
    }

    // Seed sample matching jobs if table is empty
    const [existingJobs] = await db.query('SELECT COUNT(*) AS count FROM matching_jobs');
    if (existingJobs[0].count === 0) {
      const sampleJobs = [
        [
          'Kaigo Caregiver (Perawat Lansia)',
          'Keperawatan (Kaigo / Caregiver)',
          'TSK',
          'TSK Zenkoku Care Support Japan',
          'Yamada Kenichi',
          '+81 80-1234-5678',
          'Shizuoka-ken & Tokyo-to',
          5,
          25000000.00,
          'IDR',
          JSON.stringify([
            'Pengurusan CoE & Visa Tokutei Ginou',
            'Tiket Pesawat ke Jepang (One-Way)',
            'Medical Check-Up (MCU) Keberangkatan',
            'Pelatihan Bahasa & Mentoring Mensaetsu',
            'Penerjemahan & Legalisir Dokumen',
            'Penjemputan di Bandara Haneda/Narita',
            'Asuransi Perjalanan & Perlindungan Kerja',
            'Pembuatan Zairyu Card & Akun Bank Jepang'
          ]),
          'Termasuk subsidi akomodasi bulan pertama ¥20,000 dari user di Jepang',
          'Biaya pembuatan Paspor mandiri & uang saku pribadi',
          '¥195,000 - ¥230,000 / bulan',
          'Sertifikat SSW Kaigo, JFT-Basic A2 atau JLPT N4, Usia 19-35 tahun',
          'open',
          'Pekerjaan perawat lansia di panti jepang modern fasilitas lengkap, asrama dekat lokasi kerja (10 menit jalan kaki).'
        ],
        [
          'Pengolahan Makanan & Minuman (Pabrik Bento)',
          'Pengolahan Makanan & Minuman',
          'TSK',
          'TSK Mirai Bridge Osaka',
          'Sato Daisuke',
          '+81 90-8765-4321',
          'Osaka-fu (Kansai)',
          8,
          22000000.00,
          'IDR',
          JSON.stringify([
            'Pengurusan CoE & Visa Tokutei Ginou',
            'Tiket Pesawat ke Jepang (One-Way)',
            'Pelatihan Bahasa & Mentoring Mensaetsu',
            'Penerjemahan & Legalisir Dokumen',
            'Penjemputan di Bandara Kansai (KIX)',
            'Asuransi Perjalanan & Perlindungan Kerja',
            'Seragam & Perlengkapan Kerja Pabrik'
          ]),
          'Fasilitas makan siang gratis di kantin pabrik',
          'Paspor & MCU mandiri di daerah asal',
          '¥185,000 - ¥215,000 / bulan',
          'Sertifikat SSW Pengolahan Makanan, JFT A2/N4, Rajin, Teliti, Fisik Sehat',
          'open',
          'Produksi dan packaging makanan siap saji / bento untuk supermarket nasional di Jepang. Tersedia mess ber-AC dan WiFi.'
        ],
        [
          'Pertanian Sayuran & Buah Hidroponik',
          'Pertanian & Perkebunan',
          'LPK Mitra',
          'LPK Nihon Agricultural Partner',
          'Budi Santoso (PIC Indo)',
          '0812-9876-5432',
          'Nagano-ken & Ibaraki-ken',
          4,
          20000000.00,
          'IDR',
          JSON.stringify([
            'Pengurusan CoE & Visa Tokutei Ginou',
            'Tiket Pesawat ke Jepang (One-Way)',
            'Pelatihan Teknis Pertanian Modern',
            'Penerjemahan & Legalisir Dokumen',
            'Penjemputan di Bandara Jepang',
            'Tempat Tinggal / Rumah Petani Disubsidi'
          ]),
          'Sayuran segar gratis untuk konsumsi sehari-hari',
          'Paspor & transportasi lokal keberangkatan',
          '¥180,000 - ¥205,000 / bulan',
          'SSW Pertanian, JFT A2/N4, Suka bercocok tanam dan siap kerja fisik outdoor/greenhouse',
          'open',
          'Budidaya tanaman tomat ceri dan stroberi sistem greenhouse modern otomatis.'
        ]
      ];

      for (const job of sampleJobs) {
        await db.query(
          `INSERT INTO matching_jobs 
          (job_title, bidang, source_type, source_name, source_pic, source_contact, lokasi_jepang, kuota, total_biaya, currency, include_items, include_custom, exclude_items, estimasi_gaji, persyaratan, status, deskripsi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          job
        );
      }
      console.log('✅ Seeded 3 sample job orders with realistic TSK/LPK sources, costs, and include details.');

      // Also assign candidate 1 (Kenji Tanaka) to job 1
      await db.query('UPDATE lpk_matching_job SET job_id = 1 WHERE id = 1');
      console.log('✅ Candidate #1 linked to Job #1.');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await db.end();
  }
}

main();
