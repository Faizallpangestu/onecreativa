import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, SwitchCamera, ScanFace } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useFaceApi } from "../hooks/useFaceApi";
import api from "../services/api";

const MATCH_INTERVAL_MS = 800;

// Helper: Haversine distance formula
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung oleh browser Anda."));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
         enableHighAccuracy: true,
         timeout: 10000,
         maximumAge: 0
      });
    }
  });
};

export default function FaceClock() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const lastMatchTime = useRef(0);

  const [mode, setMode] = useState("clock_in");
  const [enrolled, setEnrolled] = useState([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(true);
  const [scanStatus, setScanStatus] = useState("idle");
  const [matchedPerson, setMatchedPerson] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ present: 0, total: 8 });

  const { videoRef, isReady, error: camError, startCamera, stopCamera, captureSnapshot } = useCamera();
  const { isLoaded, loadError, detectFace, matchFace, drawDetection } = useFaceApi();

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get("/face_enroll.php");
        if (resp.data.status === "success") {
          setEnrolled(resp.data.data || []);
        }
      } catch (err) {
        console.error("Gagal load enrolled:", err);
      } finally {
        setLoadingEnrolled(false);
      }
    };
    load();
    fetchStats();
    startCamera();
    return () => stopCamera();
  }, []);

  const fetchStats = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        api.get("/attendance.php"),
        api.get("/employees.php")
      ]);
      const attendances = attRes.data?.data || attRes.data || [];
      const employees = empRes.data?.data || empRes.data || [];
      
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayAtt = attendances.filter(a => a.date === todayStr);
      
      const onlyKaryawan = employees.filter(e => {
        const r = (e.role_name || "karyawan").toLowerCase();
        return r === "karyawan" || r === "employee";
      });
      
      setStats({
        present: todayAtt.length,
        total: onlyKaryawan.length
      });
    } catch {}
  };

  useEffect(() => {
    if (!isReady || !isLoaded || enrolled.length === 0 || result) return;

    const loop = async () => {
      if (!videoRef.current || processing) {
        loopRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      const { detection, descriptor } = await detectFace(videoRef.current);

      if (!detection || !descriptor) {
        setScanStatus("idle");
        setMatchedPerson(null);
        setConfidence(0);
        if (canvasRef.current) {
          canvasRef.current.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        loopRef.current = requestAnimationFrame(loop);
        return;
      }

      if (now - lastMatchTime.current > MATCH_INTERVAL_MS) {
        lastMatchTime.current = now;
        setScanStatus("scanning");

        const { match, confidence: conf } = matchFace(descriptor, enrolled, 0.45);
        setConfidence(conf);

        if (match) {
          setScanStatus("matched");
          setMatchedPerson(match);
          drawDetection(canvasRef.current, videoRef.current, detection, `${match.employee_name} (${Math.round(conf * 100)}%)`, "#39ff14");
        } else {
          setScanStatus("no_match");
          setMatchedPerson(null);
          drawDetection(canvasRef.current, videoRef.current, detection, "Tidak dikenal", "#ff3366");
        }
      } else {
        if (matchedPerson && detection) {
          drawDetection(canvasRef.current, videoRef.current, detection, matchedPerson.employee_name, "#39ff14");
        }
      }

      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
  }, [isReady, isLoaded, enrolled, processing, result, mode, matchedPerson]);

  const handleManualClock = async (type) => {
    if (processing) return;

    // Ambil ID Karyawan dari sesi aktif, bukan dari hasil deteksi AI
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const userObj = JSON.parse(userStr);
    const empId = userObj.employee_id;

    if (!empId) {
      setResult({ error: true, message: "ID Karyawan tidak ditemukan di sesi ini. Harap Log Out lalu Log In kembali." });
      setTimeout(() => setResult(null), 3000);
      return;
    }
    
    setProcessing(true);
    cancelAnimationFrame(loopRef.current);

    // --- Geofencing Check ---
    const geofenceConfigStr = localStorage.getItem("geofence_config");
    if (geofenceConfigStr) {
      try {
        const config = JSON.parse(geofenceConfigStr);
        if (config.latitude && config.longitude && config.radius) {
          const position = await getCurrentLocation();
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const distance = getDistanceFromLatLonInM(
            parseFloat(config.latitude), 
            parseFloat(config.longitude), 
            userLat, 
            userLon
          );

          if (distance > config.radius) {
            setResult({ error: true, message: `Anda berada di luar area absen kantor! Jarak: ${Math.round(distance)}m (Maks: ${config.radius}m)` });
            setProcessing(false);
            return;
          }
        }
      } catch (err) {
        setResult({ error: true, message: "Gagal memverifikasi lokasi Anda. " + (err.message || "Pastikan izin lokasi (GPS) aktif.") });
        setProcessing(false);
        return;
      }
    }
    // ------------------------

    const snapshot = captureSnapshot(0.7);

    try {
      const resp = await api.post("/face_clock.php", {
        employee_id: empId,
        type: type,
        confidence: confidence || 1.0, // Bypass confidence
        snapshot: snapshot,
      });

      if (resp.data.status === "success") {
        setScanStatus("success");
        setResult(resp.data);
        fetchStats();
      } else {
        setScanStatus("error");
        setResult({ error: true, message: resp.data.message });
        setTimeout(resetScan, 3000);
      }
    } catch (err) {
      setScanStatus("error");
      setResult({ error: true, message: err.response?.data?.message || "Koneksi gagal" });
      setTimeout(resetScan, 3000);
    }
  };

  const resetScan = () => {
    setProcessing(false);
    setScanStatus("idle");
    setResult(null);
    setMatchedPerson(null);
    setConfidence(0);
    loopRef.current = requestAnimationFrame(() => {});
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden z-50">
      {/* Background Camera Layer */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Dark blur overlay to make viewfinder pop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10"
        />
      </div>

        {/* Header Transparan */}
        <div className="relative z-20 flex items-center justify-between p-6 pt-10">
          <button 
            onClick={() => navigate("/home")}
            className="w-12 h-12 flex items-center justify-center text-white bg-black/20 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-all"
          >
            <X className="w-7 h-7 drop-shadow-md" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-white bg-black/20 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-all">
            <SwitchCamera className="w-6 h-6 drop-shadow-md" />
          </button>
        </div>

      {/* Area Pemindaian / Viewfinder */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
        {/* Bounding Box Neon Green */}
        <div className="w-[280px] h-[340px] rounded-[3rem] border-4 border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.4)] flex items-center justify-center overflow-hidden relative">
          {/* Inner cutout for clear camera view */}
          <div className="absolute inset-0" style={{ backdropFilter: 'blur(0px)', backgroundColor: 'transparent' }}></div>
          
          {/* Overlay Status (Error / Success) 3D Popup */}
          {result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 p-4">
              <div 
                className={`w-full max-w-[240px] flex flex-col items-center justify-center p-6 text-center rounded-[2rem] border-t-2 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_10px_15px_-3px_rgba(0,0,0,0.3),_inset_0_4px_6px_rgba(255,255,255,0.3)] transition-all transform scale-100 animate-[bounce_0.5s_ease-out] ${
                  result.error 
                    ? 'bg-gradient-to-b from-red-400 to-red-600 text-white' 
                    : 'bg-gradient-to-b from-emerald-400 to-green-600 text-white'
                }`}
              >
                <div className="text-6xl mb-2 drop-shadow-lg animate-pulse">
                  {result.error ? '⚠️' : '🎉'}
                </div>
                <p className="font-black text-2xl mb-2 tracking-wide drop-shadow-md">
                  {result.error ? 'Gagal!' : 'Yey, Berhasil!'}
                </p>
                <p className="text-sm font-semibold opacity-95 drop-shadow-sm mb-4 leading-snug">
                  {result.message}
                </p>
                {result && !result.error && (
                  <button 
                    onClick={resetScan} 
                    className="mt-2 px-8 py-3 bg-white text-green-700 rounded-full text-sm font-black shadow-[0_6px_0_#166534,0_15px_20px_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_#166534] active:translate-y-[6px] transition-all"
                  >
                    TUTUP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Floating Instruction */}
        {!result && (
          <div className="mt-8 bg-black/50 backdrop-blur-xl px-6 py-3.5 rounded-[1rem] border border-white/20 text-[14px] font-semibold tracking-wide shadow-xl">
            {isLoaded ? "Posisikan wajah Anda di dalam area" : "Menyiapkan AI..."}
          </div>
        )}
      </div>

        {/* Bottom Sheet */}
        <div className="relative z-20 bg-white text-slate-900 rounded-t-[3rem] pt-6 pb-10 px-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-white/20">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
          
          {/* Kehadiran Info */}
          <div className="flex flex-col items-center mb-8">
            <p className="text-slate-500 font-bold text-[12px] uppercase tracking-[0.2em]">Kehadiran Hari Ini: <span className="text-slate-800 font-black">{stats.present}/{stats.total}</span></p>
          </div>
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleManualClock('clock_in')}
                className="w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl py-4 shadow-[0_10px_25px_rgba(37,99,235,0.3)] active:scale-[0.97] transition-all"
              >
                <ScanFace className="w-7 h-7" strokeWidth={2} />
                <span className="font-bold text-[14px] tracking-wide">ABSEN MASUK</span>
              </button>
    
              <button 
                onClick={() => handleManualClock('clock_out')}
                className="w-full flex flex-col items-center justify-center gap-2 bg-white text-rose-600 border-2 border-rose-100 rounded-3xl py-4 shadow-[0_10px_25px_rgba(244,63,94,0.15)] hover:bg-rose-50 hover:border-rose-200 active:scale-[0.97] transition-all"
              >
                <ScanFace className="w-7 h-7" strokeWidth={2} />
                <span className="font-bold text-[14px] tracking-wide">ABSEN PULANG</span>
              </button>
            </div>
        </div>

    </div>
  );
}
