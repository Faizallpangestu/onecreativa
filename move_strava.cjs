const fs = require('fs');
let f = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
f = f.replace(/(\s*label: "Hak Akses Login",[\s\S]*?<\/SidebarIcon>\s*\),\s*\}\s*)]/m, `$1,\n        {\n          label: "Aktivitas Strava",\n          path: "/strava-admin",\n          hidden: !(isAdmin || isHR || isFinance),\n          icon: (\n            <SidebarIcon>\n              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />\n            </SidebarIcon>\n          ),\n        }\n      ]`);
fs.writeFileSync('src/components/Sidebar.jsx', f);
