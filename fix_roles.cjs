const fs = require('fs');

// 1. Add useSEO to StravaIntegration.jsx
let stravaFile = fs.readFileSync('src/pages/StravaIntegration.jsx', 'utf8');
if (!stravaFile.includes('useSEO')) {
  stravaFile = stravaFile.replace('import Layout from "../components/Layout";', 'import Layout from "../components/Layout";\nimport { useSEO } from "../hooks/useSEO";');
  stravaFile = stravaFile.replace('export default function StravaIntegration() {', 'export default function StravaIntegration() {\n  useSEO({ title: "Integrasi Strava", description: "Hubungkan akun Strava Anda untuk memantau aktivitas olahraga." });');
  fs.writeFileSync('src/pages/StravaIntegration.jsx', stravaFile);
}

// 2. Add useSEO to StravaAdmin.jsx
let stravaAdminFile = fs.readFileSync('src/pages/StravaAdmin.jsx', 'utf8');
if (!stravaAdminFile.includes('useSEO')) {
  stravaAdminFile = stravaAdminFile.replace('import Layout from "../components/Layout";', 'import Layout from "../components/Layout";\nimport { useSEO } from "../hooks/useSEO";');
  stravaAdminFile = stravaAdminFile.replace('export default function StravaAdmin() {', 'export default function StravaAdmin() {\n  useSEO({ title: "Aktivitas Strava Admin", description: "Pantau aktivitas olahraga karyawan melalui integrasi Strava." });');
  fs.writeFileSync('src/pages/StravaAdmin.jsx', stravaAdminFile);
}

// 3. Add allowedRoles to App.jsx for specific routes
let appFile = fs.readFileSync('src/App.jsx', 'utf8');

const roleMap = {
  '/menu-hrd': '["hr", "hrd", "manager", "admin", "super_admin"]',
  '/menu-admin': '["admin", "super_admin"]',
  '/menu-finance': '["finance", "admin", "super_admin"]',
  '/menu-ga': '["ga", "admin", "super_admin"]',
  '/strava"': '["karyawan", "employee", "staff"]',
  '/strava-admin"': '["admin", "super_admin", "hr", "hrd", "manager", "finance"]',
  '/dashboard"': '["admin", "super_admin"]',
  '/menu-karyawan': '["karyawan", "employee", "staff"]'
};

for (const [route, roles] of Object.entries(roleMap)) {
  const regex = new RegExp(`(<Route path="${route}"\\s+element={<ProtectedRoute)(>)(<[a-zA-Z0-9]+ \\/>\\s*<\\/ProtectedRoute>}\\s*\\/>)`);
  appFile = appFile.replace(regex, `$1 allowedRoles={${roles}}$2$3`);
}

fs.writeFileSync('src/App.jsx', appFile);
