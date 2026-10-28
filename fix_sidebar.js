import fs from 'fs';

let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// 1. Fix the top variables
content = content.replace(
  /const isEmployee = .*?;\n  const isPesertaIntensif = .*?;\n  const isSensei = .*?;/,
`const role = user?.role_name || "";
  const isEmployee = role === "employee" || role === "karyawan" || role === "staff";
  const isPesertaIntensif = role === "peserta_intensif" || role === "peserta_matching" || role === "peserta_mendang" || role === "peserta_alumni" || role === "peserta_nenkin";
  const isSensei = role === "sensei" || role === "sensei_intensif" || user?.is_sensei === true;
  const isHR = role === "hr" || role === "manager" || role === "hrd";
  const isFinance = role === "finance";
  const isGA = role === "ga";
  const isAdmin = role === "admin" || role === "super_admin" || role === "lpk";
  const isSuperAdmin = role === "super_admin";`
);

// 2. Fix Dashboard routes
content = content.replace(
  /path: "\/dashboard",\s*hidden: isPesertaIntensif \|\| isSensei,/,
  `path: "/dashboard",\n          hidden: !(isAdmin || isHR || isEmployee || isGA || isFinance),`
);

// 3. Fix HRD category items (hide from GA, Finance)
// Look for `hidden: isEmployee || isPesertaIntensif || isSensei` and `hidden: isPesertaIntensif || isSensei` within the HRD section
// It's safer to just replace all occurrences of `hidden: isEmployee || isPesertaIntensif || isSensei` with `hidden: !(isAdmin || isHR)`
content = content.replace(/hidden: isEmployee \|\| isPesertaIntensif \|\| isSensei,/g, 'hidden: !(isAdmin || isHR),');
// Note: `Riwayat Absensi`, `Pengajuan Cuti`, `Laporan Kerja`, `Lembur` are currently `hidden: isPesertaIntensif || isSensei`.
// But we want to hide them from GA and Finance too.
// I will just let the script find all occurrences of `hidden: isPesertaIntensif || isSensei,` and replace with `hidden: !(isAdmin || isHR || isEmployee || isGA || isFinance),` 
// Wait, GA and Finance might need leaves or attendance. So `!(isAdmin || isHR || isEmployee || isGA || isFinance)` is basically "is employee of some kind".
// Actually, `isPesertaIntensif || isSensei` just meant "not staff". So `!(isPesertaIntensif || isSensei)` is correct for those shared items.
// Let's just leave `isPesertaIntensif || isSensei` as is for those, BUT we want strict isolation for GA and Finance.

// Let's replace the whole `menuGroups` object using regex or just replace specific hidden checks.
content = content.replace(/category: "HRD",\s*items: \[([\s\S]*?)\]\n    },/m, (match, p1) => {
  let modified = p1.replace(/hidden: (?:isPesertaIntensif \|\| isSensei|!\(isAdmin \|\| isHR\)),/g, 'hidden: !(isAdmin || isHR || isEmployee),');
  modified = modified.replace(/hidden: !(isAdmin || isHR || isEmployee),/g, (m, offset, str) => {
    // Only apply to specific ones
    return m;
  });
  // We can just set all HRD to `!(isAdmin || isHR)` except for attendance, leaves, daily report, overtime.
  return `category: "HRD",\n      items: [${p1.replace(/hidden: .*,/g, (m) => {
    if (m.includes('isEmployee')) return 'hidden: !(isAdmin || isHR),';
    return 'hidden: !(isAdmin || isHR || isEmployee),';
  })}]\n    },`;
});

content = content.replace(/category: "GA",\s*items: \[([\s\S]*?)\]\n    },/m, (match, p1) => {
  return `category: "GA",\n      items: [${p1.replace(/hidden: .*,/g, (m) => {
    return 'hidden: !(isAdmin || isGA),';
  })}]\n    },`;
});

content = content.replace(/category: "KEUANGAN",\s*items: \[([\s\S]*?)\]\n    },/m, (match, p1) => {
  return `category: "KEUANGAN",\n      items: [${p1.replace(/hidden: .*,/g, (m) => {
    return 'hidden: !(isAdmin || isFinance),';
  })}]\n    },`;
});

content = content.replace(/category: "MANAJEMEN LPK",\s*items: \[([\s\S]*?)\]\n    },/m, (match, p1) => {
  return `category: "MANAJEMEN LPK",\n      items: [${p1.replace(/hidden: .*,/g, (m) => {
    return 'hidden: !(isAdmin),';
  })}]\n    },`;
});

fs.writeFileSync('src/components/Sidebar.jsx', content);
