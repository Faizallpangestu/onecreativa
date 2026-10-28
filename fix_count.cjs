const fs = require('fs');

let content = fs.readFileSync('src/pages/sensei/SenseiTugas.jsx', 'utf8');

const target = `      // Update submitted count automatically based on graded/submitted students
      setTugas(prev => prev.map(t => {
        const submissions = grades[t.id] || {};
        const count = Object.keys(submissions).length;
        return { ...t, submitted: count, total: students.length };
      }));`;

const replacement = `      // Update submitted count automatically based on valid students
      setTugas(prev => prev.map(t => {
        const submissions = grades[t.id] || {};
        // Only count submissions from valid student IDs currently in the table
        const count = Object.keys(submissions).filter(subId => 
           students.some(s => s.id.toString() === subId.toString())
        ).length;
        return { ...t, submitted: count, total: students.length };
      }));`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/sensei/SenseiTugas.jsx', content);
console.log("Done");
