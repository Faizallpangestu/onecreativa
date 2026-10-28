const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'one-creativa'
    });
    const [rows] = await connection.execute('SELECT id, nama_lengkap, nis, no_wa, email, alamat, kota, program, status FROM peserta_intensif ORDER BY id DESC');
    console.log('Students in peserta_intensif count:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (e) {
    console.error('DB error:', e.message);
  }
}
test();
