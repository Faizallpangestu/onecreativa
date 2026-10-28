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
      reject(new Error("Geolocation tidak didukung (atau Anda menggunakan HTTP non-secure)."));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
         enableHighAccuracy: true,
         timeout: 20000,
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

  const [mode] = useState("clock_in");
  const [enrolled, setEnrolled] = useState([]);
  const [, setLoadingEnrolled] = useState(true);
  const [, setScanStatus] = useState("idle");
  const [matchedPerson, setMatchedPerson] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [, setTodayAtt] = useState(null);
  const [monthStats, setMonthStats] = useState({ izin: 0, sakit: 0, alpha: 0, hadir: 0 });
  const [currentUserProfile, setCurrentUserProfile] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [geofenceConfig, setGeofenceConfig] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' = depan, 'environment' = belakang

  const { videoRef, isReady, startCamera, stopCamera, captureSnapshot } = useCamera();
  const { isLoaded, detectFace, matchFace, drawDetection } = useFaceApi();

  const handleClose = async () => {
    console.log("[FaceClock] Close button clicked");
    try {
      // 1. Stop animation loop immediately
      if (loopRef.current) {
        console.log("[FaceClock] Cancelling animation frame");
        cancelAnimationFrame(loopRef.current);
        loopRef.current = null;
      }

      // 2. Stop camera stream
      console.log("[FaceClock] Stopping camera stream");
      stopCamera();

      // 3. Clear all state
      console.log("[FaceClock] Clearing state");
      setProcessing(false);
      setScanStatus("idle");
      setResult(null);
      setMatchedPerson(null);
      setConfidence(0);

      // 4. Small delay to ensure cleanup complete
      console.log("[FaceClock] Waiting for cleanup");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 5. Clear canvas
      if (canvasRef.current) {
        console.log("[FaceClock] Clearing canvas");
        canvasRef.current.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // 6. Navigate home
      console.log("[FaceClock] Navigating to home");
      navigate("/home");
    } catch (err) {
      console.error("[FaceClock] Error closing face clock:", err);
      navigate("/home");
    }
  };

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
    startCamera({ video: { facingMode: "user" } });
    
    // Cleanup on unmount
    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
      stopCamera();
      if (canvasRef.current) {
        try {
          canvasRef.current.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        } catch { /* Best-effort cleanup or optional browser data. */ }
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      const [attRes, profileRes, setRes] = await Promise.all([
        api.get("/attendance.php"),
        api.get("/profile.php"),
        api.get("/settings.php")
      ]);
      const attendances = attRes.data?.data || attRes.data || [];
      if (profileRes.data?.status !== "success" || !profileRes.data.data?.employee_id) {
        throw new Error("Profil karyawan belum terhubung ke akun login. Hubungi admin untuk menghubungkannya.");
      }
      if (setRes.data?.status !== "success") throw new Error("Pengaturan lokasi absen gagal dimuat. Coba lagi.");
      const profile = profileRes.data.data;
      const settingsData = setRes.data?.data || {};

      if (settingsData.office_latitude) {
        setGeofenceConfig({
          latitude: settingsData.office_latitude,
          longitude: settingsData.office_longitude,
          radius: settingsData.office_radius ? parseInt(settingsData.office_radius) : 50
        });
      }
      
      const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

      // --- Personal Attendance & Stats ---
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const empId = profile.employee_id;

        // Ambil data terbaru dari API agar WFH/WFO sinkron
        if (profile) {
           setCurrentUserProfile(prev => ({ ...prev, ...profile }));
           // Update localStorage diam-diam agar konsisten, tapi jangan timpa id bawaan login (user_id)
           const updatedUser = { ...u, ...profile };
           if (u.id) updatedUser.id = u.id; // Kembalikan u.id yang asli (users.id)
           updatedUser.employee_id = profile.employee_id;
           localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        if (empId) {
           const personalData = attendances.filter(a => String(a.employee_id) === String(empId));
           const currMonth = todayStr.slice(0, 7); // YYYY-MM
           
           const todayRecord = personalData.find(d => d.date === todayStr);
           setTodayAtt(todayRecord || null);

           let izin=0, sakit=0, alpha=0, hadir=0;
           personalData.forEach(d => {
             if (d.date.startsWith(currMonth)) {
                const st = (d.status || '').toLowerCase();
                if (st === 'izin') izin++;
                else if (st === 'sakit') sakit++;
                else if (st === 'alpha' || st === 'absen') alpha++;
                else if (st === 'present' || st === 'late' || st === 'hadir') hadir++;
             }
           });
           setMonthStats({ izin, sakit, alpha, hadir });
        }
      }
      setProfileReady(true);
      setProfileError("");
    } catch (error) {
      setProfileReady(false);
      setProfileError(error.response?.data?.message || error.message || "Data akun absen gagal dimuat. Coba lagi.");
    }
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
    if (!profileReady) {
      setResult({ error: true, message: profileError || "Data akun absen sedang dimuat. Tunggu sebentar lalu coba lagi." });
      return;
    }

    // Ambil ID Karyawan dari sesi aktif, bukan dari hasil deteksi AI
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const userObj = JSON.parse(userStr);
    const empId = currentUserProfile?.employee_id;

    if (!empId) {
      setResult({ error: true, message: "ID Karyawan tidak ditemukan di sesi ini. Harap Log Out lalu Log In kembali." });
      setTimeout(() => setResult(null), 3000);
      return;
    }
    
    setProcessing(true);
    cancelAnimationFrame(loopRef.current);

    // --- Geofencing Check & Location ---
    let finalLat = null;
    let finalLon = null;
    
    // Gunakan profile terbaru yang sudah di-fetch dari API
    const activeUser = currentUserProfile || userObj;
    const isWFH = activeUser.work_type === 'WFH';

    try {
      // Selalu coba dapatkan lokasi (baik WFO maupun WFH)
      const position = await getCurrentLocation();
      finalLat = position.coords.latitude;
      finalLon = position.coords.longitude;

      if (!isWFH && geofenceConfig) {
        if (geofenceConfig.latitude && geofenceConfig.longitude && geofenceConfig.radius) {
          const distance = getDistanceFromLatLonInM(
            parseFloat(geofenceConfig.latitude), 
            parseFloat(geofenceConfig.longitude), 
            finalLat, 
            finalLon
          );

          if (distance > geofenceConfig.radius) {
            setResult({ error: true, message: `Anda berada di luar area absen kantor! Jarak: ${Math.round(distance)}m (Maks: ${geofenceConfig.radius}m)` });
            setProcessing(false);
            return;
          }
        }
      }
    } catch (err) {
      if (!isWFH) {
        let msg = err.message;
        if (err.code === 1) msg = "Izin lokasi ditolak. Buka pengaturan browser Anda dan izinkan akses lokasi (GPS).";
        else if (err.code === 2) msg = "Sinyal GPS tidak tersedia. Coba keluar ruangan atau nyalakan layanan lokasi di HP Anda.";
        else if (err.code === 3) msg = "Pencarian lokasi timeout. Sinyal GPS terlalu lemah, coba bergerak ke tempat terbuka.";
        else if (!navigator.geolocation) msg = "Browser Anda tidak mendukung lokasi atau akses diblokir karena HTTP (Bukan HTTPS).";
        
        setResult({ error: true, message: `WFO WAJIB LOKASI: ${msg}` });
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
        latitude: finalLat,
        longitude: finalLon
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
      setResult({ error: true, message: err.response?.data?.message || err.message || "Koneksi gagal" });
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

  // Toggle kamera depan ↔ belakang
  const switchCamera = async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    // Hentikan loop dan kamera lama
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    stopCamera();
    // Tunggu sebentar agar stream lama benar-benar berhenti
    await new Promise(r => setTimeout(r, 300));
    startCamera({ video: { facingMode: newFacing } });
  };

  // Ref untuk mengukur tinggi bottom sheet secara dinamis
  const sheetRef = useRef(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const ro = new ResizeObserver(() => {
      setSheetHeight(sheet.offsetHeight);
    });
    ro.observe(sheet);
    setSheetHeight(sheet.offsetHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden z-50" style={{ height: '100dvh' }}>
      {/* Background Camera Layer — full screen */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ objectPosition: "center center", pointerEvents: "none" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10"
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* Header Transparan */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-5 pt-8" style={{ pointerEvents: "auto" }}>
        <button
          onClick={handleClose}
          type="button"
          aria-label="Kembali ke halaman utama"
          className="w-12 h-12 flex items-center justify-center text-white bg-black/30 backdrop-blur-md rounded-full border border-white/20 active:scale-95 transition-all hover:bg-black/50 cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          <X className="w-7 h-7 drop-shadow-md" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={switchCamera}
          aria-label="Ganti kamera"
          title={facingMode === "user" ? "Ganti ke kamera belakang" : "Ganti ke kamera depan"}
          className="w-12 h-12 flex items-center justify-center text-white bg-black/30 backdrop-blur-md rounded-full border border-white/20 active:scale-95 transition-all hover:bg-black/50 cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          <SwitchCamera className="w-6 h-6 drop-shadow-md" aria-hidden="true" />
        </button>
      </div>

      {/* Area Pemindaian / Viewfinder — centered, beri ruang untuk sheet */}
      <div
        className="absolute left-0 right-0 top-0 z-20 flex flex-col items-center justify-center"
        style={{ bottom: `${sheetHeight}px`, paddingTop: '80px', pointerEvents: "none" }}
      >
        {/* Bounding Box Neon Green */}
        <div className="w-[240px] h-[290px] rounded-[3rem] border-4 border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.4)] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0" style={{ backdropFilter: 'blur(0px)', backgroundColor: 'transparent' }}></div>

          {/* Overlay Status (Error / Success) 3D Popup */}
          {result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 p-4" style={{ pointerEvents: "auto" }}>
              <div
                className={`w-full max-w-[220px] flex flex-col items-center justify-center p-5 text-center rounded-[2rem] border-t-2 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                  result.error
                    ? 'bg-gradient-to-b from-red-400 to-red-600 text-white'
                    : 'bg-gradient-to-b from-emerald-400 to-green-600 text-white'
                }`}
              >
                <div className="text-5xl mb-2 drop-shadow-lg animate-pulse">
                  {result.error ? '⚠️' : '🎉'}
                </div>
                <p className="font-black text-xl mb-1 tracking-wide drop-shadow-md">
                  {result.error ? 'Gagal!' : 'Berhasil!'}
                </p>
                <p className="text-xs font-semibold opacity-95 drop-shadow-sm mb-3 leading-snug">
                  {result.message}
                </p>
                {result && !result.error && (
                  <button
                    onClick={resetScan}
                    className="px-6 py-2 bg-white text-green-700 rounded-full text-sm font-black shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-1 transition-all"
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
          <div
            role="status"
            aria-live="polite"
            className="mt-6 bg-black/50 backdrop-blur-xl px-5 py-3 rounded-[1rem] border border-white/20 text-[13px] font-semibold tracking-wide shadow-xl"
          >
            {isLoaded ? "Posisikan wajah Anda di dalam area" : "Menyiapkan AI..."}
          </div>
        )}
      </div>

      {/* Bottom Sheet — FIXED di bawah, selalu terlihat di semua device */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-30 bg-white text-slate-900 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.4)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {profileError && <div role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{profileError} <button type="button" onClick={fetchStats} className="font-bold underline">Coba Lagi</button></div>}
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Mode Absen + Statistik ringkas */}
        <div className="flex items-center justify-between px-5 mb-3">
          {currentUserProfile && (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
              currentUserProfile.work_type === 'WFH'
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              Mode: {currentUserProfile.work_type || 'WFO'}
            </span>
          )}
          <div className="flex gap-3 text-center">
            <div>
              <div className="text-[14px] font-black text-slate-700">{monthStats.hadir}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Hadir</div>
            </div>
            <div>
              <div className="text-[14px] font-black text-orange-500">{monthStats.izin}</div>
              <div className="text-[9px] font-bold text-orange-400 uppercase">Izin</div>
            </div>
            <div>
              <div className="text-[14px] font-black text-rose-500">{monthStats.sakit}</div>
              <div className="text-[9px] font-bold text-rose-400 uppercase">Sakit</div>
            </div>
            <div>
              <div className="text-[14px] font-black text-slate-500">{monthStats.alpha}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Alpa</div>
            </div>
          </div>
        </div>

        {/* ✅ Tombol Absensi — selalu terlihat di semua device termasuk HP */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-2" role="group" aria-label="Tombol absensi">
          <button
            onClick={() => handleManualClock('clock_in')}
            disabled={processing}
            aria-label="Absen masuk"
            aria-disabled={processing}
            aria-busy={processing}
            className="w-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl py-4 shadow-[0_8px_20px_rgba(37,99,235,0.35)] active:scale-[0.97] transition-all disabled:opacity-60"
          >
            <ScanFace className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
            <span className="font-bold text-[13px] tracking-wide">ABSEN MASUK</span>
          </button>

          <button
            onClick={() => handleManualClock('clock_out')}
            disabled={processing}
            aria-label="Absen pulang"
            aria-disabled={processing}
            aria-busy={processing}
            className="w-full flex flex-col items-center justify-center gap-1.5 bg-rose-50 text-rose-600 border-2 border-rose-200 rounded-2xl py-4 shadow-[0_8px_20px_rgba(244,63,94,0.15)] active:scale-[0.97] transition-all disabled:opacity-60"
          >
            <ScanFace className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
            <span className="font-bold text-[13px] tracking-wide">ABSEN PULANG</span>
          </button>
        </div>
      </div>

    </div>
  );
}

