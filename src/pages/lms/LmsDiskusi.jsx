import { useState, useMemo, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Share2, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  MoreVertical, 
  X, 
  Filter, 
  BookOpen, 
  HelpCircle, 
  Flame, 
  Clock, 
  Check, 
  ThumbsUp, 
  ArrowUpDown,
  Smile,
  FileText,
  Volume2
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlCheerImg from '../../assets/anime_girl_cheer.jpg';
import ibuTiffaImg from '../../assets/IbuTiffa.png';
import pakAlvinImg from '../../assets/PakAlvin.png';
import navridaImg from '../../assets/Navrida.png';

// Default mock discussions seeded exactly from user mockup
const INITIAL_DISCUSSIONS = [
  {
    id: 1,
    title: "Pertanyaan tentang Pola Kalimat 〜ています",
    tag: "N5 A - Bahasa Jepang",
    tagColor: "bg-sky-50 text-sky-700 border-sky-200",
    iconType: "grammar",
    iconBg: "bg-purple-100 text-purple-600",
    author: {
      name: "Rina Aulia",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
    },
    time: "10 menit lalu",
    timestamp: Date.now() - 10 * 60 * 1000,
    likes: 12,
    repliesCount: 3,
    content: "Sensei, saya masih bingung penggunaan pola kalimat 〜ています untuk kegiatan sehari-hari. Apakah pola ini hanya untuk kegiatan yang sedang berlangsung saat ini?",
    noteBox: {
      title: "〜 て い ま す",
      items: [
        "例：・食べています",
        "    ・勉強しています",
        "    ・仕事をしています"
      ]
    },
    answers: [
      {
        id: 101,
        author: {
          name: "Sensei Ayu",
          role: "Pengajar",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
        },
        time: "8 menit lalu",
        isBestAnswer: true,
        content: `Bagus sekali pertanyaannya, Rina!\nPola 〜ています digunakan untuk menyatakan kegiatan yang sedang berlangsung saat ini atau kegiatan yang rutin dilakukan.\nBerikut contohnya:\n• 今、食べています。(sedang makan sekarang)\n• 毎日 勉強しています。(setiap hari belajar)\n• 今仕事をしています。(sedang bekerja sekarang)`,
        likes: 12
      },
      {
        id: 102,
        author: {
          name: "Budi Santoso",
          role: "Siswa",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
        },
        time: "5 menit lalu",
        isBestAnswer: false,
        content: "Kalau kegiatan yang sudah selesai, apakah tetap menggunakan 〜ています?",
        likes: 2
      }
    ]
  },
  {
    id: 2,
    title: "Review Kosakata Bab 2",
    tag: "N5 B - Bahasa Jepang",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
    iconType: "vocab",
    iconBg: "bg-amber-100 text-amber-600",
    author: {
      name: "Dewi Lestari",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    time: "2 jam lalu",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    likes: 8,
    repliesCount: 5,
    content: "Halo minna-san, ada yang punya trik cepat menghafal kata penunjuk posisi benda di Bab 2 Minna no Nihongo? Terutama perbedaan pemakaian kore, sore, dan are.",
    noteBox: {
      title: "これ・それ・あれ・どれ",
      items: [
        "・これ : Benda dekat pembicara",
        "・それ : Benda dekat lawan bicara",
        "・あれ : Benda jauh dari keduanya",
        "・どれ : Yang mana (kata tanya)"
      ]
    },
    answers: [
      {
        id: 201,
        author: {
          name: "Sensei Ayu",
          role: "Pengajar",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
        },
        time: "1 jam lalu",
        isBestAnswer: true,
        content: "Ingat prinsip KO-SO-A-DO ya minna-san. Ko (dekat saya), So (dekat kamu), A (jauh dari kita), Do (tanya). Sangat mudah diingat!",
        likes: 7
      }
    ]
  },
  {
    id: 3,
    title: "Tips Menghafal Hiragana",
    tag: "N4 A - Bahasa Jepang",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    iconType: "tips",
    iconBg: "bg-purple-100 text-purple-600",
    author: {
      name: "Kenji Pratama",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    },
    time: "5 jam lalu",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    likes: 15,
    repliesCount: 7,
    content: "Bagaimana cara teman-teman membedakan karakter Hiragana yang bentuknya mirip seperti さ (sa) vs き (ki) dan わ (wa) vs ね (ne) vs れ (re)? Sering tertukar pas kuis cepat.",
    noteBox: {
      title: "Tips Visual Huruf Mirip",
      items: [
        "・さ (sa) : 1 garis melintang horizontal",
        "・き (ki) : 2 garis melintang horizontal (ingat kunci)",
        "・ね (ne) : Ada lilitan ekor kucing (neko)"
      ]
    },
    answers: [
      {
        id: 301,
        author: {
          name: "Rina Aulia",
          role: "Siswa",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
        },
        time: "4 jam lalu",
        isBestAnswer: true,
        content: "Aku pakai asosiasi gambar seperti flashcard di Kotoba! Huruf ね (ne) ekornya melingkar seperti ekor neko (kucing). Beneran ampuh banget!",
        likes: 9
      }
    ]
  },
  {
    id: 4,
    title: "Latihan Percakapan Sehari-hari",
    tag: "N5 A - Bahasa Jepang",
    tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconType: "kaiwa",
    iconBg: "bg-indigo-100 text-indigo-600",
    author: {
      name: "Ahmad Fauzi",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    time: "1 hari lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    likes: 9,
    repliesCount: 2,
    content: "Apakah ada teman sekelas yang mau sparring kaiwa perkenalan diri (Jikoshoukai) dan belanja di kombini nanti sore via voice note atau di lab?",
    answers: [
      {
        id: 401,
        author: {
          name: "Budi Santoso",
          role: "Siswa",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
        },
        time: "20 jam lalu",
        isBestAnswer: false,
        content: "Gas sore jam 16:30 setelah kelas tatap muka ya Fauzi! Nanti kita coba skenario kasir Lawson.",
        likes: 3
      }
    ]
  },
  {
    id: 5,
    title: "Perbedaan は dan が",
    tag: "N5 B - Bahasa Jepang",
    tagColor: "bg-orange-50 text-orange-700 border-orange-200",
    iconType: "grammar",
    iconBg: "bg-orange-100 text-orange-600",
    author: {
      name: "Siti Rahma",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
    },
    time: "1 hari lalu",
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    likes: 11,
    repliesCount: 4,
    content: "Sering sekali bingung kapan harus memakai partikel は (wa) dan kapan memakai が (ga) sebagai subjek kalimat. Kapan kondisi tepatnya?",
    noteBox: {
      title: "Perbandingan は vs が",
      items: [
        "・A は B です : Topik umum / info utama ada di B",
        "・A が 好きです : Penekanan subjek spesifik (A)",
        "・誰が来ましたか : Kata tanya subjek selalu pakai が"
      ]
    },
    answers: [
      {
        id: 501,
        author: {
          name: "Sensei Ayu",
          role: "Pengajar",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
        },
        time: "1 hari lalu",
        isBestAnswer: true,
        content: "Singkatnya: 'は' adalah penanda TOPIK (bicara tentang apa), sedangkan 'が' adalah penanda SUBJEK PELAKU (siapa persisnya yang melakukan).",
        likes: 14
      }
    ]
  },
  {
    id: 6,
    title: "Persiapan Ujian N5",
    tag: "Kelas Umum",
    tagColor: "bg-rose-50 text-rose-700 border-rose-200",
    iconType: "exam",
    iconBg: "bg-rose-100 text-rose-600",
    author: {
      name: "Dimas Anggara",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face"
    },
    time: "2 hari lalu",
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    likes: 20,
    repliesCount: 8,
    content: "Teman-teman persiapan try out Ujian N5 minggu depan sampai bab berapa ya? Apakah materi Choukai (listening) sudah mencakup aksen cepat?",
    answers: []
  },
  {
    id: 7,
    title: "Berbagi Pengalaman Belajar",
    tag: "Kelas Umum",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconType: "sharing",
    iconBg: "bg-emerald-100 text-emerald-600",
    author: {
      name: "Fani Santika",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face"
    },
    time: "3 hari lalu",
    timestamp: Date.now() - 72 * 60 * 60 * 1000,
    likes: 18,
    repliesCount: 12,
    content: "Sudah sebulan belajar di LPK Creativa, progres kanji dari 0 sekarang sudah hafal 80 kanji dasar! Kuncinya latihan konsisten 15 menit setiap pagi.",
    answers: []
  },
  {
    id: 8,
    title: "Rekomendasi Anime untuk Belajar",
    tag: "Kelas Umum",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
    iconType: "anime",
    iconBg: "bg-amber-100 text-amber-600",
    author: {
      name: "Rizky Ramadhan",
      role: "Siswa",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face"
    },
    time: "3 hari lalu",
    timestamp: Date.now() - 75 * 60 * 60 * 1000,
    likes: 14,
    repliesCount: 6,
    content: "Sensei dan teman-teman, boleh minta rekomendasi anime slice-of-life dengan pelafalan bahasa Jepang yang santun dan jelas untuk pemula N5?",
    answers: []
  }
];

export default function LmsDiskusi() {
  // Current user (Student Rina Aulia default)
  const [currentUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: stored.name || stored.full_name || 'Rina Aulia',
        role: 'Siswa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
      };
    } catch {
      return {
        name: 'Rina Aulia',
        role: 'Siswa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
      };
    }
  });

  // Discussions state from localStorage or initial
  const [discussions, setDiscussions] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_discussions_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DISCUSSIONS;
  });

  // Active topic selection
  const [activeId, setActiveId] = useState(1);

  // Active filter tab: 'Semua' | 'Kelas Saya' | 'Belum Dijawab' | 'Terbaru' | 'Favorit'
  const [activeTab, setActiveTab] = useState('Semua');

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites / bookmarks in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_discussion_favs') || '[]');
    } catch {
      return [];
    }
  });

  // Liked items in localStorage
  const [likedPosts, setLikedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_discussion_liked') || '{}');
    } catch {
      return {};
    }
  });

  // Reply input text
  const [replyText, setReplyText] = useState('');

  // Sort order in thread: 'Terbaru' | 'Terlama' | 'Terbanyak Disukai'
  const [sortBy, setSortBy] = useState('Terbaru');

  // Modal new topic state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    tag: 'N5 A - Bahasa Jepang',
    content: '',
    noteTitle: '',
    noteItems: ''
  });

  const replyInputRef = useRef(null);

  // Persist discussions
  useEffect(() => {
    try {
      localStorage.setItem('lms_discussions_data', JSON.stringify(discussions));
    } catch (e) {
      console.error(e);
    }
  }, [discussions]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('lms_discussion_favs', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Persist likes
  useEffect(() => {
    try {
      localStorage.setItem('lms_discussion_liked', JSON.stringify(likedPosts));
    } catch (e) {
      console.error(e);
    }
  }, [likedPosts]);

  // Filtered discussions list
  const filteredDiscussions = useMemo(() => {
    return discussions.filter(item => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesTag = item.tag.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        const matchesAuthor = item.author.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesContent && !matchesAuthor) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'Kelas Saya') {
        return item.tag.includes('N5 A') || item.tag.includes('N5 B') || item.tag.includes('N4 A');
      }
      if (activeTab === 'Belum Dijawab') {
        return !item.answers || item.answers.length === 0;
      }
      if (activeTab === 'Favorit') {
        return favorites.includes(item.id);
      }
      return true;
    }).sort((a, b) => {
      if (activeTab === 'Terbaru') {
        return (b.timestamp || b.id) - (a.timestamp || a.id);
      }
      return 0;
    });
  }, [discussions, searchQuery, activeTab, favorites]);

  // Current selected discussion object
  const activeDiscussion = useMemo(() => {
    return discussions.find(d => d.id === activeId) || filteredDiscussions[0] || discussions[0];
  }, [discussions, activeId, filteredDiscussions]);

  // Toggle favorite for a discussion
  const handleToggleFavorite = (id, e) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: exists ? 'info' : 'success',
        title: exists ? 'Dihapus dari favorit' : 'Disimpan ke favorit ⭐',
        showConfirmButton: false,
        timer: 1600
      });
      return next;
    });
  };

  // Toggle like on main discussion
  const handleToggleLikeDiscussion = (id) => {
    const isLiked = !!likedPosts[`disc_${id}`];
    setLikedPosts(prev => ({
      ...prev,
      [`disc_${id}`]: !isLiked
    }));

    setDiscussions(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          likes: isLiked ? Math.max(0, d.likes - 1) : d.likes + 1
        };
      }
      return d;
    }));
  };

  // Toggle like on an answer
  const handleToggleLikeAnswer = (answerId) => {
    const isLiked = !!likedPosts[`ans_${answerId}`];
    setLikedPosts(prev => ({
      ...prev,
      [`ans_${answerId}`]: !isLiked
    }));

    setDiscussions(prev => prev.map(d => {
      if (d.id === activeDiscussion.id && d.answers) {
        return {
          ...d,
          answers: d.answers.map(ans => {
            if (ans.id === answerId) {
              return {
                ...ans,
                likes: isLiked ? Math.max(0, ans.likes - 1) : ans.likes + 1
              };
            }
            return ans;
          })
        };
      }
      return d;
    }));
  };

  // Submit quick reply
  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;

    const newAnswer = {
      id: Date.now(),
      author: {
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar
      },
      time: 'Baru saja',
      isBestAnswer: false,
      content: replyText.trim(),
      likes: 0
    };

    setDiscussions(prev => prev.map(d => {
      if (d.id === activeDiscussion.id) {
        const answers = d.answers ? [...d.answers, newAnswer] : [newAnswer];
        return {
          ...d,
          answers,
          repliesCount: answers.length
        };
      }
      return d;
    }));

    setReplyText('');

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Tanggapan berhasil dikirim! 💬',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Create new discussion topic
  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      Swal.fire('Perhatian', 'Judul dan isi pertanyaan wajib diisi.', 'warning');
      return;
    }

    let noteBox = null;
    if (newTopic.noteTitle.trim() || newTopic.noteItems.trim()) {
      noteBox = {
        title: newTopic.noteTitle.trim() || 'Catatan Kalimat',
        items: newTopic.noteItems.split('\n').filter(line => line.trim())
      };
    }

    const created = {
      id: Date.now(),
      title: newTopic.title.trim(),
      tag: newTopic.tag,
      tagColor: newTopic.tag.includes('N5 A') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                newTopic.tag.includes('N5 B') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                newTopic.tag.includes('N4') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                'bg-rose-50 text-rose-700 border-rose-200',
      iconType: 'grammar',
      iconBg: 'bg-purple-100 text-purple-600',
      author: {
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar
      },
      time: 'Baru saja',
      timestamp: Date.now(),
      likes: 0,
      repliesCount: 0,
      content: newTopic.content.trim(),
      noteBox,
      answers: []
    };

    setDiscussions(prev => [created, ...prev]);
    setActiveId(created.id);
    setIsModalOpen(false);
    setNewTopic({
      title: '',
      tag: 'N5 A - Bahasa Jepang',
      content: '',
      noteTitle: '',
      noteItems: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Topik Diskusi Terbit! 🎉',
      text: 'Pertanyaan Anda telah dibagikan ke forum kelas.',
      confirmButtonColor: '#2563eb'
    });
  };

  // Helper for card category icon
  const renderCardIcon = (iconType, customBg) => {
    switch (iconType) {
      case 'vocab':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-amber-100 text-amber-600'}`}>
            <BookOpen className="w-5 h-5" />
          </div>
        );
      case 'tips':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-purple-100 text-purple-600'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'kaiwa':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-indigo-100 text-indigo-600'}`}>
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'exam':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-rose-100 text-rose-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'sharing':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-emerald-100 text-emerald-600'}`}>
            <Smile className="w-5 h-5" />
          </div>
        );
      case 'anime':
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-amber-100 text-amber-600'}`}>
            <Flame className="w-5 h-5" />
          </div>
        );
      default: // grammar
        return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${customBg || 'bg-purple-100 text-purple-600'}`}>
            <HelpCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
        
        {/* ============================================================ */}
        {/* HEADER HERO (1:1 PIXEL PERFECT WITH SAKURA & FUJI BACKGROUND) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-pink-50/60 via-sky-50/40 to-white border-b border-slate-200/80 px-4 md:px-8 py-5 overflow-hidden">
          
          {/* Subtle Japanese Fuji & Pagoda Sakura backdrop overlay */}
          <div 
            className="absolute top-0 right-0 w-[500px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-600 font-semibold">Diskusi</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Diskusi Kelas
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Diskusi dan bertanya bersama Sensei dan teman-teman.
              </p>
            </div>

            {/* + Buat Topik Diskusi Button */}
            <div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Topik Diskusi</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* HORIZONTAL FILTER TABS (1:1 PILL TABS) */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'Semua', label: 'Semua' },
              { id: 'Kelas Saya', label: 'Kelas Saya' },
              { id: 'Belum Dijawab', label: 'Belum Dijawab' },
              { id: 'Terbaru', label: 'Terbaru' },
              { id: 'Favorit', label: 'Favorit' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'Favorit' && favorites.length > 0 && (
                    <span className="ml-1.5 bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {favorites.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN TWO-COLUMN SPLIT LAYOUT */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* -------------------------------------------------------- */}
            {/* LEFT COLUMN: TOPIC LIST (~35% / 4-5 cols) */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-3">
              
              {/* Search Bar with clear */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Cari diskusi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-9 py-2.5 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Discussions Card List */}
              <div className="space-y-2.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredDiscussions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada diskusi ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ganti filter atau kata kunci pencarian</p>
                  </div>
                ) : (
                  filteredDiscussions.map((item) => {
                    const isSelected = activeDiscussion?.id === item.id;
                    const isFav = favorites.includes(item.id);
                    const isLiked = !!likedPosts[`disc_${item.id}`];

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`p-3.5 rounded-2xl transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Left Rounded Category Icon */}
                          {renderCardIcon(item.iconType, item.iconBg)}

                          {/* Card Content Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs md:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2">
                              {item.title}
                            </h3>

                            {/* Class Badge */}
                            <div className="mt-1">
                              <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.tag}
                              </span>
                            </div>

                            {/* Meta row: Likes, Comments, Relative time */}
                            <div className="flex items-center gap-3.5 text-[11px] text-slate-400 font-medium mt-2">
                              <span className={`inline-flex items-center gap-1 ${isLiked ? 'text-rose-500' : ''}`}>
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                {item.likes}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {item.repliesCount ?? item.answers?.length ?? 0}
                              </span>
                              <span className="ml-auto text-[11px] text-slate-400">
                                {item.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* RIGHT COLUMN: MAIN DISCUSSION THREAD DETAIL (~65% / 7-8 cols) */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-4">
              
              {activeDiscussion ? (
                <>
                  {/* MAIN THREAD CONTAINER */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6">
                    
                    {/* Header: Title & Badge */}
                    <div className="space-y-2">
                      <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                        {activeDiscussion.title}
                      </h2>
                      <div>
                        <span className="inline-block text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                          {activeDiscussion.tag}
                        </span>
                      </div>
                    </div>

                    {/* Author Meta Row */}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                      <img 
                        src={activeDiscussion.author.avatar} 
                        alt={activeDiscussion.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm font-bold text-slate-900">
                            {activeDiscussion.author.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{activeDiscussion.author.role}</span>
                          <span>•</span>
                          <span>{activeDiscussion.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="mt-4 text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {activeDiscussion.content}
                    </div>

                    {/* Japanese Example Note Box (Chalkboard / Note Card) */}
                    {activeDiscussion.noteBox && (
                      <div className="mt-4 bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-4 sm:p-5 font-mono text-slate-800 text-xs md:text-sm">
                        <div className="font-bold text-center tracking-widest text-slate-900 text-sm md:text-base mb-2">
                          {activeDiscussion.noteBox.title}
                        </div>
                        <div className="space-y-1 text-slate-700 text-center sm:text-left sm:pl-10">
                          {activeDiscussion.noteBox.items.map((line, idx) => (
                            <div key={idx} className="tracking-wide">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Bar: Like, Balas, Bookmark, More */}
                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        {/* Like button */}
                        <button 
                          onClick={() => handleToggleLikeDiscussion(activeDiscussion.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            likedPosts[`disc_${activeDiscussion.id}`]
                              ? 'bg-rose-50 text-rose-600'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${likedPosts[`disc_${activeDiscussion.id}`] ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{activeDiscussion.likes}</span>
                        </button>

                        {/* Balas button */}
                        <button 
                          onClick={() => replyInputRef.current?.focus()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Balas</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bookmark / Favorit button */}
                        <button 
                          onClick={(e) => handleToggleFavorite(activeDiscussion.id, e)}
                          className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer ${
                            favorites.includes(activeDiscussion.id) ? 'text-amber-500 bg-amber-50' : ''
                          }`}
                          title="Simpan ke Favorit"
                        >
                          <Bookmark className={`w-4 h-4 ${favorites.includes(activeDiscussion.id) ? 'fill-amber-500' : ''}`} />
                        </button>

                        {/* Share / More options */}
                        <button 
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              icon: 'success',
                              title: 'Tautan disalin ke clipboard!',
                              showConfirmButton: false,
                              timer: 1600
                            });
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                          title="Salin Tautan"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* ANSWERS LIST SECTION */}
                    {/* -------------------------------------------------------- */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80">
                      
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs md:text-sm font-bold text-slate-900">
                            {activeDiscussion.answers?.length || 0} Jawaban
                          </h3>
                        </div>

                        {/* Sort Order Dropdown */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span>Urutkan:</span>
                          <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent font-semibold text-slate-700 hover:text-blue-600 focus:outline-none cursor-pointer"
                          >
                            <option value="Terbaru">Terbaru</option>
                            <option value="Terlama">Terlama</option>
                            <option value="Terpopuler">Terpopuler</option>
                          </select>
                        </div>
                      </div>

                      {/* Answers Cards */}
                      <div className="space-y-4">
                        {(!activeDiscussion.answers || activeDiscussion.answers.length === 0) ? (
                          <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                            Belum ada jawaban pada topik ini. Jadilah yang pertama memberikan tanggapan!
                          </div>
                        ) : (
                          activeDiscussion.answers.map((ans) => {
                            const isAnsLiked = !!likedPosts[`ans_${ans.id}`];

                            return (
                              <div 
                                key={ans.id}
                                className={`p-4 rounded-xl border transition-all ${
                                  ans.isBestAnswer 
                                    ? 'bg-slate-50/70 border-emerald-200/80' 
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={ans.author.avatar} 
                                      alt={ans.author.name}
                                      className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs md:text-sm font-bold text-slate-900">
                                          {ans.author.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span className="font-medium text-slate-500">{ans.author.role}</span>
                                        <span>•</span>
                                        <span>{ans.time}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Best Answer Badge */}
                                  {ans.isBestAnswer && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      Jawaban Terbaik
                                    </span>
                                  )}
                                </div>

                                {/* Answer Content Text */}
                                <div className="mt-3 text-xs md:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line pl-12">
                                  {ans.content}
                                </div>

                                {/* Answer Footer Actions */}
                                <div className="flex items-center gap-3 mt-3 pl-12">
                                  <button 
                                    onClick={() => handleToggleLikeAnswer(ans.id)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                      isAnsLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                                    }`}
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isAnsLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    <span>{ans.likes || 0}</span>
                                  </button>

                                  <button 
                                    onClick={() => {
                                      setReplyText(`@${ans.author.name} `);
                                      replyInputRef.current?.focus();
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                                  >
                                    Balas
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* ---------------------------------------------------- */}
                      {/* BOTTOM FIXED / STICKY QUICK REPLY INPUT BAR */}
                      {/* ---------------------------------------------------- */}
                      <form onSubmit={handleSendReply} className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                        <div className="relative flex-1">
                          <input 
                            ref={replyInputRef}
                            type="text"
                            placeholder="Tulis tanggapan..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-full pl-4 pr-11 py-2.5 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              Swal.fire({
                                title: 'Lampirkan Berkas',
                                text: 'Fitur lampiran gambar dan dokumen tugas sedang disiapkan.',
                                icon: 'info',
                                confirmButtonColor: '#2563eb'
                              });
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Lampirkan Dokumen/Foto"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          type="submit"
                          disabled={!replyText.trim()}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-150 cursor-pointer shrink-0 shadow-xs ${
                            replyText.trim() 
                              ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' 
                              : 'bg-blue-300 opacity-60 cursor-not-allowed'
                          }`}
                          title="Kirim Tanggapan"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* MOTIVATIONAL ANIME BANNER (EXACT 1:1 WITH MOCKUP) */}
                  {/* ======================================================== */}
                  <div className="relative bg-gradient-to-r from-pink-50 via-rose-50/70 to-orange-50/60 border border-pink-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-2xs overflow-hidden">
                    <img 
                      src={animeGirlCheerImg} 
                      alt="Semangat Belajar"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-2xs border-2 border-white shrink-0" 
                    />
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Jangan ragu untuk bertanya!</span>
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                        Diskusi adalah tempat yang aman untuk belajar bersama. Bertanyalah, berbagi, dan dukung teman-temanmu.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-700">Pilih Topik Diskusi</h3>
                  <p className="text-xs text-slate-400 mt-1">Pilih salah satu topik dari daftar di sebelah kiri untuk melihat isi dan berpartisipasi.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MODAL: BUAT TOPIK DISKUSI BARU */}
        {/* ============================================================ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Buat Topik Diskusi Baru</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tanyakan materi, pola kalimat, atau tips kepada Sensei dan teman.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateTopic} className="space-y-3.5 mt-4 text-xs md:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas / Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTopic.tag}
                    onChange={(e) => setNewTopic({ ...newTopic, tag: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="N5 A - Bahasa Jepang">N5 A - Bahasa Jepang</option>
                    <option value="N5 B - Bahasa Jepang">N5 B - Bahasa Jepang</option>
                    <option value="N4 A - Bahasa Jepang">N4 A - Bahasa Jepang</option>
                    <option value="Kelas Umum">Kelas Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Judul Topik Diskusi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pertanyaan tentang pola kalimat 〜ています"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Isi Pertanyaan / Penjelasan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan pertanyaan Anda secara jelas dan sopan..."
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Optional Japanese Note box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-700">Contoh Kalimat / Pola Jepang (Opsional):</span>
                  <input
                    type="text"
                    placeholder="Judul Pola (Contoh: 〜ています)"
                    value={newTopic.noteTitle}
                    onChange={(e) => setNewTopic({ ...newTopic, noteTitle: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <textarea
                    rows={2}
                    placeholder="Contoh (satu kalimat per baris)&#10;例：・食べています"
                    value={newTopic.noteItems}
                    onChange={(e) => setNewTopic({ ...newTopic, noteItems: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Publikasikan Topik
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
