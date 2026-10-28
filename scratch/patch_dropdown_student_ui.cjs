const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/components/BuatInvoiceWizardModal.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add ChevronDown, Hash to imports
if (!content.includes('ChevronDown')) {
  content = content.replace(
    '  Building\n} from "lucide-react";',
    '  Building,\n  ChevronDown,\n  Hash\n} from "lucide-react";'
  );
}

// 2. Remove DEFAULT_CANDIDATES injection from fetchAllStudents
const oldFetchLogic = `        // Local newest first, then API students, then defaults
        const merged = [...activeLocal, ...apiList];

        if (Array.isArray(dataSiswa)) {
          dataSiswa.forEach(ds => {
            if (!merged.some(c => c.nis === ds.nis || c.nama.toLowerCase() === (ds.nama || ds.name || '').toLowerCase())) {
              merged.push({
                id: ds.nis || \`S-\${String(ds.id || '000').padStart(3, '0')}\`,
                nama: ds.nama || ds.name || "Siswa",
                nis: ds.nis || \`S-\${String(ds.id || '000').padStart(3, '0')}\`,
                phone: ds.kontak || ds.phone || ds.no_wa || "-",
                email: ds.email || "-",
                alamat: ds.alamat || "Cianjur, Jawa Barat",
                status: ds.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
                program: ds.program || "Kelas Intensif Offline",
                batch: ds.batch || "Batch 2"
              });
            }
          });
        }

        DEFAULT_CANDIDATES.forEach(dc => {
          if (!merged.some(c => c.nama.toLowerCase() === dc.nama.toLowerCase())) {
            merged.push(dc);
          }
        });

        if (active) {
          setLiveStudents(merged);
          if (merged.length > 0) {
            setSelectedStudent(merged[0]);
          }
        }`;

const newFetchLogic = `        // Only pull REAL registered students from Students module / DB (No dummy injection)
        const merged = [...activeLocal, ...apiList];

        if (Array.isArray(dataSiswa)) {
          dataSiswa.forEach(ds => {
            if (!merged.some(c => (c.nis && c.nis === ds.nis) || c.nama.toLowerCase() === (ds.nama || ds.name || '').toLowerCase())) {
              merged.push({
                id: ds.nis || \`S-\${String(ds.id || '000').padStart(3, '0')}\`,
                nama: ds.nama || ds.name || "Siswa",
                nis: ds.nis || \`S-\${String(ds.id || '000').padStart(3, '0')}\`,
                phone: ds.kontak || ds.phone || ds.no_wa || "-",
                email: ds.email || "-",
                alamat: ds.alamat || "Cianjur, Jawa Barat",
                status: ds.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
                program: ds.program || "Kelas Intensif Offline",
                batch: ds.batch || "Batch 2"
              });
            }
          });
        }

        // If no students registered anywhere, fallback to a single placeholder
        const finalList = merged.length > 0 ? merged : [
          { id: "S-001", nama: "Belum Ada Siswa Terdaftar", nis: "-", phone: "-", email: "-", alamat: "Cianjur", status: "Nonaktif", program: "Kelas Intensif Offline", batch: "Batch 2" }
        ];

        if (active) {
          setLiveStudents(finalList);
          if (finalList.length > 0) {
            setSelectedStudent(finalList[0]);
            if (finalList[0].program) {
              setProgramInfo(prev => ({ ...prev, program: finalList[0].program }));
            }
          }
        }`;

content = content.replace(oldFetchLogic, newFetchLogic);

// 3. Replace Step 1 UI with a clean, high-end Dropdown + Student Card layout
const startStep1 = content.indexOf('{currentStep === 1 && (');
const endStep1 = content.indexOf('{currentStep === 2 && (');

