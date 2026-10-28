const fs = require('fs');

// --- Update SenseiTugas.jsx ---
let content = fs.readFileSync('src/pages/sensei/SenseiTugas.jsx', 'utf8');

const fetchStudentsTarget = `        const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        let apiStudents = lpkUsers
          .filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif')
          .map(u => ({
            id: u.id,
            nama_lengkap: u.name || u.nama_lengkap || "Siswa",
          }));
          
        if (apiStudents.length === 0) {
          // Default mock students if local storage is totally empty
          apiStudents = [
            { id: 1, nama_lengkap: "APRIANTO" },
            { id: 2, nama_lengkap: "RAMSYAWALLY" },
            { id: 3, nama_lengkap: "MUHAMMAD FAIZAL" }
          ];
        }

        setStudents(apiStudents.map(s => ({
          id: s.id,
          nama: s.nama_lengkap,
          avatar: s.nama_lengkap[0]
        })));`;

const fetchStudentsReplacement = `        const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        let apiStudents = lpkUsers
          .filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif' || u.role?.toLowerCase() === 'siswa')
          .map(u => ({
            id: u.id,
            nama_lengkap: u.name || u.nama_lengkap || "Siswa",
            level: u.level || "N5",
            batch: u.batch || "BATCH 2"
          }));
          
        // If empty, force inject the currently logged in user so it doesn't fallback to Aprianto
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
        }

        setStudents(apiStudents.map(s => ({
          id: s.id,
          nama: s.nama_lengkap,
          avatar: s.nama_lengkap ? s.nama_lengkap[0] : "S",
          level: s.level,
          batch: s.batch
        })));`;

content = content.replace(fetchStudentsTarget, fetchStudentsReplacement);

// Render level and batch in SenseiTugas modal
const modalTableTarget = `                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#1976d2] text-white font-black text-sm flex items-center justify-center shrink-0">{student.avatar}</div>
                            <span className="text-[14px] font-semibold text-slate-800">{student.nama}</span>
                          </div>
                        </td>`;
const modalTableReplacement = `                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#1976d2] text-white font-black text-sm flex items-center justify-center shrink-0">{student.avatar}</div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-slate-800">{student.nama}</span>
                              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mt-1">
                                {student.level} - {student.batch}
                              </span>
                            </div>
                          </div>
                        </td>`;
content = content.replace(modalTableTarget, modalTableReplacement);
fs.writeFileSync('src/pages/sensei/SenseiTugas.jsx', content);


// --- Update LmsNilai.jsx ---
let nilaiContent = fs.readFileSync('src/pages/lms/LmsNilai.jsx', 'utf8');

const nilaiFetchTarget = `    // Load actual students
    const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    let intensifUsers = lpkUsers.filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif');
    
    // Fallback if empty for demo
    if (intensifUsers.length === 0) {
      intensifUsers = [
        { id: 1, name: "APRIANTO" },
        { id: 2, name: "RAMSYAWALLY" },
        { id: 3, name: user.name || "MUHAMMAD FAIZAL" }
      ];
    }`;

const nilaiFetchReplacement = `    // Load actual students
    const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    let intensifUsers = lpkUsers.filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif' || u.role?.toLowerCase() === 'siswa');
    
    // Fallback if empty for demo
    if (intensifUsers.length === 0) {
      const activeUser = JSON.parse(localStorage.getItem("user") || "{}");
      intensifUsers = [
        { 
           id: activeUser.id || 3, 
           name: activeUser.name || activeUser.full_name || "MUHAMMAD FAIZAL",
           level: "N5",
           batch: "BATCH 2"
        }
      ];
    }`;
nilaiContent = nilaiContent.replace(nilaiFetchTarget, nilaiFetchReplacement);

const nilaiMapTarget = `      return {
        id: student.id,
        name: student.name.toUpperCase(),
        quiz: avgQuiz,
        tugas: avgTugas,
        kaiwa,
        ukom,
        sikap,
        attitude,
        rata
      };`;
const nilaiMapReplacement = `      return {
        id: student.id,
        name: student.name ? student.name.toUpperCase() : "SISWA",
        level: student.level || "N5",
        batch: student.batch || "BATCH 2",
        quiz: avgQuiz,
        tugas: avgTugas,
        kaiwa,
        ukom,
        sikap,
        attitude,
        rata
      };`;
nilaiContent = nilaiContent.replace(nilaiMapTarget, nilaiMapReplacement);

const nilaiRenderTarget = `                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1565c0] text-white flex items-center justify-center font-bold text-[14px] shadow-sm">
                            {item.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-700 text-[14px]">{item.name}</span>
                        </div>
                      </td>`;
const nilaiRenderReplacement = `                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1565c0] text-white flex items-center justify-center font-bold text-[14px] shadow-sm">
                            {item.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-[14px]">{item.name}</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5 tracking-wide">
                              {item.level} - {item.batch}
                            </span>
                          </div>
                        </div>
                      </td>`;
nilaiContent = nilaiContent.replace(nilaiRenderTarget, nilaiRenderReplacement);
fs.writeFileSync('src/pages/lms/LmsNilai.jsx', nilaiContent);

console.log("Done");
