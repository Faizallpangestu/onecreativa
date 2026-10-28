// ── CENTRALIZED LMS STUDENT & ACADEMIC DATA SERVICE ──
// Sinkronisasi data Siswa, Tugas, Quiz, Nilai, dan Leaderboard secara real-time antar halaman

const STORAGE_KEYS = {
  STUDENTS: 'lms_registered_students_v1',
  TASKS: 'lms_master_tasks_v1',
  GRADES: 'lms_student_grades_v1',
  QUIZZES: 'lms_master_quizzes_v1'
};

// Helper: ambil avatar dari email atau inisial
export const getAvatarFromEmail = (email, name = '') => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = encodeURIComponent((name || 'Siswa').trim() || 'S');
  const fallback = `https://ui-avatars.com/api/?name=${cleanName}&background=0284c7&color=fff&bold=true`;
  if (!cleanEmail) return fallback;
  return `https://unavatar.io/${encodeURIComponent(cleanEmail)}?fallback=${encodeURIComponent(fallback)}`;
};

// Dispatch custom event untuk re-render instan di semua tab/komponen
const notifyDataChanged = (type, payload) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lms_data_sync', { detail: { type, payload } }));
  }
};

// ── 1. STUDENT MANAGEMENT ──

export const getStoredStudents = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading stored students:', e);
    return [];
  }
};

export const saveStoredStudents = (students) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    notifyDataChanged('STUDENTS_UPDATED', students);
  } catch (e) {
    console.error('Error saving stored students:', e);
  }
};

export const addStoredStudent = (studentData) => {
  const current = getStoredStudents();
  const nextNum = current.length + 1;
  const newStudent = {
    id: studentData.id || Date.now(),
    studentId: studentData.studentId || `S${String(nextNum).padStart(3, '0')}`,
    name: studentData.name,
    nik: studentData.nik || `3275012004${String(nextNum).padStart(6, '0')}`,
    program: studentData.program || 'Program Intensif',
    classRoom: studentData.classRoom || 'N5',
    status: studentData.status || 'Aktif',
    joinDate: studentData.joinDate || new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
    email: studentData.email || '',
    phone: studentData.phone || '',
    gender: studentData.gender || 'Laki-laki',
    birthDate: studentData.birthDate || '',
    address: studentData.address || '',
    avatar: studentData.avatar || getAvatarFromEmail(studentData.email, studentData.name),
    attendanceRate: studentData.attendanceRate || '100%',
    gpa: studentData.gpa || '0.0'
  };

  const updated = [newStudent, ...current];
  saveStoredStudents(updated);
  return newStudent;
};

export const updateStoredStudent = (id, updatedFields) => {
  const current = getStoredStudents();
  const updated = current.map(s => {
    if (s.id === id || s.studentId === id) {
      const merged = { ...s, ...updatedFields };
      if (updatedFields.email || updatedFields.name) {
        merged.avatar = getAvatarFromEmail(merged.email, merged.name);
      }
      return merged;
    }
    return s;
  });
  saveStoredStudents(updated);
};

export const deleteStoredStudent = (id) => {
  const current = getStoredStudents();
  const updated = current.filter(s => s.id !== id && s.studentId !== id);
  saveStoredStudents(updated);
};

// ── 2. TASKS (TUGAS) MANAGEMENT ──

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Kuis Kosakata Bab 2',
    subtitle: 'Latihan kosakata baru yang mencakup tema makanan, minuman, dan aktivitas sehari-hari.',
    classRoom: 'N5',
    type: 'Quiz',
    createdDate: '12 Okt 2026',
    createdDateTime: '12 Oktober 2026, 09:00',
    deadline: '20 Okt 2026, 23:59',
    deadlineDateTime: '20 Oktober 2026, 23:59',
    status: 'Aktif',
    description: 'Latihan kosakata baru yang mencakup tema makanan, minuman, dan aktivitas sehari-hari. Kerjakan dengan teliti dan pastikan jawaban yang diberikan sesuai dengan materi.',
    totalPoints: 100,
    criteria: [
      { name: 'Ketepatan jawaban', weight: 40 },
      { name: 'Kelengkapan jawaban', weight: 30 },
      { name: 'Kerapihan & struktur', weight: 20 },
      { name: 'Pemahaman materi', weight: 10 }
    ]
  }
];

