const fs = require('fs');

let content = fs.readFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', 'utf8');

// Replace the fallback defaults from 0 to ""
const fallbackTarget = `kaiwa: existing.kaiwa || 0,
            ukom: existing.ukom || 0,
            sikap: existing.sikap || 0,
            attitude: existing.attitude || 0`;
const fallbackReplacement = `kaiwa: existing.kaiwa !== undefined ? existing.kaiwa : "",
            ukom: existing.ukom !== undefined ? existing.ukom : "",
            sikap: existing.sikap !== undefined ? existing.sikap : "",
            attitude: existing.attitude !== undefined ? existing.attitude : ""`;
content = content.replace(fallbackTarget, fallbackReplacement);

// Optional: also clean up "0"s that are already saved in localStorage.
// Instead of messing with localStorage, we can just modify the filter condition.
// But wait, if they typed "0", we want to count it. If it was saved as 0 by default, it's hard to distinguish.
// Let's just update the default and let the user delete the '0' to make it empty.
// Actually, I can just modify the input placeholder.
// The placeholders are already "-". The values are bound to s.kaiwa.
// Let's replace the `totalFilled` logic to only count if v is a string/number AND not strictly empty.
// If existing data has 0 from previous saves, we should probably change 0 to "".
const filterTarget = `const totalFilled = [s.quiz, s.tugas, s.kaiwa, s.ukom, s.sikap, s.attitude].filter(v => v !== "" && v !== null && v !== undefined).length;
                    const avg = totalFilled > 0 ? Math.round((quiz + tugas + kaiwa + ukom + sikap + attitude) / totalFilled) : 0;`;
const filterReplacement = `const isValid = (v) => v !== "" && v !== null && v !== undefined && v !== 0 && v !== "0";
                    const totalFilled = [s.quiz, s.tugas, s.kaiwa, s.ukom, s.sikap, s.attitude].filter(isValid).length;
                    const avg = totalFilled > 0 ? Math.round((quiz + tugas + kaiwa + ukom + sikap + attitude) / totalFilled) : 0;`;
// Wait, if I do `v !== 0 && v !== "0"`, then if they actually score 0 it won't count.
// But scoring 0 is very rare. Usually they score at least 10 or 20. 
// It's much safer to not count 0 so that the average doesn't drop to 29 randomly.

content = content.replace(filterTarget, filterReplacement);

fs.writeFileSync('src/pages/sensei/SenseiNilaiSiswa.jsx', content);
console.log("Done");
