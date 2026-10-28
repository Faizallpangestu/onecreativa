const fs = require('fs');
let content = fs.readFileSync('src/pages/sensei/SenseiQuiz.jsx', 'utf8');

// Replace fetchStudents
const fetchTarget = `const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/lpk_intensif.php');
        const apiStudents = res.data?.data || [];
        setStudents(apiStudents.map(s => ({
          id: s.id,
          nama: s.nama_lengkap,
          avatar: s.nama_lengkap[0]
        })));
      } catch(err) {}
    };
    fetchStudents();`;
    
const fetchReplacement = `    const fetchStudents = () => {
      try {
        const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        let apiStudents = lpkUsers
          .filter(u => {
            const role = (u.role_name || u.role || "").toLowerCase();
            return role.includes('peserta_intensif') || role.includes('siswa');
          })
          .filter(u => {
             const b = (u.batch || "").toUpperCase();
             return b === "BATCH 2" || b === "2" || b === "BATCH2";
          })
          .map(u => ({
            id: u.id,
            nama: u.name || u.nama_lengkap || "Siswa",
            avatar: u.avatar || (u.name || u.nama_lengkap || "S")[0]
          }));

        if (apiStudents.length === 0) {
           let activeId = 3;
           try {
             const grades = JSON.parse(localStorage.getItem("sensei_quiz_grades_real") || "{}");
             let foundId = null;
             Object.values(grades).forEach(task => {
               Object.keys(task).forEach(subId => {
                 if (subId !== "1" && subId !== "2") foundId = subId;
               });
             });
             if (foundId) activeId = foundId;
           } catch(e) {}
           apiStudents = [{ id: activeId, nama: "MUHAMMAD FAIZAL", avatar: "M" }];
        }
        setStudents(apiStudents);
      } catch(err) {}
    };
    fetchStudents();`;

content = content.replace(fetchTarget, fetchReplacement);

fs.writeFileSync('src/pages/sensei/SenseiQuiz.jsx', content);
console.log("Done");
