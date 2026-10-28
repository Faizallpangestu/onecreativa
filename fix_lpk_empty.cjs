const fs = require('fs');

let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');

// 1. Add fallback to fetchParticipants
const extractLpkUsersCode = `const fetchParticipants = async () => {
  setIsLoading(true);
  try {
    const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    let apiStudents = lpkUsers
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

    if (apiStudents.length === 0) {
      let activeId = 3;
      try {
         const grades = JSON.parse(localStorage.getItem("sensei_tugas_grades_real") || "{}");
         let foundId = null;
         Object.values(grades).forEach(task => {
           Object.keys(task).forEach(subId => {
             if (subId !== "1" && subId !== "2") foundId = subId;
           });
         });
         if (foundId) activeId = foundId;
      } catch(e) {}
      apiStudents = [
        { 
          id: activeId, 
          nama_lengkap: "MUHAMMAD FAIZAL",
          email: "muhammadfaizal.mf10@gmail.com",
          no_wa: "08123456789",
          level: "N5",
          batch: "BATCH 2",
          foto_profil: null
        }
      ];
    }

    setParticipants(apiStudents);
    setErrorMessage("");
  } catch (error) {
    setErrorMessage("Gagal memuat data peserta.");
  } finally {
    setIsLoading(false);
  }
};`;

content = content.replace(/const fetchParticipants = async \(\) => \{[\s\S]*?setIsLoading\(false\);\n\s*\}\n\};/m, extractLpkUsersCode.trim());

// 2. Remove "Tambah Peserta" button
const btnTarget = `<button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-[#1565c0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-[14px] transition shadow-sm hover:shadow">
              <Plus className="w-5 h-5" /> Tambah Peserta
            </button>`;
content = content.replace(btnTarget, "");

// 3. Remove "AKSI" header
const headerTarget = `<th className="text-right px-4 py-3 text-[11px] font-black text-slate-100 w-24">Aksi</th>`;
content = content.replace(headerTarget, "");

// 4. Remove actions cells (edit/delete)
const cellTarget = `<td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition" title="Edit Peserta">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title="Hapus Peserta">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>`;
// We might need a regex if it's slightly different
const cellRegex = /<td className="py-4 px-4 text-right">[\s\S]*?<Trash2 className="w-4 h-4" \/>[\s\S]*?<\/td>/gm;
content = content.replace(cellRegex, "");

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
