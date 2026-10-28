import React, { useState } from "react";
import Layout from "../components/Layout";
import { useSEO } from "../hooks/useSEO";
import { Activity, Search, Filter, Map, Clock, ArrowUpDown, RefreshCw, CalendarDays, User, Zap } from "lucide-react";
import Swal from "sweetalert2";

export default function StravaAdmin() {
  useSEO({ title: "Aktivitas Strava Admin", description: "Pantau aktivitas olahraga karyawan melalui integrasi Strava." });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // "all", "karyawan", "siswa"
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dummyData = [
    { id: 1, name: "Anggi Alfin", role: "Karyawan", type: "Lari", distance: "5.2 km", time: "32:15", pace: "6:12 /km", date: "Hari ini, 06:00", avatar: "AA" },
    { id: 2, name: "Budi Santoso", role: "Karyawan", type: "Sepeda", distance: "15.4 km", time: "45:30", pace: "20.3 km/h", date: "Kemarin, 16:30", avatar: "BS" },
    { id: 3, name: "Citra Kirana", role: "Siswa LPK", type: "Lari", distance: "3.1 km", time: "18:45", pace: "6:02 /km", date: "5 Okt 2026, 16:15", avatar: "CK" },
    { id: 4, name: "Deni Pratama", role: "Siswa LPK", type: "Jalan Cepat", distance: "4.0 km", time: "40:00", pace: "10:00 /km", date: "4 Okt 2026, 06:30", avatar: "DP" },
    { id: 5, name: "Eka Putri", role: "Karyawan", type: "Lari", distance: "10.0 km", time: "1:05:00", pace: "6:30 /km", date: "2 Okt 2026, 16:00", avatar: "EP" },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Data aktivitas Strava berhasil diperbarui',
        showConfirmButton: false,
        timer: 3000
      });
    }, 1500);
  };

  const filteredData = dummyData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || item.role.toLowerCase().includes(filterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-12 md:mt-16 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 mb-4 shadow-inner">
              <Activity className="w-6 h-6 text-[#FC4C02]" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Aktivitas Strava</h1>
            <p className="text-slate-500 mt-2 text-lg">Pantau aktivitas olahraga seluruh karyawan dan siswa LPK.</p>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#FC4C02] text-white hover:bg-[#E34402] transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-70"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            Sinkronisasi Data
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FC4C02] focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <div className="flex gap-2">
              {['all', 'karyawan', 'siswa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${
                    filterRole === role 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {role === 'all' ? 'Semua' : role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table / List */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-semibold rounded-tl-3xl">Pengguna</th>
                  <th className="px-6 py-4 font-semibold">Tipe & Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Jarak</th>
                  <th className="px-6 py-4 font-semibold">Waktu</th>
                  <th className="px-6 py-4 font-semibold">Pace / Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FC4C02] flex items-center justify-center font-bold text-sm">
                            {item.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> {item.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-[#FC4C02]" /> {item.type}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <CalendarDays className="w-3 h-3" /> {item.date}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4 text-slate-400" />
                          {item.distance}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {item.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100">
                          <Zap className="w-4 h-4 text-amber-500" />
                          {item.pace}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium">Tidak ada data aktivitas ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
