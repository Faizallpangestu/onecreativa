import React, { useState } from "react";
import Layout from "../components/Layout";
import { useSEO } from "../hooks/useSEO";
import { Activity, CheckCircle, AlertCircle, RefreshCw, LogIn, Mail, Map, Clock, Zap } from "lucide-react";
import Swal from "sweetalert2";

export default function StravaIntegration() {
  useSEO({ title: "Integrasi Strava", description: "Hubungkan akun Strava Anda untuk memantau aktivitas olahraga." });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  const [historyData, setHistoryData] = useState([
    { id: 1, type: "Lari Pagi", distance: "5.2 km", time: "32:15", pace: "6:12 /km", date: "Kemarin, 06:00" },
    { id: 2, type: "Sepeda Santai", distance: "15.4 km", time: "45:30", pace: "20.3 km/h", date: "3 Hari lalu, 16:30" },
  ]);

  const showToast = (icon, title) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleConnect = (method) => {
    setIsConnecting(true);
    // Simulate OAuth / connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setLastSync(new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      showToast("success", `Berhasil terhubung via ${method}! Data disesuaikan.`);
    }, 1500);
  };

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate fetching new data from Strava API
    setTimeout(() => {
      setIsSyncing(false);
      
      // Simulate getting a new activity
      const newActivity = { 
        id: Date.now(), 
        type: "Lari Siang", 
        distance: "2.5 km", 
        time: "15:20", 
        pace: "6:08 /km", 
        date: "Hari ini, " + new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
      };
      
      setHistoryData([newActivity, ...historyData]);
      setLastSync(new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      showToast("success", "Data aktivitas terbaru berhasil disinkronisasi!");
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setHistoryData([
      { id: 1, type: "Lari Pagi", distance: "5.2 km", time: "32:15", pace: "6:12 /km", date: "Kemarin, 06:00" },
      { id: 2, type: "Sepeda Santai", distance: "15.4 km", time: "45:30", pace: "20.3 km/h", date: "3 Hari lalu, 16:30" }
    ]);
    showToast("success", "Berhasil memutuskan akun Strava!");
  };

  return (
    <Layout appearance="employee">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-12 md:mt-16 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6 shadow-inner">
            <Activity className="w-10 h-10 text-[#FC4C02]" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Integrasi Strava</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Pantau aktivitas olahraga Anda langsung dari Dashboard Karyawan.</p>
        </div>

        {isConnected ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Akun Terhubung</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Sinkronisasi aktivitas aktif.</p>
                  {lastSync && <p className="text-xs font-semibold text-slate-400 mt-1">Terakhir disinkronisasi: {lastSync}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#FC4C02] text-white hover:bg-[#E34402] transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-70"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /> 
                  {isSyncing ? "Menyelaraskan..." : "Sync"}
                </button>
                <button onClick={handleDisconnect} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Putuskan
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <Map className="w-6 h-6 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Riwayat Aktivitas</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {historyData.map((item) => (
                  <div key={item.id} className="p-6 sm:px-8 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FC4C02]">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.type}</h4>
                        <p className="text-sm text-slate-500">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-semibold text-slate-700 w-full sm:w-auto">
                      <div className="flex flex-col"><span className="text-xs text-slate-400 font-normal">Jarak</span>{item.distance}</div>
                      <div className="flex flex-col"><span className="text-xs text-slate-400 font-normal">Waktu</span>{item.time}</div>
                      <div className="flex flex-col"><span className="text-xs text-slate-400 font-normal">Pace/Speed</span>{item.pace}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Pilih Metode Login</h3>
            
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={() => handleConnect("Google")}
                disabled={isConnecting}
                className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Lanjutkan dengan Google
              </button>
              
              <button 
                onClick={() => handleConnect("Email")}
                disabled={isConnecting}
                className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl font-bold bg-[#FC4C02] text-white hover:bg-[#E34402] transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-70"
              >
                <Mail className="w-5 h-5" />
                Login dengan Email
              </button>
            </div>

            <div className="mt-10 bg-amber-50 rounded-2xl p-5 border border-amber-100 text-left">
              <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Petunjuk:
              </h4>
              <p className="text-sm text-amber-700">Gunakan akun Google atau Email yang sama dengan yang terpasang pada aplikasi Strava di HP Anda.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