export const getStoredTasks = () => {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_TASKS;
  }
};

export const saveStoredTasks = (tasks) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    notifyDataChanged('TASKS_UPDATED', tasks);
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
};

export const addStoredTask = (taskData) => {
  const current = getStoredTasks();
  const newTask = {
    id: `task-${Date.now()}`,
    title: taskData.title,
    subtitle: taskData.subtitle || `Tugas untuk kelas ${taskData.classRoom || 'N5'}`,
    classRoom: taskData.classRoom || 'N5',
    type: taskData.type || 'Tugas Individu',
    createdDate: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
    createdDateTime: `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}, 09:00`,
    deadline: taskData.deadline || '28 Okt 2026, 23:59',
    deadlineDateTime: taskData.deadlineDateTime || '28 Oktober 2026, 23:59',
    status: 'Aktif',
    description: taskData.description || 'Selesaikan tugas dengan teliti sesuai instruksi pembelajaran.',
    totalPoints: taskData.totalPoints || 100,
    criteria: taskData.criteria || [
      { name: 'Ketepatan jawaban', weight: 40 },
      { name: 'Kelengkapan jawaban', weight: 30 },
      { name: 'Kerapihan & struktur', weight: 20 },
      { name: 'Pemahaman materi', weight: 10 }
    ],
    fileAttachment: taskData.fileAttachment || null
  };

  const updated = [newTask, ...current];
  saveStoredTasks(updated);
  return newTask;
};

export const updateStoredTask = (id, updatedFields) => {
  const current = getStoredTasks();
  const updated = current.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
  saveStoredTasks(updated);
};

export const deleteStoredTask = (id) => {
  const current = getStoredTasks();
  const updated = current.filter(t => t.id !== id);
  saveStoredTasks(updated);
};

// ── 3. GRADES & SUBMISSIONS PER TASK ──

