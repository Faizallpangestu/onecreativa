import { useState, useMemo, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { 
  Search, 
  Volume2, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  Plus, 
  List, 
  Grid, 
  BookOpen, 
  Target, 
  Flame, 
  BarChart3, 
  CheckCircle2, 
  Copy, 
  Sparkles, 
  MoreVertical, 
  Layers, 
  HelpCircle, 
  Bookmark, 
  Loader2, 
  RefreshCw,
  Globe
} from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl.jpg';

// Curated Indonesian dictionary for the most common Japanese words across N5 to N1
const DICT_INDONESIA = {
  '食べる': 'Makan',
  'たべる': 'Makan',
  '行く': 'Pergi',
  'いく': 'Pergi',
  '見る': 'Melihat / Menonton',
  'みる': 'Melihat / Menonton',
  '大きい': 'Besar',
  'おおきい': 'Besar',
  '新しい': 'Baru',
  'あたらしい': 'Baru',
  '友達': 'Teman / Sahabat',
  'ともだち': 'Teman / Sahabat',
  '本': 'Buku',
  'ほん': 'Buku',
  '飲む': 'Minum',
  'のむ': 'Minum',
  '学校': 'Sekolah',
  'がっこう': 'Sekolah',
  '先生': 'Guru / Pengajar',
  'せんせい': 'Guru / Pengajar',
  '学生': 'Siswa / Mahasiswa',
  'がくせい': 'Siswa / Mahasiswa',
  '車': 'Mobil',
  'くるま': 'Mobil',
  '水': 'Air',
  'みず': 'Air',
  '日': 'Matahari / Hari',
  'ひ': 'Matahari / Hari',
  '年': 'Tahun',
  'とし': 'Tahun',
  '人': 'Orang / Manusia',
  'ひと': 'Orang / Manusia',
  '手': 'Tangan',
  'て': 'Tangan',
  '目': 'Mata',
  'め': 'Mata',
  '耳': 'Telinga',
  'みみ': 'Telinga',
  '口': 'Mulut',
  'くち': 'Mulut',
  '時間': 'Waktu / Jam',
  'じかん': 'Waktu / Jam',
  '会社': 'Perusahaan / Kantor',
  'かいしゃ': 'Perusahaan / Kantor',
  '日本語': 'Bahasa Jepang',
  'にほんご': 'Bahasa Jepang',
  '勉強': 'Belajar',
  'べんきょう': 'Belajar',
  '仕事': 'Pekerjaan',
  'しごと': 'Pekerjaan',
  '私': 'Saya / Aku',
  'わたし': 'Saya / Aku',
  '明日': 'Besok',
  'あした': 'Besok',
  '今日': 'Hari ini',
  'きょう': 'Hari ini',
  '昨日': 'Kemarin',
  'きのう': 'Kemarin',
  '今': 'Sekarang',
  'いま': 'Sekarang',
  '家族': 'Keluarga',
  'かぞく': 'Keluarga'
};

// Emoji illustrations mapping
const EMOJI_MAP = {
  '食べる': '🍚',
  '行く': '🏫',
  '見る': '🖥️',
  '大きい': '📦',
  '新しい': '🚗',
  '友達': '👭',
  '本': '📖',
  '飲む': '☕',
  '学校': '🏫',
  '先生': '👨‍🏫',
  '学生': '🎓',
  '車': '🚗',
  '水': '💧',
  '手': '✋',
  '時間': '⏰',
  '会社': '🏢',
  '日本語': '🌸',
  '家族': '👨‍👩‍👧‍👦'
};

export default function LmsKotoba() {
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Favorit' | 'Sudah Dikuasai'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Semua Level');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Pagination & Loading States
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(35);
  const [totalCount, setTotalCount] = useState(350);

  // Favorites & Mastered storage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kotoba_favorites') || '[1, 4, 7]');
    } catch {
      return [1, 4, 7];
    }
  });

  const [mastered, setMastered] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kotoba_mastered') || '[1, 2, 4, 6, 7, 8]');
    } catch {
      return [1, 2, 4, 6, 7, 8];
    }
  });

  // Selected checkbox IDs
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Primary list of words (live from Jisho or cached)
  const [words, setWords] = useState([
    {
      id: 1,
      kanji: '食べる',
      hiragana: 'たべる',
      romaji: 'taberu',
      level: 'N5',
      category: 'Kata Kerja (動詞)',
      posType: 'verb',
      meaning: 'Makan',
      exampleJp: '例：私はご飯を食べます。',
      exampleRomaji: 'Watashi wa gohan o tabemasu.',
      exampleId: 'Saya makan nasi.',
      icon: '🍚'
    },
    {
      id: 2,
      kanji: '行く',
      hiragana: 'いく',
      romaji: 'iku',
      level: 'N5',
      category: 'Kata Kerja (動詞)',
      posType: 'verb',
      meaning: 'Pergi',
      exampleJp: '例：学校へ行きます。',
      exampleRomaji: 'Gakkou e ikimasu.',
      exampleId: 'Pergi ke sekolah.',
      icon: '🏫'
    },
    {
      id: 3,
      kanji: '見る',
      hiragana: 'みる',
      romaji: 'miru',
      level: 'N5',
      category: 'Kata Kerja (動詞)',
      posType: 'verb',
      meaning: 'Melihat',
      exampleJp: '例：映画を見ます。',
      exampleRomaji: 'Eiga o mimasu.',
      exampleId: 'Menonton film.',
      icon: '🖥️'
    },
    {
      id: 4,
      kanji: '大きい',
      hiragana: 'おおきい',
      romaji: 'ookii',
      level: 'N5',
      category: 'Kata Sifat (形容詞)',
      posType: 'adj',
      meaning: 'Besar',
      exampleJp: '例：この箱は大きいです。',
      exampleRomaji: 'Kono hako wa ookii desu.',
      exampleId: 'Kotak ini besar.',
      icon: '📦'
    },
    {
      id: 5,
      kanji: '新しい',
      hiragana: 'あたらしい',
      romaji: 'atarashii',
      level: 'N5',
      category: 'Kata Sifat (形容詞)',
      posType: 'adj',
      meaning: 'Baru',
      exampleJp: '例：新しい車です。',
      exampleRomaji: 'Atarashii kuruma desu.',
      exampleId: 'Ini adalah mobil baru.',
      icon: '🚗'
    },
    {
      id: 6,
      kanji: '友達',
      hiragana: 'ともだち',
      romaji: 'tomodachi',
      level: 'N5',
      category: 'Kata Benda (名詞)',
      posType: 'noun',
      meaning: 'Teman',
      exampleJp: '例：友達と話します。',
      exampleRomaji: 'Tomodachi to hanashimasu.',
      exampleId: 'Berbicara dengan teman.',
      icon: '👭'
    }
  ]);

  // Sync favorites with localStorage
  useEffect(() => {
    localStorage.setItem('kotoba_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync mastered with localStorage
  useEffect(() => {
    localStorage.setItem('kotoba_mastered', JSON.stringify(mastered));
  }, [mastered]);

  // Map Jisho parts of speech to friendly Indonesian category
  const mapCategory = (posArray = []) => {
    const posStr = posArray.join(' ').toLowerCase();
    if (posStr.includes('verb')) return 'Kata Kerja (動詞)';
    if (posStr.includes('adjective') || posStr.includes('adj')) return 'Kata Sifat (形容詞)';
    if (posStr.includes('noun')) return 'Kata Benda (名詞)';
    if (posStr.includes('adverb')) return 'Kata Keterangan (副詞)';
    return 'Lainnya (その他)';
  };

  // Convert Jisho sense English definition to Indonesian or clean translation
  const getIndonesianMeaning = (kanji, hiragana, senses = []) => {
    if (DICT_INDONESIA[kanji]) return DICT_INDONESIA[kanji];
    if (DICT_INDONESIA[hiragana]) return DICT_INDONESIA[hiragana];

    const firstSense = senses[0];
    if (firstSense && firstSense.english_definitions && firstSense.english_definitions.length > 0) {
      const eng = firstSense.english_definitions.slice(0, 2).join(', ');
      // Simple translation replacements for common keywords
      let idTrans = eng
        .replace(/\bto eat\b/gi, 'Makan')
        .replace(/\bto go\b/gi, 'Pergi')
        .replace(/\bto see\b/gi, 'Melihat')
        .replace(/\bto drink\b/gi, 'Minum')
        .replace(/\bto read\b/gi, 'Membaca')
        .replace(/\bto write\b/gi, 'Menulis')
        .replace(/\bto speak\b/gi, 'Berbicara')
        .replace(/\bto come\b/gi, 'Datang')
        .replace(/\bbig\b/gi, 'Besar')
        .replace(/\bsmall\b/gi, 'Kecil')
        .replace(/\bnew\b/gi, 'Baru')
        .replace(/\bold\b/gi, 'Lama / Tua')
        .replace(/\bgood\b/gi, 'Bagus / Baik')
        .replace(/\bfriend\b/gi, 'Teman')
        .replace(/\bbook\b/gi, 'Buku')
        .replace(/\bschool\b/gi, 'Sekolah')
        .replace(/\bteacher\b/gi, 'Guru')
        .replace(/\bstudent\b/gi, 'Siswa / Mahasiswa')
        .replace(/\bwater\b/gi, 'Air')
        .replace(/\bhand\b/gi, 'Tangan')
        .replace(/\bcar\b/gi, 'Mobil');
      return idTrans;
    }
    return 'Kosakata Bahasa Jepang';
  };

  // Assign illustrative emoji
  const getIcon = (kanji, category) => {
    if (EMOJI_MAP[kanji]) return EMOJI_MAP[kanji];
    if (category.includes('Kerja')) return '⚡';
    if (category.includes('Sifat')) return '✨';
    if (category.includes('Benda')) return '📦';
    if (category.includes('Keterangan')) return '📖';
    return '📝';
  };

  // Live Jisho Fetch Function
  const fetchJishoWords = async (levelTab, search, pageNum) => {
    // If favorites or mastered tab, handle from local cache
    if (levelTab === 'Favorit' || levelTab === 'Sudah Dikuasai') {
      return;
    }

    setIsLoading(true);

    let query = '#jlpt-n5';
    if (search.trim()) {
      query = search.trim();
    } else if (levelTab === 'N5') {
      query = '#jlpt-n5';
    } else if (levelTab === 'N4') {
      query = '#jlpt-n4';
    } else if (levelTab === 'N3') {
      query = '#jlpt-n3';
    } else if (levelTab === 'N2') {
      query = '#jlpt-n2';
    } else if (levelTab === 'N1') {
      query = '#jlpt-n1';
    } else if (levelTab === 'Semua') {
      query = selectedLevel !== 'Semua Level' ? `#jlpt-${selectedLevel.toLowerCase()}` : '#jlpt-n5';
    }

    try {
      // First try Vite dev proxy /jisho
      let response;
      try {
        response = await axios.get(`/jisho/api/v1/search/words?keyword=${encodeURIComponent(query)}&page=${pageNum}`, { timeout: 6000 });
      } catch {
        // Fallback to PHP backend proxy
        response = await axios.get(`/One-creativa/backend/api/jisho_proxy.php?keyword=${encodeURIComponent(query)}&page=${pageNum}`, { timeout: 8000 });
      }

      const rawData = response.data?.data || [];
      if (rawData.length > 0) {
        const parsedWords = rawData.map((item, idx) => {
          const kanji = item.japanese?.[0]?.word || item.japanese?.[0]?.reading || item.slug || `Kotoba ${idx + 1}`;
          const hiragana = item.japanese?.[0]?.reading || item.slug || kanji;
          
          let jlptLevel = 'N5';
          if (item.jlpt && item.jlpt.length > 0) {
            const jlptTag = item.jlpt.find(tag => tag.includes('jlpt-'));
            if (jlptTag) jlptLevel = jlptTag.replace('jlpt-', '').toUpperCase();
          } else if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(levelTab)) {
            jlptLevel = levelTab;
          }

          const category = mapCategory(item.senses?.[0]?.parts_of_speech);
          const meaning = getIndonesianMeaning(kanji, hiragana, item.senses);
          const icon = getIcon(kanji, category);

          return {
            id: item.slug || `${kanji}_${idx}`,
            kanji,
            hiragana,
            romaji: hiragana,
            level: jlptLevel,
            category,
            meaning,
            exampleJp: `例：${kanji}の練習をします。`,
            exampleRomaji: '',
            exampleId: `Contoh penggunaan kata ${kanji}.`,
            icon
          };
        });

        setWords(parsedWords);
        setTotalCount(350);
        setTotalPages(Math.max(1, Math.ceil(350 / 6)));
      }
    } catch (err) {
      console.warn('Jisho Live API note:', err.message);
      // Keep existing curated words so UI never breaks
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search and tab trigger
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchJishoWords(activeTab, searchQuery, currentPage);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [activeTab, searchQuery, selectedLevel, currentPage]);

  // Audio Speech Synthesis
  const speakJapanese = (text) => {
    if (!('speechSynthesis' in window)) {
      Swal.fire('Info', 'Browser belum mendukung Speech Synthesis.', 'info');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.includes('ja'));
    if (jpVoice) utterance.voice = jpVoice;

    window.speechSynthesis.speak(utterance);
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(x => x !== id) : [...prev, id];
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: !exists ? 'success' : 'info',
        title: !exists ? 'Ditambahkan ke Favorit ⭐' : 'Dihapus dari Favorit',
        showConfirmButton: false,
        timer: 1500
      });
      return updated;
    });
  };

  // Filtered words for current display
  const displayedWords = useMemo(() => {
    return words.filter(item => {
      if (activeTab === 'Favorit' && !favorites.includes(item.id)) return false;
      if (activeTab === 'Sudah Dikuasai' && !mastered.includes(item.id)) return false;
      if (selectedCategory !== 'Semua Kategori' && !item.category.includes(selectedCategory)) return false;
      return true;
    });
  }, [words, activeTab, favorites, mastered, selectedCategory]);

  // Add custom word modal
  const handleAddNewWord = () => {
    Swal.fire({
      title: 'Tambah ke Daftar Kotoba Saya',
      html: `
        <div class="text-left text-xs space-y-3 mt-3 text-slate-700">
          <div>
            <label class="block font-bold mb-1">Kanji / Kata:</label>
            <input id="swal-kanji" class="w-full p-2.5 border rounded-xl" placeholder="Contoh: 飲む" />
          </div>
          <div>
            <label class="block font-bold mb-1">Hiragana / Cara Baca:</label>
            <input id="swal-hiragana" class="w-full p-2.5 border rounded-xl" placeholder="Contoh: のむ" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold mb-1">Level JLPT:</label>
              <select id="swal-level" class="w-full p-2.5 border rounded-xl">
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div>
              <label class="block font-bold mb-1">Kategori:</label>
              <select id="swal-cat" class="w-full p-2.5 border rounded-xl">
                <option value="Kata Kerja (動詞)">Kata Kerja</option>
                <option value="Kata Sifat (形容詞)">Kata Sifat</option>
                <option value="Kata Benda (名詞)">Kata Benda</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1">Arti (Bahasa Indonesia):</label>
            <input id="swal-meaning" class="w-full p-2.5 border rounded-xl" placeholder="Contoh: Minum" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan ke Kotoba Saya',
      confirmButtonColor: '#f43f5e',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-3xl' }
    }).then((res) => {
      if (res.isConfirmed) {
        const kanji = document.getElementById('swal-kanji')?.value;
        const hiragana = document.getElementById('swal-hiragana')?.value;
        const level = document.getElementById('swal-level')?.value || 'N5';
        const category = document.getElementById('swal-cat')?.value || 'Kata Kerja';
        const meaning = document.getElementById('swal-meaning')?.value;

        if (kanji && meaning) {
          const newItem = {
            id: `custom_${Date.now()}`,
            kanji,
            hiragana: hiragana || kanji,
            romaji: hiragana || kanji,
            level,
            category,
            meaning,
            exampleJp: `例：${kanji}を使います。`,
            icon: '📝'
          };
          setWords(prev => [newItem, ...prev]);
          Swal.fire('Berhasil!', 'Kotoba baru tersimpan ke daftar belajar Anda.', 'success');
        }
      }
    });
  };

  // Flashcard mode
  const handleOpenFlashcard = () => {
    let index = 0;
    const cards = displayedWords.length > 0 ? displayedWords : words;
    
    const showCard = () => {
      const card = cards[index];
      Swal.fire({
        title: `🎴 Flashcard Kotoba (${index + 1}/${cards.length})`,
        html: `
          <div class="py-6 px-4 text-center cursor-pointer select-none">
            <div class="text-4xl font-black text-slate-900 mb-2">${card.kanji}</div>
            <div class="text-sm font-semibold text-rose-500 font-mono mb-4">${card.hiragana}</div>
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span class="text-xs uppercase font-bold text-slate-400 block mb-1">Arti:</span>
              <span class="text-lg font-bold text-slate-800">${card.meaning}</span>
              <p class="text-xs text-slate-500 mt-2">${card.exampleJp}</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Sudah Tahu ✅',
        denyButtonText: 'Belum Tahu 🔄',
        cancelButtonText: 'Selesai',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-3xl' }
      }).then((result) => {
        if (result.isConfirmed || result.isDenied) {
          index = (index + 1) % cards.length;
          showCard();
        }
      });
    };
    showCard();
  };

  // Multiple Choice Quiz
  const handleOpenQuiz = () => {
    const q = displayedWords[0] || words[0];
    Swal.fire({
      title: '🎯 Latihan Pilihan Ganda',
      html: `
        <div class="text-left text-xs space-y-3 mt-3">
          <p class="text-sm text-slate-700">Apakah arti dari kata <b>「${q.kanji}」</b> (${q.hiragana})?</p>
          <div class="space-y-2 mt-3">
            <button id="opt-1" class="w-full p-3 text-left border rounded-xl hover:bg-rose-50 font-semibold">A. Tidur (Nemasu)</button>
            <button id="opt-2" class="w-full p-3 text-left border rounded-xl hover:bg-rose-50 font-semibold">B. ${q.meaning} (Benar)</button>
            <button id="opt-3" class="w-full p-3 text-left border rounded-xl hover:bg-rose-50 font-semibold">C. Minum (Nomu)</button>
            <button id="opt-4" class="w-full p-3 text-left border rounded-xl hover:bg-rose-50 font-semibold">D. Berlari (Hashiru)</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Tutup',
      didOpen: () => {
        document.getElementById('opt-2')?.addEventListener('click', () => {
          Swal.fire('Benar! 🎉', `Jawaban tepat! 「${q.kanji}」 berarti ${q.meaning}.`, 'success');
        });
        ['opt-1', 'opt-3', 'opt-4'].forEach(id => {
          document.getElementById(id)?.addEventListener('click', () => {
            Swal.fire('Kurang Tepat', `Jawaban yang benar adalah B (${q.meaning}).`, 'error');
          });
        });
      }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER HERO BANNER (1:1 WITH MOCKUP) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-white border-b border-slate-200/80 px-4 md:px-8 py-5 overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-[550px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 30%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-rose-500 font-semibold">Kotoba</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kotoba
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Pelajari kosakata bahasa Jepang secara terstruktur, lengkap dengan cara baca, arti, contoh kalimat, dan audio.
              </p>
            </div>

            {/* Live Jisho.org Badge Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-xs text-xs font-bold text-slate-600">
              <Globe className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
              <span>Jisho.org Database N1-N5</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4 METRIC CARDS ROW */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Daftar Kotoba */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                <BookOpen className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Daftar Kotoba</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">350+</div>
                <div className="text-[11px] text-slate-400">kosakata tersedia</div>
              </div>
            </div>

            {/* Card 2: Target Saya */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
                <Target className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Target Saya</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">50</div>
                <div className="text-[11px] text-slate-400">kosakata / minggu</div>
              </div>
            </div>

            {/* Card 3: Streak Belajar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Streak Belajar</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">12 hari</div>
                <div className="text-[11px] text-slate-400">berturut-turut</div>
              </div>
            </div>

            {/* Card 4: Progress */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/20">
                <BarChart3 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Progress</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">64%</div>
                <div className="text-[11px] text-slate-400">dari target bulan ini</div>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* LEVEL TABS & TAMBAH BUTTON */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Filter Tabs (N1 - N5 from Jisho.org) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['Semua', 'N5', 'N4', 'N3', 'N2', 'N1', 'Favorit', 'Sudah Dikuasai'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'bg-rose-500 text-white shadow-sm font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tambah Button */}
            <button
              onClick={handleAddNewWord}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah ke Daftar Saya</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEARCH & FILTER BAR */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Search input (Live queries Jisho) */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari kotoba di Jisho.org (kanji, hiragana, arti)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-rose-400 transition-all"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 text-rose-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Middle: Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Level Dropdown */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none pr-7 appearance-none cursor-pointer"
                >
                  <option value="Semua Level">Semua Level</option>
                  <option value="N5">Level N5</option>
                  <option value="N4">Level N4</option>
                  <option value="N3">Level N3</option>
                  <option value="N2">Level N2</option>
                  <option value="N1">Level N1</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none pr-7 appearance-none cursor-pointer"
                >
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Kata Kerja">Kata Kerja (動詞)</option>
                  <option value="Kata Sifat">Kata Sifat (形容詞)</option>
                  <option value="Kata Benda">Kata Benda (名詞)</option>
                  <option value="Kata Keterangan">Kata Keterangan (副詞)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort Order */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none pr-7 appearance-none cursor-pointer"
                >
                  <option value="Terbaru">Urutkan: Terbaru</option>
                  <option value="Abjad">Urutkan: A - Z</option>
                  <option value="Level">Urutkan: Level</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Right: View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY: 2-COLUMN LAYOUT */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- LEFT/CENTER: KOTOBA LIST (8 COLS) ---------------- */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-3">
              
              {/* Loading Banner */}
              {isLoading && (
                <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex items-center justify-center gap-2 text-xs text-rose-600 font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengambil data kosakata terlengkap dari Jisho.org...</span>
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {displayedWords.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isFav = favorites.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-300 ${
                          isSelected ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/80'
                        }`}
                      >
                        {/* Left Group: Checkbox, Audio, Word, Badge */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedItemIds(prev =>
                                prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />

                          {/* Audio Speaker Button (Pink Pill) */}
                          <button
                            onClick={() => speakJapanese(item.kanji)}
                            className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                            title="Dengarkan pengucapan asli"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {/* Kanji & Hiragana */}
                          <div>
                            <div className="text-xl font-black text-slate-900 tracking-tight font-sans">
                              {item.kanji}
                            </div>
                            <div className="text-xs font-semibold text-slate-400 font-mono -mt-0.5">
                              {item.hiragana}
                            </div>
                          </div>

                          {/* Level & POS Badges */}
                          <div className="flex flex-col gap-1 ml-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-50 text-sky-600 border border-sky-200/70 w-fit">
                              {item.level}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-slate-100 text-slate-600 w-fit truncate max-w-[110px]">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Middle Group: Meaning & Example Sentence */}
                        <div className="flex-1 min-w-0 sm:px-4">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span className="truncate">{item.meaning}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 leading-relaxed font-sans truncate">
                            {item.exampleJp}
                          </div>
                          {item.exampleRomaji && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                              {item.exampleRomaji}
                            </div>
                          )}
                        </div>

                        {/* Right Group: Illustration Thumbnail, Favorite Star, Menu */}
                        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                          {/* Visual Illustration Badge */}
                          <div className="w-14 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-2xs">
                            {item.icon}
                          </div>

                          {/* Star Favorite Button */}
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Favorit"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>

                          {/* Menu Dots */}
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: `${item.kanji} (${item.hiragana})`,
                                html: `
                                  <div class="text-left text-xs space-y-2 mt-2">
                                    <p><b>Level:</b> ${item.level}</p>
                                    <p><b>Kategori:</b> ${item.category}</p>
                                    <p><b>Arti:</b> ${item.meaning}</p>
                                    <p><b>Contoh:</b> ${item.exampleJp}</p>
                                  </div>
                                `,
                                icon: 'info'
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {displayedWords.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-50 text-sky-600 border border-sky-200">
                            {item.level}
                          </span>
                          <button onClick={() => toggleFavorite(item.id)}>
                            <Star className={`w-4 h-4 ${favorites.includes(item.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                          </button>
                        </div>

                        <div className="text-center my-3">
                          <div className="text-3xl font-black text-slate-900">{item.kanji}</div>
                          <div className="text-xs text-rose-500 font-mono mt-1">{item.hiragana}</div>
                          <div className="text-sm font-bold text-slate-700 mt-2">{item.meaning}</div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mt-3 border border-slate-100">
                          {item.exampleJp}
                        </div>
                      </div>

                      <button
                        onClick={() => speakJapanese(item.kanji)}
                        className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengarkan</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls Footer */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                
                {/* Page numbers */}
                <div className="flex items-center gap-1 text-xs font-bold">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-7 h-7 rounded-lg transition-all ${
                        currentPage === num
                          ? 'bg-rose-500 text-white font-black shadow-xs'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  <span className="px-1 text-slate-400">..</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    {totalPages}
                  </button>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right page counter info */}
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span>Menampilkan {displayedWords.length} dari {totalCount} kotoba</span>
                  <div className="relative">
                    <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none pr-6 appearance-none cursor-pointer">
                      <option>6 / halaman</option>
                      <option>12 / halaman</option>
                      <option>24 / halaman</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

              </div>

            </div>

            {/* ---------------- RIGHT SIDEBAR (4 COLS) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-6">
              
              {/* Card 1: Progress Kotoba Saya */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Progress Kotoba Saya
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Detail Progress', 'Target bulanan: 200 kosakata baru N1-N5', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Detail &gt;
                  </button>
                </div>

                <div className="flex items-center justify-around gap-4 pt-1">
                  {/* Circular Donut Representation */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#10b981" 
                        strokeWidth="10" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 * (1 - 0.64)} 
                        strokeLinecap="round" 
                        fill="transparent" 
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black text-slate-900 block leading-tight">64%</span>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Dari target<br/>200 kotoba</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Dikuasai
                      </span>
                      <b className="text-slate-900">128</b>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Sedang Dipelajari
                      </span>
                      <b className="text-slate-900">52</b>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Belum Dipelajari
                      </span>
                      <b className="text-slate-900">70</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Kategori Kotoba */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Kategori Kotoba
                  </h3>
                  <button 
                    onClick={() => Swal.fire('Kategori Kotoba', 'Menampilkan pembagian jenis kata bahasa Jepang', 'info')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua &gt;
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="text-rose-500">✏️</span> Kata Kerja (動詞)</span>
                    <b className="text-slate-900">120</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="text-emerald-500">🏷️</span> Kata Sifat (形容詞)</span>
                    <b className="text-slate-900">80</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="text-blue-500">📦</span> Kata Benda (名詞)</span>
                    <b className="text-slate-900">100</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="text-purple-500">📖</span> Kata Keterangan (副詞)</span>
                    <b className="text-slate-900">30</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="text-amber-500">📁</span> Lainnya</span>
                    <b className="text-slate-900">20</b>
                  </div>
                </div>
              </div>

              {/* Card 3: Fitur Belajar (2x2 Grid) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 pb-1">
                  Fitur Belajar
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Mode Flashcard */}
                  <button
                    onClick={handleOpenFlashcard}
                    className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-100/60 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Mode Flashcard</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Latihan cepat</div>
                  </button>

                  {/* Latihan Pilihan Ganda */}
                  <button
                    onClick={handleOpenQuiz}
                    className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 hover:bg-emerald-100/60 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Latihan Pilihan Ganda</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Uji pemahaman</div>
                  </button>

                  {/* Daftar Favorit */}
                  <button
                    onClick={() => setActiveTab('Favorit')}
                    className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 hover:bg-amber-100/60 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                      <Star className="w-4 h-4 fill-white" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Daftar Favorit</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Kotoba tersimpan</div>
                  </button>

                  {/* Kotoba Saya */}
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Kotoba Saya',
                        text: 'Daftar kosakata pribadi yang Anda tambahkan sendiri.',
                        icon: 'info'
                      });
                    }}
                    className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 hover:bg-purple-100/60 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Kotoba Saya</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Daftar belajar pribadi</div>
                  </button>
                </div>
              </div>

              {/* Card 4: Kumpulkan dan Kuasai Kotoba! (Motivational) */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50/60 to-pink-50/30 border border-pink-100/90 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-pink-200 shadow-sm bg-white">
                  <img
                    src={animeGirlImg}
                    alt="Anime Schoolgirl Studying"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    Kumpulkan dan Kuasai Kotoba!
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Semakin banyak kotoba yang kamu pelajari, semakin mudah kamu memahami bahasa Jepang!
                  </p>
                  <div className="mt-2 text-[10px] font-semibold text-rose-600">
                    🌸 Semangat menghafal hari ini!
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
