/**
 * lmsChaptersApi.js
 * Source of truth for LMS Sensei Classes, Chapters & Materials
 * Synchronized with /lms/materi and /lms/quiz/generate
 */

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



/**
 * Get real chapters for a given class object
 * Reads directly from localStorage (if Sensei modified chapters in /lms/materi)
 * or falls back to standard master curriculum by level
 */
export function getChaptersForClass(cls) {
  if (!cls) return INITIAL_CHAPTERS;
  try {
    const classId = cls.id || cls.class_id;
    if (classId) {
      const saved = localStorage.getItem(`lms_sensei_chapters_class_${classId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
    const globalSaved = localStorage.getItem('lms_sensei_chapters_data');
    if (globalSaved) {
      const parsed = JSON.parse(globalSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Only return if it matches level or default
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading chapters for class:', e);
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
}

/**
 * Save updated chapters for a class into localStorage
 */
export function saveChaptersForClass(clsId, chapters) {
  if (!clsId) return;
  try {
    localStorage.setItem(`lms_sensei_chapters_class_${clsId}`, JSON.stringify(chapters));
    localStorage.setItem('lms_sensei_chapters_data', JSON.stringify(chapters));
  } catch (e) {
    console.error('Error saving chapters:', e);
  }
}

/**
 * Extract all learning materials inside a selected chapter range [startBab, endBab]
 */
export function getMaterialsInChapterRange(chapters, startBabNumber, endBabNumber) {
  if (!Array.isArray(chapters)) return [];
  const s = Math.min(startBabNumber, endBabNumber);
  const e = Math.max(startBabNumber, endBabNumber);

  const result = [];
  chapters.forEach((chap, idx) => {
    const chapNum = chap.number || (idx + 1);
    if (chapNum >= s && chapNum <= e) {
      const mats = chap.materials || [];
      mats.forEach(m => {
        result.push({
          ...m,
          chapterId: chap.id,
          chapterNumber: chapNum,
          chapterTitle: chap.title || `Bab ${chapNum}`,
          chapterLabel: chap.labelName || chap.title || ''
        });
      });
    }
  });
  return result;
}

export { INITIAL_CHAPTERS, DEFAULT_CHAPTERS_BY_LEVEL };
