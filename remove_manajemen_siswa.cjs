const fs = require('fs');
const content = fs.readFileSync('src/pages/AccessRightsLPK.jsx', 'utf8');

let newContent = content;

// 1. Add level and batch to form state
const formStateTarget = `  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_name: role ? role.toLowerCase() : "peserta_intensif",
  });`;
const formStateReplacement = `  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_name: role ? role.toLowerCase() : "peserta_intensif",
    level: "N5",
    batch: "BATCH 2"
  });`;
newContent = newContent.replace(formStateTarget, formStateReplacement);

// 2. Add local storage sync in handleSubmit
const submitTarget = `      if (form.id) {
        await axios.put(EMPLOYEES_API_URL, payload);
      } else {
        await axios.post(EMPLOYEES_API_URL, payload);
      }`;
const submitReplacement = `      let newId = form.id;
      if (form.id) {
        await axios.put(EMPLOYEES_API_URL, payload);
      } else {
        const res = await axios.post(EMPLOYEES_API_URL, payload);
        newId = res.data?.id || Date.now();
      }

      // Sync to local storage for lpk_users (for legacy dashboard usage)
      if (form.role_name === 'peserta_intensif') {
        let lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
        const existingIndex = lpkUsers.findIndex(u => u.email === form.email || u.id === form.id);
        const lpkPayload = {
          id: newId || form.id || Date.now(),
          name: form.name,
          email: form.email,
          role: "peserta_intensif",
          level: form.level || "N5",
          batch: form.batch || "BATCH 2"
        };
        if (existingIndex >= 0) {
          lpkUsers[existingIndex] = { ...lpkUsers[existingIndex], ...lpkPayload };
        } else {
          lpkUsers.push(lpkPayload);
        }
        localStorage.setItem("lpk_users", JSON.stringify(lpkUsers));
      }`;
newContent = newContent.replace(submitTarget, submitReplacement);

// Reset form
const resetTarget = `      setForm({ id: null, name: "", email: "", password: "", role_name: role ? role.toLowerCase() : "peserta_intensif" });`;
const resetReplacement = `      setForm({ id: null, name: "", email: "", password: "", role_name: role ? role.toLowerCase() : "peserta_intensif", level: "N5", batch: "BATCH 2" });`;
newContent = newContent.replace(resetTarget, resetReplacement);

// Handle Edit
const editTarget = `  const handleEdit = (u) => {
    setForm({
      id: u.id,
      nik: u.nik,
      name: u.name,
      email: u.email,
      password: "",`;
const editReplacement = `  const handleEdit = (u) => {
    // try fetching level and batch from local storage if exists
    let lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    let lpkUser = lpkUsers.find(lu => lu.email === u.email) || {};

    setForm({
      id: u.id,
      nik: u.nik,
      name: u.name,
      email: u.email,
      password: "",
      level: lpkUser.level || "N5",
      batch: lpkUser.batch || "BATCH 2",`;
newContent = newContent.replace(editTarget, editReplacement);

// Update UI
const uiTarget = `                  <label className="block mb-2">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Password</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={form.id ? "Kosongkan jika tidak diubah" : "Password rahasia"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 pl-11 pr-4 text-[14px] font-mono font-bold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                  </label>`;
const uiReplacement = `                  <label className="block mb-2">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Password</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={form.id ? "Kosongkan jika tidak diubah" : "Password rahasia"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 pl-11 pr-4 text-[14px] font-mono font-bold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                  </label>

                  {form.role_name === 'peserta_intensif' && (
                    <div className="flex gap-4">
                      <label className="block flex-1">
                        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Level</span>
                        <select
                          value={form.level}
                          onChange={(e) => setForm({ ...form, level: e.target.value })}
                          className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                        >
                          <option value="N5">N5</option>
                          <option value="N4">N4</option>
                          <option value="N3">N3</option>
                        </select>
                      </label>
                      <label className="block flex-1">
                        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Batch</span>
                        <select
                          value={form.batch}
                          onChange={(e) => setForm({ ...form, batch: e.target.value })}
                          className="h-12 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-indigo-400"
                        >
                          <option value="BATCH 1">BATCH 1</option>
                          <option value="BATCH 2">BATCH 2</option>
                          <option value="BATCH 3">BATCH 3</option>
                          <option value="BATCH 4">BATCH 4</option>
                        </select>
                      </label>
                    </div>
                  )}`;
newContent = newContent.replace(uiTarget, uiReplacement);

if (newContent === content) {
    console.log("No changes made. Match failed.");
} else {
    fs.writeFileSync('src/pages/AccessRightsLPK.jsx', newContent);
    console.log("Done AccessRightsLPK.jsx");
}

// 3. Remove "Manajemen Siswa" from Sidebar
const sidebarContent = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
const sidebarNewContent = sidebarContent.replace(/\{ label: "Manajemen Siswa", path: "\/lpk-intensif" \},\n?/, "");
if (sidebarNewContent !== sidebarContent) {
    fs.writeFileSync('src/components/Sidebar.jsx', sidebarNewContent);
    console.log("Done Sidebar.jsx");
}
