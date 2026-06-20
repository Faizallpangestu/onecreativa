import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === '.htaccess') continue; // Jangan timpa .htaccess dari public/
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const srcDir = path.join(__dirname, 'backend');
  const destDir = path.join(__dirname, 'dist');
  
  console.log('📦 Menyalin folder backend ke dalam dist...');
  copyDir(srcDir, destDir);
  console.log('✅ Berhasil! Folder dist sekarang sudah berisi frontend & backend secara utuh.');
} catch (err) {
  console.error('❌ Gagal menyalin backend:', err);
}