if (startStep1 !== -1 && endStep1 !== -1) {
  const newStep1UI = `{currentStep === 1 && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Pilih Siswa / Customer</h3>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Data Langsung dari Modul Students ({liveStudents.length} Siswa Terdaftar)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih siswa melalui menu dropdown di bawah. Data profil & kontak otomatis ditarik dari sistem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualStudent(!isManualStudent)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  {isManualStudent ? "Pilih dari Dropdown Siswa" : "Input Manual (Opsional)"}
                </button>
              </div>

              {isManualStudent ? (
                /* Mode Input Manual Baru */
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Muhammad Rizki"
                        value={manualStudent.nama}
                        onChange={e => setManualStudent({ ...manualStudent, nama: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">NIS / ID Siswa</label>
                      <input
                        type="text"
                        value={manualStudent.nis}
                        onChange={e => setManualStudent({ ...manualStudent, nis: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        placeholder="0812-xxxx-xxxx"
                        value={manualStudent.phone}
                        onChange={e => setManualStudent({ ...manualStudent, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="siswa@example.com"
                        value={manualStudent.email}
                        onChange={e => setManualStudent({ ...manualStudent, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                      <input
                        type="text"
                        placeholder="Cianjur, Jawa Barat"
                        value={manualStudent.alamat}
                        onChange={e => setManualStudent({ ...manualStudent, alamat: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* DROPDOWN SELECT SISWA (REKOMENDASI UI/UX) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Pilih Siswa / Customer (Tarik Data Otomatis)
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600">
                        {liveStudents.length} Siswa Terdaftar
                      </span>
                    </label>

                    <div className="relative">
                      <select
                        value={selectedStudent?.nis || selectedStudent?.id || (liveStudents[0] ? (liveStudents[0].nis || liveStudents[0].id) : "")}
                        onChange={e => {
                          const chosenVal = e.target.value;
                          const found = liveStudents.find(s => (s.nis || s.id) === chosenVal || s.nama === chosenVal);
                          if (found) handleSelectCandidateStudent(found);
                        }}
                        className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-10 transition"
                      >
                        {liveStudents.map((s, idx) => (
                          <option key={s.id || s.nis || idx} value={s.nis || s.id || s.nama}>
                            {s.nama} ({s.nis || 'NIS -'}) — {s.program || 'Program Intensif'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* KARTU PROFIL & DETAIL SISWA TERPILIH */}
                  {selectedStudent && (
                    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 rounded-3xl border border-blue-200/90 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100/80 pb-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            {selectedStudent.nama ? selectedStudent.nama.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 text-base md:text-lg">{selectedStudent.nama}</h4>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {selectedStudent.status || "Siswa Aktif"}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 font-bold mt-0.5 flex items-center gap-1.5">
                              <span>📚 {selectedStudent.program || "Kelas Intensif Offline"}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-normal">{selectedStudent.batch || "Batch 2"}</span>
                            </p>
                          </div>
                        </div>

                        <span className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Siswa Terpilih
                        </span>
                      </div>

                      {/* 4 Detail Grid Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Hash className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">Nomor Induk Siswa (NIS)</p>
                            <p className="font-bold text-slate-900 font-mono text-xs">{selectedStudent.nis || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">WhatsApp / Nomor Telepon</p>
                            <p className="font-bold text-slate-900 font-mono text-xs">{selectedStudent.phone || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-medium">Email Resmi</p>
                            <p className="font-bold text-slate-900 truncate text-xs">{selectedStudent.email || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-medium">Alamat Domisili</p>
                            <p className="font-bold text-slate-900 truncate text-xs">{selectedStudent.alamat || "Cianjur, Jawa Barat"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Data otomatis tersinkron dengan database profil student
                        </span>
                        <span className="text-slate-400">Siap dibuatkan invoice penagihan</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}\n\n          `;

  content = content.slice(0, startStep1) + newStep1UI + content.slice(endStep1);
  console.log('Successfully updated Step 1 UI to clean Dropdown layout');
} else {
  console.error('Could not find Step 1 bounds');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Saved BuatInvoiceWizardModal.jsx');
