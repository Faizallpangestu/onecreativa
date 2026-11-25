import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  Edit3,
  MoreVertical,
  X,
  Check,
  Sparkles,
  Eye,
  Search,
  FileCheck,
  Layers,
  Volume2,
  Maximize,
  HelpCircle,
  GripVertical,
  Calendar,
  Users,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Trash2,
  Edit2,
  UploadCloud,
  Link as LinkIcon,
  Paperclip,
  File,
  Loader2
} from 'lucide-react';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl.jpg';
import Swal from 'sweetalert2';
import { moduleApi } from '../../utils/moduleApi';

// ─────────────────────────────────────────────────────────────────────────────
// ── MASTER 10 CHAPTERS & MATERIALS FOR SENSEI & SISWA VIEW ──
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_CHAPTERS = [
  {
    id: 1,
    title: "Bab 1 – Hiragana",
    shortTitle: "Bab 1",
    labelName: "Hiragana",
    badgeText: "あ",
    badgeColor: "bg-blue-600 text-white",
    iconBg: "bg-blue-600 text-white",
    subtitle: "Pengenalan huruf dasar Hiragana, cara baca, dan penulisan.",
    materialsCount: 5,
    progress: 80,
    completedItems: 4,
    totalItems: 5,
    materials: [
      {
        id: 101,
        number: 1,
        title: "1. Pengenalan Hiragana",
        type: "Video",
        badgeType: "video",
        badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
        isMandatory: true,
        status: "Selesai",
        statusCode: "completed",
        duration: "12:45",
        desc: "Penjelasan dasar huruf Hiragana dan cara membacanya.",
        thumbnailText: "あいうえ",
        actionText: "Tonton Lagi",
        actionType: "video",
        isVisible: true
      },
      {
        id: 102,
        number: 2,
        title: "2. Lembar Materi Hiragana",
        type: "PDF",
        badgeType: "pdf",
        badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
        isMandatory: true,
        status: "Selesai",
        statusCode: "completed",
        desc: "Dokumen pembelajaran huruf Hiragana.",
        actionText: "Download",
        actionType: "download",
        fileSize: "2.4 MB",
        isVisible: true
      },
      {
        id: 103,
        number: 3,
        title: "3. Latihan Menulis Hiragana",
        type: "Slide",
        badgeType: "slide",
        badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
        isMandatory: true,
        status: "Sedang Dipelajari",
        statusCode: "in_progress",
        desc: "Template latihan menulis untuk siswa.",
        actionText: "Buka Materi",
        actionType: "slide",
        fileSize: "5.1 MB",
        isVisible: true
      },
      {
        id: 104,
        number: 4,
        title: "4. Cara Penulisan Huruf",
        type: "Video",
        badgeType: "video",
        badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
        isMandatory: false,
        status: "Selesai",
        statusCode: "completed",
        duration: "08:30",
        desc: "Video demonstrasi penulisan Hiragana.",
        thumbnailText: "あいうえ",
        actionText: "Tonton Lagi",
        actionType: "video",
        isVisible: true
      },
      {
        id: 105,
        number: 5,
        title: "5. Kuis Latihan Hiragana",
        type: "Dokumen",
        badgeType: "quiz",
        badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
        isMandatory: false,
        status: "Belum Dikerjakan",
        statusCode: "pending",
        desc: "Latihan soal untuk menguji pemahaman.",
        actionText: "Kerjakan",
        actionType: "quiz",
        isVisible: true
      }
    ]
  },
  {
    id: 2,
    title: "Bab 2 – Katakana",
    shortTitle: "Bab 2",
    labelName: "Katakana",
    badgeText: "ア",
    badgeColor: "bg-purple-500 text-white",
    iconBg: "bg-purple-500 text-white",
    subtitle: "Huruf Katakana untuk kata serapan asing & pelafalan onomatope.",
    materialsCount: 5,
    progress: 20,
    completedItems: 1,
    totalItems: 5,
    materials: [
      {
        id: 201,
        number: 1,
        title: "1. Pengenalan Katakana",
        type: "Video",
        isMandatory: true,
        duration: "15:00",
        desc: "Pengenalan vokal Katakana A-I-U-E-O dan kata serapan.",
        isVisible: true
      },
      {
        id: 202,
        number: 2,
        title: "2. Tabel Katakana Lengkap",
        type: "PDF",
        isMandatory: true,
        desc: "Daftar huruf Katakana dari A sampai N beserta dakuten.",
        isVisible: true
      }
    ]
  },
  {
    id: 3,
    title: "Bab 3 – Kosakata Dasar",
    shortTitle: "Bab 3",
    labelName: "Kosakata Dasar",
    badgeText: "語",
    badgeColor: "bg-amber-500 text-white",
    iconBg: "bg-amber-500 text-white",
    subtitle: "Kosakata esensial benda sehari-hari, sekolah, dan lingkungan sekitar.",
    materialsCount: 6,
    progress: 0,
    completedItems: 0,
    totalItems: 6,
    materials: [
      {
        id: 301,
        number: 1,
        title: "1. Kosakata Benda di Kelas",
        type: "Slide",
        isMandatory: true,
        desc: "Kosakata hon, enpitsu, tsukue, isu, kokuban.",
        isVisible: true
      }
    ]
  },
  {
    id: 4,
    title: "Bab 4 – Salam & Percakapan",
    shortTitle: "Bab 4",
    labelName: "Salam & Percakapan",
    badgeText: "話",
    badgeColor: "bg-orange-500 text-white",
    iconBg: "bg-orange-500 text-white",
    subtitle: "Ungkapan salam (Aisatsu), perkenalan diri (Jikoshoukai), dan etika sopan.",
    materialsCount: 5,
    progress: 0,
    completedItems: 0,
    totalItems: 5,
    materials: [
      {
        id: 401,
        number: 1,
        title: "1. Aisatsu & Ungkapan Sehari-hari",
        type: "Video",
        isMandatory: true,
        duration: "11:20",
        desc: "Ohayou gozaimasu, Konnichiwa, Konbanwa, Arigatou gozaimasu.",
        isVisible: true
      }
    ]
  },
  {
    id: 5,
    title: "Bab 5 – Angka & Waktu",
    shortTitle: "Bab 5",
    labelName: "Angka & Waktu",
    badgeText: "時",
    badgeColor: "bg-rose-500 text-white",
    iconBg: "bg-rose-500 text-white",
    subtitle: "Penghitungan angka 1–10.000, jam, menit, hari, dan tanggal kalender.",
    materialsCount: 6,
    progress: 0,
    completedItems: 0,
    totalItems: 6,
    materials: [
      {
        id: 501,
        number: 1,
        title: "1. Membaca Jam dan Menit (Ji & Fun)",
        type: "PDF",
        isMandatory: true,
        desc: "Panduan pembacaan menit khusus (pun, ippun, sanpun, roppun).",
        isVisible: true
      }
    ]
  },
  {
    id: 6,
    title: "Bab 6 – Kata Kerja Dasar",
    shortTitle: "Bab 6",
    labelName: "Kata Kerja Dasar",
    badgeText: "動",
    badgeColor: "bg-emerald-500 text-white",
    iconBg: "bg-emerald-500 text-white",
    subtitle: "Klasifikasi kata kerja golongan I (Godan), II (Ichidan), dan III (Fukisoku).",
    materialsCount: 7,
    progress: 0,
    completedItems: 0,
    totalItems: 7,
    materials: []
  },
  {
    id: 7,
    title: "Bab 7 – Keluarga & Profesi",
    shortTitle: "Bab 7",
    labelName: "Keluarga & Profesi",
    badgeText: "人",
    badgeColor: "bg-sky-500 text-white",
    iconBg: "bg-sky-500 text-white",
    subtitle: "Sebutan anggota keluarga sendiri vs orang lain, serta nama pekerjaan.",
    materialsCount: 5,
    progress: 0,
    completedItems: 0,
    totalItems: 5,
    materials: []
  },
  {
    id: 8,
    title: "Bab 8 – Kata Sifat (い-Adjective)",
    shortTitle: "Bab 8",
    labelName: "Kata Sifat (い-Adjective)",
    badgeText: "形",
    badgeColor: "bg-violet-500 text-white",
    iconBg: "bg-violet-500 text-white",
    subtitle: "Perubahan bentuk kata sifat berakhiran -i positif, negatif, dan lampau.",
    materialsCount: 6,
    progress: 0,
    completedItems: 0,
    totalItems: 6,
    materials: []
  },
  {
    id: 9,
    title: "Bab 9 – Partikel Dasar",
    shortTitle: "Bab 9",
    labelName: "Partikel Dasar",
    badgeText: "助",
    badgeColor: "bg-amber-600 text-white",
    iconBg: "bg-amber-600 text-white",
    subtitle: "Penggunaan partikel wa, ga, o, ni, de, e, to, mo dalam kalimat.",
    materialsCount: 6,
    progress: 0,
    completedItems: 0,
    totalItems: 6,
    materials: []
  },
  {
    id: 10,
    title: "Bab 10 – Latihan & Evaluasi",
    shortTitle: "Bab 10",
    labelName: "Latihan & Evaluasi",
    badgeText: "考",
    badgeColor: "bg-pink-500 text-white",
    iconBg: "bg-pink-500 text-white",
    subtitle: "Rangkuman bab 1 s/d 9, latihan soal Dokkai, dan persiapan Ujian Tengah Semester.",
    materialsCount: 8,
    progress: 0,
    completedItems: 0,
    totalItems: 8,
    materials: []
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// ── DEFAULT CURRICULUM CHAPTERS & MODULES SCOPED PER LEVEL / CLASS ──
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CHAPTERS_BY_LEVEL = {
  N5: INITIAL_CHAPTERS,
  N4: [
    {
      id: 1,
      title: "Bab 1 – KANJI N4 & Kosakata Minna no Nihongo II",
      shortTitle: "Bab 1",
      labelName: "Kanji N4",
      badgeText: "漢",
      badgeColor: "bg-blue-600 text-white",
      iconBg: "bg-blue-600 text-white",
      subtitle: "Penguasaan 150 kanji baru tingkat N4 dan kosakata situasional percakapan lanjutan.",
      materialsCount: 3,
      progress: 0,
      completedItems: 0,
      totalItems: 3,
      materials: [
        {
          id: 201,
          number: 1,
          title: "1. Modul Daftar 150 Kanji JLPT N4 Lengkap",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Lembar kanji N4 beserta on'yomi, kun'yomi, dan contoh kalimat.",
          actionText: "Download",
          actionType: "download",
          fileSize: "3.2 MB",
          isVisible: true
        },
        {
          id: 202,
          number: 2,
          title: "2. Video Penjelasan Pola Kalimat Bab 26 Minna no Nihongo",
          type: "Video",
          badgeType: "video",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          duration: "18:20",
          desc: "Penggunaan pola ~ndesu (~んです) untuk memberi alasan dan meminta penjelasan.",
          actionText: "Tonton",
          actionType: "video",
          isVisible: true
        },
        {
          id: 203,
          number: 3,
          title: "3. Slide Ringkasan Kosakata Bab 26 - 30",
          type: "Slide",
          badgeType: "slide",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: false,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Slide presentasi kosakata Minna no Nihongo jilid II.",
          actionText: "Buka Slide",
          actionType: "slide",
          fileSize: "4.5 MB",
          isVisible: true
        }
      ]
    },
    {
      id: 2,
      title: "Bab 2 – Pola Kalimat Pengandaian (~Tara, ~Ba, ~Nara)",
      shortTitle: "Bab 2",
      labelName: "Pengandaian",
      badgeText: "条",
      badgeColor: "bg-indigo-600 text-white",
      iconBg: "bg-indigo-600 text-white",
      subtitle: "Perbedaan syarat pengandaian kondisi fakta vs hipotesis.",
      materialsCount: 2,
      progress: 0,
      completedItems: 0,
      totalItems: 2,
      materials: [
        {
          id: 204,
          number: 1,
          title: "1. Panduan Penggunaan ~Tara, ~Ba, dan ~Nara",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Rangkuman rumus tata bahasa pengandaian bahasa Jepang.",
          actionText: "Download",
          actionType: "download",
          fileSize: "1.8 MB",
          isVisible: true
        },
        {
          id: 205,
          number: 2,
          title: "2. Video Latihan Soal Pola Pengandaian",
          type: "Video",
          badgeType: "video",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          duration: "14:10",
          desc: "Pembahasan contoh soal JLPT N4 materi pengandaian.",
          actionText: "Tonton",
          actionType: "video",
          isVisible: true
        }
      ]
    },
    {
      id: 3,
      title: "Bab 3 – Bentuk Pasif (Ukemi) & Kausatif (Shieki)",
      shortTitle: "Bab 3",
      labelName: "Ukemi & Shieki",
      badgeText: "使",
      badgeColor: "bg-purple-600 text-white",
      iconBg: "bg-purple-600 text-white",
      subtitle: "Kalimat pasif penderitaan dan bentuk menyuruh / mengizinkan dalam situasi kerja.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 206,
          number: 1,
          title: "1. Modul Ukemi & Shieki dengan Contoh Kasus Lapangan",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Penjelasan konjugasi kata kerja bentuk pasif dan kausatif.",
          actionText: "Download",
          actionType: "download",
          fileSize: "2.1 MB",
          isVisible: true
        }
      ]
    },
    {
      id: 4,
      title: "Bab 4 – Bahasa Hormat (Keigo: Sonkeigo & Kenjougo)",
      shortTitle: "Bab 4",
      labelName: "Keigo",
      badgeText: "敬",
      badgeColor: "bg-emerald-600 text-white",
      iconBg: "bg-emerald-600 text-white",
      subtitle: "Fondasi komunikasi profesional dengan atasan dan rekan kerja di Jepang.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 207,
          number: 1,
          title: "1. Panduan Praktis Keigo untuk Lingkungan Kerja Jepang",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Tabel perbandingan Futsugo, Teineigo, Sonkeigo, dan Kenjougo.",
          actionText: "Download",
          actionType: "download",
          fileSize: "2.9 MB",
          isVisible: true
        }
      ]
    },
    {
      id: 5,
      title: "Bab 5 – Latihan Dokkai, Choukai & Tryout JLPT N4",
      shortTitle: "Bab 5",
      labelName: "Tryout N4",
      badgeText: "評",
      badgeColor: "bg-amber-600 text-white",
      iconBg: "bg-amber-600 text-white",
      subtitle: "Simulasi ujian kelulusan JLPT N4 / JFT-Basic A2.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 208,
          number: 1,
          title: "1. Paket Tryout Lengkap JLPT N4 Beserta Audio Choukai",
          type: "Dokumen",
          badgeType: "quiz",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Paket soal simulasi ujian standar JLPT N4 dan lembar pembahasan.",
          actionText: "Kerjakan",
          actionType: "quiz",
          fileSize: "6.0 MB",
          isVisible: true
        }
      ]
    }
  ],
  Mensetsu: [
    {
      id: 1,
      title: "Bab 1 – Penyusunan Rirekisho & Video Perkenalan Diri (Jikoshoukai)",
      shortTitle: "Bab 1",
      labelName: "Rirekisho & Jikoshoukai",
      badgeText: "履",
      badgeColor: "bg-rose-600 text-white",
      iconBg: "bg-rose-600 text-white",
      subtitle: "Format CV resmi perusahaan Jepang, Shibou Douki (alasan melamar), dan teknik video 1 menit.",
      materialsCount: 2,
      progress: 0,
      completedItems: 0,
      totalItems: 2,
      materials: [
        {
          id: 301,
          number: 1,
          title: "1. Template Resmi Resume Jepang (JIS Standard Rirekisho)",
          type: "Dokumen",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Format berkas Word dan PDF yang wajib diisi kandidat untuk seleksi perusahaan Jepang.",
          actionText: "Download",
          actionType: "download",
          fileSize: "1.2 MB",
          isVisible: true
        },
        {
          id: 302,
          number: 2,
          title: "2. Video Panduan Perekaman Video Jikoshoukai 60 Detik",
          type: "Video",
          badgeType: "video",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          duration: "10:15",
          desc: "Tips pencahayaan, intonasi suara, senyuman, dan pelafalan nama serta motivasi.",
          actionText: "Tonton",
          actionType: "video",
          isVisible: true
        }
      ]
    },
    {
      id: 2,
      title: "Bab 2 – Simulasi Tanya Jawab Wawancara Kerja (Mensetsu)",
      shortTitle: "Bab 2",
      labelName: "Simulasi Tanya Jawab",
      badgeText: "面",
      badgeColor: "bg-blue-600 text-white",
      iconBg: "bg-blue-600 text-white",
      subtitle: "Pertanyaan wajib: kelebihan/kekurangan, ketahanan fisik, adaptasi budaya, dan etika Ojigi.",
      materialsCount: 2,
      progress: 0,
      completedItems: 0,
      totalItems: 2,
      materials: [
        {
          id: 303,
          number: 1,
          title: "1. Modul 50 Pertanyaan Wawancara User Jepang & Pola Jawaban Tepat",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Kompilasi pertanyaan wawancara dari perusahaan penerima di Jepang beserta strategi jawaban.",
          actionText: "Download",
          actionType: "download",
          fileSize: "2.7 MB",
          isVisible: true
        },
        {
          id: 304,
          number: 2,
          title: "2. Video Tata Krama Masuk Ruangan Mensetsu & Etika Membungkuk (Ojigi)",
          type: "Video",
          badgeType: "video",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          duration: "15:00",
          desc: "Ketukan pintu 3 kali, ucapan Shitsurei shimasu, sudut membungkuk 30 & 45 derajat.",
          actionText: "Tonton",
          actionType: "video",
          isVisible: true
        }
      ]
    },
    {
      id: 3,
      title: "Bab 3 – Etika Kerja Hou-Ren-So & Budaya Perusahaan Jepang",
      shortTitle: "Bab 3",
      labelName: "Hou-Ren-So & Etika",
      badgeText: "報",
      badgeColor: "bg-emerald-600 text-white",
      iconBg: "bg-emerald-600 text-white",
      subtitle: "Houkoku (Lapor), Renraku (Informasi), Soudan (Konsultasi) dan kedisiplinan 5S.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 305,
          number: 1,
          title: "1. Buku Panduan Hou-Ren-So dan Budaya Kerja Jepang",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Panduan praktis komunikasi efektif di lingkungan kerja Jepang.",
          actionText: "Download",
          actionType: "download",
          fileSize: "3.5 MB",
          isVisible: true
        }
      ]
    },
    {
      id: 4,
      title: "Bab 4 – Simulasi Wawancara Langsung & Persiapan COE / Kontrak",
      shortTitle: "Bab 4",
      labelName: "Simulasi & COE",
      badgeText: "挑",
      badgeColor: "bg-purple-600 text-white",
      iconBg: "bg-purple-600 text-white",
      subtitle: "Mock interview dengan Native Speaker Jepang dan verifikasi kelengkapan berkas penempatan.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 306,
          number: 1,
          title: "1. Panduan Prosedur Matching Job & Pengurusan COE Pasca Lulus Wawancara",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Alur penandatanganan Koyou Keiyakusho hingga penerbitan Certificate of Eligibility.",
          actionText: "Download",
          actionType: "download",
          fileSize: "1.9 MB",
          isVisible: true
        }
      ]
    }
  ],
  Kaigo: [
    {
      id: 1,
      title: "Bab 1 – Pengantar & Etika Kaigo (介護の基本理念)",
      shortTitle: "Bab 1",
      labelName: "Etika Kaigo",
      badgeText: "介",
      badgeColor: "bg-teal-600 text-white",
      iconBg: "bg-teal-600 text-white",
      subtitle: "Filosofi perawatan berpusat pada martabat manusia (Jinken) dan kemandirian lansia.",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 401,
          number: 1,
          title: "1. Modul Konsep Dasar Etika Perawatan Lansia di Jepang",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Prinsip dasar pelayanan kaigo di panti jompo (Roujin Houmu).",
          actionText: "Download",
          actionType: "download",
          fileSize: "2.5 MB",
          isVisible: true
        }
      ]
    },
    {
      id: 2,
      title: "Bab 2 – Kosakata Medis & Komunikasi Empati (Koe-kake)",
      shortTitle: "Bab 2",
      labelName: "Kosakata Medis",
      badgeText: "声",
      badgeColor: "bg-emerald-600 text-white",
      iconBg: "bg-emerald-600 text-white",
      subtitle: "Sapaan menenangkan saat memandikan, membantu makan, dan berpindah posisi (Ijou).",
      materialsCount: 1,
      progress: 0,
      completedItems: 0,
      totalItems: 1,
      materials: [
        {
          id: 402,
          number: 1,
          title: "1. Buku Saku Komunikasi Sapaan Kaigo (Koe-kake)",
          type: "PDF",
          badgeType: "pdf",
          badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
          isMandatory: true,
          status: "Belum Dipelajari",
          statusCode: "pending",
          desc: "Kumpulan ungkapan empati ketika mendampingi lansia beraktivitas sehari-hari.",
          actionText: "Download",
          actionType: "download",
          fileSize: "3.1 MB",
          isVisible: true
        }
      ]
    }
  ]
};

