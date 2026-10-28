import { createElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, BookOpen, Users, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
export default function DashboardCreativa() {
  const [timeNow, setTimeNow] = useState(new Date()),
    [response, setResponse] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => setTimeNow(new Date()), 60000);
    axios.get('/api/dashboard_stats.php').then(r => {
      if (r.data.status !== 'success') throw new Error('Respons tidak valid.');
      if (active) setResponse(r.data);
    }).catch(e => {
      if (active) setError(e.response?.data?.message || 'Dashboard operasional gagal dimuat.');
    });
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const greet = () => timeNow.getHours() < 12 ? 'Selamat Pagi' : timeNow.getHours() < 15 ? 'Selamat Siang' : timeNow.getHours() < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const data = response?.operational;
  return <Layout hideMobileHeader={true} hideBottomNav={true}><div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-12"><div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* HERO BANNER */}
          <div className="relative w-full h-[200px] sm:h-[240px] rounded-[2rem] overflow-hidden shadow-lg bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#1d4ed8] flex items-center">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-[#60a5fa] opacity-20 rounded-full blur-[80px] translate-y-1/3" />
            
            {/* SVG Mountain / Fuji Silhouette overlay (Abstract) */}
            <svg className="absolute bottom-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>

            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center px-8 md:px-12">
              <div className="max-w-xl text-white">
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  {greet()}, <span className="text-yellow-400">Admin!</span>
                </h1>
                <p className="text-blue-100 text-[14px] md:text-[15px] font-medium leading-relaxed">
                  Kelola seluruh operasional LPK Creativa dengan lebih efektif dan efisien.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-6 text-white">
                <div className="text-right italic text-blue-100 text-sm max-w-xs border-r border-blue-400/30 pr-6">
                  "Pendidikan hari ini, membuka masa depan yang lebih baik di Jepang."
                  <span className="block mt-2 font-bold text-xs not-italic text-white">- LPK Creativa</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">
                    {timeNow.toLocaleDateString('id-ID', {
                    weekday: 'long'
                  })}
                  </p>
                  <p className="text-lg font-black tracking-tight">
                    {timeNow.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  </p>
                </div>
              </div>
            </div>
          </div>


 {error && <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[['TOTAL SISWA INTENSIF', data?.students, GraduationCap], ['JADWAL MENDATANG', data?.upcoming_meetings, BookOpen], ['AKUN SENSEI AKTIF', data?.active_sensei, Users], ['PENDAFTARAN 30 HARI', data?.recent_students, UserPlus]].map(([label, value, Icon]) => <section key={label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex justify-between"><div><p className="text-xs text-slate-400 font-bold">{label}</p><strong className="text-3xl">{value ?? (error ? 'Belum tersedia' : 'Memuat...')}</strong><p className="text-xs text-slate-500 mt-2">Data database tersimpan</p></div>{createElement(Icon, {
              className: 'text-blue-500'
            })}</section>)}</div>
 <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"><div className="flex justify-between"><h2 className="font-bold">Peserta Intensif Terdaftar</h2><Link className="text-blue-600" to="/lpk-intensif">Buka Master Siswa</Link></div><div className="overflow-auto mt-4"><table className="w-full text-left text-sm"><thead><tr><th>ID sumber</th><th>Nama</th><th>Level</th><th>Batch</th><th>Terdaftar</th></tr></thead><tbody>{response?.students.map(s => <tr key={s.id} className="border-b border-slate-100"><td className="py-3">{s.id}</td><td>{s.name}</td><td>{s.level ?? 'Belum tersedia'}</td><td>{s.batch ?? 'Belum tersedia'}</td><td>{s.created_at ?? 'Belum tersedia'}</td></tr>)}</tbody></table>{response && !response.students.length && <p>Belum ada peserta tersimpan.</p>}</div></section>
 <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"><h2 className="font-bold">Keuangan dari Jurnal Posted</h2><p className="text-sm text-slate-500 mt-2">Laba rugi, arus kas, dan neraca tersedia bersama cakupan data dan dokumen sumber.</p><div className="flex gap-3 mt-4"><Link className="text-blue-600 font-bold" to="/laporan-keuangan">Laporan Keuangan</Link><Link className="text-blue-600 font-bold" to="/buku-transaksi">Buku Transaksi & Audit</Link></div></section>
 </div></div></Layout>;
}
