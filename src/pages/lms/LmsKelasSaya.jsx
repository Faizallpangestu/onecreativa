import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  BookOpen, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MessageSquare, 
  Award, 
  ChevronDown, 
  Sparkles,
  FileCheck
} from 'lucide-react';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl.jpg';

export default function LmsKelasSaya() {
  const navigate = useNavigate();

  // Siswa View Tabs: 'Sedang Berjalan' | 'Akan Datang' | 'Selesai'
  const [siswaTab, setSiswaTab] = useState('Sedang Berjalan');

  // Semester Filter
  const [selectedSemester, setSelectedSemester] = useState('Semester Ganjil 2026');

  // Master Data: Kelas Siswa
  const siswaClasses = [
    {
      id: 1,
      badgeText: 'N5',
      badgeBg: 'from-rose-500 to-pink-600',
      title: 'N5 A - Pagi',
      status: 'Sedang Berjalan',
      statusCode: 'running',
      sensei: 'Sensei Ayu',
      senseiAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      days: 'Selasa & Kamis',
      time: '08:00 - 09:30',
      progress: 78
    },
    {
      id: 2,
      badgeText: 'N4',
      badgeBg: 'from-purple-600 to-indigo-700',
      title: 'N4 B - Sore',
      status: 'Sedang Berjalan',
      statusCode: 'running',
      sensei: 'Sensei Budi',
      senseiAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      days: 'Senin & Rabu',
      time: '14:00 - 15:30',
      progress: 62
    },
    {
      id: 3,
      badgeText: 'N3',
      badgeBg: 'from-emerald-500 to-teal-600',
      title: 'N3 Intensif - Siang',
      status: 'Sedang Berjalan',
      statusCode: 'running',
      sensei: 'Sensei Kenji',
      senseiAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      days: 'Setiap Hari',
      time: '10:00 - 12:00',
      progress: 85
    },
    {
      id: 4,
      badgeText: '会話',
      badgeBg: 'from-cyan-500 to-blue-600',
      title: 'Kaiwa & Tata Bahasa N4',
      status: 'Sedang Berjalan',
      statusCode: 'running',
      sensei: 'Sensei Sakura',
      senseiAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
      days: 'Jumat',
      time: '15:00 - 16:30',
      progress: 70
    },
    {
      id: 5,
      badgeText: 'N5',
      badgeBg: 'from-amber-500 to-orange-600',
      title: 'N5 C - Weekend',
      status: 'Akan Dimulai',
      statusCode: 'upcoming',
      sensei: 'Sensei Ayu',
      senseiAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      days: 'Sabtu',
      time: '10:00 - 11:30',
      progress: 0
    },
    {
      id: 6,
      badgeText: 'N5',
      badgeBg: 'from-slate-600 to-slate-800',
      title: 'N5 Pra-Dasar Hiragana & Katakana',
      status: 'Selesai',
      statusCode: 'completed',
      sensei: 'Sensei Budi',
      senseiAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      days: 'Senin - Jumat',
      time: '08:00 - 10:00',
      progress: 100
    }
  ];

  // Filtered Siswa Classes
  const filteredSiswaClasses = useMemo(() => {
    if (siswaTab === 'Akan Datang') {
      return siswaClasses.filter(c => c.statusCode === 'upcoming');
    }
    if (siswaTab === 'Selesai') {
      return siswaClasses.filter(c => c.statusCode === 'completed');
    }
    return siswaClasses.filter(c => c.statusCode === 'running');
  }, [siswaClasses, siswaTab]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-16">
        
        {/* ========================================================================= */}
        {/* ==================== HERO HEADER: KELAS SAYA SISWA ====================== */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-6 lg:px-8 py-6 relative overflow-hidden">
          {/* Subtle Japanese Aesthetic Background Overlay */}
          <div 
            className="absolute top-0 right-0 w-80 md:w-96 h-full bg-cover bg-no-repeat bg-right opacity-15 pointer-events-none"
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
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-semibold">Kelas Saya</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kelas Saya
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Daftar kelas yang sedang Anda ikuti.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ============================== SISWA VIEW =============================== */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6 space-y-6">
          
          {/* Filter Tabs & Semester Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                onClick={() => setSiswaTab('Sedang Berjalan')}
                className={`pb-1 transition-all relative ${
                  siswaTab === 'Sedang Berjalan'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sedang Berjalan ({siswaClasses.filter(c => c.statusCode === 'running').length})
              </button>
              <button
                onClick={() => setSiswaTab('Akan Datang')}
                className={`pb-1 transition-all relative ${
                  siswaTab === 'Akan Datang'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Akan Datang ({siswaClasses.filter(c => c.statusCode === 'upcoming').length})
              </button>
              <button
                onClick={() => setSiswaTab('Selesai')}
                className={`pb-1 transition-all relative ${
                  siswaTab === 'Selesai'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Selesai ({siswaClasses.filter(c => c.statusCode === 'completed').length})
              </button>
            </div>

            {/* Semester Dropdown */}
            <div className="relative self-end sm:self-auto">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-7 appearance-none shadow-xs"
              >
                <option value="Semester Ganjil 2026">Semester Ganjil 2026</option>
                <option value="Semester Genap 2026">Semester Genap 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* List of Student Class Cards */}
          <div className="space-y-4">
            {filteredSiswaClasses.map((item) => {
              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left & Middle Info */}
                  <div className="flex items-start gap-4">
                    {/* Japanese Artwork Badge */}
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${item.badgeBg} text-white flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group`}>
                      <img 
                        src={bannerImg} 
                        alt="Japan" 
                        className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
                      />
                      <span className="relative z-10 text-xl md:text-2xl font-black tracking-wider font-sans drop-shadow-md">
                        {item.badgeText}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base md:text-lg font-bold text-slate-800">
                          {item.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-full ${
                          item.statusCode === 'running' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : item.statusCode === 'completed'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                            : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Sensei Profile & Schedule */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.senseiAvatar}
                            alt={item.sensei}
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Sensei+Ayu'; }}
                          />
                          <span className="font-semibold text-slate-700">{item.sensei}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{item.days}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.time}</span>
                        </div>
                      </div>

                      {/* 4 Action Buttons for Siswa (Lihat Materi, Tugas & Quiz, Nilai Saya, Diskusi) */}
                      <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        <button
                          onClick={() => navigate('/lms/materi')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Lihat Materi</span>
                        </button>

                        <button
                          onClick={() => navigate('/lms/tugas-quiz')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Tugas & Quiz</span>
                        </button>

                        <button
                          onClick={() => navigate('/lms/nilai')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Nilai Saya</span>
                        </button>

                        <button
                          onClick={() => navigate('/lms/diskusi')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl px-3.5 py-2 transition-all shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Diskusi</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Right: Progres Belajar */}
                  <div className="lg:w-56 flex flex-col justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Progres Belajar</span>
                      <span className="text-slate-800">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.statusCode === 'completed' ? 'bg-blue-600' :
                          item.progress > 70 ? 'bg-blue-600' :
                          item.progress > 50 ? 'bg-purple-600' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                </div>
              );
            })}

            {filteredSiswaClasses.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">Tidak ada kelas pada kategori ini</h4>
                <p className="text-xs text-slate-400 mt-1">Silakan pilih tab filter lainnya atau hubungi Sensei untuk informasi kelas baru.</p>
              </div>
            )}
          </div>

          {/* Bottom Encouragement Card for Students */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg mt-8">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none overflow-hidden">
              <img 
                src={animeGirlImg} 
                alt="Anime Motivation" 
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-3 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Tips Sukses Belajar</span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Semangat Belajar, Masa Depan Cerah Menantimu di Jepang! 🌸
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
                Konsisten ikuti setiap pertemuan, kerjakan kuis tepat waktu, dan kuasai materi JLPT bersama para Sensei terbaik. Setiap langkah kecil membawamu lebih dekat ke impian berkarier di Jepang.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <button 
                  onClick={() => navigate('/lms/kalender')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-600/30"
                >
                  Jadwal Kalender
                </button>
                <button 
                  onClick={() => navigate('/lms/latihan-kaiwa')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all border border-white/20"
                >
                  Latihan Kaiwa
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
