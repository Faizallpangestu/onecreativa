const fs = require('fs');

let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');

const regex = /<button[\s\S]*?onClick=\{openForm\}[\s\S]*?Tambah Peserta[\s\S]*?<\/button>/g;
content = content.replace(regex, "");

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
