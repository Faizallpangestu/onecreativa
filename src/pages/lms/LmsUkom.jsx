import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Check, 
  CheckCircle,
  Flag,
  Eraser,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import examAppleImg from '../../assets/exam_apple.jpg';
import examStudentStudyImg from '../../assets/exam_student_study.jpg';

export default function LmsUkom() {
  // Current active question (starts at 13 matching the reference mockup)
  const [currentQuestion, setCurrentQuestion] = useState(13);

  // Initial answers matching reference: 12 answered out of 40 (30% progress)
  const [answers, setAnswers] = useState({
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'A',
    5: 'D',
    6: 'B',
    7: 'C',
    9: 'A',
    10: 'B',
    11: 'D',
    12: 'C',
    13: 'B' // りんごです。
  });

  // Flagged questions (ragu-ragu)
  const [flagged, setFlagged] = useState({
    13: true
  });

  // Countdown timer: 00:58:32
  const [timeLeft, setTimeLeft] = useState(58 * 60 + 32);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Comprehensive 40 Questions Database (JLPT N5 Standard)
  const questionsData = useMemo(() => {
    return [
      {
        id: 1,
        question: '「あさ」の かんじは どれですか。',
        translation: 'Manakah kanji yang tepat untuk kosakata "asa" (pagi)?',
        options: [
          { key: 'A', text: '朝', label: 'Asa (Pagi)' },
          { key: 'B', text: '昼', label: 'Hiru (Siang)' },
          { key: 'C', text: '夜', label: 'Yoru (Malam)' },
          { key: 'D', text: '夕', label: 'Yuu (Sore)' }
        ],
        correct: 'A'
      },
      {
        id: 2,
        question: 'わたし（　）がくせいです。',
        translation: 'Pilihlah partikel yang tepat untuk melengkapi kalimat tersebut.',
        options: [
          { key: 'A', text: 'を (wo)', label: 'Partikel penanda objek' },
          { key: 'B', text: 'は (wa)', label: 'Partikel penanda topik kalimat' },
          { key: 'C', text: 'に (ni)', label: 'Partikel penanda waktu / tujuan' },
          { key: 'D', text: 'で (de)', label: 'Partikel penanda tempat aktivitas' }
        ],
        correct: 'B'
      },
      {
        id: 3,
        question: '「ほん」の いみは どれですか。',
        translation: 'Apakah arti dari kosakata "hon" dalam bahasa Indonesia?',
        options: [
          { key: 'A', text: 'Pensil (えんぴつ)', label: 'Enpitsu' },
          { key: 'B', text: 'Tas (かばん)', label: 'Kaban' },
          { key: 'C', text: 'Buku (本)', label: 'Hon' },
          { key: 'D', text: 'Kamus (じしょ)', label: 'Jisho' }
        ],
        correct: 'C'
      },
      {
        id: 4,
        question: 'きょうは なんようび（　）ですか。',
        translation: 'Hari ini hari apa? (Lengkapi dengan partikel yang tepat)',
        options: [
          { key: 'A', text: '（なし）/ Tanpa partikel', label: 'Langsung ですか' },
          { key: 'B', text: 'は (wa)', label: 'Topik' },
          { key: 'C', text: 'の (no)', label: 'Kepemilikan' },
          { key: 'D', text: 'に (ni)', label: 'Waktu' }
        ],
        correct: 'A'
      },
      {
        id: 5,
        question: 'いま なんじ（　）ですか。',
        translation: 'Sekarang jam berapa?',
        options: [
          { key: 'A', text: 'でした', label: 'Bentuk lampau' },
          { key: 'B', text: 'ます', label: 'Kata kerja' },
          { key: 'C', text: 'でしたか', label: 'Tanya lampau' },
          { key: 'D', text: 'です', label: 'Bentuk sopan masa kini' }
        ],
        correct: 'D'
      },
      {
        id: 6,
        question: 'ともだち（　）にほんへ いきます。',
        translation: 'Pergi ke Jepang bersama teman. Partikel "bersama" adalah...',
        options: [
          { key: 'A', text: 'を (wo)', label: 'Objek' },
          { key: 'B', text: 'と (to)', label: 'Bersama dengan' },
          { key: 'C', text: 'へ (he)', label: 'Arah tujuan' },
          { key: 'D', text: 'から (kara)', label: 'Dari' }
        ],
        correct: 'B'
      },
      {
        id: 7,
        question: 'これは わたしの（　）です。',
        translation: 'Ini adalah ... milik saya.',
        options: [
          { key: 'A', text: 'みず (Air)', label: 'Mizu' },
          { key: 'B', text: 'ごはん (Nasi)', label: 'Gohan' },
          { key: 'C', text: 'かさ (Payung)', label: 'Kasa' },
          { key: 'D', text: 'そら (Langit)', label: 'Sora' }
        ],
        correct: 'C'
      },
      {
        id: 8,
        question: 'せんせいは きょうしつ（　）います。',
        translation: 'Guru berada di dalam ruang kelas. (Penanda keberadaan orang)',
        options: [
          { key: 'A', text: 'に (ni)', label: 'Keberadaan subjek hidup' },
          { key: 'B', text: 'で (de)', label: 'Tempat aktivitas' },
          { key: 'C', text: 'を (wo)', label: 'Objek' },
          { key: 'D', text: 'へ (he)', label: 'Arah' }
        ],
        correct: 'A'
      },
      {
        id: 9,
        question: 'きのう テレビを（　）。',
        translation: 'Kemarin saya menonton televisi. (Bentuk lampau positif)',
        options: [
          { key: 'A', text: 'みました (Mimashita)', label: 'Sudah menonton' },
          { key: 'B', text: 'みます (Mimasu)', label: 'Akan menonton' },
          { key: 'C', text: 'みません (Mimasen)', label: 'Tidak menonton' },
          { key: 'D', text: 'みませんでした (Mimasendeshita)', label: 'Tidak menonton (lampau)' }
        ],
        correct: 'A'
      },
      {
        id: 10,
        question: '「ありがとう」の へんじは どれですか。',
        translation: 'Respon sopan untuk ungkapan terima kasih "Arigatou" adalah...',
        options: [
          { key: 'A', text: 'おはようございます', label: 'Selamat pagi' },
          { key: 'B', text: 'どういたしまして', label: 'Sama-sama' },
          { key: 'C', text: 'さようなら', label: 'Selamat tinggal' },
          { key: 'D', text: 'いただきます', label: 'Selamat makan' }
        ],
        correct: 'B'
      },
      {
        id: 11,
        question: 'あした とうきょう（　）いきます。',
        translation: 'Besok akan pergi ke Tokyo. (Partikel penanda arah tujuan)',
        options: [
          { key: 'A', text: 'を (wo)', label: 'Objek' },
          { key: 'B', text: 'が (ga)', label: 'Subjek penegas' },
          { key: 'C', text: 'で (de)', label: 'Alat/transportasi' },
          { key: 'D', text: 'へ (he/e)', label: 'Arah tujuan pergi' }
        ],
        correct: 'D'
      },
      {
        id: 12,
        question: 'この りょうりは とても（　）です。',
        translation: 'Masakan ini sangat lezat/enak.',
        options: [
          { key: 'A', text: 'たかい (Mahal)', label: 'Takai' },
          { key: 'B', text: 'おもい (Berat)', label: 'Omoi' },
          { key: 'C', text: 'おいしい (Lezat)', label: 'Oishii' },
          { key: 'D', text: 'あかい (Merah)', label: 'Akai' }
        ],
        correct: 'C'
      },
      {
        id: 13,
        question: 'これは なんですか。',
        translation: 'Benda apakah ini?',
        hasImage: true,
        image: examAppleImg,
        options: [
          { key: 'A', text: 'みかんです。', label: 'Jeruk' },
          { key: 'B', text: 'りんごです。', label: 'Apel' },
          { key: 'C', text: 'いちごです。', label: 'Stroberi' },
          { key: 'D', text: 'ぶどうです。', label: 'Anggur' }
        ],
        correct: 'B'
      },
      {
        id: 14,
        question: 'えきまで バス（　）いきます。',
        translation: 'Pergi sampai stasiun menggunakan bus. (Alat transportasi)',
        options: [
          { key: 'A', text: 'で (de)', label: 'Naik/menggunakan kendaraan' },
          { key: 'B', text: 'に (ni)', label: 'Titik tujuan' },
          { key: 'C', text: 'を (wo)', label: 'Objek' },
          { key: 'D', text: 'と (to)', label: 'Bersama' }
        ],
        correct: 'A'
      },
      {
        id: 15,
        question: '「みず」の かんじは どれですか。',
        translation: 'Manakah kanji yang berarti "mizu" (air)?',
        options: [
          { key: 'A', text: '木', label: 'Ki (Pohon)' },
          { key: 'B', text: '水', label: 'Mizu (Air)' },
          { key: 'C', text: '火', label: 'Hi (Api)' },
          { key: 'D', text: '金', label: 'Kane (Uang/Emas)' }
        ],
        correct: 'B'
      },
      {
        id: 16,
        question: 'やすみは （　）ようびと にちようびです。',
        translation: 'Hari libur adalah hari Sabtu dan hari Minggu.',
        options: [
          { key: 'A', text: 'ど (Do)', label: 'Doyoubi (Sabtu)' },
          { key: 'B', text: 'げつ (Getsu)', label: 'Getsuyoubi (Senin)' },
          { key: 'C', text: 'か (Ka)', label: 'Kayoubi (Selasa)' },
          { key: 'D', text: 'すい (Sui)', label: 'Suiyoubi (Rabu)' }
        ],
        correct: 'A'
      },
      {
        id: 17,
        question: 'つくえの （　）に ほんが あります。',
        translation: 'Di atas meja terdapat buku.',
        options: [
          { key: 'A', text: 'した (Bawah)', label: 'Shita' },
          { key: 'B', text: 'うえ (Atas)', label: 'Ue' },
          { key: 'C', text: 'なか (Dalam)', label: 'Naka' },
          { key: 'D', text: 'うしろ (Belakang)', label: 'Ushiro' }
        ],
        correct: 'B'
      },
      {
        id: 18,
        question: 'パンを （　）ました。',
        translation: 'Saya telah makan roti.',
        options: [
          { key: 'A', text: 'たべ (Tabe)', label: 'Tabemashita (Makan)' },
          { key: 'B', text: 'のみ (Nomi)', label: 'Nomimashita (Minum)' },
          { key: 'C', text: 'かき (Kaki)', label: 'Kakimashita (Menulis)' },
          { key: 'D', text: 'きき (Kiki)', label: 'Kikimashita (Mendengar)' }
        ],
        correct: 'A'
      },
      {
        id: 19,
        question: 'にほんごの べんきょうは （　）ですか。',
        translation: 'Bagaimana pelajaran bahasa Jepang? (Menanyakan kesan/keadaan)',
        options: [
          { key: 'A', text: 'どう (Dou)', label: 'Bagaimana' },
          { key: 'B', text: 'だれ (Dare)', label: 'Siapa' },
          { key: 'C', text: 'どこ (Doko)', label: 'Di mana' },
          { key: 'D', text: 'いつ (Itsu)', label: 'Kapan' }
        ],
        correct: 'A'
      },
      {
        id: 20,
        question: 'コーヒーを （　）ます。',
        translation: 'Saya meminum kopi.',
        options: [
          { key: 'A', text: 'たべ (Makan)', label: 'Tabemasu' },
          { key: 'B', text: 'のみ (Minum)', label: 'Nomimasu' },
          { key: 'C', text: 'かい (Membeli)', label: 'Kaimasu' },
          { key: 'D', text: 'み (Melihat)', label: 'Mimasu' }
        ],
        correct: 'B'
      },
      ...Array.from({ length: 20 }, (_, idx) => {
        const id = idx + 21;
        return {
          id: id,
          question: `Soal ${id}: つぎの ぶんの （　）に なにを いれますか。`,
          translation: `Pilihlah jawaban yang paling tepat untuk melengkapi kalimat nomor ${id}.`,
          hasImage: false,
          options: [
            { key: 'A', text: `Pilihan A untuk soal nomor ${id}`, label: 'Opsi A' },
            { key: 'B', text: `Pilihan B untuk soal nomor ${id}`, label: 'Opsi B' },
            { key: 'C', text: `Pilihan C untuk soal nomor ${id}`, label: 'Opsi C' },
            { key: 'D', text: `Pilihan D untuk soal nomor ${id}`, label: 'Opsi D' }
          ],
          correct: 'B'
        };
      })
    ];
  }, []);

  const currentQData = questionsData.find(q => q.id === currentQuestion) || questionsData[0];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / 40) * 100);

  const handleSelectAnswer = (optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionKey
    }));
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion]
    }));
  };

  const handleClearAnswer = () => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQuestion];
      return copy;
    });
  };

  const handleSubmitExam = () => {
    const unAnsweredCount = 40 - Object.keys(answers).length;
    const flaggedCount = Object.values(flagged).filter(Boolean).length;

    Swal.fire({
      title: 'Kumpulkan Ujian Sekarang?',
      html: `
        <div class="text-left text-sm space-y-2 mt-2">
          <p class="text-slate-600">Pastikan Anda telah memeriksa seluruh jawaban sebelum mengumpulkan:</p>
          <div class="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-200">
            <div class="flex justify-between text-slate-700"><span>Total Soal:</span> <b>40 Soal</b></div>
            <div class="flex justify-between text-emerald-600"><span>Sudah Dijawab:</span> <b>${answeredCount} Soal</b></div>
            <div class="flex justify-between text-amber-600"><span>Ditandai Ragu-ragu:</span> <b>${flaggedCount} Soal</b></div>
            <div class="flex justify-between text-rose-600"><span>Belum Dijawab:</span> <b>${unAnsweredCount} Soal</b></div>
          </div>
        </div>
      `,
      icon: unAnsweredCount > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kumpulkan Ujian',
      cancelButtonText: 'Periksa Kembali',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      customClass: {
        popup: 'rounded-3xl'
      }
    }).then((res) => {
      if (res.isConfirmed) {
        let score = 0;
        questionsData.forEach(q => {
          if (answers[q.id] === q.correct) score += 2.5;
        });
        const finalScore = Math.round(score);

        Swal.fire({
          title: '🎉 Ujian Selesai Dikumpulkan!',
          html: `
            <div class="text-center py-2">
              <div class="text-5xl font-black text-blue-600 my-3">${finalScore}</div>
              <p class="text-sm font-semibold text-slate-700">Ujian Kompetensi N5 - Bab 2</p>
              <p class="text-xs text-slate-500 mt-1">Status: <span class="text-emerald-600 font-bold">${finalScore >= 70 ? 'LULUS (Memenuhi Standar)' : 'PERLU REMEDIAL'}</span></p>
              <div class="mt-4 p-3 bg-blue-50/70 rounded-2xl text-xs text-blue-800 border border-blue-200">
                Nilai dan rekap jawaban telah tersimpan ke database nilai LMS Creativa.
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Tutup',
          confirmButtonColor: '#2563eb',
          customClass: {
            popup: 'rounded-3xl'
          }
        });
      }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER BANNER SISWA (EXACT 1:1 WITH REFERENCE MOCKUP) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-white border-b border-slate-200/80 px-4 md:px-8 py-5 overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-[450px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span>Ujian Kompetensi</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">N5 - Bab 2</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Ujian Kompetensi N5 - Bab 2
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Kerjakan soal dengan teliti dan jujur.
              </p>
            </div>

            {/* Right: Sisa Waktu Timer Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-red-50/90 border border-red-200 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-red-500">
                    Sisa Waktu
                  </div>
                  <div className="text-xl font-black text-red-600 tracking-wider font-mono">
                    {formatTimer(timeLeft)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY AREA (SISWA CBT EXAM) */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6 space-y-6">
          
          {/* Progress Pengerjaan Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Progress Pengerjaan</span>
              <span className="text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1.5">
              {answeredCount} dari 40 soal
            </div>
          </div>

          {/* 2-Column Exam Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- LEFT COLUMN: DAFTAR SOAL (4 COLS) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
              <h2 className="text-sm font-extrabold text-slate-800 mb-3">
                Daftar Soal
              </h2>

              {/* Legend */}
              <div className="space-y-1.5 mb-5 pb-4 border-b border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Sudah Dijawab</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span>Sedang Dikerjakan</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></span>
                  <span>Belum Dijawab</span>
                </div>
              </div>

              {/* 40 Numbers Grid (5 cols x 8 rows) */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 40 }, (_, idx) => {
                  const num = idx + 1;
                  const isCurrent = currentQuestion === num;
                  const isAnswered = !!answers[num];
                  const isFlagged = !!flagged[num];

                  let btnStyle = 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
                  if (isCurrent) {
                    btnStyle = 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300 font-black';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-500 text-white hover:bg-emerald-600 font-bold';
                  }

                  return (
                    <button
                      key={num}
                      onClick={() => setCurrentQuestion(num)}
                      className={`relative h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${btnStyle}`}
                    >
                      <span>{num}</span>
                      {/* Flag indicator pin */}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Action Buttons below grid */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleToggleFlag}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    flagged[currentQuestion]
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-amber-50/70 text-amber-600 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <span>{flagged[currentQuestion] ? 'Batalkan Tanda Soal' : 'Tandai Soal'}</span>
                </button>

                <button
                  onClick={handleClearAnswer}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-50/70 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Hapus Jawaban</span>
                </button>
              </div>
            </div>

            {/* ---------------- RIGHT COLUMN: SOAL AKTIF (8 COLS) ---------------- */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              
              {/* Active Question Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8">
                
                {/* Question Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="text-base font-extrabold text-slate-800">
                    Soal {currentQuestion} dari 40
                  </div>

                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      flagged[currentQuestion]
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    <span>Tandai Soal</span>
                  </button>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed font-sans">
                    {currentQData.question}
                  </h3>
                  {currentQData.translation && (
                    <p className="text-xs md:text-sm text-slate-400 mt-1.5">
                      {currentQData.translation}
                    </p>
                  )}
                </div>

                {/* Question Image (e.g. Apple for #13) */}
                {currentQData.hasImage && (
                  <div className="mb-8 flex justify-center">
                    <div className="bg-slate-50/70 p-4 rounded-3xl border border-slate-200/80 max-w-sm w-full flex items-center justify-center shadow-xs">
                      <img
                        src={currentQData.image}
                        alt="Question illustration"
                        className="max-h-56 w-auto object-contain rounded-2xl drop-shadow-sm transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                  </div>
                )}

                {/* Options (A, B, C, D) */}
                <div className="space-y-3">
                  {currentQData.options.map((option) => {
                    const isSelected = answers[currentQuestion] === option.key;

                    return (
                      <div
                        key={option.key}
                        onClick={() => handleSelectAnswer(option.key)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-600 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {option.key}
                        </div>

                        <div className="flex-1">
                          <span className="text-base font-medium text-slate-800">
                            {option.text}
                          </span>
                          {option.label && (
                            <span className="text-xs text-slate-400 ml-2">
                              ({option.label})
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
                    disabled={currentQuestion === 1}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold border border-slate-300 transition-all ${
                      currentQuestion === 1
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmitExam}
                      className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      Kumpulkan Ujian
                    </button>

                    <button
                      onClick={() => setCurrentQuestion(prev => Math.min(40, prev + 1))}
                      disabled={currentQuestion === 40}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                        currentQuestion === 40
                          ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                      }`}
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* ---------------- BOTTOM CARD: ANIME GIRL & INSTRUKSI UJIAN ---------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6">
                {/* Anime Girl Illustration */}
                <div className="w-40 h-40 sm:w-44 sm:h-44 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-amber-50/30">
                  <img
                    src={examStudentStudyImg}
                    alt="Anime Student Studying"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Instruksi Ujian Text */}
                <div className="flex-1">
                  <h4 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Instruksi Ujian</span>
                  </h4>

                  <ol className="space-y-2 text-xs md:text-sm text-slate-600 list-decimal list-inside leading-relaxed">
                    <li>Bacalah setiap soal dengan teliti.</li>
                    <li>Pilih jawaban yang paling tepat.</li>
                    <li>Anda dapat menandai soal untuk ditinjau kembali.</li>
                    <li>Pastikan semua jawaban telah disimpan sebelum waktu habis.</li>
                  </ol>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5" /> Autosave Aktif
                    </span>
                    <span>Jawaban tersimpan otomatis ke cloud server</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
