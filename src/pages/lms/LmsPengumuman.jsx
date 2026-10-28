import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  Megaphone, 
  Plus, 
  Search, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Eye, 
  BookOpen, 
  Award, 
  GraduationCap, 
  Settings, 
  Bell, 
  ChevronDown, 
  X, 
  Check, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Share2, 
  User, 
  CheckCircle2, 
  MoreHorizontal,
  Compass,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';

export default function LmsPengumuman() {
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua' | 'Akademik' | 'Kegiatan' | 'Jadwal' | 'Beasiswa' | 'Lainnya'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Terbaru'); // 'Terbaru' | 'Terlama' | 'Paling Banyak Dilihat'
  const [isNotifActive, setIsNotifActive] = useState(false);

  // Modal states
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating announcement
  const [newForm, setNewForm] = useState({
    title: '',
    category: 'Akademik',
    author: 'Admin Sekolah',
    date: '20 Okt 2026',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=350'
  });

  // Master Announcements Data
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Perubahan Jadwal Ujian Kompetensi N5',
      category: 'Penting',
      badgeColor: 'rose',
      description: 'Ujian Kompetensi N5 yang semula dijadwalkan pada 15 Oktober 2026 diundur menjadi 17 Oktober 2026 karena ada kegiatan sekolah. Mohon seluruh siswa menyesuaikan jadwal dan mempersiapkan diri dengan baik.',
      fullContent: `Diberitahukan kepada seluruh siswa/siswi kelas persiapan JLPT N5 di LPK Creativa:
      
Sehubungan dengan adanya agenda koordinasi dan akreditasi sekolah bersama pihak asosiasi Jepang, maka pelaksanaan Ujian Kompetensi N5 dijadwalkan ulang sebagai berikut:

• Jadwal Semula: Kamis, 15 Oktober 2026 (08:00 - 09:00 WIB)
• Jadwal Baru: Sabtu, 17 Oktober 2026 (08:00 - 09:00 WIB)
• Format Ujian: Computer Based Test (CBT) melalui platform LMS Creativa

Mohon seluruh siswa memanfaatkan waktu tambahan ini untuk mengulang kembali materi huruf Kanji, kosakata Bab 1-6, dan pola kalimat partikel. Pastikan koneksi internet stabil sebelum waktu pengerjaan dimulai.`,
      author: 'Admin Sekolah',
      authorRole: 'Sekretariat Akademik',
      date: '12 Okt 2026',
      views: 234,
      image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=350',
      isCalendarGraphic: true,
      calendarDate: '17',
      calendarMonth: 'OCT'
    },
    {
      id: 2,
      title: 'Materi Baru Telah Tersedia – Bab 3',
      category: 'Akademik',
      badgeColor: 'blue',
      description: 'Materi pembelajaran Bab 3 (Perkenalan Diri) sudah diunggah pada menu Materi. Silakan pelajari dan kerjakan tugas latihan yang telah disediakan.',
      fullContent: `Konnichiwa minna-san!

Modul materi terbaru untuk Bab 3: "Jikoshoukai / Perkenalan Diri" kini telah resmi dirilis di tab Materi LMS. Pembahasan mencakup:
1. Pola kalimat dasar: ~ wa ~ desu & ~ dewa arimasen.
2. Kosakata kebangsaan, profesi, dan umur.
3. Audio latihan kaiwa pendengaran penutur asli Jepang.
4. Lembar kerja latihan penulisan Katakana.

Silakan unduh modul PDF dan selesaikan tugas latihan sebelum pertemuan tatap muka berikutnya. Selamat belajar!`,
      author: 'Sensei Ayu',
      authorRole: 'Pengajar Bahasa Jepang',
      date: '10 Okt 2026',
      views: 189,
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=350'
    },
    {
      id: 3,
      title: 'Pengumuman Kegiatan Budaya Jepang (Culture Day)',
      category: 'Kegiatan',
      badgeColor: 'emerald',
      description: 'Sekolah akan mengadakan kegiatan budaya Jepang pada 25 Oktober 2026. Akan ada lomba, pertunjukan, dan makanan khas Jepang. Semua siswa diwajibkan mengikuti kegiatan ini.',
      fullContent: `Hai seluruh keluarga besar LPK Creativa!

Dalam rangka mempererat silaturahmi dan mengenalkan budaya kerja serta kehidupan sosial di Jepang, LPK Creativa akan menyelenggarakan acara "Creativa Japan Culture Day 2026" pada:

• Hari / Tanggal: Minggu, 25 Oktober 2026
• Waktu: 09:00 - 15:00 WIB
• Lokasi: Aula Utama LPK Creativa & Halaman Budaya
• Rangkaian Acara:
  - Lomba Shodou (Kaligrafi Jepang)
  - Lomba Speech Contest Bahasa Jepang N5 & N4
  - Workshop Memakai Yukata & Origami
  - Festival Kuliner Takoyaki, Dorayaki & Matcha

Kehadiran seluruh siswa bernilai poin partisipasi 10% untuk mata pelajaran Budaya Kerja Jepang.`,
      author: 'Admin Sekolah',
      authorRole: 'Panitia Acara',
      date: '8 Okt 2026',
      views: 320,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=350'
    },
    {
      id: 4,
      title: 'Batas Pengumpulan Tugas Akhir Bab 2',
      category: 'Jadwal',
      badgeColor: 'amber',
      description: 'Pengumpulan tugas akhir Bab 2 (Kata Kerja) paling lambat tanggal 14 Oktober 2026 pukul 23:59. Tugas yang dikumpulkan setelah batas waktu tidak akan dinilai.',
      fullContent: `Pengingat Penting Tugas Bab 2:

Batas akhir submisi Tugas Mandiri Bab 2: Rekaman Percakapan Singkat (Kaiwa) dan Latihan Konjugasi Kata Kerja Bentuk Masu adalah:
• Deadline: Rabu, 14 Oktober 2026, Pukul 23:59 WIB.
• Format: File audio MP3/M4A atau rekaman langsung di LMS.

Pastikan rekaman suara terdengar jelas dengan pelafalan intonasi yang tepat. Keterlambatan tanpa konfirmasi sebelumnya akan otomatis mengurangi nilai akhir tugas sebesar 20 poin.`,
      author: 'Sensei Dika',
      authorRole: 'Instruktur Tata Bahasa',
      date: '7 Okt 2026',
      views: 176,
      image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=350'
    },
    {
      id: 5,
      title: 'Informasi Program Beasiswa Siswa Berprestasi',
      category: 'Beasiswa',
      badgeColor: 'purple',
      description: 'Sekolah membuka program beasiswa untuk siswa berprestasi periode 2026. Informasi lengkap dapat dilihat pada lampiran pengumuman ini.',
      fullContent: `Pemberitahuan Program Beasiswa Unggulan LPK Creativa 2026:

Diberikan bantuan beasiswa subsidi biaya pelatihan dan tiket keberangkatan program Tokutei Ginou bagi 3 siswa dengan peringkat tertinggi (Top 3 Leaderboard) selama 3 bulan berturut-turut.

Persyaratan:
1. Mempertahankan nilai rata-rata di atas 88.0.
2. Tingkat kehadiran presensi minimal 95%.
3. Lulus Ujian Kompetensi JLPT N5 / JFT-Basic pada kesempatan pertama.
4. Aktif berpartisipasi dalam diskusi kelas dan tugas harian.

Pendaftaran dan verifikasi berkas dibuka mulai 5 Oktober s/d 20 Oktober 2026 di ruang tata usaha.`,
      author: 'Admin Sekolah',
      authorRole: 'Bagian Kemahasiswaan & Kerjasama',
      date: '5 Okt 2026',
      views: 412,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=350'
    },
    {
      id: 6,
      title: 'Pemeliharaan Sistem LMS',
      category: 'Lainnya',
      badgeColor: 'slate',
      description: 'Akan dilakukan pemeliharaan sistem LMS pada tanggal 20 Oktober 2026 pukul 22:00 – 02:00 WIB. Selama waktu tersebut, akses ke LMS mungkin akan terganggu.',
      fullContent: `Pemberitahuan Pemeliharaan Rutin Server (Scheduled Maintenance):

Dalam rangka peningkatan performa server database, kecepatan akses materi video, serta pembaruan fitur CBT Ujian Kompetensi, sistem LMS Creativa akan melakukan maintenance berkala:

• Waktu: Selasa, 20 Oktober 2026
• Durasi: 22:00 - 02:00 WIB (4 Jam)
• Dampak: Portal siswa dan instruktur tidak dapat diakses sementara.

Seluruh data tugas dan ujian yang telah tersimpan tidak akan terpengaruh. Mohon menyimpan draf pengerjaan Anda sebelum waktu pemeliharaan dimulai. Terima kasih atas pengertiannya.`,
      author: 'IT Support',
      authorRole: 'Divisi Teknologi Informasi',
      date: '3 Okt 2026',
      views: 128,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=350'
    }
  ]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      Semua: 12,
      Penting: 3,
      Akademik: 5,
      Kegiatan: 3,
      Jadwal: 2,
      Beasiswa: 1,
      Lainnya: 1
    };
  }, []);

  // Filtered and Sorted announcements
  const filteredAnnouncements = useMemo(() => {
    let result = [...announcements];

    // Filter by Tab
    if (activeTab !== 'Semua') {
      result = result.filter(a => a.category.toLowerCase() === activeTab.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'Terbaru') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'Terlama') {
      result.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'Paling Banyak Dilihat') {
      result.sort((a, b) => b.views - a.views);
    }

    return result;
  }, [announcements, activeTab, searchQuery, sortBy]);

  // Toggle Notifications
  const handleToggleNotification = () => {
    const nextState = !isNotifActive;
    setIsNotifActive(nextState);
    if (nextState) {
      Swal.fire({
        title: '🔔 Notifikasi Diaktifkan!',
        text: 'Anda akan menerima pemberitahuan setiap ada pengumuman baru dari pengajar atau sekolah.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });
    } else {
      Swal.fire({
        title: 'Notifikasi Dimatikan',
        text: 'Notifikasi pengumuman telah dinonaktifkan.',
        icon: 'info',
        confirmButtonColor: '#64748b'
      });
    }
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newForm.title || !newForm.content) {
      Swal.fire('Form Belum Lengkap', 'Judul dan isi pengumuman wajib diisi!', 'warning');
      return;
    }

    const newObj = {
      id: Date.now(),
      title: newForm.title,
      category: newForm.category,
      badgeColor: 
        newForm.category === 'Penting' ? 'rose' :
        newForm.category === 'Akademik' ? 'blue' :
        newForm.category === 'Kegiatan' ? 'emerald' :
        newForm.category === 'Jadwal' ? 'amber' :
        newForm.category === 'Beasiswa' ? 'purple' : 'slate',
      description: newForm.content.slice(0, 150) + (newForm.content.length > 150 ? '...' : ''),
      fullContent: newForm.content,
      author: newForm.author,
      authorRole: 'Sekretariat Sekolah',
      date: '20 Okt 2026',
      views: 1,
      image: newForm.imageUrl
    };

    setAnnouncements(prev => [newObj, ...prev]);
    setIsCreateModalOpen(false);
    setNewForm({
      title: '',
      category: 'Akademik',
      author: 'Admin Sekolah',
      date: '20 Okt 2026',
      content: '',
      imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=350'
    });

    Swal.fire({
      title: 'Pengumuman Berhasil Diterbitkan!',
      text: 'Pengumuman baru telah tampil di feed siswa dan pengajar.',
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        
        {/* ================= TOP HEADER WITH SAKURA & MT FUJI ARTWORK ================= */}
        <div className="relative overflow-hidden bg-white border-b border-slate-100 shadow-sm px-6 py-6 md:px-8">
          <div 
            className="absolute top-0 right-0 w-[420px] h-full opacity-15 pointer-events-none bg-right bg-cover"
            style={{ 
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1550px] mx-auto">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span>Beranda</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Pengumuman</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pengumuman
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Informasi penting terkait kegiatan belajar, jadwal, dan acara dari sekolah atau pengajar.
              </p>
            </div>

            {/* Right Action Button: + Buat Pengumuman */}
            <div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm transition-all"
              >
                <Megaphone className="w-4 h-4" />
                <span>Buat Pengumuman</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN MAIN CONTENT ================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ----------------- LEFT COLUMN: FEED PENGUMUMAN (8-9 COLS) ----------------- */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              
              {/* Filter Tabs & Search Bar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Horizontal Category Tabs */}
                <div className="flex items-center gap-5 overflow-x-auto no-scrollbar text-xs md:text-sm font-semibold">
                  <button
                    onClick={() => setActiveTab('Semua')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Semua'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Semua ({categoryCounts.Semua})
                  </button>
                  <button
                    onClick={() => setActiveTab('Akademik')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Akademik'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Akademik ({categoryCounts.Akademik})
                  </button>
                  <button
                    onClick={() => setActiveTab('Kegiatan')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Kegiatan'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Kegiatan ({categoryCounts.Kegiatan})
                  </button>
                  <button
                    onClick={() => setActiveTab('Jadwal')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Jadwal'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Jadwal ({categoryCounts.Jadwal})
                  </button>
                  <button
                    onClick={() => setActiveTab('Beasiswa')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Beasiswa'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Beasiswa ({categoryCounts.Beasiswa})
                  </button>
                  <button
                    onClick={() => setActiveTab('Lainnya')}
                    className={`pb-2 whitespace-nowrap transition-all relative ${
                      activeTab === 'Lainnya'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Lainnya ({categoryCounts.Lainnya})
                  </button>
                </div>

                {/* Search Input & Sort Dropdown */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari pengumuman..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 w-36 md:w-44 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-semibold outline-none cursor-pointer pr-6 appearance-none"
                    >
                      <option value="Terbaru">Terbaru</option>
                      <option value="Paling Banyak Dilihat">Terpopuler</option>
                      <option value="Terlama">Terlama</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Announcement Cards List */}
              <div className="space-y-3.5">
                {filteredAnnouncements.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAnnouncement(item)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer group"
                    >
                      {/* Left Thumbnail */}
                      <div className="w-full sm:w-36 h-28 rounded-2xl overflow-hidden flex-shrink-0 relative bg-slate-100">
                        {item.isCalendarGraphic ? (
                          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200">
                            <img 
                              src={bannerImg} 
                              alt="Sakura" 
                              className="absolute inset-0 w-full h-full object-cover opacity-60" 
                            />
                            {/* Calendar Leaf Overlay */}
                            <div className="relative z-10 bg-white/95 rounded-xl border border-rose-200 shadow-md py-1.5 px-3 text-center">
                              <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1"></div>
                              <span className="text-xl font-black text-rose-600 block leading-tight">
                                {item.calendarDate}
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                {item.calendarMonth}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=350';
                            }}
                          />
                        )}
                      </div>

                      {/* Middle Details */}
                      <div className="flex-1 min-w-0">
                        
                        {/* Category Pill */}
                        <div className="mb-1.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.badgeColor === 'rose' ? 'bg-rose-50 text-rose-500 border border-rose-200/60' :
                            item.badgeColor === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-200/60' :
                            item.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
                            item.badgeColor === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-200/60' :
                            item.badgeColor === 'purple' ? 'bg-purple-50 text-purple-600 border border-purple-200/60' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {item.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2.5">
                          <div className="flex items-center gap-1.5">
                            <Megaphone className="w-3 h-3 text-slate-400" />
                            <span>{item.author}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            <span>{item.date}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{item.views} dilihat</span>
                          </div>
                        </div>

                      </div>

                      {/* Right Chevron */}
                      <div className="hidden sm:block self-center pr-1">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>

                    </div>
                  );
                })}

                {filteredAnnouncements.length === 0 && (
                  <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Tidak ada pengumuman ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih tab "Semua".</p>
                  </div>
                )}
              </div>

            </div>

            {/* ----------------- RIGHT COLUMN: WIDGETS & SIDEBAR (4 COLS) ----------------- */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-5">
              
              {/* Card 1: Pengumuman Terbaru */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    Pengumuman Terbaru
                  </h3>
                  <button 
                    onClick={() => setActiveTab('Semua')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  
                  {/* Item 1 */}
                  <div 
                    onClick={() => setSelectedAnnouncement(announcements[0])}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 border border-rose-100">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          Perubahan Jadwal Ujian Kompetensi N5
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          12 Okt 2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-500 border border-rose-200/60">
                      Penting
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div 
                    onClick={() => setSelectedAnnouncement(announcements[1])}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          Materi Baru Telah Tersedia
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          10 Okt 2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                      Akademik
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div 
                    onClick={() => setSelectedAnnouncement(announcements[2])}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          Kegiatan Budaya Jepang
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          8 Okt 2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                      Kegiatan
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div 
                    onClick={() => setSelectedAnnouncement(announcements[3])}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          Batas Pengumpulan Tugas
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          7 Okt 2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                      Jadwal
                    </span>
                  </div>

                  {/* Item 5 */}
                  <div 
                    onClick={() => setSelectedAnnouncement(announcements[4])}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          Informasi Program Beasiswa
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          5 Okt 2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-200/60">
                      Beasiswa
                    </span>
                  </div>

                </div>
              </div>

              {/* Card 2: Kategori Pengumuman */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 pb-3 mb-3 border-b border-slate-100">
                  Kategori Pengumuman
                </h3>

                <div className="space-y-2.5">
                  
                  {/* Penting */}
                  <div 
                    onClick={() => setActiveTab('Semua')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Penting</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">3</span>
                  </div>

                  {/* Akademik */}
                  <div 
                    onClick={() => setActiveTab('Akademik')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Akademik</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">5</span>
                  </div>

                  {/* Kegiatan */}
                  <div 
                    onClick={() => setActiveTab('Kegiatan')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Kegiatan</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">3</span>
                  </div>

                  {/* Jadwal */}
                  <div 
                    onClick={() => setActiveTab('Jadwal')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Jadwal</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">2</span>
                  </div>

                  {/* Beasiswa */}
                  <div 
                    onClick={() => setActiveTab('Beasiswa')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Beasiswa</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">1</span>
                  </div>

                  {/* Lainnya */}
                  <div 
                    onClick={() => setActiveTab('Lainnya')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Lainnya</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">1</span>
                  </div>

                </div>
              </div>

              {/* Card 3: Jangan Lewatkan Informasi Penting (CTA Notifikasi) */}
              <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 border border-blue-100 rounded-3xl p-5 shadow-sm">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/25">
                    <Megaphone className="w-6 h-6 -rotate-12" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Jangan Lewatkan Informasi Penting!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Aktifkan notifikasi agar selalu mendapatkan pengumuman terbaru.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleNotification}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isNotifActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-blue-600 border border-blue-400 shadow-xs'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>{isNotifActive ? 'Notifikasi Aktif ✓' : 'Aktifkan Notifikasi'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ================= MODAL DETAIL PENGUMUMAN ================= */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedAnnouncement.badgeColor === 'rose' ? 'bg-rose-500 text-white' :
                    selectedAnnouncement.badgeColor === 'blue' ? 'bg-blue-500 text-white' :
                    selectedAnnouncement.badgeColor === 'emerald' ? 'bg-emerald-500 text-white' :
                    selectedAnnouncement.badgeColor === 'amber' ? 'bg-amber-500 text-white' :
                    selectedAnnouncement.badgeColor === 'purple' ? 'bg-purple-500 text-white' :
                    'bg-slate-600 text-white'
                  }`}>
                    {selectedAnnouncement.category}
                  </span>
                  <span className="text-xs text-slate-400">• {selectedAnnouncement.date}</span>
                </div>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                
                {/* Title */}
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight leading-snug">
                  {selectedAnnouncement.title}
                </h2>

                {/* Author Info Card */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{selectedAnnouncement.author}</div>
                      <div className="text-[11px] text-slate-400">{selectedAnnouncement.authorRole}</div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{selectedAnnouncement.views} pembaca</span>
                  </div>
                </div>

                {/* Full text content */}
                <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white py-2">
                  {selectedAnnouncement.fullContent || selectedAnnouncement.description}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    Swal.fire({ title: 'Tautan Tersalin!', icon: 'success', timer: 1200, showConfirmButton: false });
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan</span>
                </button>

                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= MODAL BUAT PENGUMUMAN ================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  <h3 className="text-base font-bold">Buat Pengumuman Baru</h3>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Pengumuman
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jadwal Ujian Tengah Semester N5"
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    className="w-full text-xs md:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={newForm.category}
                      onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Penting">Penting</option>
                      <option value="Akademik">Akademik</option>
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Jadwal">Jadwal</option>
                      <option value="Beasiswa">Beasiswa</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Penulis / Pengirim
                    </label>
                    <select
                      value={newForm.author}
                      onChange={(e) => setNewForm({ ...newForm, author: e.target.value })}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Admin Sekolah">Admin Sekolah</option>
                      <option value="Sensei Ayu">Sensei Ayu</option>
                      <option value="Sensei Dika">Sensei Dika</option>
                      <option value="IT Support">IT Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Isi Pengumuman Lengkap
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Tuliskan isi pengumuman secara rinci..."
                    value={newForm.content}
                    onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                    className="w-full text-xs md:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terbitkan Pengumuman</span>
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
