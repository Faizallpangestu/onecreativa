const fs = require('fs');
let content = fs.readFileSync('src/pages/sensei/SenseiQuiz.jsx', 'utf8');

const target = `<td className="py-4 px-6">
                            {hasSubmitted ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                  <CheckCircle className="w-3 h-3" /> Telah Mengerjakan
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-slate-400">Tanggal: {submission.date}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Belum Mengerjakan
                              </span>
                            )}
                          </td>`;

const replacement = `<td className="py-4 px-6">
                            {hasSubmitted ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 mb-1">
                                  <CheckCircle className="w-3 h-3" /> Telah Mengerjakan
                                </span>
                                
                                {submission.text && (
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 mb-1">
                                    <span className="font-bold text-slate-500 block mb-1">Jawaban Teks:</span>
                                    {submission.text}
                                  </div>
                                )}
                                
                                {submission.link && (
                                  <a href={submission.link.startsWith('http') ? submission.link : 'https://'+submission.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:underline w-fit">
                                    <LinkIcon className="w-3.5 h-3.5" /> Lihat Lampiran Tautan
                                  </a>
                                )}
                                
                                {submission.file && (
                                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 w-fit cursor-pointer hover:underline" onClick={() => alert("Mengunduh file: " + submission.file)}>
                                    <FileText className="w-3.5 h-3.5" /> Unduh Lampiran Kuis
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-slate-400">Tanggal: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('id-ID') : (submission.date || '-')}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Belum Mengerjakan
                              </span>
                            )}
                          </td>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/sensei/SenseiQuiz.jsx', content);
console.log("Done");
