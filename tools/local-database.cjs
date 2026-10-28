const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const root = path.resolve(__dirname, '..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function connect(database) {
  const dir = path.join(root, 'backend/config');
  const text = fs.readFileSync(path.join(dir, fs.existsSync(path.join(dir, 'db_env.php')) ? 'db_env.php' : 'database.php'), 'utf8');
  const value = key => {
    const match = text.match(new RegExp('\\$' + key + '\\s*=\\s*([\x27\x22])([^\x27\x22]*)\\1\\s*;'));
    if (!match) throw Error('Unsupported database configuration');
    return match[2];
  };
  const host = value('DB_HOST');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) throw Error('Only local database actions allowed');
  const configured = value('DB_NAME');
  const db = await mysql.createConnection({host, user:value('DB_USER'), password:value('DB_PASS'), database:database || configured, dateStrings:true, supportBigNumbers:true, bigNumberStrings:true});
  await db.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
  return {db, configured};
}
async function snapshot(db) {
  const tables = (await db.query("SHOW FULL TABLES WHERE Table_type='BASE TABLE'"))[0];
  const result = {};
  for (const row of tables) {
    const name = Object.values(row)[0];
    const schema = (await db.query('SHOW CREATE TABLE ' + mysql.escapeId(name)))[0][0]['Create Table'];
    const rows = (await db.query('SELECT * FROM ' + mysql.escapeId(name)))[0];
    const canonical = rows.map(r => Object.values(r).map(mysql.escape).join(',')).sort().join('\n');
    result[name] = {schema, rows, count:rows.length, row_sha256:hash(canonical)};
  }
  return result;
}
function assertPreserved(before, after) {
  for (const [name, table] of Object.entries(before)) {
    if (!after[name] || after[name].row_sha256 !== table.row_sha256) throw Error('Preservation failed for ' + name);
  }
}
function normalizeSchema(schema) {
  return schema.replace(/ AUTO_INCREMENT=\d+/g, '').replace(/`[^`]+`\./g, '').replace(/CONSTRAINT `[^`]+` /g,'').trim();
}
function safeTestDatabase(name, configured) {
  if (!/^one_creativa_release_test_[a-f0-9]{16}$/.test(name) || name === configured) throw Error('Unsafe test database name');
}
module.exports = {fs,path,crypto,mysql,root,hash,connect,snapshot,assertPreserved,normalizeSchema,safeTestDatabase};
