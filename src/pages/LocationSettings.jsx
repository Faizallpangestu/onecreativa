import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Map as MapIcon, Target, Save, Search } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";

export default function LocationSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    latitude: "-6.2088", // Default dummy coordinate (Jakarta)
    longitude: "106.8456",
    radius: 50, // in meters
    mapLink: "", // temporary state for map link
  });

  useEffect(() => {
    // Ambil setting dari database
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings.php");
        if (res.data?.data) {
          const { office_latitude, office_longitude, office_radius } = res.data.data;
          setForm({
            latitude: office_latitude || "-6.2088",
            longitude: office_longitude || "106.8456",
            radius: office_radius ? parseInt(office_radius) : 50,
            mapLink: "",
          });
        }
      } catch (err) {
        console.error("Gagal memuat pengaturan lokasi:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Ambil data yang ada dulu biar field lain nggak hilang
      const curr = await api.get("/settings.php");
      const baseData = curr.data?.data || {};

      await api.put("/settings.php", {
        ...baseData,
        office_latitude: form.latitude,
        office_longitude: form.longitude,
        office_radius: form.radius
      });
      navigate("/menu-admin"); 
    } catch {
      alert("Gagal menyimpan pengaturan lokasi!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm({
            ...form,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            mapLink: "", // reset map link when using current location
          });
        },
        () => {
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  const handleMapLinkChange = async (e) => {
    const url = e.target.value;
    setForm((prev) => ({ ...prev, mapLink: url }));

    if (!url) return;

    // First try direct regex for long URLs
    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const regexBang = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;

    let match = url.match(regexBang) || url.match(regexAt);

    if (match) {
      setForm((prev) => ({
        ...prev,
        latitude: match[1],
        longitude: match[2],
      }));
      return;
    }

    // If it's a short URL (e.g., maps.app.goo.gl), call backend to resolve
    if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
      try {
        const res = await api.post("/resolve_map.php", { url });
        if (res.data?.status === "success") {
          setForm((prev) => ({
            ...prev,
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          }));
        }
      } catch (err) {
        console.error("Gagal mendeteksi koordinat dari short link", err);
        // Optionally show an error to the user:
        // alert("Gagal mengekstrak lokasi dari link pendek. Pastikan link valid.");
      }
    }
  };

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">
        
        {/* ── Map Simulation Card ── */}
        <div className="px-5 pt-8">
          <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden mb-6">
            <div className="h-[200px] bg-slate-100 relative w-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50/60"></div>
              
              {/* Geofence Circle Animation */}
              <div 
                className="absolute bg-emerald-500/20 rounded-full border border-emerald-500/40 flex items-center justify-center transition-all duration-300"
                style={{ 
                  width: `${Math.max(120, (form.radius / 100) * 160)}px`, 
                  height: `${Math.max(120, (form.radius / 100) * 160)}px` 
                }}
              >
                <div className="w-5 h-5 bg-emerald-600 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.8),0_8px_15px_rgba(0,0,0,0.2)] animate-bounce"></div>
              </div>

              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-700 shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pusat
                </div>
                <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-700 shadow-sm flex items-center gap-1.5">
                   <span className="text-emerald-600">{form.radius}m</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 text-center bg-white border-t border-slate-100">
              <p className="text-[13px] font-semibold text-slate-500 leading-relaxed">
                Karyawan wajib berada di dalam area lingkaran untuk dapat melakukan absensi masuk/pulang.
              </p>
            </div>
          </div>
        </div>

        {/* ── Form Settings ── */}
        <div className="relative z-10 px-5 mb-24">
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 border border-slate-100 flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Latitude</span>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-mono font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Longitude</span>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-mono font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="relative py-2">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
               </div>
               <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atau</span>
               </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-slate-500">Deteksi dari Link Maps</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                   <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Paste URL Google Maps di sini..."
                  value={form.mapLink || ""}
                  onChange={handleMapLinkChange}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </label>

            <button
              onClick={handleGetCurrentLocation}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-50 text-[13px] font-bold text-emerald-600 hover:bg-emerald-100 transition active:scale-[0.98] border border-emerald-100"
            >
              <Target className="w-4 h-4" />
              Pakai GPS Saya Saat Ini
            </button>

            <div className="h-px bg-slate-100 my-2 w-full"></div>

            {/* Slider Radius */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-500">Radius Toleransi</label>
                <span className="text-[20px] font-black text-emerald-600 leading-none">{form.radius} <span className="text-[12px] font-bold text-emerald-400">meter</span></span>
              </div>
              
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400 mt-3 px-1 uppercase tracking-wider">
                <span>Ketat (10m)</span>
                <span>Longgar (500m)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 left-0 right-0 px-5 flex justify-center pointer-events-none z-50">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="pointer-events-auto w-full max-w-md h-[3.5rem] bg-emerald-600 text-white rounded-[1.5rem] text-[15px] font-black tracking-wide shadow-[0_8px_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan & Kembali
              </>
            )}
          </button>
        </div>

      </div>
    </Layout>
  );
}
