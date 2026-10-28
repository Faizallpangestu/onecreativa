const fs = require('fs');

let content = fs.readFileSync('src/pages/sensei/SenseiKehadiran.jsx', 'utf8');

// Change STATUS_STYLE and STATUS_ICON
content = content.replace(/alfa: "bg-red-50 text-red-600 border-red-200",/, 'alfa: "bg-red-50 text-red-600 border-red-200",\n  pending: "bg-slate-50 text-slate-500 border-slate-200",');
content = content.replace(/alfa: <XCircle className="w-3.5 h-3.5" \/>,/, 'alfa: <XCircle className="w-3.5 h-3.5" />,\n  pending: <Clock className="w-3.5 h-3.5" />,');

// Import Clock if not imported
if (!content.includes('Clock')) {
    content = content.replace(/import \{.*?\} from "lucide-react";/, (m) => m.replace('}', ', Clock }'));
}

// Default to pending instead of alfa
content = content.replace(/const st = s\.kehadiran\[activeSession\] \|\| "alfa";/g, 'const st = s.kehadiran[activeSession] || "pending";');
content = content.replace(/s\.kehadiran\[session\] \|\| "alfa"/g, 's.kehadiran[session] || "pending"');
content = content.replace(/activeSession, stat\.status\)/g, 'activeSession, stat.status)');
content = content.replace(/\(s\.kehadiran\[session\] \|\| "alfa"\) === status/g, '(s.kehadiran[session] || "pending") === status');

// Add "Menunggu" to stats
content = content.replace(/\{label:"Hadir",status:"hadir",color:"bg-green-50 text-green-700 border-green-200"\},\{label:"Izin",status:"izin",color:"bg-amber-50 text-amber-700 border-amber-200"\},\{label:"Alfa",status:"alfa",color:"bg-red-50 text-red-600 border-red-200"\}/g, '{label:"Hadir",status:"hadir",color:"bg-green-50 text-green-700 border-green-200"},{label:"Izin",status:"izin",color:"bg-amber-50 text-amber-700 border-amber-200"},{label:"Alfa",status:"alfa",color:"bg-red-50 text-red-600 border-red-200"},{label:"Belum Absen",status:"pending",color:"bg-slate-50 text-slate-600 border-slate-200"}');
// Make grid cols 4
content = content.replace(/grid-cols-3/g, 'grid-cols-2 md:grid-cols-4');

// Update Status buttons
content = content.replace(/\["hadir","izin","alfa"\]\.map/g, '["hadir","izin","alfa", "pending"].map');

fs.writeFileSync('src/pages/sensei/SenseiKehadiran.jsx', content);
