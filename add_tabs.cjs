const fs = require('fs');
const content = fs.readFileSync('src/pages/DashboardSiswaIntensif.jsx', 'utf8');

let newContent = content;

// Add state
const stateReplacement = `  const [stats, setStats] = useState({ totalSiswa: 0, hadir: 0, izin: 0, terlambat: 0 });
  const [activeTab, setActiveTab] = useState('agenda');`;
newContent = newContent.replace(/  const \[stats, setStats\] = useState\(\{ totalSiswa: 0, hadir: 0, izin: 0, terlambat: 0 \}\);/, stateReplacement);

// Tab buttons replacement
const tabsTarget = `<button className="px-4 py-5 border-b-[3px] border-blue-600 text-blue-600 font-bold text-[14px]">
                       Agenda Kelas & Materi
                     </button>
                     <button className="px-4 py-5 border-b-[3px] border-transparent text-slate-400 hover:text-slate-600 font-bold text-[14px] flex items-center gap-2">
                       Tugas yang Perlu Dikerjakan <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">2</span>
                     </button>`;

const tabsReplacement = `<button onClick={() => setActiveTab('agenda')} className={\`px-4 py-5 border-b-[3px] font-bold text-[14px] \${activeTab === 'agenda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}\`}>
                       Agenda Kelas & Materi
                     </button>
                     <button onClick={() => setActiveTab('tugas')} className={\`px-4 py-5 border-b-[3px] font-bold text-[14px] flex items-center gap-2 \${activeTab === 'tugas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}\`}>
                       Tugas yang Perlu Dikerjakan <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">{tugas.length}</span>
                     </button>`;
                     
newContent = newContent.replace(tabsTarget, tabsReplacement);


// Tab content replacement
const contentTarget = `<div className="p-6 sm:p-8 flex-1">
                   <div className="mb-6">
                     <h2 className="text-[18px] font-black text-slate-800 mb-1">Agenda Kelas Terkini</h2>
                     <p className="text-[13px] font-medium text-slate-500">Lihat materi dan jadwal yang telah disiapkan oleh Sensei</p>
                   </div>

                   {agenda.length > 0 ? (
                     <div className="grid grid-cols-1 gap-4">
                       {agenda.map(a => (
                         <div key={a.id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50 flex flex-col md:flex-row gap-5 items-start">
                           <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                             <Book className="w-6 h-6 text-blue-600"/>
                           </div>
                           <div className="flex-1 w-full">
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                               <div>
                                 <h3 className="font-black text-[15px] text-slate-800 mb-1">{a.judul}</h3>
                                 <p className="text-[13px] font-medium text-slate-500">{a.tanggal}</p>
                                 <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
                                   <CalendarIcon className="w-4 h-4"/>
                                   <span className="text-[11px] font-black uppercase tracking-wider">{a.hari}</span>
                                 </div>
                               </div>
                               
                               <div className="flex flex-col gap-2 text-[12px] font-medium text-slate-500 shrink-0">
                                 <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> {a.jam_mulai} - {a.jam_selesai}</div>
                                 <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> BAB 1 - BAB 2</div>
                                 <div className="flex items-start gap-2 mt-1">
                                   <User className="w-4 h-4 mt-0.5 shrink-0"/> 
                                   <div className="flex flex-col">
                                     <span className="text-[10px] uppercase font-bold text-slate-400">PENGAJAR (N5)</span>
                                     <span className="text-slate-700 font-bold">{sensei ? sensei.name : "Sensei Siti Nurhatifah S.Keb"}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="mt-5 pt-5 border-t border-slate-200">
                               <button className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-[12px] font-bold transition w-full sm:w-auto">
                                 <Download className="w-4 h-4"/> Download: {a.judul.split(" ")[0]} - Week 1.pdf
                               </button>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                       <p className="text-slate-500 font-medium text-[14px]">Belum ada agenda kelas dari Sensei.</p>
                     </div>
                   )}
                 </div>`;

