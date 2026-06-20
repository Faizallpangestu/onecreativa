import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";

function getInitials(name) {
  if (!name) return "HR";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    pendingLeaves: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, empRes, leaveRes] = await Promise.all([
          api.get("/attendance.php"),
          api.get("/employees.php"),
          api.get("/leaves.php")
        ]);
        
        const attendances = attRes.data?.data || attRes.data || [];
        const employees = empRes.data?.data || empRes.data || [];
        const leaves = leaveRes.data?.data || leaveRes.data || [];

        const todayStr = new Date().toISOString().slice(0, 10);
        const todayAtt = attendances.filter(a => a.date === todayStr);

        // Hanya hitung karyawan (bukan admin/hr/finance)
        const onlyKaryawan = employees.filter(e => {
          const r = (e.role_name || "karyawan").toLowerCase();
          return r === "karyawan" || r === "employee";
        });

        setStats({
          totalEmployees: onlyKaryawan.length,
          presentToday: todayAtt.length,
          lateToday: todayAtt.filter(a => a.status === "late").length,
          pendingLeaves: leaves.filter(l => l.status === "pending").length,
        });

        // Top 5 recent
        setRecentAttendance(attendances.slice(0, 5));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-slate-500">Memuat dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout hideMobileHeader={true}>
      <div className="min-h-full bg-slate-50 p-4 lg:p-6 pb-24">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ChevronLeft className="w-7 h-7 text-slate-800" strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <div className="w-10 h-10"></div> {/* Spacer for center alignment */}
        </div>

        {/* KPI Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {/* Card 1: Total Karyawan */}
          <div className="bg-white p-5 rounded-[1.5rem] shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex flex-col justify-between aspect-square">
            <span className="text-[12px] font-bold text-slate-500 leading-tight">Total Karyawan</span>
            <span className="text-[42px] font-black text-slate-800 leading-none">{stats.totalEmployees}</span>
          </div>

          {/* Card 2: Kehadiran Hari Ini */}
          <div className="bg-blue-50/60 p-5 rounded-[1.5rem] flex flex-col justify-between aspect-square">
            <span className="text-[12px] font-bold text-blue-600 leading-tight">Kehadiran Hari Ini</span>
            <span className="text-[42px] font-black text-blue-600 leading-none">{stats.presentToday}</span>
          </div>

          {/* Card 3: Terlambat */}
          <div className="bg-red-50/60 p-5 rounded-[1.5rem] flex flex-col justify-between aspect-square">
            <span className="text-[12px] font-bold text-red-500 leading-tight">Terlambat Hari Ini</span>
            <span className="text-[42px] font-black text-red-500 leading-none">{stats.lateToday}</span>
          </div>

          {/* Card 4: Pending Cuti */}
          <div className="bg-orange-50/60 p-5 rounded-[1.5rem] flex flex-col justify-between aspect-square">
            <span className="text-[12px] font-bold text-orange-500 leading-tight">Pending Cuti</span>
            <span className="text-[42px] font-black text-orange-500 leading-none">{stats.pendingLeaves}</span>
          </div>
        </div>

        {/* Recent Attendance */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-black text-slate-900">Recent Attendance</h2>
            <button 
              onClick={() => navigate("/attendance")}
              className="text-[13px] font-bold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentAttendance.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 text-center py-6 bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)]">Belum ada absensi</p>
            ) : (
              recentAttendance.map((att, i) => {
                const dateObj = new Date(att.check_in || att.date);
                const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                
                return (
                  <div key={i} className="bg-white p-3.5 pr-4 rounded-[1.25rem] shadow-[0_2px_8px_rgb(0,0,0,0.02)] flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar */}
                      <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {getInitials(att.name)}
                      </div>
                      
                      {/* Name & Time */}
                      <div>
                        <p className="font-bold text-[14px] text-slate-900 leading-tight">{att.name}</p>
                        <p className="text-[12px] font-medium text-slate-400 mt-1">{dateStr} - {timeStr}</p>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${
                      att.status === 'present' ? 'bg-[#d1fae5] text-[#059669]' :
                      att.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {att.status === 'present' ? 'Present' : att.status === 'late' ? 'Late' : 'Absent'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
