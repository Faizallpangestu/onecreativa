const fs = require('fs');
const content = fs.readFileSync('src/pages/DashboardSiswaIntensif.jsx', 'utf8');

const startMarker = '{/* DESKTOP LAYOUT (Hidden on mobile) */}';
const endMarker = '        </div>\n      </div>\n    </Layout>'; 

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found");
  console.log("Start:", startIndex, "End:", endIndex);
  process.exit(1);
}

const newDesktopBlock = `          {/* DESKTOP LAYOUT (Hidden on mobile) */}
          <div className="hidden md:block max-w-[1400px] mx-auto pb-12">
            
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-sm mb-6 bg-blue-50/80 min-h-[180px] flex items-center">
              {/* Background Image Container */}
              <div className="absolute inset-0 pointer-events-none">
                <img src="/assets/anime_student_banner.jpg" alt="Banner Background" className="w-full h-full object-cover object-center opacity-100" style={{maskImage:"linear-gradient(to right, black 50%, transparent 100%)",WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 50%, black 100%)"}}/>
              </div>
              
              <div className="relative z-10 px-8 sm:px-10 py-8 flex flex-col md:flex-row items-center justify-between w-full">
                <div className="flex-1 w-full text-left max-w-lg bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-white">
                  <h1 className="text-3xl sm:text-[2rem] font-black text-[#0c2e59] leading-tight mb-2">Selamat Datang, <span className="text-blue-600">{user?.name?.split(" ")[0] || "Siswa"}!</span></h1>
                  <p className="text-[#0c2e59]/80 text-[15px] font-semibold">Terus semangat belajar untuk mencapai impian ke Jepang. 🇯🇵</p>
                </div>
                
                <div className="w-full md:w-auto mt-6 md:mt-0 flex flex-col gap-3 shrink-0">
                  <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{new Date().toLocaleDateString("id-ID",{weekday:"long"})}</p>
                      <p className="text-slate-800 font-bold text-[14px]">{new Date().getDate()} {new Date().toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</p>
                    </div>
                  </div>
                  <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-3.5 text-[14px] font-bold flex items-center justify-center gap-2 transition shadow-sm">
                     <RefreshCcw className="w-4 h-4"/> Refresh Data
                  </button>
                </div>
              </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-emerald-600"/>
                </div>
                <div>
                  <p className="text-emerald-700 text-[12px] font-bold">Total Siswa</p>
                  <p className="text-emerald-900 font-black text-2xl">48</p>
                  <p className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">↑ +12% dari bulan lalu</p>
                </div>
              </div>
              <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-blue-600"/>
                </div>
                <div>
                  <p className="text-blue-700 text-[12px] font-bold">Hadir Hari Ini</p>
                  <p className="text-blue-900 font-black text-2xl">36</p>
                  <p className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">↑ +8% dari bulan lalu</p>
                </div>
              </div>
              <div className="bg-orange-50/50 rounded-3xl p-5 border border-orange-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-orange-500"/>
                </div>
                <div>
                  <p className="text-orange-700 text-[12px] font-bold">Izin / Cuti</p>
                  <p className="text-orange-900 font-black text-2xl">5</p>
                  <p className="text-orange-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">↓ -2% dari bulan lalu</p>
                </div>
              </div>
              <div className="bg-rose-50/50 rounded-3xl p-5 border border-rose-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-500"/>
                </div>
                <div>
                  <p className="text-rose-700 text-[12px] font-bold">Terlambat</p>
                  <p className="text-rose-900 font-black text-2xl">7</p>
                  <p className="text-rose-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">↑ +1% dari bulan lalu</p>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT ROW */}
            <div className="flex gap-6">
              
              {/* LEFT: CALENDAR */}
              <div className="w-[360px] shrink-0 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="font-black text-[16px] text-slate-800 flex items-center gap-2">Jadwal Minggu Ini <Maximize2 className="w-3.5 h-3.5 text-slate-400 cursor-pointer"/></h2>
                   <span className="text-[12px] text-slate-500 font-bold flex items-center gap-1 cursor-pointer hover:text-slate-800"><ChevronLeft className="w-3.5 h-3.5"/> September 2026 <ChevronRight className="w-3.5 h-3.5"/></span>
                 </div>
                 
                 <div className="flex justify-between items-center text-center mb-6">
                   {weekDays.map((d, i) => {
                     const dateStr = \`2026-09-\${d.date.toString().padStart(2, '0')}\`;
                     const hasEvent = agenda.some(a => a.tanggal === dateStr);
                     return (
                       <div key={i} onClick={() => setSelectedDate(d.date)} className="flex flex-col items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 transition-transform relative">
                         <span className={\`text-[12px] font-bold uppercase tracking-wider \${selectedDate === d.date ? 'text-blue-600' : 'text-slate-400'}\`}>{d.day}</span>
                         <span className={\`text-[15px] font-black \${selectedDate === d.date ? 'text-white bg-blue-600 w-10 h-10 flex items-center justify-center rounded-full shadow-md' : 'text-slate-700'}\`}>
                           {d.date}
                         </span>
                         {hasEvent ? <div className={\`absolute -bottom-2 w-1.5 h-1.5 \${selectedDate === d.date ? 'bg-blue-600' : 'bg-slate-300'} rounded-full\`}></div> : null}
                       </div>
                     )
                   })}
                 </div>

                 <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center text-center mt-2">
                   {selectedEvent ? (
                      <div className="w-full flex flex-col text-left animate-in fade-in">
                        <h3 className="font-bold text-[14px] text-blue-900 mb-3">{selectedEvent.title}</h3>
                        <div className="flex flex-col gap-2 text-[12px] font-medium text-blue-700 flex-wrap">
                          <span className="flex items-center gap-2"><Book className="w-4 h-4 opacity-70"/> {selectedEvent.session}</span>
                          <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 opacity-70"/> {selectedEvent.time}</span>
                          {selectedEvent.notes && <span className="flex items-start gap-2 italic"><FileText className="w-4 h-4 opacity-70 shrink-0"/> {selectedEvent.notes}</span>}
                        </div>
                      </div>
                   ) : (
                     <div className="flex flex-col items-center">
                       <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" strokeWidth={1.5}/>
                       <p className="text-[14px] font-bold text-slate-600 mb-1">Tidak ada jadwal pada tanggal ini</p>
                       <p className="text-[12px] font-medium text-slate-400">Nikmati waktu luangmu atau kerjakan tugas lainnya.</p>
                     </div>
                   )}
                 </div>
              </div>

              {/* RIGHT: AGENDA / TUGAS */}
              <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between border-b border-slate-100 px-2 sm:px-6">
                   <div className="flex items-center gap-2">
                     <button className="px-4 py-5 border-b-[3px] border-blue-600 text-blue-600 font-bold text-[14px]">
                       Agenda Kelas & Materi
                     </button>
                     <button className="px-4 py-5 border-b-[3px] border-transparent text-slate-400 hover:text-slate-600 font-bold text-[14px] flex items-center gap-2">
                       Tugas yang Perlu Dikerjakan <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">2</span>
                     </button>
                   </div>
                   <button className="hidden sm:flex text-[13px] font-bold text-blue-600 items-center gap-1 hover:text-blue-700">Lihat Semua →</button>
                 </div>
                 
                 <div className="p-6 sm:p-8 flex-1">
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
                 </div>
              </div>
              
            </div>
          </div>
\n`;

const finalContent = content.substring(0, startIndex) + newDesktopBlock + content.substring(endIndex);
fs.writeFileSync('src/pages/DashboardSiswaIntensif.jsx', finalContent);
console.log("Done");
