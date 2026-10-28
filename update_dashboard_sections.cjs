const fs = require('fs');

let content = fs.readFileSync('src/pages/DashboardSensei.jsx', 'utf8');

// 1. We need to parse sensei_agenda_real and lpk_pengumuman in fetchData
const fetchDataTarget = `      const backendStats = resStats.data.data || {};
      setStats({ ...backendStats, total_siswa: actualTotalSiswa });
    } catch (error) {
      console.error("Failed to load data", error);
    }`;

const fetchDataReplacement = `      const backendStats = resStats.data.data || {};
      setStats({ ...backendStats, total_siswa: actualTotalSiswa });
      
      try {
         const savedAgenda = localStorage.getItem("sensei_agenda_real");
         if (savedAgenda) {
           setMeetings(JSON.parse(savedAgenda));
         }
      } catch(e) {}
      
      try {
         const savedPengumuman = localStorage.getItem("lpk_pengumuman");
         if (savedPengumuman) {
           // We will store it in tasks just to reuse state, or create a new state.
           // Actually, let's create a new state for pengumuman.
         }
      } catch(e) {}

    } catch (error) {
      console.error("Failed to load data", error);
    }`;

// Wait, I need to add state for `pengumuman` if I'm going to render it dynamically.
const stateTarget = `  const [stats, setStats] = useState(null);`;
const stateReplacement = `  const [stats, setStats] = useState(null);
  const [pengumuman, setPengumuman] = useState([]);`;
content = content.replace(stateTarget, stateReplacement);

const fetch2Target = `setStats({ ...backendStats, total_siswa: actualTotalSiswa });
    } catch (error) {`;
const fetch2Replacement = `setStats({ ...backendStats, total_siswa: actualTotalSiswa });

      try {
         const savedAgenda = localStorage.getItem("sensei_agenda_real");
         if (savedAgenda) {
           setMeetings(JSON.parse(savedAgenda));
         }
      } catch(e) {}
      
      try {
         const savedPengumuman = localStorage.getItem("lpk_pengumuman");
         if (savedPengumuman) {
           setPengumuman(JSON.parse(savedPengumuman));
         }
      } catch(e) {}
    } catch (error) {`;
content = content.replace(fetch2Target, fetch2Replacement);


// 2. Replace the Agenda and Pengumuman rendering block.
const agendaTarget = `<div className="flex-1 space-y-5 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Berlangsung</span>
                           <span className="text-[11px] font-bold text-slate-400">08:00 - 09:00</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800">Kelas Hiragana - Week 1</h4>
                        <p className="text-[12px] font-medium text-slate-500">Ruang A • 25 Siswa</p>
                     </div>
                  </div>

                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-amber-400 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Akan Datang</span>
                           <span className="text-[11px] font-bold text-slate-400">10:00 - 11:00</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800">Kelas Katakana - Week 2</h4>
                        <p className="text-[12px] font-medium text-slate-500">Ruang B • 20 Siswa</p>
                     </div>
                  </div>

                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-slate-300 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Belum Mulai</span>
                           <span className="text-[11px] font-bold text-slate-400">13:00 - 14:00</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800">Latihan Kanji Dasar</h4>
                        <p className="text-[12px] font-medium text-slate-500">Ruang C • 18 Siswa</p>
                     </div>
                  </div>
               </div>`;

const agendaReplacement = `<div className="flex-1 space-y-5 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {meetings.length === 0 ? (
                     <p className="text-center text-slate-400 font-bold mt-10">Belum ada agenda hari ini.</p>
                  ) : meetings.slice(0,4).map((m, i) => {
                     let statusStr = "Belum Mulai";
                     let statusColor = "bg-slate-300";
                     let badgeColor = "text-slate-500 bg-slate-100";
                     if (i === 0) {
                        statusStr = "Berlangsung";
                        statusColor = "bg-blue-500";
                        badgeColor = "text-blue-500 bg-blue-50";
                     } else if (i === 1) {
                        statusStr = "Akan Datang";
                        statusColor = "bg-amber-400";
                        badgeColor = "text-amber-500 bg-amber-50";
                     }

                     return (
                     <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className={\`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white \${statusColor} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2\`}></div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
                           <div className="flex items-center justify-between mb-1">
                              <span className={\`text-[11px] font-bold px-2 py-0.5 rounded \${badgeColor}\`}>{statusStr}</span>
                              <span className="text-[11px] font-bold text-slate-400">{m.jam_mulai || '00:00'} - {m.jam_selesai || '00:00'}</span>
                           </div>
                           <h4 className="text-sm font-black text-slate-800 line-clamp-1">{m.judul || m.title || 'Agenda'}</h4>
                           <p className="text-[12px] font-medium text-slate-500 line-clamp-1">{m.catatan || m.description || m.hari || 'Tidak ada catatan'}</p>
                        </div>
                     </div>
                     )
                  })}
               </div>`;
content = content.replace(agendaTarget, agendaReplacement);


const pengumumanTarget = `<div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex gap-4 items-start group hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Jadwal Ujian UKOM</h4>
                           <span className="text-[10px] font-bold text-slate-400">30 Sep 2026</span>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 line-clamp-1">Ujian UKOM akan dilaksanakan pada tanggal 15...</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex gap-4 items-start group hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-emerald-600" />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Pembagian Kelas Baru</h4>
                           <span className="text-[10px] font-bold text-slate-400">28 Sep 2026</span>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 line-clamp-1">Silakan cek pembagian kelas untuk semester ganjil...</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex gap-4 items-start group hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5 text-amber-600" />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Maintenance Sistem</h4>
                           <span className="text-[10px] font-bold text-slate-400">25 Sep 2026</span>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 line-clamp-1">Sistem akan mengalami maintenance pada tanggal...</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                  </div>
               </div>`;
               
const pengumumanReplacement = `<div className="flex flex-col gap-4">
                  {pengumuman.length === 0 ? (
                     <div className="text-center py-10">
                        <p className="text-slate-400 font-bold">Belum ada pengumuman.</p>
                     </div>
                  ) : pengumuman.slice(0, 3).map((p, i) => {
                     const icons = [FileText, Users, Wrench];
                     const colors = ["indigo", "emerald", "amber"];
                     const color = colors[i % colors.length];
                     const Icon = icons[i % icons.length];
                     return (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex gap-4 items-start group hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-pointer">
                           <div className={\`w-10 h-10 rounded-xl bg-\${color}-100 flex items-center justify-center shrink-0\`}>
                              <Icon className={\`w-5 h-5 text-\${color}-600\`} />
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                 <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{p.title || 'Pengumuman'}</h4>
                                 <span className="text-[10px] font-bold text-slate-400">{p.date || 'Hari ini'}</span>
                              </div>
                              <p className="text-[12px] font-medium text-slate-500 line-clamp-1">{p.content || '-'}</p>
                           </div>
                           <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                        </div>
                     );
                  })}
               </div>`;
content = content.replace(pengumumanTarget, pengumumanReplacement);

fs.writeFileSync('src/pages/DashboardSensei.jsx', content);
console.log("Done");
