import { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import Layout from './Layout';
import defaultHeroImage from '../assets/lms_agenda_hero_3d.jpg';

export const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400';
export const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c2e59] to-[#1a56db] hover:from-[#0a2547] hover:to-[#1648b8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
export const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer';
export const dangerButtonClass = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer';

export function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

export default function ModuleFrame({ title, description, loading, error, refresh, heroImage, children }) {
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeHeroImage = heroImage || defaultHeroImage;

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

          {/* 3D SIGNATURE HERO BANNER WITH 3D CHARACTER ARTWORK */}
          <div className="relative w-full min-h-[180px] sm:min-h-[220px] rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-[#071f3d] via-[#0c2e59] to-[#164282] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            {/* Background 3D Character Illustration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              <img
                src={activeHeroImage}
                alt="3D LMS Hero Illustration"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none md:max-w-[55%] lg:max-w-[48%] object-cover object-center opacity-90 transition-all duration-500"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,1) 45%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,1) 45%)'
                }}
              />
              {/* High-contrast smooth gradient on the left for maximum text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#071f3d] via-[#071f3d]/90 to-transparent sm:via-[#071f3d]/75" />
            </div>

            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-500 opacity-25 rounded-full blur-[70px] pointer-events-none" />

            {/* Subtle Japanese Wave Pattern Outline */}
            <svg 
              className="absolute bottom-0 left-0 w-full h-full object-cover opacity-10 mix-blend-overlay pointer-events-none" 
              preserveAspectRatio="none" 
              viewBox="0 0 1440 320" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#ffffff" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </svg>

            {/* Banner Content Container */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/20 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5 text-yellow-300" />
                  <span>LPK Creativa Bridging International · LMS Portal</span>
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 leading-tight drop-shadow-sm">
                  {title}
                </h1>
                <p className="text-blue-100/90 text-sm sm:text-base font-medium leading-relaxed max-w-lg drop-shadow-xs">
                  {description}
                </p>
              </div>

              {/* Date & Refresh Widget */}
              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                <div className="bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 text-center min-w-[130px] shadow-sm transition-all">
                  <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wider">
                    {timeNow.toLocaleDateString('id-ID', { weekday: 'long' })}
                  </p>
                  <p className="text-sm font-black text-white">
                    {timeNow.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {refresh && (
                  <button 
                    type="button" 
                    onClick={refresh} 
                    disabled={loading} 
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/25 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ALERTS & SKELETON */}
          {loading && (
            <div role="status" className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm font-semibold text-blue-900 shadow-xs animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
              <span>Sinkronisasi data LMS dari server...</span>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800 shadow-xs flex items-center justify-between gap-3">
              <span>{error}</span>
              {refresh && (
                <button type="button" onClick={refresh} className="text-xs underline font-bold cursor-pointer hover:text-red-950">
                  Coba lagi
                </button>
              )}
            </div>
          )}

          {/* MAIN MODULE CONTENT */}
          {!loading && !error && (
            <div className="space-y-6">
              {children}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
