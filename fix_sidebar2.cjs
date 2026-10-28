const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// Replace GA hidden rules. We know they currently say: hidden: !(isAdmin || isHR || isEmployee || isGA || isFinance)
// We only want them to say: hidden: !(isAdmin || isGA)

// However, only for GA section!
let inGA = false;
let inKeuangan = false;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('category: "GA"')) inGA = true;
    else if (lines[i].includes('category: "KEUANGAN"')) { inGA = false; inKeuangan = true; }
    else if (lines[i].includes('category: "MANAJEMEN LPK"')) { inKeuangan = false; }
    
    if (inGA && lines[i].includes('hidden:')) {
        lines[i] = '          hidden: !(isAdmin || isGA),';
        if (lines[i-1] && lines[i-1].includes('Absensi Wajah')) {
            // Keep the special rule for Absensi Wajah if it existed
            // "admin", "super_admin" logic was there but we can simplify to !(isGA) since admin might not need it?
            // User said admin shouldn't see face clock? Actually they said lock ke role.
        }
    }
    
    if (inKeuangan && lines[i].includes('hidden:')) {
        lines[i] = '          hidden: !(isAdmin || isFinance),';
    }
}

content = lines.join('\n');
fs.writeFileSync('src/components/Sidebar.jsx', content);
