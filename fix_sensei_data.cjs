const fs = require('fs');

const extractLpkUsersCode = `
        let apiStudents = [];
        try {
          const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
          apiStudents = lpkUsers
            .filter(u => {
              const role = (u.role_name || u.role || "").toLowerCase();
              return role === 'peserta_intensif' || role === 'siswa';
            })
            .map(u => ({
              id: u.id,
              nama_lengkap: u.name || u.nama_lengkap || "Siswa",
              level: u.level || "N5",
              batch: u.batch || "BATCH 2"
            }));

          // Fallback to API if lpk_users is completely empty (but avoid Sensei!)
          if (apiStudents.length === 0) {
            try {
              const res = await axios.get('/api/lpk_intensif.php');
              if (res.data?.data) {
                apiStudents = res.data.data
                  .filter(u => u.nama_lengkap && !u.nama_lengkap.toLowerCase().includes('sensei'))
                  .map(u => ({
                    id: u.id,
                    nama_lengkap: u.nama_lengkap,
                    level: "N5",
                    batch: "BATCH 2"
                  }));
              }
            } catch (e) {}
          }
        } catch(e) {}
`;

// 1. Fix SenseiNilaiSiswa.jsx
let nilaiContent = fs.readFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', 'utf8');
const nilaiTarget = `        const res = await axios.get('/api/lpk_intensif.php');
        const apiStudents = res.data?.data || [];`;
nilaiContent = nilaiContent.replace(nilaiTarget, extractLpkUsersCode);

// Add level and batch to SenseiNilaiSiswa.jsx mapping
const nilaiMapTarget = `            id: apiS.id,
            nama: apiS.nama_lengkap,`;
const nilaiMapReplacement = `            id: apiS.id,
            nama: apiS.nama_lengkap,
            level: apiS.level || "N5",
            batch: apiS.batch || "BATCH 2",`;
nilaiContent = nilaiContent.replace(nilaiMapTarget, nilaiMapReplacement);

// Render level and batch in SenseiNilaiSiswa.jsx table
const nilaiRenderTableTarget = `                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#1976d2] text-white font-black text-xs flex items-center justify-center shrink-0">{s.nama[0]}</div>
                            <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">{s.nama}</span>
                          </div>
                        </td>`;
const nilaiRenderTableReplacement = `                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#1976d2] text-white font-black text-xs flex items-center justify-center shrink-0">{s.nama[0]}</div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">{s.nama}</span>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                {s.level} - {s.batch}
                              </span>
                            </div>
                          </div>
                        </td>`;
nilaiContent = nilaiContent.replace(nilaiRenderTableTarget, nilaiRenderTableReplacement);
fs.writeFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', nilaiContent);


// 2. Fix SenseiLeaderboard.jsx
let lbContent = fs.readFileSync('src/pages/sensei/SenseiLeaderboard.jsx', 'utf8');
const lbTarget = `      const res = await axios.get('/api/lpk_intensif.php');
      const apiStudents = res.data?.data || [];`;
lbContent = lbContent.replace(lbTarget, extractLpkUsersCode);
fs.writeFileSync('src/pages/sensei/SenseiLeaderboard.jsx', lbContent);


// 3. Fix SenseiTugas.jsx
let tugasContent = fs.readFileSync('src/pages/sensei/SenseiTugas.jsx', 'utf8');
const tugasTarget = `        const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        let apiStudents = lpkUsers
          .filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif' || u.role?.toLowerCase() === 'siswa')
          .map(u => ({
            id: u.id,
            nama_lengkap: u.name || u.nama_lengkap || "Siswa",
            level: u.level || "N5",
            batch: u.batch || "BATCH 2"
          }));
          
        if (apiStudents.length === 0) {
          const activeUser = JSON.parse(localStorage.getItem("user") || "{}");
          apiStudents = [
            { 
              id: activeUser.id || 3, 
              nama_lengkap: activeUser.name || activeUser.full_name || "MUHAMMAD FAIZAL",
              level: "N5",
              batch: "BATCH 2"
            }
          ];
        }`;

const tugasReplacement = `
        let apiStudents = [];
        const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        apiStudents = lpkUsers
          .filter(u => {
            const role = (u.role_name || u.role || "").toLowerCase();
            return role === 'peserta_intensif' || role === 'siswa';
          })
          .map(u => ({
            id: u.id,
            nama_lengkap: u.name || u.nama_lengkap || "Siswa",
            level: u.level || "N5",
            batch: u.batch || "BATCH 2"
          }));

        if (apiStudents.length === 0) {
           try {
              const res = await axios.get('/api/lpk_intensif.php');
              if (res.data?.data) {
                apiStudents = res.data.data
                  .filter(u => u.nama_lengkap && !u.nama_lengkap.toLowerCase().includes('sensei'))
                  .map(u => ({
                    id: u.id,
                    nama_lengkap: u.nama_lengkap,
                    level: "N5",
                    batch: "BATCH 2"
                  }));
              }
           } catch (e) {}
        }
        
        // Final fallback just for faizal if everything fails
        if (apiStudents.length === 0) {
          apiStudents = [
            { id: 3, nama_lengkap: "MUHAMMAD FAIZAL", level: "N5", batch: "BATCH 2" }
          ];
        }
`;
tugasContent = tugasContent.replace(tugasTarget, tugasReplacement);
tugasContent = tugasContent.replace("const fetchStudents = () => {", "const fetchStudents = async () => {");
fs.writeFileSync('src/pages/sensei/SenseiTugas.jsx', tugasContent);

console.log("Done");