export const getStoredGrades = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRADES);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveStudentGrade = (taskId, studentId, gradeData) => {
  if (typeof window === 'undefined') return;
  try {
    const allGrades = getStoredGrades();
    if (!allGrades[taskId]) allGrades[taskId] = {};
    allGrades[taskId][studentId] = {
      score: gradeData.score,
      status: gradeData.score !== '' && gradeData.score !== null ? 'Sudah Dinilai' : 'Belum Dinilai',
      feedback: gradeData.feedback || '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(allGrades));
    notifyDataChanged('GRADES_UPDATED', { taskId, studentId, gradeData });
  } catch (e) {
    console.error('Error saving student grade:', e);
  }
};

// Helper: memeriksa apakah kelas siswa cocok dengan target kelas
const isClassMatching = (studentClass = '', targetClass = 'ALL') => {
  if (!targetClass || targetClass === 'ALL' || targetClass === 'Semua Kelas') return true;
  const s = studentClass.trim().toUpperCase();
  const t = targetClass.trim().toUpperCase();
  if (s === t) return true;
  // Memeriksa substring N5, N4, N3, N2, N1
  const levels = ['N1', 'N2', 'N3', 'N4', 'N5'];
  for (const lvl of levels) {
    if (s.includes(lvl) && t.includes(lvl)) return true;
  }
  return s.includes(t) || t.includes(s);
};

// Ambil daftar pengumpulan tugas siswa yang otomatis terhubung dengan data siswa terdaftar
export const getTaskSubmissionsForTask = (taskId, targetClass = 'ALL') => {
  const students = getStoredStudents();
  const allGrades = getStoredGrades();
  const taskGrades = allGrades[taskId] || {};

  // Filter siswa sesuai kelas (jika targetClass tidak ALL)
  const eligibleStudents = students.filter(s => isClassMatching(s.classRoom, targetClass));

  return eligibleStudents.map((student, idx) => {
    const savedGrade = taskGrades[student.id] || taskGrades[student.studentId] || {};
    const hasScore = savedGrade.score !== undefined && savedGrade.score !== '' && savedGrade.score !== null;

    return {
      id: student.id,
      no: idx + 1,
      studentId: student.studentId,
      name: student.name,
      classRoom: student.classRoom,
      avatar: student.avatar || getAvatarFromEmail(student.email, student.name),
      email: student.email,
      fileName: `Tugas_${student.name.replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      submittedAt: student.joinDate ? `${student.joinDate}, 10:00` : '18 Okt 2026, 10:24',
      status: hasScore ? 'Sudah Dinilai' : (savedGrade.status || 'Belum Dinilai'),
      score: hasScore ? Number(savedGrade.score) : '',
      feedback: savedGrade.feedback || ''
    };
  });
};

// ── 4. LEADERBOARD COMPUTATION BERDASARKAN SISWA TERDAFTAR ──

export const getLeaderboardData = (classFilter = 'ALL') => {
  const students = getStoredStudents();
  const allGrades = getStoredGrades();

  if (students.length === 0) {
    return [];
  }

  // Hitung total poin dan skor tugas per siswa
  const ranked = students
    .filter(s => isClassMatching(s.classRoom, classFilter))
    .map(student => {
      let totalTaskScore = 0;
      let gradedTaskCount = 0;

      Object.keys(allGrades).forEach(taskId => {
        const studentGrade = allGrades[taskId]?.[student.id] || allGrades[taskId]?.[student.studentId];
        if (studentGrade && studentGrade.score !== '' && studentGrade.score !== null) {
          totalTaskScore += Number(studentGrade.score);
          gradedTaskCount += 1;
        }
      });

      const avgTaskScore = gradedTaskCount > 0 ? Math.round(totalTaskScore / gradedTaskCount) : 85;
      const totalPoints = gradedTaskCount > 0 ? (totalTaskScore * 10) + 250 : 800;
      const avgGrade = gradedTaskCount > 0 ? (totalTaskScore / gradedTaskCount).toFixed(1) : '85.0';

      return {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        classRoom: student.classRoom,
        avatar: student.avatar || getAvatarFromEmail(student.email, student.name),
        totalPoints,
        avgGrade: parseFloat(avgGrade),
        attendance: student.attendanceRate || '100%',
        tasksScore: `${avgTaskScore}%`,
        quizScore: gradedTaskCount > 0 ? `${Math.min(100, avgTaskScore + 2)}%` : '88%',
        examScore: gradedTaskCount > 0 ? `${Math.min(100, avgTaskScore + 5)}%` : '90%',
        badges: ['crown', 'calendar', 'book'],
        badgeNames: ['Siswa Aktif', 'Tugas Konsisten', 'Nilai Baik'],
        title: `Peserta ${student.classRoom}`
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((s, idx) => ({
      ...s,
      rank: idx + 1,
      title: idx === 0 ? `Juara 1 Kelas ${s.classRoom}` : idx === 1 ? `Peringkat 2 Kelas ${s.classRoom}` : idx === 2 ? `Peringkat 3 Kelas ${s.classRoom}` : `Peringkat ${idx + 1}`
    }));

  return ranked;
};

// ── 5. REKAP NILAI SISWA TERINTEGRASI ──

export const getAllStudentsWithGradeSummary = (classFilter = 'ALL') => {
  const students = getStoredStudents();
  const allGrades = getStoredGrades();
  const allTasks = getStoredTasks();

  return students
    .filter(s => isClassMatching(s.classRoom, classFilter))
    .map((student, idx) => {
      let totalScore = 0;
      let count = 0;

      allTasks.forEach(task => {
        const g = allGrades[task.id]?.[student.id] || allGrades[task.id]?.[student.studentId];
        if (g && g.score !== '' && g.score !== null) {
          totalScore += Number(g.score);
          count += 1;
        }
      });

      const avg = count > 0 ? Math.round(totalScore / count) : 85;
      const letterGrade = avg >= 90 ? 'A' : avg >= 80 ? 'B+' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : 'D';

      return {
        id: student.id,
        no: idx + 1,
        studentId: student.studentId,
        name: student.name,
        classRoom: student.classRoom,
        program: student.program,
        avatar: student.avatar || getAvatarFromEmail(student.email, student.name),
        avgScore: avg,
        letterGrade,
        completedTasks: `${count}/${allTasks.length}`,
        attendance: student.attendanceRate || '100%',
        status: student.status
      };
    });
};