// Helper to get or initialize chapters for a specific class
const getInitialChaptersForClass = (cls) => {
  if (!cls) return INITIAL_CHAPTERS;
  try {
    const saved = localStorage.getItem(`lms_sensei_chapters_class_${cls.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }

  const lvl = (cls.level || '').toLowerCase();
  const name = (cls.name || '').toLowerCase();

  if (lvl.includes('mensetsu') || name.includes('mensetsu') || name.includes('matching')) {
    return DEFAULT_CHAPTERS_BY_LEVEL.Mensetsu;
  }
  if (lvl.includes('kaigo') || name.includes('kaigo')) {
    return DEFAULT_CHAPTERS_BY_LEVEL.Kaigo;
  }
  if (lvl.includes('n4') || name.includes('n4')) {
    return DEFAULT_CHAPTERS_BY_LEVEL.N4;
  }
  return DEFAULT_CHAPTERS_BY_LEVEL.N5;
};

export default function LmsMateri() {
  const navigate = useNavigate();

  // Detect user role: Sensei by default or if role_name contains sensei/pengajar/admin
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const isSensei = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qRole = urlParams.get('role');
    if (qRole === 'siswa') return false;
    if (qRole === 'sensei') return true;

    const roleName = (currentUser?.role_name || currentUser?.role || '').toLowerCase();
    if (roleName.includes('peserta') || roleName.includes('siswa')) return false;
    return true; // Default Sensei for Sensei role
  }, [currentUser]);

  // Classes List & Active Class State (Synced with Database / relationships API)
  const [classesList, setClassesList] = useState([]);
  const [activeClass, setActiveClass] = useState({
    id: 19,
    code: 'CJ-B2',
    name: 'N5 Pagi',
    batch: 'Batch 1 2026',
    level: 'N5',
    schedule_days: 'Senin & Rabu',
    schedule_time: '08:00 - 09:30',
    enrolled_students_count: 1
  });

  // Navigation tab: 'daftar_materi' | 'rencana' | 'bank_materi' | 'urutan' | 'catatan'
  const [activeTab, setActiveTab] = useState('daftar_materi');

  // Selected Bab filter dropdown
  const [selectedBabFilter, setSelectedBabFilter] = useState('Semua Bab');

  // Accordion state for Siswa view
  const [expandedBabs, setExpandedBabs] = useState({ 1: true });

  // Active Bab for Sensei view (Left Column selection)
  const [activeSenseiBab, setActiveSenseiBab] = useState(1);

  // Chapters Data (Scoped per class)
  const [chaptersData, setChaptersData] = useState(() => {
    return getInitialChaptersForClass({ id: 19, level: 'N5' });
  });

  // Sync classes from backend & auto-select from query param or localStorage
  useEffect(() => {
    let isMounted = true;
    moduleApi('relationships')
      .then(res => {
        if (isMounted && res?.classes?.length) {
          setClassesList(res.classes);

          const urlParams = new URLSearchParams(window.location.search);
          const qClassId = urlParams.get('class_id') || urlParams.get('classId');
          const savedClassId = qClassId || localStorage.getItem('lms_active_class_id');

          let target = res.classes[0];
          if (savedClassId) {
            const found = res.classes.find(c => String(c.id) === String(savedClassId));
            if (found) target = found;
          } else {
            const active = res.classes.find(c => c.status === 'active');
            if (active) target = active;
          }

          if (target) {
            setActiveClass(target);
            const chapters = getInitialChaptersForClass(target);
            setChaptersData(chapters);
            setActiveSenseiBab(chapters[0]?.id || 1);
          }
        }
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  // Class switcher handler
  const handleClassChange = (newClassId) => {
    const selected = classesList.find(c => String(c.id) === String(newClassId));
    if (!selected) return;

    setActiveClass(selected);
    localStorage.setItem('lms_active_class_id', selected.id);

    const chapters = getInitialChaptersForClass(selected);
    setChaptersData(chapters);
    setActiveSenseiBab(chapters[0]?.id || 1);
    setSelectedBabFilter('Semua Bab');

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Beralih ke Kelas: ${selected.name}`,
      text: `Menampilkan bab & materi pembelajaran (${selected.level || 'Kelas'})`,
      showConfirmButton: false,
      timer: 1800
    });
  };

  // Modal states
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [activeDocModal, setActiveDocModal] = useState(null);
  const [isAddMateriModalOpen, setIsAddMateriModalOpen] = useState(false);
  const [isAddBabModalOpen, setIsAddBabModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBab, setEditingBab] = useState(null);
  const [isEditBabModalOpen, setIsEditBabModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New Materi Form state
  const [newMateri, setNewMateri] = useState({
    title: '',
    type: 'Video',
    isMandatory: true,
    duration: '10:00',
    desc: '',
    targetBabId: 1,
    sourceType: 'file', // 'file' or 'url'
    fileUrl: '',
    fileName: '',
    fileSize: '',
    url: ''
  });

  // New Bab Form state
  const [newBab, setNewBab] = useState({
    title: '',
    subtitle: ''
  });

  // Persist chapters per class
  useEffect(() => {
    if (activeClass?.id && chaptersData && chaptersData.length > 0) {
      try {
        localStorage.setItem(`lms_sensei_chapters_class_${activeClass.id}`, JSON.stringify(chaptersData));
        localStorage.setItem('lms_sensei_chapters_data', JSON.stringify(chaptersData));
      } catch (e) {
        console.error(e);
      }
    }
  }, [chaptersData, activeClass?.id]);

  // Active Chapter Object for Sensei
  const currentSenseiChapter = useMemo(() => {
    return chaptersData.find(b => b.id === activeSenseiBab) || chaptersData[0] || {};
  }, [chaptersData, activeSenseiBab]);

  // Filtered chapters based on Bab filter dropdown
  const visibleChapters = useMemo(() => {
    if (selectedBabFilter === 'Semua Bab') return chaptersData;
    return chaptersData.filter(c => (c.shortTitle === selectedBabFilter || c.title.includes(selectedBabFilter)));
  }, [chaptersData, selectedBabFilter]);

  // Toggle Visibility of a Material (Sensei)
  const handleToggleVisibility = (chapterId, materialId) => {
    setChaptersData(prev => prev.map(ch => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          materials: (ch.materials || []).map(m => {
            if (m.id === materialId) {
              const nextState = !m.isVisible;
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: nextState ? 'success' : 'info',
                title: nextState ? 'Materi sekarang ditampilkan untuk siswa' : 'Materi disembunyikan dari siswa',
                showConfirmButton: false,
                timer: 1500
              });
              return { ...m, isVisible: nextState };
            }
            return m;
          })
        };
      }
      return ch;
    }));
  };

  // Re-order Material Up/Down (Sensei Drag & Drop section)
  const handleMoveMaterial = (chapterId, index, direction) => {
    setChaptersData(prev => prev.map(ch => {
      if (ch.id === chapterId && ch.materials) {
        const list = [...ch.materials];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= list.length) return ch;

        const temp = list[index];
        list[index] = list[targetIndex];
        list[targetIndex] = temp;

        return { ...ch, materials: list };
      }
      return ch;
    }));
  };

  // YouTube Helper
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };

  // Upload handler for documents, slides, videos, audios, and images
  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/lms_upload.php', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.status === 'success') {
        const { file_url, file_name, file_size } = json.data;
        if (isEdit) {
          setEditingMateri(prev => ({
            ...prev,
            fileUrl: file_url,
            fileName: file_name,
            fileSize: file_size
          }));
        } else {
          setNewMateri(prev => ({
            ...prev,
            fileUrl: file_url,
            fileName: file_name,
            fileSize: file_size
          }));
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `File "${file_name}" berhasil diunggah!`,
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        Swal.fire('Upload Gagal', json.message || 'Gagal mengunggah file', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal menghubungi server untuk upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Material
  const handleDeleteMateri = (chapterId, materialId, title) => {
    Swal.fire({
      title: 'Hapus Materi?',
      text: `Apakah Anda yakin ingin menghapus materi "${title || 'ini'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Materi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    }).then((res) => {
      if (res.isConfirmed) {
        setChaptersData(prev => prev.map(ch => {
          if (ch.id === chapterId) {
            const mats = (ch.materials || []).filter(m => m.id !== materialId);
            return {
              ...ch,
              materials: mats,
              materialsCount: mats.length,
              totalItems: mats.length
            };
          }
          return ch;
        }));
        Swal.fire('Dihapus!', 'Materi pembelajaran berhasil dihapus.', 'success');
      }
    });
  };

  // Open Edit Material Modal
  const handleOpenEditModal = (item, chapterId) => {
    setEditingMateri({
      ...item,
      chapterId: chapterId,
      targetBabId: chapterId,
      sourceType: item.fileUrl ? 'file' : (item.url ? 'url' : 'file')
    });
    setIsEditModalOpen(true);
  };

  // Update Material Submit
  const handleUpdateMateri = (e) => {
    e.preventDefault();
    if (!editingMateri || !editingMateri.title.trim()) return;

    const targetBab = Number(editingMateri.targetBabId || editingMateri.chapterId);
    const oldBab = Number(editingMateri.chapterId);

    const updatedItem = {
      ...editingMateri,
      title: editingMateri.title.trim(),
      type: editingMateri.type,
      isMandatory: editingMateri.isMandatory,
      duration: editingMateri.type === 'Video' ? editingMateri.duration : null,
      desc: editingMateri.desc ? editingMateri.desc.trim() : '',
      url: editingMateri.url ? editingMateri.url.trim() : null,
      fileUrl: editingMateri.fileUrl || null,
      fileName: editingMateri.fileName || null,
      fileSize: editingMateri.fileSize || null
    };

    setChaptersData(prev => {
      if (targetBab !== oldBab) {
        return prev.map(ch => {
          if (ch.id === oldBab) {
            const mats = (ch.materials || []).filter(m => m.id !== editingMateri.id);
            return { ...ch, materials: mats, materialsCount: mats.length, totalItems: mats.length };
          }
          if (ch.id === targetBab) {
            const mats = ch.materials ? [...ch.materials, updatedItem] : [updatedItem];
            return { ...ch, materials: mats, materialsCount: mats.length, totalItems: mats.length };
          }
          return ch;
        });
      }

      return prev.map(ch => {
        if (ch.id === targetBab) {
          const mats = (ch.materials || []).map(m => m.id === editingMateri.id ? updatedItem : m);
          return { ...ch, materials: mats };
        }
        return ch;
      });
    });

    setIsEditModalOpen(false);
    setEditingMateri(null);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Materi berhasil diperbarui!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Toggle Material Completion (for Siswa / User real progress)
  const handleToggleMaterialCompletion = (chapterId, materialId) => {
    setChaptersData(prev => {
      const updated = prev.map(ch => {
        if (ch.id === chapterId) {
          const newMats = (ch.materials || []).map(m => {
            if (m.id === materialId) {
              const nextStatus = m.statusCode === 'completed' ? 'pending' : 'completed';
              return {
                ...m,
                statusCode: nextStatus,
                status: nextStatus === 'completed' ? 'Selesai' : 'Belum Selesai'
              };
            }
            return m;
          });
          const completedCount = newMats.filter(m => m.statusCode === 'completed').length;
          const totalCount = newMats.length;
          const prog = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          return {
            ...ch,
            materials: newMats,
            completedItems: completedCount,
            totalItems: totalCount,
            progress: prog
          };
        }
        return ch;
      });
      localStorage.setItem('lms_sensei_chapters_data', JSON.stringify(updated));
      return updated;
    });
  };

  // Add New Materi submit
  const handleCreateMateri = (e) => {
    e.preventDefault();
    if (!newMateri.title.trim()) return;

    const newItem = {
      id: Date.now(),
      number: (currentSenseiChapter.materials?.length || 0) + 1,
      title: newMateri.title.trim(),
      type: newMateri.type,
      isMandatory: newMateri.isMandatory,
      duration: newMateri.type === 'Video' ? newMateri.duration : null,
      desc: newMateri.desc.trim() || 'Materi pembelajaran bahasa Jepang.',
      isVisible: true,
      statusCode: 'pending',
      url: newMateri.url ? newMateri.url.trim() : null,
      fileUrl: newMateri.fileUrl || null,
      fileName: newMateri.fileName || null,
      fileSize: newMateri.fileSize || null
    };

    setChaptersData(prev => prev.map(ch => {
      if (ch.id === Number(newMateri.targetBabId || activeSenseiBab)) {
        const mats = ch.materials ? [...ch.materials, newItem] : [newItem];
        return {
          ...ch,
          materials: mats,
          materialsCount: mats.length,
          totalItems: mats.length
        };
      }
      return ch;
    }));

    setIsAddMateriModalOpen(false);
    setNewMateri({
      title: '',
      type: 'Video',
      isMandatory: true,
      duration: '10:00',
      desc: '',
      targetBabId: activeSenseiBab,
      sourceType: 'file',
      fileUrl: '',
      fileName: '',
      fileSize: '',
      url: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Materi Berhasil Ditambahkan! 🎉',
      text: 'Materi baru telah tersedia di kelas dan dapat diakses siswa.',
      confirmButtonColor: '#2563eb'
    });
  };

  // Add New Bab submit
  const handleCreateBab = (e) => {
    e.preventDefault();
    if (!newBab.title.trim()) return;

    const nextId = chaptersData.length > 0 ? Math.max(...chaptersData.map(b => b.id)) + 1 : 1;
    const babNum = chaptersData.length + 1;
    const newChapter = {
      id: nextId,
      title: `Bab ${babNum} – ${newBab.title.trim()}`,
      shortTitle: `Bab ${babNum}`,
      labelName: newBab.title.trim(),
      badgeText: newBab.title.trim().charAt(0) || '日',
      badgeColor: 'bg-blue-600 text-white',
      iconBg: 'bg-blue-600 text-white',
      subtitle: newBab.subtitle.trim() || `Modul pembelajaran untuk kelas ${activeClass?.name || 'ini'}.`,
      materialsCount: 0,
      progress: 0,
      completedItems: 0,
      totalItems: 0,
      materials: []
    };

    setChaptersData(prev => [...prev, newChapter]);
    setActiveSenseiBab(nextId);
    setIsAddBabModalOpen(false);
    setNewBab({ title: '', subtitle: '' });

    Swal.fire({
      icon: 'success',
      title: 'Bab Baru Ditambahkan!',
      text: `Bab ${babNum} ("${newBab.title.trim()}") berhasil dibuat untuk kelas ${activeClass?.name || 'aktif'}.`,
      confirmButtonColor: '#2563eb'
    });
  };

  // Open Edit Bab Modal
  const handleOpenEditBab = (bab) => {
    if (!bab) return;
    setEditingBab({
      id: bab.id,
      title: bab.title || '',
      labelName: bab.labelName || bab.title || '',
      subtitle: bab.subtitle || '',
      badgeText: bab.badgeText || (bab.title ? bab.title.charAt(0) : '日')
    });
    setIsEditBabModalOpen(true);
  };

  // Submit Update Bab
  const handleUpdateBab = (e) => {
    e.preventDefault();
    if (!editingBab || !editingBab.title.trim()) return;

    setChaptersData(prev => prev.map(ch => {
      if (ch.id === editingBab.id) {
        return {
          ...ch,
          title: editingBab.title.trim(),
          labelName: editingBab.labelName.trim() || editingBab.title.trim(),
          subtitle: editingBab.subtitle.trim() || ch.subtitle,
          badgeText: (editingBab.badgeText || editingBab.title.trim().charAt(0) || '日')
        };
      }
      return ch;
    }));

    setIsEditBabModalOpen(false);
    setEditingBab(null);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Bab berhasil diperbarui!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Delete Bab with confirmation
  const handleDeleteBab = (babId, babTitle) => {
    const bab = chaptersData.find(b => b.id === babId);
    const materialsCount = bab?.materials?.length || 0;

    Swal.fire({
      title: 'Hapus Bab Ini?',
      html: `Apakah Anda yakin ingin menghapus <b>${babTitle || 'Bab ini'}</b>?` +
        (materialsCount > 0
          ? `<br/><div class="mt-2.5 text-rose-600 font-bold text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-200">Perhatian: ${materialsCount} materi di dalam bab ini juga akan ikut terhapus!</div>`
          : ''),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Bab',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    }).then((res) => {
      if (res.isConfirmed) {
        setChaptersData(prev => {
          const filtered = prev.filter(b => b.id !== babId);
          if (activeSenseiBab === babId && filtered.length > 0) {
            setActiveSenseiBab(filtered[0].id);
          }
          return filtered;
        });

        Swal.fire({
          icon: 'success',
          title: 'Bab Berhasil Dihapus!',
          text: `Bab "${babTitle || ''}" telah dihapus dari kelas ${activeClass?.name || ''}.`,
          confirmButtonColor: '#2563eb'
        });
      }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">

        {/* ============================================================ */}
        {/* 1. HERO HEADER BANNER (1:1 PIXEL PERFECT WITH SAKURA & FUJI) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border-b border-slate-200/80 px-4 md:px-8 py-5 overflow-hidden">

          {/* Subtle Mt. Fuji & Pagoda Sakura backdrop */}
          <div
            className="absolute top-0 right-0 w-[550px] h-full opacity-20 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 25%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 25%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/lms/classes')}>Kelas & Rombel</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-700">{activeClass?.name || 'Kelas Aktif'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-bold">Materi Pembelajaran</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Materi Pembelajaran
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                {isSensei
                  ? `Kelola modul bab dan bagikan berkas materi untuk kelas ${activeClass?.name || ''}.`
                  : `Akses materi pembelajaran terstruktur kelas ${activeClass?.name || ''}.`}
              </p>
            </div>

            {/* Right Action: Class Switcher & + Tambah Materi Button */}
            <div className="flex flex-wrap items-center gap-3">
              {classesList.length > 0 && (
                <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Pilih Kelas:</span>
                  <select
                    value={activeClass?.id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="bg-transparent text-xs font-extrabold text-blue-700 outline-none cursor-pointer pr-1"
                  >
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level || 'Kelas'} • {c.batch || 'Batch'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSensei && (
                <button
                  onClick={() => {
                    setNewMateri(prev => ({ ...prev, targetBabId: activeSenseiBab || chaptersData[0]?.id || 1 }));
                    setIsAddMateriModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Materi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CLASS INFO HERO CARD (Synced Real Class & Quick Switcher) */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 md:p-5 flex flex-col gap-4">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Class Badge & Details */}
              <div className="flex items-center gap-4">
                {/* Level Japanese Sakura Artwork Thumbnail */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-black text-xl md:text-2xl shadow-sm relative overflow-hidden shrink-0 border border-pink-200">
                  <img
                    src={bannerImg}
                    alt={activeClass.level || 'N5'}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <span className="relative z-10 drop-shadow-md text-xs sm:text-sm font-bold tracking-tight px-1 text-center">
                    {activeClass.level || 'LMS'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
                      {activeClass.name || 'N5 Pagi'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-100">
                      Aktif
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Tingkat {activeClass.level || 'Bahasa'} {activeClass.batch ? `• ${activeClass.batch}` : ''}
                  </div>

                  {/* Class Meta Pills */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeClass.enrolled_students_count || 1} siswa</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeClass.schedule_days || 'Senin & Rabu'}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeClass.schedule_time || '08:00 - 09:30'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions & Jump to Classes */}
              <div className="flex items-center gap-2.5 self-start md:self-center">
                <button
                  onClick={() => setIsAddBabModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-2 transition shadow-2xs cursor-pointer"
                  title="Tambah Bab Baru ke Kelas Ini"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bab</span>
                </button>

                <button
                  onClick={() => navigate(isSensei ? '/lms/classes' : '/lms/kelas-saya')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 transition shadow-2xs cursor-pointer"
                  title={isSensei ? 'Buka Kelola Kelas & Rombel' : 'Buka Halaman Kelas Saya'}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isSensei ? 'Kelola Rombel' : 'Lihat Kelas'}</span>
                </button>
              </div>
            </div>

            {/* Quick Class Switcher Tab Pills (When multiple classes exist) */}
            {classesList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 border-t border-slate-100 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Beralih Kelas:
                </span>
                {classesList.map(c => {
                  const isSelected = String(c.id) === String(activeClass?.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleClassChange(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap border ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                    >
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                        {c.level || 'LMS'}
                      </span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. NAVIGATION TABS BAR (Daftar Materi, Rencana, Bank, Urutan) */}
        {/* ============================================================ */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-1">

            {/* Tabs */}
            <div className="flex items-center gap-6 md:gap-8 text-xs md:text-sm font-semibold overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveTab('daftar_materi')}
                className={`pb-2.5 transition relative cursor-pointer whitespace-nowrap ${activeTab === 'daftar_materi'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Daftar Materi
              </button>

              <button
                onClick={() => setActiveTab('rencana')}
                className={`pb-2.5 transition relative cursor-pointer whitespace-nowrap ${activeTab === 'rencana'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Rencana Pembelajaran
              </button>

              {isSensei ? (
                <>
                  <button
                    onClick={() => setActiveTab('bank_materi')}
                    className={`pb-2.5 transition relative cursor-pointer whitespace-nowrap ${activeTab === 'bank_materi'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Bank Materi
                  </button>
                  <button
                    onClick={() => setActiveTab('urutan')}
                    className={`pb-2.5 transition relative cursor-pointer whitespace-nowrap ${activeTab === 'urutan'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Urutan Topik
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('catatan')}
                  className={`pb-2.5 transition relative cursor-pointer whitespace-nowrap ${activeTab === 'catatan'
                    ? 'text-rose-500 border-b-2 border-rose-500 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Catatan Saya
                </button>
              )}
            </div>

            {/* Dynamic Bab Filter Dropdown */}
            <div className="relative self-end sm:self-auto shrink-0">
              <select
                value={selectedBabFilter}
                onChange={(e) => setSelectedBabFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-7 appearance-none shadow-2xs"
              >
                <option value="Semua Bab">Semua Bab ({chaptersData.length} Bab)</option>
                {chaptersData.map(ch => (
                  <option key={ch.id} value={ch.shortTitle}>{ch.title}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. SENSEI TWO-COLUMN SPLIT VIEW (1:1 EXACT MOCKUP) */}
        {/* ============================================================ */}
        {activeTab === 'daftar_materi' && isSensei && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

              {/* ──────────────────────────────────────────────────────── */}
              {/* LEFT COLUMN: DAFTAR BAB (COL 4) */}
              {/* ──────────────────────────────────────────────────────── */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">

                {/* Header: Title & + Tambah Bab button */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Daftar Bab ({chaptersData.length})
                    </h3>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Kelas: {activeClass?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddBabModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bab</span>
                  </button>
                </div>

                {/* Chapters Vertical List */}
                <div className="space-y-1.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {visibleChapters.map((bab) => {
                    const isActive = activeSenseiBab === bab.id;

                    return (
                      <div
                        key={bab.id}
                        onClick={() => setActiveSenseiBab(bab.id)}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border group relative ${isActive
                          ? 'bg-blue-50/80 border-blue-200/90 shadow-2xs'
                          : 'bg-white hover:bg-slate-50/80 border-transparent'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Left Rounded Square Icon */}
                          <div className={`w-9 h-9 rounded-xl ${bab.iconBg || 'bg-blue-600 text-white'} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                            {bab.badgeText || '日'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {bab.shortTitle || bab.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">
                              {bab.labelName || bab.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Edit & Delete (Always visible or on hover) */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditBab(bab);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 transition cursor-pointer"
                            title="Edit Bab Ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBab(bab.id, bab.title);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition cursor-pointer"
                            title="Hapus Bab Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 ml-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* RIGHT COLUMN: ACTIVE BAB MATERIALS & URUTAN MATERI (COL 8) */}
              {/* ──────────────────────────────────────────────────────── */}
              <div className="lg:col-span-8 space-y-5">

                {/* ── TOP BOX: ACTIVE BAB MATERIALS DETAIL ── */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 space-y-4">

                  {/* Chapter Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base md:text-lg font-extrabold text-slate-900">
                        {currentSenseiChapter.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentSenseiChapter.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {currentSenseiChapter.materials?.length || 0} Materi
                      </span>
                      <button
                        onClick={() => handleOpenEditBab(currentSenseiChapter)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl px-3 py-1.5 transition shadow-2xs cursor-pointer"
                        title="Edit Judul & Keterangan Bab Ini"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Bab</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBab(currentSenseiChapter.id, currentSenseiChapter.title)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl px-3 py-1.5 transition shadow-2xs cursor-pointer"
                        title="Hapus Bab Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Bab</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Materials with Switch Toggle */}
                  <div className="space-y-3 pt-1">
                    {(!currentSenseiChapter.materials || currentSenseiChapter.materials.length === 0) ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Belum ada materi pada bab ini. Klik tombol <b>+ Tambah Materi</b> di atas untuk menambahkan.
                      </div>
                    ) : (
                      currentSenseiChapter.materials.map((m) => (
                        <div
                          key={m.id}
                          className="p-3.5 md:p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-2xs"
                        >
                          {/* Left Media & Details */}
                          <div className="flex items-center gap-3.5 min-w-0">

                            {/* Media Thumbnail or Document Badge */}
                            {m.type === 'Video' ? (
                              <div
                                onClick={() => setActiveVideoModal(m)}
                                className="w-20 h-13 md:w-24 md:h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-2xs shrink-0"
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center text-indigo-300 font-serif text-xs font-bold tracking-widest opacity-80">
                                  {m.thumbnailText || 'あいうえ'}
                                </div>
                                <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                </div>
                                <span className="absolute bottom-1 right-1.5 text-[9px] font-mono bg-black/75 text-white/90 px-1 rounded">
                                  {m.duration || '10:00'}
                                </span>
                              </div>
                            ) : m.type === 'PDF' ? (
                              <div
                                onClick={() => {
                                  if (m.fileUrl || m.url) window.open(m.fileUrl || m.url, '_blank');
                                  else Swal.fire('Informasi', 'Belum ada file/link PDF yang dilampirkan. Klik Edit untuk melampirkan.', 'info');
                                }}
                                className="w-12 h-12 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition"
                                title="Buka Dokumen PDF"
                              >
                                <FileText className="w-6 h-6" />
                              </div>
                            ) : m.type === 'Slide' ? (
                              <div
                                onClick={() => {
                                  if (m.fileUrl || m.url) window.open(m.fileUrl || m.url, '_blank');
                                  else Swal.fire('Informasi', 'Belum ada file/link Slide yang dilampirkan. Klik Edit untuk melampirkan.', 'info');
                                }}
                                className="w-12 h-12 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-500 border border-orange-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition"
                                title="Buka Slide Presentasi (PPT)"
                              >
                                <span className="text-base font-black">P</span>
                              </div>
                            ) : m.type === 'Audio' ? (
                              <div
                                onClick={() => {
                                  if (m.fileUrl || m.url) window.open(m.fileUrl || m.url, '_blank');
                                  else Swal.fire('Informasi', 'Belum ada file/link Audio yang dilampirkan. Klik Edit untuk melampirkan.', 'info');
                                }}
                                className="w-12 h-12 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition"
                                title="Putar Audio Choukai"
                              >
                                <Volume2 className="w-6 h-6" />
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  if (m.fileUrl || m.url) window.open(m.fileUrl || m.url, '_blank');
                                  else Swal.fire('Informasi', 'Belum ada file/link yang dilampirkan. Klik Edit untuk melampirkan.', 'info');
                                }}
                                className="w-12 h-12 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition"
                              >
                                <FileCheck className="w-6 h-6" />
                              </div>
                            )}

                            {/* Details text & badges */}
                            <div className="min-w-0">
                              <div className="text-xs md:text-sm font-bold text-slate-900 truncate">
                                {m.title}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  {m.type}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${m.isMandatory
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {m.isMandatory ? 'Wajib' : 'Pilihan'}
                                </span>
                                {m.fileUrl && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <Paperclip className="w-2.5 h-2.5" />
                                    {m.fileSize || 'File Terlampir'}
                                  </span>
                                )}
                                {m.url && !m.fileUrl && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <LinkIcon className="w-2.5 h-2.5" />
                                    Link Eksternal
                                  </span>
                                )}
                              </div>

                              {m.desc && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                  {m.desc}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions (Buka/Download, Edit, Hapus, Toggle) */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Tombol Tonton / Buka File */}
                            {m.type === 'Video' ? (
                              <button
                                onClick={() => setActiveVideoModal(m)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                title="Tonton Video"
                              >
                                <Play className="w-3.5 h-3.5 fill-blue-700" />
                                <span className="hidden sm:inline">Tonton</span>
                              </button>
                            ) : (m.fileUrl || m.url) ? (
                              <a
                                href={m.fileUrl || m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                title="Buka / Unduh File Materi"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Buka File</span>
                              </a>
                            ) : null}

                            {/* Tombol Edit Materi */}
                            <button
                              onClick={() => handleOpenEditModal(m, currentSenseiChapter.id)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                              title="Edit Materi Pembelajaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus Materi */}
                            <button
                              onClick={() => handleDeleteMateri(currentSenseiChapter.id, m.id, m.title)}
                              className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Tampilkan ke Siswa */}
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                              <span className="text-xs font-semibold text-slate-500 hidden md:inline">Tampilkan</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={m.isVisible !== false}
                                  onChange={() => handleToggleVisibility(currentSenseiChapter.id, m.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* ── BOTTOM BOX: URUTAN MATERI (DRAG & DROP) ── */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Urutan Materi (Drag & Drop)
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Gunakan tombol panah untuk mengubah urutan materi
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(!currentSenseiChapter.materials || currentSenseiChapter.materials.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Belum ada materi untuk diurutkan.</p>
                    ) : (
                      currentSenseiChapter.materials.map((m, idx) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-between transition shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-xs font-bold text-slate-400 w-4 text-center">{idx + 1}</span>

                            {/* Color Dot Indicator */}
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === 0 ? 'bg-rose-500' :
                              idx === 1 ? 'bg-purple-500' :
                                idx === 2 ? 'bg-amber-500' :
                                  'bg-blue-500'
                              }`} />

                            <span className="text-xs font-bold text-slate-900 truncate">
                              {m.title}
                            </span>

                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-semibold shrink-0">
                              {m.type}
                            </span>

                            {m.duration && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {m.duration}
                              </span>
                            )}
                          </div>

                          {/* Reorder Buttons & More Options */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveMaterial(currentSenseiChapter.id, idx, 'up')}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                              title="Pindah ke Atas"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === currentSenseiChapter.materials.length - 1}
                              onClick={() => handleMoveMaterial(currentSenseiChapter.id, idx, 'down')}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                              title="Pindah ke Bawah"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 p-1">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. SISWA ACCORDION VIEW (WHEN ROLE IS SWITCHED TO SISWA) */}
        {/* ============================================================ */}
        {activeTab === 'daftar_materi' && !isSensei && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5 space-y-4">
            {visibleChapters.map((chapter) => {
              const isExpanded = expandedBabs[chapter.id];

              return (
                <div
                  key={chapter.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Chapter Accordion Header */}
                  <div
                    onClick={() => setExpandedBabs(prev => ({ ...prev, [chapter.id]: !prev[chapter.id] }))}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${chapter.badgeColor} flex items-center justify-center font-bold text-base shadow-2xs shrink-0`}>
                        {chapter.badgeText}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                          {chapter.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-24 md:w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${chapter.progress}%` }}
                          />
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {chapter.progress}% • <span className="text-slate-400 font-normal">{chapter.completedItems}/{chapter.totalItems} materi</span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Chapter Materials Body */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 md:px-5 py-4 space-y-3 bg-[#FAFCFF]/60">
                      {(chapter.materials && chapter.materials.length > 0) ? (
                        chapter.materials.filter(m => m.isVisible !== false).map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-200 transition-all"
                          >
                            <div className="flex items-center gap-3.5">
                              {item.type === 'Video' ? (
                                <div
                                  onClick={() => setActiveVideoModal(item)}
                                  className="w-20 h-13 md:w-24 md:h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-2xs shrink-0"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center text-indigo-300 font-serif text-xs font-bold tracking-widest opacity-80">
                                    {item.thumbnailText || 'あいうえ'}
                                  </div>
                                  <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                  </div>
                                  <span className="absolute bottom-1 right-1.5 text-[9px] font-mono bg-black/70 text-white/90 px-1 rounded">
                                    {item.duration || '10:00'}
                                  </span>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center font-bold text-xs shrink-0">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}

                              <div>
                                <div className="text-sm font-bold text-slate-800">
                                  {item.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
                                    {item.type}
                                  </span>
                                  {item.statusCode === 'completed' && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      ✓ Selesai
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <button
                                onClick={() => handleToggleMaterialCompletion(chapter.id, item.id)}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer ${item.statusCode === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                title={item.statusCode === 'completed' ? 'Klik untuk batal selesai' : 'Klik untuk tandai selesai'}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${item.statusCode === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{item.statusCode === 'completed' ? 'Selesai' : 'Tandai Selesai'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (item.type === 'Video') setActiveVideoModal(item);
                                  else if (item.fileUrl || item.url) window.open(item.fileUrl || item.url, '_blank');
                                  else Swal.fire('Informasi', 'Materi ini belum dilampirkan link atau file dokumen.', 'info');
                                }}
                                className="text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
                              >
                                {item.type === 'Video' ? 'Tonton Video' : (item.fileUrl || item.url) ? 'Buka / Unduh' : 'Lihat Materi'}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 py-3 text-center">Belum ada materi aktif.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. TAB: RENCANA PEMBELAJARAN */}
        {/* ============================================================ */}
        {activeTab === 'rencana' && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Silabus & Rencana Pembelajaran Semester (N5 A - Pagi)
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kurikulum terstandarisasi untuk mengantarkan siswa menguasai 100 Kanji, 800 kosakata esensial, dan pola kalimat dasar JLPT N5 dalam 32 sesi tatap muka dan evaluasi berkala.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                  <div className="font-bold text-blue-700">Tahap 1: Pengenalan Huruf (Sesi 1 - 6)</div>
                  <p className="text-slate-600 mt-1">Menguasai goresan Hiragana, Katakana, dan aturan pengucapan akurat.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="font-bold text-emerald-700">Tahap 2: Tata Bahasa & Kosakata (Sesi 7 - 20)</div>
                  <p className="text-slate-600 mt-1">Struktur kalimat dasar, partikel, kata sifat, dan kata kerja bentuk Masu.</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80">
                  <div className="font-bold text-purple-700">Tahap 3: Percakapan & Latihan UKOM (Sesi 21 - 32)</div>
                  <p className="text-slate-600 mt-1">Simulasi percakapan situasi kerja, pendengaran Choukai, dan evaluasi UKOM.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. TAB: BANK MATERI (SENSEI) */}
        {/* ============================================================ */}
        {activeTab === 'bank_materi' && isSensei && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Bank Materi & Modul Siap Pakai</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Koleksi berkas modul dan presentasi yang dapat dibagikan ulang ke kelas mana pun.</p>
                </div>
                <button
                  onClick={() => setIsAddMateriModalOpen(true)}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                  Unggah ke Bank Materi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  { name: 'Modul_Lengkap_Hiragana_Katakana.pdf', size: '12 MB', category: 'Dasar Huruf' },
                  { name: 'Minna_No_Nihongo_Bab1_10_Kosakata.pdf', size: '8.4 MB', category: 'Kosakata' },
                  { name: 'Kompilasi_Soal_Tryout_JLPT_N5.pdf', size: '15 MB', category: 'Ujian' }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.category} • {item.size}</div>
                    </div>
                    <button className="text-blue-600 hover:underline font-bold text-xs">Pakai</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 8. TAB: URUTAN TOPIK (SENSEI) */}
        {/* ============================================================ */}
        {activeTab === 'urutan' && isSensei && (
          <div className="max-w-[1550px] mx-auto px-4 md:px-8 mt-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Urutan Silabus Topik Bab</h3>
              <p className="text-xs text-slate-500">Atur urutan penayangan Bab dalam kelas ini.</p>
              <div className="space-y-2">
                {chaptersData.map((b, i) => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400 w-5">{i + 1}</span>
                      <span className="font-bold text-slate-900">{b.title}</span>
                      <span className="text-slate-400">({b.materialsCount} materi)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:text-blue-600"><MoveUp className="w-3.5 h-3.5" /></button>
                      <button className="p-1 hover:text-blue-600"><MoveDown className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 1: TAMBAH MATERI BARU (SENSEI) */}
        {/* ============================================================ */}
        {isAddMateriModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in duration-150 my-8">
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                      {activeClass?.level || 'Kelas'}
                    </span>
                    <span className="text-xs text-blue-100 font-semibold">{activeClass?.name}</span>
                  </div>
                  <h3 className="font-extrabold text-sm md:text-base">Tambah Materi Pembelajaran</h3>
                  <p className="text-xs text-blue-100">Upload video, modul PDF, slide PPT, atau tautan materi ke kelas {activeClass?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMateriModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateMateri} className="p-6 space-y-4 text-xs md:text-sm max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Bab Pembelajaran:</label>
                  <select
                    value={newMateri.targetBabId}
                    onChange={(e) => setNewMateri({ ...newMateri, targetBabId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {chaptersData.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Materi:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1. Pengenalan Huruf Hiragana & Aturan Tulis"
                    value={newMateri.title}
                    onChange={(e) => setNewMateri({ ...newMateri, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Materi:</label>
                    <select
                      value={newMateri.type}
                      onChange={(e) => setNewMateri({ ...newMateri, type: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Video">Video Tutorial / Rekaman</option>
                      <option value="PDF">Dokumen Modul PDF</option>
                      <option value="Slide">Slide Presentasi (PPT / PPTX)</option>
                      <option value="Audio">Audio / Choukai (MP3)</option>
                      <option value="Foto">Foto / Infografis</option>
                      <option value="Dokumen">Latihan Soal / Kuis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sifat Materi:</label>
                    <select
                      value={newMateri.isMandatory ? 'wajib' : 'pilihan'}
                      onChange={(e) => setNewMateri({ ...newMateri, isMandatory: e.target.value === 'wajib' })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="wajib">Wajib Dipelajari</option>
                      <option value="pilihan">Pilihan / Pengayaan</option>
                    </select>
                  </div>
                </div>

                {/* Sumber Materi: Upload File vs Tautan Link */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Sumber Materi & Lampiran:
                  </label>

                  <div className="grid grid-cols-2 gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setNewMateri({ ...newMateri, sourceType: 'file' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${newMateri.sourceType === 'file'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload File Komputer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMateri({ ...newMateri, sourceType: 'url' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${newMateri.sourceType === 'url'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Tautan Link / URL</span>
                    </button>
                  </div>

                  {/* Mode 1: Upload File */}
                  {newMateri.sourceType === 'file' && (
                    <div className="space-y-2 pt-1">
                      {newMateri.fileUrl ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 min-w-0 font-medium">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate"><strong>File Siap:</strong> {newMateri.fileName} ({newMateri.fileSize})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewMateri({ ...newMateri, fileUrl: '', fileName: '', fileSize: '' })}
                            className="text-xs text-rose-600 hover:underline font-bold shrink-0 ml-2"
                          >
                            Ganti File
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center transition bg-white cursor-pointer relative">
                          <input
                            type="file"
                            id="upload-materi-file"
                            onChange={(e) => handleFileUpload(e.target.files?.[0], false)}
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.webm,.mp3,.wav,.jpg,.jpeg,.png,.webp"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                <span className="text-xs font-bold text-blue-600">Sedang mengunggah file ke server...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-7 h-7 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Klik atau geser file ke sini</span>
                                <span className="text-[10px] text-slate-400">PDF, PPT/PPTX, Word, Video MP4, Audio MP3, atau Foto (Maks 100MB)</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Tautan URL */}
                  {newMateri.sourceType === 'url' && (
                    <div className="space-y-1 pt-1">
                      <input
                        type="url"
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau link Google Drive"
                        value={newMateri.url}
                        onChange={(e) => setNewMateri({ ...newMateri, url: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs"
                      />
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Mendukung link <strong>YouTube</strong> (otomatis diputar di sistem), <strong>Google Drive</strong>, <strong>Canva</strong>, <strong>Google Slides</strong>, atau tautan web lainnya.
                      </p>
                    </div>
                  )}
                </div>

                {newMateri.type === 'Video' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimasi Durasi Video (Menit:Detik):</label>
                    <input
                      type="text"
                      placeholder="Contoh: 12:45"
                      value={newMateri.duration}
                      onChange={(e) => setNewMateri({ ...newMateri, duration: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat:</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan petunjuk pembelajaran bagi siswa..."
                    value={newMateri.desc}
                    onChange={(e) => setNewMateri({ ...newMateri, desc: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddMateriModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? 'Mengunggah...' : 'Simpan Materi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL EDIT: EDIT MATERI PEMBELAJARAN (SENSEI)               */}
        {/* ============================================================ */}
        {isEditModalOpen && editingMateri && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in duration-150 my-8">
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm md:text-base">Edit Materi Pembelajaran</h3>
                  <p className="text-xs text-blue-100">Perbarui informasi, file modul, atau link materi</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingMateri(null); }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleUpdateMateri} className="p-6 space-y-4 text-xs md:text-sm max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pindahkan ke Bab:</label>
                  <select
                    value={editingMateri.targetBabId || editingMateri.chapterId}
                    onChange={(e) => setEditingMateri({ ...editingMateri, targetBabId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {chaptersData.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Materi:</label>
                  <input
                    type="text"
                    required
                    value={editingMateri.title}
                    onChange={(e) => setEditingMateri({ ...editingMateri, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Materi:</label>
                    <select
                      value={editingMateri.type}
                      onChange={(e) => setEditingMateri({ ...editingMateri, type: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Video">Video Tutorial / Rekaman</option>
                      <option value="PDF">Dokumen Modul PDF</option>
                      <option value="Slide">Slide Presentasi (PPT / PPTX)</option>
                      <option value="Audio">Audio / Choukai (MP3)</option>
                      <option value="Foto">Foto / Infografis</option>
                      <option value="Dokumen">Latihan Soal / Kuis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sifat Materi:</label>
                    <select
                      value={editingMateri.isMandatory ? 'wajib' : 'pilihan'}
                      onChange={(e) => setEditingMateri({ ...editingMateri, isMandatory: e.target.value === 'wajib' })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="wajib">Wajib Dipelajari</option>
                      <option value="pilihan">Pilihan / Pengayaan</option>
                    </select>
                  </div>
                </div>

                {/* Sumber Materi: Upload File vs Tautan Link */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Sumber Materi & Lampiran:
                  </label>

                  <div className="grid grid-cols-2 gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setEditingMateri({ ...editingMateri, sourceType: 'file' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${editingMateri.sourceType === 'file'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload File Komputer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMateri({ ...editingMateri, sourceType: 'url' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${editingMateri.sourceType === 'url'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Tautan Link / URL</span>
                    </button>
                  </div>

                  {/* Mode 1: Upload File */}
                  {editingMateri.sourceType === 'file' && (
                    <div className="space-y-2 pt-1">
                      {editingMateri.fileUrl ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 min-w-0 font-medium">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate"><strong>File Siap:</strong> {editingMateri.fileName || 'File Terlampir'} ({editingMateri.fileSize || 'Ukuran Tersimpan'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingMateri({ ...editingMateri, fileUrl: '', fileName: '', fileSize: '' })}
                            className="text-xs text-rose-600 hover:underline font-bold shrink-0 ml-2"
                          >
                            Ganti File
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center transition bg-white cursor-pointer relative">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e.target.files?.[0], true)}
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.webm,.mp3,.wav,.jpg,.jpeg,.png,.webp"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                <span className="text-xs font-bold text-blue-600">Sedang mengunggah file...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-7 h-7 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Pilih file baru untuk mengganti</span>
                                <span className="text-[10px] text-slate-400">PDF, PPT/PPTX, Word, Video MP4, Audio MP3, atau Foto</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Tautan URL */}
                  {editingMateri.sourceType === 'url' && (
                    <div className="space-y-1 pt-1">
                      <input
                        type="url"
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau link Google Drive"
                        value={editingMateri.url || ''}
                        onChange={(e) => setEditingMateri({ ...editingMateri, url: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs"
                      />
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Mendukung link <strong>YouTube</strong>, <strong>Google Drive</strong>, <strong>Canva</strong>, <strong>Google Slides</strong>, dll.
                      </p>
                    </div>
                  )}
                </div>

                {editingMateri.type === 'Video' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimasi Durasi Video (Menit:Detik):</label>
                    <input
                      type="text"
                      placeholder="Contoh: 12:45"
                      value={editingMateri.duration || ''}
                      onChange={(e) => setEditingMateri({ ...editingMateri, duration: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat:</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan petunjuk pembelajaran bagi siswa..."
                    value={editingMateri.desc || ''}
                    onChange={(e) => setEditingMateri({ ...editingMateri, desc: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditingMateri(null); }}
                    className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: TAMBAH BAB BARU (SENSEI) */}
        {/* ============================================================ */}
        {isAddBabModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                      {activeClass?.level || 'Kelas'}
                    </span>
                    <span className="text-xs text-blue-100 font-semibold">{activeClass?.name}</span>
                  </div>
                  <h3 className="font-extrabold text-sm md:text-base">Tambah Bab Baru</h3>
                  <p className="text-xs text-blue-100">Buat bab materi pembelajaran untuk rombel {activeClass?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBabModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateBab} className="p-6 space-y-4 text-xs md:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Bab:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Partikel Lanjutan"
                    value={newBab.title}
                    onChange={(e) => setNewBab({ ...newBab, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan Subjudul:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembelajaran partikel ni, de, dan to"
                    value={newBab.subtitle}
                    onChange={(e) => setNewBab({ ...newBab, subtitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setIsAddBabModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Batal</button>
                  <button type="submit" className="px-5 py-2 font-bold bg-blue-600 text-white rounded-xl">Simpan Bab</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2.5: EDIT BAB PEMBELAJARAN (SENSEI)                    */}
        {/* ============================================================ */}
        {isEditBabModalOpen && editingBab && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                      {activeClass?.level || 'Kelas'}
                    </span>
                    <span className="text-xs text-blue-100 font-semibold">{activeClass?.name}</span>
                  </div>
                  <h3 className="font-extrabold text-sm md:text-base">Edit Bab Pembelajaran</h3>
                  <p className="text-xs text-blue-100">Ubah judul, label nama, atau subjudul bab</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsEditBabModalOpen(false); setEditingBab(null); }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleUpdateBab} className="p-6 space-y-4 text-xs md:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Bab Lengkap:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bab 1 – Hiragana & Aturan Tulis"
                    value={editingBab.title}
                    onChange={(e) => setEditingBab({ ...editingBab, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Singkat / Label:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Hiragana"
                      value={editingBab.labelName}
                      onChange={(e) => setEditingBab({ ...editingBab, labelName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Karakter Ikon Badge:</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="あ / 漢"
                      value={editingBab.badgeText}
                      onChange={(e) => setEditingBab({ ...editingBab, badgeText: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan / Subjudul:</label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan petunjuk atau cakupan materi bab ini..."
                    value={editingBab.subtitle}
                    onChange={(e) => setEditingBab({ ...editingBab, subtitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingBab.id;
                      const title = editingBab.title;
                      setIsEditBabModalOpen(false);
                      setEditingBab(null);
                      handleDeleteBab(id, title);
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Bab</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsEditBabModalOpen(false); setEditingBab(null); }}
                      className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: VIDEO PLAYER MODAL */}
        {/* ============================================================ */}
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl text-white">
              <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-400 fill-blue-400" />
                  <h3 className="text-sm md:text-base font-bold text-white">{activeVideoModal.title}</h3>
                </div>
                <button onClick={() => setActiveVideoModal(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer transition">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                {getYouTubeEmbedUrl(activeVideoModal.url || activeVideoModal.fileUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeVideoModal.url || activeVideoModal.fileUrl)}
                    className="w-full h-full"
                    title={activeVideoModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (activeVideoModal.fileUrl && activeVideoModal.fileUrl.match(/\.(mp4|webm|ogg)$/i)) ? (
                  <video
                    src={activeVideoModal.fileUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (activeVideoModal.url || activeVideoModal.fileUrl) ? (
                  <div className="text-center p-8 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl">
                      <Play className="w-9 h-9 fill-white ml-1" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{activeVideoModal.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{activeVideoModal.desc || 'Video materi pembelajaran'}</p>
                    </div>
                    <a
                      href={activeVideoModal.url || activeVideoModal.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      <span>Buka Video di Tab Baru</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <Play className="w-9 h-9 fill-white ml-1" />
                    </div>
                    <h4 className="text-lg font-bold text-white">{activeVideoModal.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {activeVideoModal.desc || 'Belum ada link/file video yang dilampirkan. Klik tombol Edit Materi untuk melampirkan video.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                <span>Pengajar: Sensei LPK Creativa • Kelas Intensif</span>
                <button onClick={() => setActiveVideoModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
