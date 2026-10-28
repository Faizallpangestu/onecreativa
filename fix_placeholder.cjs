const fs = require('fs');
let content = fs.readFileSync('src/pages/lms/LmsQuiz.jsx', 'utf8');

// The file contains corrupted unicode for the link emoji
content = content.replace(/<span className="text-slate-400">A,\?\?\?"<\/span>/g, '<span className="text-slate-400">🔗</span>');
content = content.replace(/<span className="text-slate-400">ðŸ”—<\/span>/g, '<span className="text-slate-400">🔗</span>');

// Alternatively, just replace any weird span before the input
content = content.replace(/<span className="text-slate-400">.*?<\/span>\s*<\/div>\s*<input\s*type="url"/g, '<span className="text-slate-400">🔗</span>\n                      </div>\n                      <input \n                        type="url"');

fs.writeFileSync('src/pages/lms/LmsQuiz.jsx', content);
console.log("Done");
