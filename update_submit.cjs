const fs = require('fs');
const content = fs.readFileSync('src/pages/lms/LmsTugas.jsx', 'utf8');
let newContent = content;

// Helper to get current student ID
const getStudentIdHelper = `
  const getCurrentStudentId = () => {
    try {
      const users = JSON.parse(localStorage.getItem("lpk_users") || "[]");
      const siswa = users.find(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif');
      return siswa ? siswa.id : 1;
    } catch {
      return 1;
    }
  };
`;

// Modify useEffect to read grades
const useEffectTarget = `  useEffect(() => {
    const fetchData = () => {
      const fetchedTasks = JSON.parse(localStorage.getItem("sensei_tugas_real") || "[]");
      const mappedTasks = fetchedTasks.map((t, index) => {`;
const useEffectReplacement = `  useEffect(() => {
    const fetchData = () => {
      const fetchedTasks = JSON.parse(localStorage.getItem("sensei_tugas_real") || "[]");
      const allGrades = JSON.parse(localStorage.getItem("sensei_tugas_grades_real") || "{}");
      const studentId = getCurrentStudentId();

      const mappedTasks = fetchedTasks.map((t, index) => {
        const studentGrade = allGrades[t.id]?.[studentId];
        const isSubmitted = !!studentGrade;
`;
newContent = newContent.replace(useEffectTarget, getStudentIdHelper + useEffectReplacement);

// Modify status generation in useEffect
const statusTarget = `        let status = "Aktif";
        let statusColor = "bg-emerald-100 text-emerald-600 before:bg-emerald-500";
        
        // Randomize status just for display if needed, or based on deadline
        const today = new Date();
        const deadline = new Date(t.deadline);
        if (deadline < today) {
           status = "Terlambat";
           statusColor = "bg-rose-100 text-rose-600 before:bg-rose-500";
        }`;
const statusReplacement = `        let status = isSubmitted ? "Sudah Dikumpulkan" : "Aktif";
        let statusColor = isSubmitted ? "bg-blue-100 text-blue-600 before:bg-blue-500" : "bg-emerald-100 text-emerald-600 before:bg-emerald-500";
        
        const today = new Date();
        const deadline = new Date(t.deadline);
        if (!isSubmitted && deadline < today) {
           status = "Terlambat";
           statusColor = "bg-rose-100 text-rose-600 before:bg-rose-500";
        }`;
newContent = newContent.replace(statusTarget, statusReplacement);

// Add isSubmitted flag to task obj
const taskObjTarget = `          pengajar: t.senseiName || "Sensei",
          tglDiberikan: new Date(t.givenDate || Date.now()).toLocaleDateString('id-ID'),
          tenggatWaktu: t.deadline || "-",
          status: status,
          statusColor: statusColor,
        };
      });`;
const taskObjReplacement = `          pengajar: t.senseiName || "Sensei",
          tglDiberikan: new Date(t.givenDate || Date.now()).toLocaleDateString('id-ID'),
          tenggatWaktu: t.deadline || "-",
          status: status,
          statusColor: statusColor,
          isSubmitted: isSubmitted
        };
      });`;
newContent = newContent.replace(taskObjTarget, taskObjReplacement);


// Update Button UI
const buttonUITarget = `<button onClick={() => handleOpenModal(item)} className="flex items-center gap-1 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition">
                             Kumpul Tugas
                           </button>`;
const buttonUIReplacement = `{item.isSubmitted ? (
                             <button disabled className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg transition cursor-not-allowed">
                               <CheckCircle className="w-3.5 h-3.5" /> Terkumpul
                             </button>
                           ) : (
                             <button onClick={() => handleOpenModal(item)} className="flex items-center gap-1 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition">
                               Kumpul Tugas
                             </button>
                           )}`;
newContent = newContent.replace(buttonUITarget, buttonUIReplacement);


// Handle submit Logic
const handleSubmitTarget = `      // Update task status locally
      const updatedTasks = assignments.map(a => 
        a.id === selectedTask.id 
          ? {...a, status: "Terkumpul", statusColor: "bg-blue-100 text-blue-600 before:bg-blue-500"} 
          : a
      );
      setAssignments(updatedTasks);`;

const handleSubmitReplacement = `      // Update local storage
      const studentId = getCurrentStudentId();
      let allGrades = JSON.parse(localStorage.getItem("sensei_tugas_grades_real") || "{}");
      if (!allGrades[selectedTask.id]) {
        allGrades[selectedTask.id] = {};
      }
      
      const fileName = uploadType === 'file' && selectedFile ? selectedFile.name : 'link_tautan';
      allGrades[selectedTask.id][studentId] = {
        file: fileName,
        date: new Date().toISOString(),
        score: null // not graded yet
      };
      localStorage.setItem("sensei_tugas_grades_real", JSON.stringify(allGrades));

      // Update state to re-render without full reload
      const updatedTasks = assignments.map(a => 
        a.id === selectedTask.id 
          ? {...a, status: "Sudah Dikumpulkan", statusColor: "bg-blue-100 text-blue-600 before:bg-blue-500", isSubmitted: true} 
          : a
      );
      setAssignments(updatedTasks);`;
newContent = newContent.replace(handleSubmitTarget, handleSubmitReplacement);

fs.writeFileSync('src/pages/lms/LmsTugas.jsx', newContent);
console.log("Done");
