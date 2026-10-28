const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// 1. Fix the top variables
content = content.replace(
  /const isEmployee = .*?;\n\s*const isPesertaIntensif = .*?;\n\s*const isSensei = .*?;/,
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

content = content.replace(
  /path: "\/dashboard",\s*hidden: isPesertaIntensif \|\| isSensei,/,
  `path: "/dashboard",\n          hidden: !(isAdmin || isHR || isEmployee || isGA || isFinance),`
);

content = content.replace(/category: "HRD",\s*items: \[([\s\S]*?)\]\n    },/m, (match, p1) => {
  let modified = p1;
  // Employee, HR, Admin can see attendance, leaves, overtime, daily report
  modified = modified.replace(/path: "\/attendance",\s*hidden: .*,/g, 'path: "/attendance",\n          hidden: !(isAdmin || isHR || isEmployee),');
  modified = modified.replace(/path: "\/leaves",\s*hidden: .*,/g, 'path: "/leaves",\n          hidden: !(isAdmin || isHR || isEmployee),');
  modified = modified.replace(/path: "\/daily-report-admin",\s*hidden: .*,/g, 'path: "/daily-report-admin",\n          hidden: !(isAdmin || isHR || isEmployee),');
  modified = modified.replace(/path: "\/overtime",\s*hidden: .*,/g, 'path: "/overtime",\n          hidden: !(isAdmin || isHR || isEmployee),');
  
  // Only Admin, HR can see employees, positions, payroll
  modified = modified.replace(/path: "\/employees",\s*hidden: .*,/g, 'path: "/employees",\n          hidden: !(isAdmin || isHR),');
  modified = modified.replace(/path: "\/positions",\s*hidden: .*,/g, 'path: "/positions",\n          hidden: !(isAdmin || isHR),');
  modified = modified.replace(/path: "\/payroll-hrd",\s*hidden: .*,/g, 'path: "/payroll-hrd",\n          hidden: !(isAdmin || isHR),');
  
  return `category: "HRD",\n      items: [${modified}]\n    },`;
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

content = content.replace(/category: "SETTINGS",\s*items: \[([\s\S]*?)\]\n    }/m, (match, p1) => {
  return `category: "SETTINGS",\n      items: [${p1.replace(/hidden: .*,/g, (m) => {
    if (m.includes("super_admin")) return 'hidden: !(isSuperAdmin),';
    return 'hidden: !(isAdmin),';
  })}]\n    }`;
});

fs.writeFileSync('src/components/Sidebar.jsx', content);
