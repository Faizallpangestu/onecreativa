const fs = require('fs');
const content = fs.readFileSync('src/pages/DashboardSiswaIntensif.jsx', 'utf8');

let newContent = content;

// Add state
const stateReplacement = `  const [quiz, setQuiz] = useState([]);
  const [sensei, setSensei] = useState(null);
  
  const [stats, setStats] = useState({ totalSiswa: 48, hadir: 36, izin: 5, terlambat: 7 });`;
newContent = newContent.replace(/  const \[quiz, setQuiz\] = useState\(\[\]\);\n  const \[sensei, setSensei\] = useState\(null\);/, stateReplacement);

// Add to fetchData
const fetchLogic = `      const n5Sensei = instructors.find(i => i.level === "N5" || i.kelas?.includes("N5"));
      if (n5Sensei) {
        setSensei(n5Sensei);
      }

      const users = JSON.parse(localStorage.getItem("lpk_users") || "[]");
      const students = users.filter(u => u.role === "peserta_intensif" || u.role?.toLowerCase() === "siswa");
      const totalSiswa = students.length > 0 ? students.length : 48;

      const attendanceData = JSON.parse(localStorage.getItem('sensei_attendance_real') || '{}');
      const todayDate = new Date().toISOString().split('T')[0];
      let hadirCount = 0;
      let izinCount = 0;
      let terlambatCount = 0;

      Object.values(attendanceData).forEach(records => {
         const todayRecord = Object.keys(records).find(k => k.includes(todayDate) || k.includes('Sekarang') || k.includes(new Date().toLocaleDateString('id-ID')));
         if (todayRecord) {
            const status = records[todayRecord].toString().toLowerCase();
            if (status === 'hadir') hadirCount++;
            else if (['izin', 'sakit', 'cuti'].includes(status)) izinCount++;
            else if (status === 'terlambat') terlambatCount++;
         }
      });

      setStats({
         totalSiswa: totalSiswa,
         hadir: hadirCount > 0 ? hadirCount : 36,
         izin: izinCount > 0 ? izinCount : (hadirCount > 0 ? 0 : 5),
         terlambat: terlambatCount > 0 ? terlambatCount : (hadirCount > 0 ? 0 : 7)
      });`;
newContent = newContent.replace(/      const n5Sensei = instructors\.find\(i => i\.level === "N5" \|\| i\.kelas\?\.includes\("N5"\)\);\n      if \(n5Sensei\) {\n        setSensei\(n5Sensei\);\n      }/, fetchLogic);

// Update HTML
newContent = newContent.replace(/<p className="text-emerald-900 font-black text-2xl">48<\/p>/, '{/* STAT 1 */}\n                  <p className="text-emerald-900 font-black text-2xl">{stats.totalSiswa}</p>');
newContent = newContent.replace(/<p className="text-blue-900 font-black text-2xl">36<\/p>/, '{/* STAT 2 */}\n                  <p className="text-blue-900 font-black text-2xl">{stats.hadir}</p>');
newContent = newContent.replace(/<p className="text-orange-900 font-black text-2xl">5<\/p>/, '{/* STAT 3 */}\n                  <p className="text-orange-900 font-black text-2xl">{stats.izin}</p>');
newContent = newContent.replace(/<p className="text-rose-900 font-black text-2xl">7<\/p>/, '{/* STAT 4 */}\n                  <p className="text-rose-900 font-black text-2xl">{stats.terlambat}</p>');

fs.writeFileSync('src/pages/DashboardSiswaIntensif.jsx', newContent);
console.log("Done");
