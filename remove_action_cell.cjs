const fs = require('fs');

let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');
const regex = /<td className="w-24">[\s\S]*?<\/td>/g;
content = content.replace(regex, "");

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
