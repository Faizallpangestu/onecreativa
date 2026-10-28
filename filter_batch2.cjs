const fs = require('fs');

const extractLpkUsersCode = `
        let apiStudents = [];
        try {
          const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
          apiStudents = lpkUsers
            .filter(u => {
              const role = (u.role_name || u.role || "").toLowerCase();
              const batch = (u.batch || "").toUpperCase();
              return (role.includes('peserta_intensif') || role.includes('siswa')) && batch === 'BATCH 2';
            })
            .map(u => ({
              id: u.id,
              nama_lengkap: u.name || u.nama_lengkap || "Siswa",
              level: u.level || "N5",
              batch: u.batch || "BATCH 2"
            }));

          // Strict fallback: If empty, use ONLY the logged-in user (if it's not a Sensei)
          if (apiStudents.length === 0) {
            const activeUser = JSON.parse(localStorage.getItem("user") || "{}");
            const activeName = activeUser.name || activeUser.full_name || "MUHAMMAD FAIZAL";
            if (!activeName.toLowerCase().includes('sensei') && !activeName.toLowerCase().includes('admin')) {
               apiStudents = [
                 { 
                   id: activeUser.id || 3, 
                   nama_lengkap: activeName,
                   level: "N5",
                   batch: "BATCH 2"
                 }
               ];
            }
          }
        } catch(e) {}
`;

// 1. Fix SenseiNilaiSiswa.jsx
let nilaiContent = fs.readFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', 'utf8');
nilaiContent = nilaiContent.replace(/let apiStudents = \[\];[\s\S]*?catch\s*\(\w*\)\s*\{\}/m, extractLpkUsersCode.trim());
fs.writeFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', nilaiContent);

// 2. Fix SenseiLeaderboard.jsx
let lbContent = fs.readFileSync('src/pages/sensei/SenseiLeaderboard.jsx', 'utf8');
lbContent = lbContent.replace(/let apiStudents = \[\];[\s\S]*?catch\s*\(\w*\)\s*\{\}/m, extractLpkUsersCode.trim());
fs.writeFileSync('src/pages/sensei/SenseiLeaderboard.jsx', lbContent);

// 3. Fix SenseiTugas.jsx
let tugasContent = fs.readFileSync('src/pages/sensei/SenseiTugas.jsx', 'utf8');
tugasContent = tugasContent.replace(/let apiStudents = \[\];[\s\S]*?catch\s*\(\w*\)\s*\{\}/m, extractLpkUsersCode.trim());
fs.writeFileSync('src/pages/sensei/SenseiTugas.jsx', tugasContent);

console.log("Done");
