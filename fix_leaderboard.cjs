const fs = require('fs');

let content = fs.readFileSync('src/pages/sensei/SenseiLeaderboard.jsx', 'utf8');

// 1. Update totalPoin calculation
const logicTarget = `const ukom = Number(existing.ukom || 0);
            const hadir = 100; // Mock presence
            const totalPoin = avgTugas + avgQuiz + ukom; // Example total points logic

            return {
              id: apiS.id,
              nama: apiS.nama_lengkap,
              tugas: avgTugas,
              quiz: avgQuiz,
              ukom: ukom,
              hadir: hadir,
              totalPoin: totalPoin
            };`;
const logicReplacement = `const ukom = Number(existing.ukom || 0);
            const kaiwa = Number(existing.kaiwa || 0);
            const sikap = Number(existing.sikap || 0);
            const attitude = Number(existing.attitude || 0);
            const hadir = 100; // Mock presence
            const totalPoin = avgTugas + avgQuiz + kaiwa + ukom + sikap + attitude; // Example total points logic

            return {
              id: apiS.id,
              nama: apiS.nama_lengkap,
              tugas: avgTugas,
              quiz: avgQuiz,
              kaiwa: kaiwa,
              ukom: ukom,
              sikap: sikap,
              attitude: attitude,
              hadir: hadir,
              totalPoin: totalPoin
            };`;
content = content.replace(logicTarget, logicReplacement);

// 2. Update Table Headers
const theadTarget = `<th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Tugas</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Quiz</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">UKOM</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Hadir</th>`;
const theadReplacement = `<th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Tugas</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Quiz</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Kaiwa</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">UKOM</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Sikap</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Attitude</th>
                          <th className="text-center px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Hadir</th>`;
content = content.replace(theadTarget, theadReplacement);

// 3. Update Table Cells
const tbodyTarget = `<td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.tugas}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.quiz}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.ukom}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.hadir}%</td>`;
const tbodyReplacement = `<td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.tugas}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.quiz}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.kaiwa}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.ukom}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.sikap}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.attitude}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{s.hadir}%</td>`;
content = content.replace(tbodyTarget, tbodyReplacement);

fs.writeFileSync('src/pages/sensei/SenseiLeaderboard.jsx', content);
console.log("Done");
