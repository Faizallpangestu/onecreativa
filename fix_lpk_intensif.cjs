const fs = require('fs');

const extractLpkUsersCode = `
const fetchParticipants = async () => {
  setIsLoading(true);
  try {
    const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    const apiStudents = lpkUsers
      .filter(u => {
        const role = (u.role_name || u.role || "").toLowerCase();
        return role.includes('peserta_intensif') || role.includes('siswa');
      })
      .map(u => ({
        id: u.id,
        nama_lengkap: u.name || u.nama_lengkap || "Siswa",
        email: u.email || "",
        no_wa: u.phone || u.no_wa || "",
        level: u.level || "N5",
        batch: u.batch || "BATCH 2",
        foto_profil: u.avatar || null
      }));

    setParticipants(apiStudents);
    setErrorMessage("");
  } catch (error) {
    setErrorMessage("Gagal memuat data peserta.");
  } finally {
    setIsLoading(false);
  }
};
`;

let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');

// Replace the fetchParticipants function
content = content.replace(/const fetchParticipants = async \(\) => \{[\s\S]*?setIsLoading\(false\);\n\s*\}\n\};/m, extractLpkUsersCode.trim());

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
