const fs = require('fs');

let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');
const regex = /<td className="px-4 py-3 text-center align-middle border-b border-slate-100">[\s\S]*?<\/td>/g;
content = content.replace(regex, "");

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
