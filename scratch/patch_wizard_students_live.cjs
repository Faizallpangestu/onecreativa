const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/components/BuatInvoiceWizardModal.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace candidateStudents useMemo and static state with live synchronization
const oldStudentInit = `  // ─── STEP 1: DATA SISWA ──────────────────────────────────────────────────────
  const candidateStudents = useMemo(() => {
    const list = [...DEFAULT_CANDIDATES];
    if (Array.isArray(dataSiswa)) {
      dataSiswa.forEach(s => {
        const id = s.id ? \`S-\${String(s.id).padStart(3, "0")}\` : (s.nis || "S-000");
        if (!list.some(c => c.nis === id || c.nama === (s.nama || s.name))) {
          list.push({
            id: id,
            nama: s.nama || s.name || "Siswa",
            nis: s.nis || id,
            phone: s.kontak || s.phone || s.no_wa || "0812-xxxx-xxxx",
            email: s.email || "siswa@example.com",
            alamat: s.alamat ? \`\${s.alamat}, \${s.kota || "Cianjur"}\` : (s.kota || "Cianjur, Jawa Barat"),
            status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
            program: s.program || "Kelas Intensif Offline",
            batch: s.batch || "Batch 2"
          });
        }
      });
    }
    return list;
  }, [dataSiswa]);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(DEFAULT_CANDIDATES[0]);
  const [isManualStudent, setIsManualStudent] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    nama: "",
    nis: "S-012",
    phone: "",
    email: "",
    alamat: "Cianjur, Jawa Barat",
  });`;

const newStudentInit = `  // ─── STEP 1: DATA SISWA (AUTO-SYNC DARI DATABASE STUDENTS & CUSTOMERS) ──────
  const [liveStudents, setLiveStudents] = useState(DEFAULT_CANDIDATES);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(DEFAULT_CANDIDATES[0]);
  const [isManualStudent, setIsManualStudent] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    nama: "",
    nis: "S-012",
    phone: "",
    email: "",
    alamat: "Cianjur, Jawa Barat",
  });

  // Auto-fetch latest live students from Database & LocalStorage
  useEffect(() => {
    let active = true;
    const fetchAllStudents = async () => {
      setLoadingStudents(true);
      try {
        const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
        const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");
        const localOnly = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");

        let apiList = [];
        try {
          const res = await axios.get("/api/accounting.php?view=lookups");
          if (res.data?.data?.students) {
            apiList = res.data.data.students
              .filter(s => !deletedIds.includes(Number(s.id)) && !deletedIds.includes(String(s.id)))
              .map((s, i) => {
                const sid = s.id || i + 1;
                const override = customOverrides[sid];
                if (override) return override;

                const name = s.name || s.nama_lengkap || "Siswa";
                return {
                  id: s.nis || \`S-\${String(sid).padStart(3, "0")}\`,
                  rawId: sid,
                  nama: name,
                  nis: s.nis || \`S-\${String(sid).padStart(3, "0")}\`,
                  phone: s.no_wa && s.no_wa !== "-" ? s.no_wa : (s.kontak || s.phone || "0812-xxxx-xxxx"),
                  email: s.email && s.email !== "-" ? s.email : \`\${name.toLowerCase().replace(/\\s+/g, ".")}@gmail.com\`,
                  alamat: s.alamat ? \`\${s.alamat}, \${s.kota || "Cianjur"}\` : (s.kota || "Cianjur, Jawa Barat"),
                  status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
                  program: s.program || "Kelas Intensif Offline",
                  batch: s.batch ? (String(s.batch).toLowerCase().startsWith("Batch") ? s.batch : \`Batch \${s.batch}\`) : "Batch 2"
                };
              });
          }
        } catch (e) {
          console.warn("Lookups API fallback:", e);
        }

        const activeLocal = localOnly
          .filter(s => !deletedIds.includes(Number(s.id)) && !deletedIds.includes(String(s.id)))
          .map(s => ({
            id: s.nis || \`S-\${String(s.id).padStart(3, "0")}\`,
            rawId: s.id,
            nama: s.nama || s.name || "Siswa",
            nis: s.nis || \`S-\${String(s.id).padStart(3, "0")}\`,
            phone: s.kontak || s.phone || s.no_wa || "-",
            email: s.email || "-",
            alamat: s.alamat ? \`\${s.alamat}, \${s.kota || "Cianjur"}\` : "Cianjur, Jawa Barat",
            status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
            program: s.program || "Kelas Intensif Offline",
            batch: s.batch || "Batch 2"
          }));

        // Local newest first, then API students, then defaults
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
        }
      } catch (err) {
        console.error("Gagal sinkron siswa:", err);
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    fetchAllStudents();
    return () => { active = false; };
  }, [dataSiswa]);

  const candidateStudents = liveStudents;

  const handleSelectCandidateStudent = (st) => {
    setSelectedStudent(st);
    if (st.program) {
      setProgramInfo(prev => ({
        ...prev,
        program: st.program
      }));
    }
  };`;

content = content.replace(oldStudentInit, newStudentInit);

// Update onClick on student row to handleSelectCandidateStudent
content = content.replace(
  'onClick={() => setSelectedStudent(s)}',
  'onClick={() => handleSelectCandidateStudent(s)}'
);

// Update step 1 header with live indicator
const oldStep1Header = `<div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pilih Siswa / Customer</h3>
                  <p className="text-xs text-slate-400">Pilih dari database siswa atau ketik untuk mencari</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualStudent(!isManualStudent)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isManualStudent ? "Pilih dari Database" : "+ Input Siswa Baru"}
                </button>
              </div>`;

const newStep1Header = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">Pilih Siswa / Customer</h3>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Database Terkoneksi ({candidateStudents.length} Siswa)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Pilih siswa terbaru dari database atau ketik nama/NIS di pencarian</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualStudent(!isManualStudent)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  {isManualStudent ? "Pilih dari Database Siswa" : "Input Manual (Opsional)"}
                </button>
              </div>`;

content = content.replace(oldStep1Header, newStep1Header);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated BuatInvoiceWizardModal.jsx with auto-sync student data');
