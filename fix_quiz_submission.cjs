const fs = require('fs');
let content = fs.readFileSync('src/pages/lms/LmsQuiz.jsx', 'utf8');

// 1. Replace fetchData mock logic
const fetchTarget = `// Mock submissions
      setMySubmissions([]);`;
const fetchReplacement = `// Real submissions logic
      const allGrades = JSON.parse(localStorage.getItem("sensei_quiz_grades_real") || "{}");
      const found = lpkUsers.find(u => u.email === userData.email);
      const studentId = found ? found.id : (userData.id || 3);
      
      const mySubs = [];
      Object.keys(allGrades).forEach(taskId => {
        if (allGrades[taskId][studentId]) {
           mySubs.push({
             task_id: taskId,
             ...allGrades[taskId][studentId]
           });
        }
      });
      setMySubmissions(mySubs);`;

content = content.replace(fetchTarget, fetchReplacement);

// 2. Replace submitTask logic
const submitTarget = `const submitTask = async () => {
    if (!submissionText && !submissionFile && !submissionLink) {
      alert("Harap isi teks jawaban, tautan link, atau lampirkan file!");
      return;
    }

    setIsSubmitting(true);
    try {
      alert("Kuis berhasil dikumpulkan (Mock)!");
      setActiveTask(null);
    } catch (err) {
      console.error("Failed to submit", err);
      alert("Gagal mengumpulkan Kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };`;
const submitReplacement = `const submitTask = async () => {
    if (!submissionText && !submissionFile && !submissionLink) {
      alert("Harap isi teks jawaban, tautan link, atau lampirkan file!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get student id
      const lpkUsers = JSON.parse(localStorage.getItem("lpk_users") || "[]");
      const found = lpkUsers.find(u => u.email === user.email);
      const studentId = found ? found.id : (user?.id || 3);

      const newGradeObj = {
        studentId: studentId,
        score: null,
        status: "submitted",
        link: submissionLink,
        file: submissionFile ? submissionFile.name : null,
        text: submissionText,
        submittedAt: new Date().toISOString()
      };
      
      const allGrades = JSON.parse(localStorage.getItem("sensei_quiz_grades_real") || "{}");
      if (!allGrades[activeTask.id]) {
        allGrades[activeTask.id] = {};
      }
      allGrades[activeTask.id][studentId] = newGradeObj;
      localStorage.setItem("sensei_quiz_grades_real", JSON.stringify(allGrades));
      
      setMySubmissions(prev => [...prev, { task_id: activeTask.id, ...newGradeObj }]);
      
      setActiveTask(null);
    } catch (err) {
      console.error("Failed to submit", err);
      alert("Gagal mengumpulkan Kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };`;

content = content.replace(submitTarget, submitReplacement);

fs.writeFileSync('src/pages/lms/LmsQuiz.jsx', content);
console.log("Done");
