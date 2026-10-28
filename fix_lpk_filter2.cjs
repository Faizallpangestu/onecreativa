const fs = require('fs');
let content = fs.readFileSync('src/pages/LpkIntensif.jsx', 'utf8');

// 1. Inject States
content = content.replace(
  'const [searchQuery, setSearchQuery] = useState("");',
  'const [searchQuery, setSearchQuery] = useState("");\n  const [filterLevel, setFilterLevel] = useState("Semua");\n  const [filterBatch, setFilterBatch] = useState("Semua");'
);

// 2. Inject Filter Logic
const filterRegex = /const filteredParticipants = participants\.filter\(\(p\) => \{[\s\S]*?return searchableText\.includes\(keyword\);\n\s*\}\);/;
const filterReplacement = `const filteredParticipants = participants.filter((p) => {
    const keyword = searchQuery.toLowerCase();
    const searchableText = [p.nama_lengkap, p.email, p.no_wa].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = searchableText.includes(keyword);
    
    const matchLevel = filterLevel === "Semua" || (p.level && p.level.toUpperCase() === filterLevel.toUpperCase());
    const matchBatch = filterBatch === "Semua" || (p.batch && p.batch.toUpperCase().replace(/\\s+/g, '') === filterBatch.toUpperCase().replace(/\\s+/g, ''));

    return matchSearch && matchLevel && matchBatch;
  });

  const availableLevels = ["Semua", ...new Set(participants.map(p => p.level?.toUpperCase()).filter(Boolean))];
  const availableBatches = ["Semua", ...new Set(participants.map(p => p.batch?.toUpperCase()).filter(Boolean))];`;
content = content.replace(filterRegex, filterReplacement);

// 3. Inject UI
const uiRegex = /<div className="relative">\s*<Search className="w-3\.5 h-3\.5 text-slate-400 absolute left-2\.5 top-1\/2 -translate-y-1\/2" \/>\s*<input\s*type="text"\s*value=\{searchQuery\}\s*onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*placeholder="Cari peserta\.\.\."[\s\S]*?<\/div>/;
const uiReplacement = `<div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <span className="text-slate-500 font-bold">Level:</span>
                    <select 
                      value={filterLevel} 
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 font-semibold outline-none focus:border-blue-400"
                    >
                      {availableLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <span className="text-slate-500 font-bold">Batch:</span>
                    <select 
                      value={filterBatch} 
                      onChange={(e) => setFilterBatch(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 font-semibold outline-none focus:border-blue-400"
                    >
                      {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama/email..."
                      className="border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-white text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-400 w-48" 
                    />
                  </div>
                </div>`;
content = content.replace(uiRegex, uiReplacement);

fs.writeFileSync('src/pages/LpkIntensif.jsx', content);
console.log("Done");
