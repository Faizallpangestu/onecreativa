const fs = require('fs');
let fileContent = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// Regex to find and remove ALL occurrences of the Strava employee block
const stravaBlockRegex = /\s*\{\s*label:\s*"Strava",\s*path:\s*"\/strava",\s*hidden:\s*!isEmployee,[\s\S]*?<\/SidebarIcon>\s*\),\s*\},?/g;

fileContent = fileContent.replace(stravaBlockRegex, '');

// Now we need to insert it back ONLY into the KARYAWAN category.
// Let's find the KARYAWAN category items array.
const karyawanRegex = /(category:\s*"KARYAWAN",\s*items:\s*\[[\s\S]*?)(\s*\]\s*\})/m;

fileContent = fileContent.replace(karyawanRegex, (match, p1, p2) => {
  return p1 + `,\n        {\n          label: "Strava",\n          path: "/strava",\n          hidden: !isEmployee,\n          icon: (\n            <SidebarIcon>\n              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>\n            </SidebarIcon>\n          ),\n        }` + p2;
});

fs.writeFileSync('src/components/Sidebar.jsx', fileContent);
