const fs = require('fs');
const content = fs.readFileSync('src/pages/lms/LmsTugas.jsx', 'utf8');

let newContent = content;

// Update imports
const importTarget = `import { Search, Plus, Calendar, Clock, BookOpen, ChevronLeft, ChevronRight, MoreHorizontal, Filter, Eye } from "lucide-react";`;
const importReplacement = `import { Search, Plus, Calendar, Clock, BookOpen, ChevronLeft, ChevronRight, MoreHorizontal, Filter, Eye, X, Upload, CheckCircle, FileText, Link as LinkIcon } from "lucide-react";`;
newContent = newContent.replace(importTarget, importReplacement);


// Add state
const stateTarget = `  const [selectedEntries, setSelectedEntries] = useState(10);
  const [assignments, setAssignments] = useState([]);`;
const stateReplacement = `  const [selectedEntries, setSelectedEntries] = useState(10);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadType, setUploadType] = useState('file');
  const [fileUrl, setFileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);`;
newContent = newContent.replace(stateTarget, stateReplacement);

// Add handlers
const handlersReplacement = `  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    setUploadType('file');
    setFileUrl("");
    setShowSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Update task status locally
      const updatedTasks = assignments.map(a => 
        a.id === selectedTask.id 
          ? {...a, status: "Terkumpul", statusColor: "bg-blue-100 text-blue-600 before:bg-blue-500"} 
          : a
      );
      setAssignments(updatedTasks);
      
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    }, 1500);
  };
  
  useEffect(() => {`;
newContent = newContent.replace(/  useEffect\(\(\) => \{/, handlersReplacement);


// Update button
const buttonTarget = `<button className="flex items-center gap-1 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition">
                             Kumpul Tugas
                           </button>`;
const buttonReplacement = `<button onClick={() => handleOpenModal(item)} className="flex items-center gap-1 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition">
                             Kumpul Tugas
                           </button>`;
newContent = newContent.replace(buttonTarget, buttonReplacement);

// Append Modal before </Layout>
const modalMarkup = `      {/* Modal Kumpul Tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-[16px]">Kumpul Tugas</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {showSuccess ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-[18px] text-slate-800 mb-1">Berhasil Terkirim!</h4>
                <p className="text-[13px] text-slate-500 font-medium">Tugas "{selectedTask?.judul}" berhasil dikumpulkan ke Sensei.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5">
                <div className="mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 text-[14px] mb-1">{selectedTask?.judul}</h4>
                  <p className="text-[12px] font-medium text-blue-700/70 mb-3">{selectedTask?.subJudul}</p>
                  <div className="flex items-center gap-4 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-rose-600"><Clock className="w-3.5 h-3.5"/> Deadline: {selectedTask?.tenggatWaktu}</span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Metode Pengumpulan</label>
                  <div className="flex bg-slate-100/70 p-1 rounded-xl">
                    <button type="button" onClick={() => setUploadType('file')} className={\`flex-1 py-2 text-[12px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition \${uploadType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>
                      <Upload className="w-3.5 h-3.5"/> Upload File
                    </button>
                    <button type="button" onClick={() => setUploadType('link')} className={\`flex-1 py-2 text-[12px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition \${uploadType === 'link' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>
                      <LinkIcon className="w-3.5 h-3.5"/> Tautan Link
                    </button>
                  </div>
                </div>

                {uploadType === 'file' ? (
                  <div className="mb-6">
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Upload Dokumen</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer group">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-[13px] font-bold text-blue-600 mb-1">Klik untuk upload file</p>
                      <p className="text-[11px] font-medium text-slate-500">Maksimal ukuran file: 10MB (PDF, DOCX, JPG)</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Tautan Tugas (G-Drive / Link)</label>
                    <input 
                      type="url" 
                      required
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                    />
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Pesan Tambahan (Opsional)</label>
                  <textarea 
                    rows="2"
                    placeholder="Tulis pesan untuk Sensei jika ada..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">
                    Batal
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Mengirim...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Kumpulkan</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>`;
newContent = newContent.replace(`    </Layout>`, modalMarkup);

if (newContent === content) {
    console.log("No changes made. Match failed.");
} else {
    fs.writeFileSync('src/pages/lms/LmsTugas.jsx', newContent);
    console.log("Done");
}
