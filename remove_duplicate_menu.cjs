const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// Find the section that has duplicate Manajemen Siswa.
// It looks like:
/*
        {
          label: "Manajemen Siswa",
          path: "/sensei/student-management",
          hidden: !isSensei,
          icon: (
            <SidebarIcon>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </SidebarIcon>
          ),
        },
*/

content = content.replace(/\{\s*label:\s*"Manajemen Siswa",\s*path:\s*"\/sensei\/student-management",[\s\S]*?\},/g, '');

fs.writeFileSync('src/components/Sidebar.jsx', content);
