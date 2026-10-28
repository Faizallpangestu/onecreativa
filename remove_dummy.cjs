const fs = require('fs');

let content = fs.readFileSync('src/pages/lms/LmsQuiz.jsx', 'utf8');

content = content.replace(/Presensi \(Dummy\)/g, "Statistik Kehadiran");

fs.writeFileSync('src/pages/lms/LmsQuiz.jsx', content);
console.log("Done");
