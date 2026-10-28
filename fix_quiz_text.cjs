const fs = require('fs');

let content = fs.readFileSync('src/pages/lms/LmsQuiz.jsx', 'utf8');

// Replace the anchor tag contents for "Lihat Lampiran Kuis"
content = content.replace(
  /<a href=\{task\.link\} target="_blank" rel="noreferrer" className="text-\[13px\] font-bold text-indigo-600 hover:underline flex items-center gap-2">[\s\S]*?<\/a>/g,
  '<a href={task.link} target="_blank" rel="noreferrer" className="text-[13px] font-bold text-indigo-600 hover:underline flex items-center gap-2"><FileText className="w-4 h-4" /> Lihat Lampiran Kuis</a>'
);

// Replace the anchor tag contents for "Lihat Lampiran File"
content = content.replace(
  /<a href=\{sub\.file_path\} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-semibold flex items-center gap-1">[\s\S]*?<\/a>/g,
  '<a href={sub.file_path} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-semibold flex items-center gap-1"><FileText className="w-4 h-4" /> Lihat Lampiran File</a>'
);

fs.writeFileSync('src/pages/lms/LmsQuiz.jsx', content);
console.log("Done");