const contentReplacement = `<div className="p-6 sm:p-8 flex-1">
                   {activeTab === 'agenda' ? (
                     <>
                       <div className="mb-6">
                         <h2 className="text-[18px] font-black text-slate-800 mb-1">Agenda Kelas Terkini</h2>
                         <p className="text-[13px] font-medium text-slate-500">Lihat materi dan jadwal yang telah disiapkan oleh Sensei</p>
                       </div>

                       {agenda.length > 0 ? (
                         <div className="grid grid-cols-1 gap-4">
                           {agenda.map(a => (
                             <div key={a.id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50 flex flex-col md:flex-row gap-5 items-start">
                               <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                 <Book className="w-6 h-6 text-blue-600"/>
                               </div>
                               <div className="flex-1 w-full">
                                 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                   <div>
                                     <h3 className="font-black text-[15px] text-slate-800 mb-1">{a.judul}</h3>
                                     <p className="text-[13px] font-medium text-slate-500">{a.tanggal}</p>
                                     <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
                                       <CalendarIcon className="w-4 h-4"/>
                                       <span className="text-[11px] font-black uppercase tracking-wider">{a.hari}</span>
                                     </div>
                                   </div>
                                   
                                   <div className="flex flex-col gap-2 text-[12px] font-medium text-slate-500 shrink-0">
                                     <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> {a.jam_mulai} - {a.jam_selesai}</div>
                                     <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> BAB 1 - BAB 2</div>
                                     <div className="flex items-start gap-2 mt-1">
                                       <User className="w-4 h-4 mt-0.5 shrink-0"/> 
                                       <div className="flex flex-col">
                                         <span className="text-[10px] uppercase font-bold text-slate-400">PENGAJAR (N5)</span>
                                         <span className="text-slate-700 font-bold">{sensei ? sensei.name : "Sensei Siti Nurhatifah S.Keb"}</span>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                                 
                                 <div className="mt-5 pt-5 border-t border-slate-200">
                                   <button className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-[12px] font-bold transition w-full sm:w-auto">
                                     <Download className="w-4 h-4"/> Download: {a.judul.split(" ")[0]} - Week 1.pdf
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                           <p className="text-slate-500 font-medium text-[14px]">Belum ada agenda kelas dari Sensei.</p>
                         </div>
                       )}
                     </>
                   ) : (
                     <>
                       <div className="mb-6">
                         <h2 className="text-[18px] font-black text-slate-800 mb-1">Tugas Mendatang</h2>
                         <p className="text-[13px] font-medium text-slate-500">Jangan sampai terlewat, kerjakan tugas-tugas berikut</p>
                       </div>
                       {tugas.length > 0 ? (
                         <div className="grid grid-cols-1 gap-4">
                           {tugas.map(t => (
                             <div key={t.id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50 flex flex-col md:flex-row gap-5 items-start">
                               <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                 <ClipboardList className="w-6 h-6 text-orange-600"/>
                               </div>
                               <div className="flex-1 w-full">
                                 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                       <h3 className="font-black text-[15px] text-slate-800 mb-1">{t.judul}</h3>
                                       <p className="text-[13px] font-medium text-slate-500">{t.deskripsi || "Tugas dari Sensei"}</p>
                                    </div>
                                    <div className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-700 shrink-0 h-max">
                                       <CalendarIcon className="w-4 h-4"/>
                                       <span className="text-[11px] font-black uppercase tracking-wider">Deadline: {t.deadline || "Belum ditentukan"}</span>
                                    </div>
                                 </div>
                                 <div className="mt-5 pt-5 border-t border-slate-200">
                                   <button onClick={() => navigate('/lms/tugas')} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-[12px] font-bold transition w-full sm:w-auto">
                                     Kumpul Tugas Sekarang
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                           <p className="text-slate-500 font-medium text-[14px]">Hore! Belum ada tugas dari Sensei saat ini.</p>
                         </div>
                       )}
                     </>
                   )}
                 </div>`;

newContent = newContent.replace(contentTarget, contentReplacement);

if (newContent === content) {
    console.log("No changes made. Match failed.");
} else {
    fs.writeFileSync('src/pages/DashboardSiswaIntensif.jsx', newContent);
    console.log("Done");
}
