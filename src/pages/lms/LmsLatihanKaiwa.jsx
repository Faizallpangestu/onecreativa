import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { 
  ChevronRight, 
  Volume2, 
  Square, 
  Mic, 
  MicOff, 
  History, 
  Settings, 
  Lightbulb, 
  CheckCircle2, 
  Copy, 
  User, 
  Home, 
  GraduationCap, 
  Gamepad2, 
  Utensils, 
  Briefcase, 
  ShoppingBag, 
  Plane, 
  Send, 
  Sparkles,
  Bot
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import aiSenseiImg from '../../assets/ai_sensei_kaiwa.jpg';
import animeGirlPointingImg from '../../assets/anime_girl_pointing.jpg';

export default function LmsLatihanKaiwa() {
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [selectedTopic, setSelectedTopic] = useState('perkenalan');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  // AI Settings State
  const [showRomaji, setShowRomaji] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.9);

  // Topics Definition
  const topics = [
    { id: 'perkenalan', name: 'Perkenalan Diri', icon: User, color: 'text-rose-500 bg-rose-50' },
    { id: 'sehari_hari', name: 'Kehidupan Sehari-hari', icon: Home, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'sekolah', name: 'Di Sekolah', icon: GraduationCap, color: 'text-rose-600 bg-rose-50' },
    { id: 'hobi', name: 'Hobi', icon: Gamepad2, color: 'text-blue-500 bg-blue-50' },
    { id: 'restoran', name: 'Di Restoran', icon: Utensils, color: 'text-rose-500 bg-rose-50' },
    { id: 'kerja', name: 'Di Tempat Kerja', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
    { id: 'belanja', name: 'Berbelanja', icon: ShoppingBag, color: 'text-purple-500 bg-purple-50' },
    { id: 'perjalanan', name: 'Perjalanan', icon: Plane, color: 'text-sky-500 bg-sky-50' },
  ];

  // Topic-specific vocabulary & example
  const topicDetails = {
    perkenalan: {
      vocab: [
        { jp: '自己紹介', romaji: 'jikoshoukai', id: 'perkenalan diri' },
        { jp: '名前', romaji: 'namae', id: 'nama' },
        { jp: '出身', romaji: 'shusshin', id: 'asal' },
        { jp: '学生', romaji: 'gakusei', id: 'pelajar / mahasiswa' },
        { jp: '仕事', romaji: 'shigoto', id: 'pekerjaan' },
      ],
      example: {
        jp: 'はじめまして。私はリナです。',
        romaji: 'Hajimemashite. Watashi wa Rina desu.',
        id: 'Senang bertemu dengan Anda. Saya Rina.'
      }
    },
    sehari_hari: {
      vocab: [
        { jp: '朝ごはん', romaji: 'asagohan', id: 'sarapan' },
        { jp: '起きます', romaji: 'okimasu', id: 'bangun tidur' },
        { jp: '毎日', romaji: 'mainichi', id: 'setiap hari' },
        { jp: '学校', romaji: 'gakkou', id: 'sekolah' },
        { jp: '寝ます', romaji: 'nemasu', id: 'tidur' },
      ],
      example: {
        jp: '毎朝 6時に 起きます。',
        romaji: 'Maiasa rokuji ni okimasu.',
        id: 'Setiap pagi saya bangun jam 6.'
      }
    },
    restoran: {
      vocab: [
        { jp: '注文', romaji: 'chuumon', id: 'pesanan' },
        { jp: 'メニュー', romaji: 'menyuu', id: 'menu' },
        { jp: '美味しい', romaji: 'oishii', id: 'enak / lezat' },
        { jp: '水', romaji: 'mizu', id: 'air putih' },
        { jp: 'お会計', romaji: 'okaikei', id: 'tagihan bayar' },
      ],
      example: {
        jp: 'すみません、これを お願いします。',
        romaji: 'Sumimasen, kore o onegaishimasu.',
        id: 'Permisi, saya pesan yang ini tolong.'
      }
    },
    hobi: {
      vocab: [
        { jp: '趣味', romaji: 'shumi', id: 'hobi' },
        { jp: '音楽', romaji: 'ongaku', id: 'musik' },
        { jp: '映画', romaji: 'eiga', id: 'film' },
        { jp: '読書', romaji: 'dokusho', id: 'membaca buku' },
        { jp: '旅行', romaji: 'ryokou', id: 'wisata / traveling' },
      ],
      example: {
        jp: '私の 趣味は 音楽を 聴くことです。',
        romaji: 'Watashi no shumi wa ongaku o kiku koto desu.',
        id: 'Hobi saya adalah mendengarkan musik.'
      }
    }
  };

  const currentTopicData = topicDetails[selectedTopic] || topicDetails.perkenalan;

  // Chat conversation messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'sensei',
      jp: 'こんにちは！ 今日はどんな練習をしますか？',
      romaji: 'Konnichiwa! Kyou wa donna renshuu o shimasu ka?',
      id: 'Halo! Hari ini kamu mau latihan apa?'
    },
    {
      id: 2,
      sender: 'student',
      jp: '自己紹介の練習をしたいです。',
      romaji: 'Jikoshoukai no renshuu o shitai desu.',
      id: 'Saya ingin latihan perkenalan diri.'
    },
    {
      id: 3,
      sender: 'sensei',
      jp: 'いいですね！ では、私に自己紹介をしてください。',
      romaji: 'Ii desu ne! Dewa, watashi ni jikoshoukai o shite kudasai.',
      id: 'Bagus! Kalau begitu, tolong perkenalkan diri kamu kepada saya.'
    }
  ]);

  const recognitionRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ja-JP';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleStudentResponse(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Text-To-Speech (TTS)
  const speakJapanese = (text) => {
    if (!('speechSynthesis' in window)) {
      Swal.fire('Fitur Audio', 'Browser Anda belum mendukung Speech Synthesis.', 'info');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = speechRate;
    
    // Choose Japanese voice if present
    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.includes('ja'));
    if (jpVoice) utterance.voice = jpVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopAllAudio = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsSpeaking(false);
    setIsListening(false);
  };

  // Toggle Voice Recording
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        // Fallback demo input if microphone permission is not granted
        Swal.fire({
          title: 'Mulai Berbicara (Demo Mic)',
          text: 'Ucapkan kalimat bahasa Jepang atau masukkan teks:',
          input: 'text',
          inputValue: 'はじめまして、私はインドネシアから来ました。',
          showCancelButton: true,
          confirmButtonText: 'Kirim Jawaban',
          confirmButtonColor: '#f43f5e'
        }).then((res) => {
          if (res.isConfirmed && res.value) {
            handleStudentResponse(res.value);
          }
        });
      }
    }
  };

  // Student response handler
  const handleStudentResponse = (text) => {
    if (!text.trim()) return;

    const newStudentMsg = {
      id: Date.now(),
      sender: 'student',
      jp: text,
      romaji: 'Hajimemashite, watashi wa...',
      id: 'Perkenalan dari siswa'
    };

    setMessages(prev => [...prev, newStudentMsg]);

    // AI Sensei automated smart response
    setTimeout(() => {
      const aiReplies = [
        {
          jp: '素晴らしいです！ 発音もとても自然ですよ。次はお仕事や趣味について話してみましょうか？',
          romaji: 'Subarashii desu! Hatsuon mo totemo shizen desu yo. Tsugi wa oshigoto ya shumi ni tsuite hanashite mimashou ka?',
          id: 'Luar biasa! Pelafalan kamu sangat natural. Selanjutnya mari bicarakan tentang pekerjaan atau hobimu?'
        },
        {
          jp: '上手ですね！ 日本語の勉強はどのくらい続けていますか？',
          romaji: 'Jouzu desu ne! Nihongo no benkyou wa dono kurai tsuzukete imasu ka?',
          id: 'Bagus sekali! Sudah berapa lama kamu belajar bahasa Jepang?'
        }
      ];
      const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'sensei', ...reply }]);
      speakJapanese(reply.jp);
    }, 1000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Tersalin ke clipboard!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic.id);
    const greeting = {
      id: Date.now(),
      sender: 'sensei',
      jp: `${topic.name}についての会話を始めましょう！何でも話してくださいね。`,
      romaji: `${topic.name} ni tsuite no kaiwa o hajimemashou! Nandemo hanashite kudasai ne.`,
      id: `Mari mulai percakapan tentang topik "${topic.name}"! Silakan katakan apa saja.`
    };
    setMessages(prev => [...prev, greeting]);
    speakJapanese(greeting.jp);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER HERO BANNER (1:1 WITH MOCKUP) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-blue-50/90 via-rose-50/50 to-white border-b border-slate-200/80 px-4 md:px-8 py-5 overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-[550px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 30%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-rose-500 font-semibold">Kaiwa dengan AI</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kaiwa dengan AI
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Latih kemampuan berbicara bahasa Jepang dengan AI Tutor secara interaktif.
              </p>
            </div>

            {/* Right: Anime Schoolgirl + Speech Bubble Badge */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-white/95 border border-pink-200 rounded-2xl px-4 py-2.5 shadow-sm relative">
                <div className="text-xs font-black text-slate-800 leading-tight">
                  話して、<br />
                  <span className="text-rose-500">もっと上手になろう！</span>
                </div>
                {/* Speech Bubble Arrow */}
                <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-pink-200 rotate-45"></div>
              </div>

              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-pink-100 flex-shrink-0">
                <img
                  src={animeGirlPointingImg}
                  alt="Anime Student Cheering"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LEVEL TABS & QUICK CONTROLS BAR */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            
            {/* Level Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {['N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedLevel === lvl
                      ? 'bg-rose-500 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Right Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Riwayat Percakapan Kaiwa',
                    html: `
                      <div class="text-left text-xs space-y-2 mt-3">
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <b>Topik: Perkenalan Diri (N5)</b>
                          <p class="text-slate-500 mt-1">12 Pertukaran Pesan • Akurasi Pelafalan: 92%</p>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <b>Topik: Di Restoran (N5)</b>
                          <p class="text-slate-500 mt-1">8 Pertukaran Pesan • Akurasi Pelafalan: 88%</p>
                        </div>
                      </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#f43f5e'
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>Riwayat Percakapan</span>
              </button>

              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Pengaturan AI Tutor',
                    html: `
                      <div class="text-left text-xs space-y-3 mt-3">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="swal-romaji" checked class="rounded" />
                          <span>Tampilkan Romaji (Pelafalan Latin)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="swal-trans" checked class="rounded" />
                          <span>Tampilkan Terjemahan Bahasa Indonesia</span>
                        </label>
                        <div>
                          <label class="block font-bold mb-1">Kecepatan Suara Sensei:</label>
                          <select id="swal-rate" class="w-full p-2 border rounded-xl">
                            <option value="0.8">0.8x (Lambat / Belajar)</option>
                            <option value="0.9" selected>0.9x (Standar Edukasi)</option>
                            <option value="1.0">1.0x (Kecepatan Asli Penutur)</option>
                          </select>
                        </div>
                      </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Simpan',
                    confirmButtonColor: '#f43f5e'
                  }).then((res) => {
                    if (res.isConfirmed) {
                      const rate = parseFloat(document.getElementById('swal-rate')?.value || '0.9');
                      setSpeechRate(rate);
                      Swal.fire('Tersimpan', 'Pengaturan suara AI diperbarui', 'success');
                    }
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan AI</span>
              </button>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY: 2-COLUMN WORKSPACE */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- LEFT/CENTER: AI SENSEI & CHAT AREA (8 COLS) ---------------- */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-6">
              
              {/* Main Chat Workspace Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row">
                
                {/* AI Sensei Portrait Panel (Left) */}
                <div className="md:w-72 lg:w-80 relative flex-shrink-0 bg-slate-900 overflow-hidden min-h-[380px] md:min-h-[580px]">
                  <img
                    src={aiSenseiImg}
                    alt="AI Sensei Japanese Tutor"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Subtle Gradient Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Floating AI Sensei Status Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">AI Sensei</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                      Teman latihan Kaiwa kamu kapan saja, di mana saja!
                    </p>
                  </div>
                </div>

                {/* Chat & Voice Controls Panel (Right) */}
                <div className="flex-1 flex flex-col justify-between bg-slate-50/40 p-5 md:p-6 border-t md:border-t-0 md:border-l border-slate-100">
                  
                  {/* Chat Messages Log */}
                  <div ref={chatScrollRef} className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                    {messages.map((msg) => {
                      const isSensei = msg.sender === 'sensei';

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${isSensei ? 'justify-start' : 'justify-end'}`}
                        >
                          {/* Sensei Avatar */}
                          {isSensei && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-white shadow-2xs">
                              <img src={aiSenseiImg} alt="Sensei" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs relative ${
                              isSensei
                                ? 'bg-white border border-slate-200/90 text-slate-800'
                                : 'bg-blue-50 border border-blue-200 text-slate-900 ml-auto'
                            }`}
                          >
                            {/* Japanese Main Text */}
                            <div className="text-sm md:text-base font-bold text-slate-900 leading-relaxed font-sans">
                              {msg.jp}
                            </div>

                            {/* Romaji Subtitle */}
                            {showRomaji && msg.romaji && (
                              <div className="text-xs text-blue-600 font-medium mt-1 font-mono">
                                {msg.romaji}
                              </div>
                            )}

                            {/* Indonesian Subtitle */}
                            {showTranslation && msg.id && (
                              <div className="text-xs text-slate-500 mt-1">
                                {msg.id}
                              </div>
                            )}

                            {/* Audio Speaker Icon Button */}
                            <button
                              onClick={() => speakJapanese(msg.jp)}
                              className="absolute top-3.5 right-3 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Dengarkan pelafalan"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Student Avatar */}
                          {!isSensei && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-200 flex-shrink-0 bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shadow-2xs">
                              RA
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Centered Voice Controls & Microphone */}
                  <div className="pt-6 border-t border-slate-200/80 mt-6 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-6">
                      
                      {/* Dengarkan Button */}
                      <button
                        onClick={() => {
                          const lastSenseiMsg = [...messages].reverse().find(m => m.sender === 'sensei');
                          if (lastSenseiMsg) speakJapanese(lastSenseiMsg.jp);
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-600">
                          Dengarkan
                        </span>
                      </button>

                      {/* Main Mic Button (Glowing Pink Pulse) */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={toggleListening}
                          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                            isListening
                              ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse shadow-rose-500/40'
                              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                          }`}
                        >
                          {isListening ? (
                            <MicOff className="w-7 h-7 stroke-[2.5]" />
                          ) : (
                            <Mic className="w-7 h-7 stroke-[2.5]" />
                          )}
                        </button>
                        <span className="text-[11px] font-bold text-slate-500">
                          {isListening ? 'Sedang mendengarkan...' : 'Klik untuk mulai berbicara'}
                        </span>
                      </div>

                      {/* Hentikan Button */}
                      <button
                        onClick={stopAllAudio}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
                          <Square className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-rose-600">
                          Hentikan
                        </span>
                      </button>

                    </div>

                    {/* Optional Fallback Text Input */}
                    <div className="w-full mt-4 flex items-center gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && textInput.trim()) {
                            handleStudentResponse(textInput);
                            setTextInput('');
                          }
                        }}
                        placeholder="Atau ketik kalimat bahasa Jepang di sini..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-rose-400 shadow-2xs"
                      />
                      <button
                        onClick={() => {
                          if (textInput.trim()) {
                            handleStudentResponse(textInput);
                            setTextInput('');
                          }
                        }}
                        className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-xs transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

              </div>

              {/* Tips Latihan Kaiwa Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Tips Latihan Kaiwa</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Gunakan kalimat sederhana terlebih dahulu.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Jangan takut salah, AI akan membantu.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Coba berbicara dengan suara yang jelas.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Latih secara rutin untuk hasil maksimal.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ---------------- RIGHT SIDEBAR (4 COLS) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-6">
              
              {/* Card 1: Pilih Topik Percakapan */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Pilih Topik Percakapan
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Semua Topik Kaiwa', 'Tersedia 20+ topik percakapan situasional', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                {/* 8 Topic Tiles (4 cols x 2 rows) */}
                <div className="grid grid-cols-4 gap-2.5">
                  {topics.map((t) => {
                    const isSelected = selectedTopic === t.id;
                    const IconComp = t.icon;

                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTopicChange(t)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50/80 border-2 border-rose-500 shadow-xs'
                            : 'bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${t.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Level dan Progres */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Level dan Progres
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Progres Kaiwa', 'Target: Menyelesaikan 20 topik level N5', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Detail &gt;
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {/* Level Box */}
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
                    {selectedLevel}
                  </div>

                  {/* Progress details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>Pemula</span>
                      <span className="text-rose-600">64%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: '64%' }}
                      />
                    </div>

                    <div className="text-[11px] font-medium text-slate-400 mt-1">
                      Selesai <b className="text-slate-700">12</b> dari 20 topik percakapan
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Kosakata Terkait */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Kosakata Terkait
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Bank Kosakata Kaiwa', 'Kumpulan kosakata esensial untuk percakapan', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-2">
                  {currentTopicData.vocab.map((v, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => speakJapanese(v.jp)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Dengarkan kata"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{v.jp}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({v.romaji})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-600 truncate">{v.id}</span>
                        <button
                          onClick={() => handleCopy(v.jp)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Salin kata"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Contoh Kalimat */}
              <div className="bg-gradient-to-r from-pink-50/80 to-rose-50/50 rounded-3xl border border-pink-100 p-5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="text-rose-500">📕</span>
                    <span>Contoh Kalimat</span>
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Contoh Kalimat', currentTopicData.example.jp, 'info')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Lihat Lainnya &gt;
                  </button>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-pink-200/70 flex items-start gap-3">
                  <button
                    onClick={() => speakJapanese(currentTopicData.example.jp)}
                    className="p-1.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 mt-0.5"
                    title="Dengarkan kalimat"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-relaxed font-sans">
                      {currentTopicData.example.jp}
                    </div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                      {currentTopicData.example.romaji}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {currentTopicData.example.id}
                    </div>
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
