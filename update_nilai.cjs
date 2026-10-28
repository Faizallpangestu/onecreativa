const fs = require('fs');
const content = fs.readFileSync('src/pages/lms/LmsNilai.jsx', 'utf8');

let newContent = content;

const stateTarget = `  const [user, setUser] = useState({ name: "Siswa", id: "000000" });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser({
        name: parsedUser.name || parsedUser.full_name || "MUHAMMAD FAIZAL",
        id: parsedUser.id || "312310551"
      });
    }
  }, []);

  const students = [
    { id: 1, name: "APRIANTO", quiz: 0, tugas: 0, kaiwa: 0, ukom: 0, sikap: 0, attitude: 0, rata: "-" },
    { id: 2, name: "RAMSYAWALLY", quiz: 0, tugas: 0, kaiwa: 0, ukom: 0, sikap: 0, attitude: 0, rata: "-" },
    { id: 3, name: user.name.toUpperCase(), quiz: 0, tugas: 0, kaiwa: 0, ukom: 0, sikap: 0, attitude: 0, rata: "-" },
  ];`;

const stateReplacement = `  const [user, setUser] = useState({ name: "Siswa", id: "000000" });
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser({
        name: parsedUser.name || parsedUser.full_name || "MUHAMMAD FAIZAL",
        id: parsedUser.id || "312310551"
      });
    }

    // Load actual students
    const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
    let intensifUsers = lpkUsers.filter(u => u.role_name?.toLowerCase() === 'peserta_intensif' || u.role === 'peserta_intensif');
    
    // Fallback if empty for demo
    if (intensifUsers.length === 0) {
      intensifUsers = [
        { id: 1, name: "APRIANTO" },
        { id: 2, name: "RAMSYAWALLY" },
        { id: 3, name: user.name || "MUHAMMAD FAIZAL" }
      ];
    }

    // Load Grades
    const tugasGrades = JSON.parse(localStorage.getItem("sensei_tugas_grades_real") || "{}");
    const quizGrades = JSON.parse(localStorage.getItem("sensei_quiz_grades_real") || "{}");

    const mappedStudents = intensifUsers.map(student => {
      // Calculate Tugas Average
      let totalTugasScore = 0;
      let countTugas = 0;
      Object.values(tugasGrades).forEach(taskSubmissions => {
        const submission = taskSubmissions[student.id];
        if (submission && submission.score !== null && submission.score !== undefined) {
          totalTugasScore += Number(submission.score);
          countTugas++;
        }
      });
      const avgTugas = countTugas > 0 ? Math.round(totalTugasScore / countTugas) : 0;

      // Calculate Quiz Average
      let totalQuizScore = 0;
      let countQuiz = 0;
      Object.values(quizGrades).forEach(quizSubmissions => {
        const submission = quizSubmissions[student.id];
        if (submission && submission.score !== null && submission.score !== undefined) {
          totalQuizScore += Number(submission.score);
          countQuiz++;
        }
      });
      const avgQuiz = countQuiz > 0 ? Math.round(totalQuizScore / countQuiz) : 0;

      // Dummy values for other fields until implemented
      const kaiwa = 0;
      const ukom = 0;
      const sikap = 0;
      const attitude = 0;

      // Calculate overall average
      const scores = [avgQuiz, avgTugas, kaiwa, ukom, sikap, attitude].filter(s => s > 0);
      const rata = scores.length > 0 ? Math.round(scores.reduce((a,b)=>a+b, 0) / scores.length) : "-";

      return {
        id: student.id,
        name: student.name.toUpperCase(),
        quiz: avgQuiz,
        tugas: avgTugas,
        kaiwa,
        ukom,
        sikap,
        attitude,
        rata
      };
    });

    setStudents(mappedStudents);
  }, []);`;

newContent = newContent.replace(stateTarget, stateReplacement);

fs.writeFileSync('src/pages/lms/LmsNilai.jsx', newContent);
console.log("Done");
