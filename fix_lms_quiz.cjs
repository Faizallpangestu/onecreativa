const fs = require('fs');

let content = fs.readFileSync('src/pages/lms/LmsQuiz.jsx', 'utf8');

// 1. Fix the weird encoded characters
content = content.replace(/A,\?\?\?" Lihat Lampiran Kuis/g, "Lihat Lampiran Kuis");
content = content.replace(/A,\?\?\?" Lihat Lampiran File/g, "Lihat Lampiran File");

// 2. Add Participant Count logic
const stateTarget = `const [sensei, setSensei] = useState(null);`;
const stateReplacement = `const [sensei, setSensei] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);`;
content = content.replace(stateTarget, stateReplacement);

const fetchTarget = `const instructors = JSON.parse(localStorage.getItem("lms_instructors") || "[]");`;
const fetchReplacement = `const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
      const validStudents = lpkUsers.filter(u => {
        const r = (u.role_name || u.role || "").toLowerCase();
        return r.includes('peserta_intensif') || r.includes('siswa');
      });
      setParticipantCount(validStudents.length > 0 ? validStudents.length : 1);
      
      const instructors = JSON.parse(localStorage.getItem("lms_instructors") || "[]");`;
content = content.replace(fetchTarget, fetchReplacement);

// 3. Redesign Hero Banner
// We need to replace the entire banner div.
// It starts with `<div className="w-full bg-[#004b87] text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">`
// We will replace it with a beautiful glassmorphism banner with the 3D image.

const heroRegex = /<div className="w-full bg-\[#004b87\] text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">[\s\S]*?<div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">[\s\S]*?<\/div>\s*<\/div>/;

const newHero = `<div className="w-full bg-[#0a192f] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10 mb-8 flex flex-col md:flex-row items-center gap-8 group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-[#0a192f] z-0"></div>
            <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/30 transition duration-700"></div>
            
            {/* 3D Image Content */}
            <div className="w-full md:w-1/3 relative z-10 flex justify-center md:justify-start">
               <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img src="/images/quiz_hero_3d.jpg" alt="3D Education Concept" className="w-full h-full object-cover object-center" />
               </div>
            </div>

            {/* Text Content */}
            <div className="w-full md:w-2/3 relative z-10 flex flex-col">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 text-sky-100 text-[12px] font-bold px-3 py-1.5 rounded-full w-fit mb-4 shadow-sm flex items-center gap-1.5">
                 <FileText className="w-3.5 h-3.5 text-blue-300" /> Kuis & Evaluasi Pembelajaran
               </div>
               
               <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200">
                 Kuis Intensif
               </h1>
               <p className="text-blue-200 text-[15px] mb-8 max-w-lg leading-relaxed">
                 Uji pemahaman Anda melalui kuis interaktif. Selesaikan tugas tepat waktu dan raih nilai terbaik di Kelas {(user?.branch || 'Cianjur').toUpperCase()}.
               </p>
               
               {/* Stats Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                 <div>
                   <p className="text-sky-200/70 text-[11px] uppercase tracking-wider font-bold mb-1">Kode Kelas</p>
                   <p className="font-bold text-[16px] text-white">{(user?.batch || 'Batch 2').toUpperCase()}</p>
                 </div>
                 <div className="md:col-span-1">
                   <p className="text-sky-200/70 text-[11px] uppercase tracking-wider font-bold mb-1">Dosen Pengajar</p>
                   <p className="font-bold text-[14px] text-white leading-tight">{sensei ? sensei.name : 'Belum Ditentukan'}</p>
                 </div>
                 <div>
                   <p className="text-sky-200/70 text-[11px] uppercase tracking-wider font-bold mb-1">Peserta</p>
                   <p className="font-bold text-[16px] text-white">{participantCount} Siswa</p>
                 </div>
                 <div>
                   <p className="text-sky-200/70 text-[11px] uppercase tracking-wider font-bold mb-1">Program</p>
                   <p className="font-bold text-[15px] text-white">Intensif Offline</p>
                 </div>
               </div>
            </div>
          </div>`;

content = content.replace(heroRegex, newHero);

fs.writeFileSync('src/pages/lms/LmsQuiz.jsx', content);
console.log("Done");
