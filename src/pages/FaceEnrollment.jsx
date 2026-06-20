import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useCamera } from "../hooks/useCamera";
import { useFaceApi } from "../hooks/useFaceApi";
import api from "../services/api";

const STEPS = [
  { id: 1, label: "Persiapan", icon: "📋" },
  { id: 2, label: "Posisikan Wajah", icon: "👤" },
  { id: 3, label: "Capture Otomatis", icon: "📸" },
  { id: 4, label: "Selesai", icon: "✅" },
];

export default function FaceEnrollment() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const detectionLoop = useRef(null);

  const [step, setStep] = useState(1);
  const [captures, setCaptures] = useState([]);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [enrolledData, setEnrolledData] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user.employee_id || user.id;

  const { videoRef, isReady, error: camError, startCamera, stopCamera, captureSnapshot } = useCamera();
  const { isLoaded, loadError, detectFace, captureDescriptors, drawDetection } = useFaceApi();

  // Start camera on step 2
  useEffect(() => {
    if (step === 2) startCamera();
    return () => {
      if (step === 2) stopCamera();
    };
  }, [step]);

  // Face detection loop (step 2 - preview only)
  useEffect(() => {
    if (step !== 2 || !isReady || !isLoaded) return;

    const loop = async () => {
      if (!videoRef.current) return;
      const { detection } = await detectFace(videoRef.current);

      if (canvasRef.current && videoRef.current) {
        if (detection) {
          setFaceDetected(true);
          drawDetection(canvasRef.current, videoRef.current, detection, "Wajah terdeteksi ✓", "#4ade80");
        } else {
          setFaceDetected(false);
          const ctx = canvasRef.current.getContext("2d");
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      detectionLoop.current = requestAnimationFrame(loop);
    };

    detectionLoop.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(detectionLoop.current);
  }, [step, isReady, isLoaded]);

  // Step 3: Auto capture
  const startCapture = async () => {
    if (!videoRef.current || !isLoaded) return;
    cancelAnimationFrame(detectionLoop.current);
    setIsCapturing(true);
    setCaptures([]);
    setCaptureProgress(0);
    setStep(3);

    const descriptors = await captureDescriptors(
      videoRef.current,
      5,
      (current, total) => {
        setCaptureProgress(current);
        // Take a snapshot thumbnail
        const snap = captureSnapshot(0.5);
        if (snap) setCaptures((prev) => [...prev.slice(0, current - 1), snap]);
      }
    );

    setIsCapturing(false);

    if (descriptors.length >= 3) {
      setEnrolledData(descriptors);
    } else {
      setSaveError("Gagal menangkap wajah yang cukup. Pastikan pencahayaan baik dan wajah terlihat jelas.");
      setStep(2);
    }
  };

  // Step 4: Save to server
  const saveEnrollment = async () => {
    if (!enrolledData || !employeeId) return;
    setSaving(true);
    setSaveError(null);

    try {
      const resp = await api.post("/face_enroll.php", {
        employee_id: employeeId,
        descriptors: enrolledData,
        quality_score: 0.9,
        enrolled_by: user.id,
      });

      if (resp.data.status === "success") {
        stopCamera();
        setStep(4);
      } else {
        setSaveError(resp.data.message || "Gagal menyimpan");
      }
    } catch (err) {
      setSaveError("Koneksi gagal: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2563eb", marginBottom: 4 }}>
            Human Resource
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Daftarkan Wajah
          </h1>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
            Daftarkan wajah Anda untuk absensi face recognition
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, idx) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", flex: 1,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 16,
                  background: step >= s.id ? "#2563eb" : step === s.id - 1 ? "#dbeafe" : "#f1f5f9",
                  color: step >= s.id ? "#fff" : "#64748b",
                  fontWeight: 700, transition: "all 0.3s",
                  boxShadow: step === s.id ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
                }}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <span style={{ fontSize: 11, marginTop: 6, color: step >= s.id ? "#2563eb" : "#94a3b8", fontWeight: step === s.id ? 700 : 400 }}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ height: 2, flex: 0.5, background: step > s.id ? "#2563eb" : "#e2e8f0", transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Persiapan */}
        {step === 1 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🎭</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", color: "#0f172a", marginBottom: 12 }}>
              Persiapan Pendaftaran Wajah
            </h2>
            <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              {[
                "📡 Pastikan Anda berada di tempat dengan pencahayaan yang cukup",
                "👓 Lepas kacamata jika memungkinkan, atau jaga agar tetap bersih",
                "📱 Hadapkan wajah langsung ke kamera (tidak miring)",
                "🚶 Saat capture, gerakkan kepala sedikit ke kiri, kanan, atas, bawah",
                "⏱️ Proses membutuhkan sekitar 10-15 detik",
              ].map((tip, i) => (
                <p key={i} style={{ margin: "8px 0", fontSize: 14, color: "#334155" }}>{tip}</p>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)", transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.opacity = 0.9)}
              onMouseOut={(e) => (e.target.style.opacity = 1)}
            >
              Mulai Sekarang →
            </button>
          </div>
        )}

        {/* STEP 2: Posisikan Wajah */}
        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16, textAlign: "center" }}>
              Posisikan Wajah Anda
            </h2>

            {/* Camera error */}
            {camError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
                ⚠️ {camError}
              </div>
            )}

            {/* Loading states */}
            {(!isReady || !isLoaded) && !camError && (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <p style={{ fontWeight: 600 }}>{!isReady ? "Mengaktifkan kamera..." : "Memuat model wajah..."}</p>
              </div>
            )}

            {/* Camera preview */}
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0f172a", display: isReady ? "block" : "none" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", display: "block", maxHeight: 360, objectFit: "cover" }}
              />
              <canvas
                ref={canvasRef}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />

              {/* Oval guide overlay */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 180, height: 220,
                border: `3px solid ${faceDetected ? "#4ade80" : "rgba(255,255,255,0.4)"}`,
                borderRadius: "50%", pointerEvents: "none",
                boxShadow: faceDetected ? "0 0 20px rgba(74,222,128,0.4)" : "none",
                transition: "all 0.3s",
              }} />

              {/* Status badge */}
              <div style={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                background: faceDetected ? "rgba(74,222,128,0.9)" : "rgba(0,0,0,0.6)",
                color: faceDetected ? "#000" : "#fff",
                padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                backdropFilter: "blur(8px)", transition: "all 0.3s",
              }}>
                {faceDetected ? "✓ Wajah Terdeteksi" : "Arahkan wajah ke kamera"}
              </div>
            </div>

            {loadError && (
              <p style={{ color: "#dc2626", fontSize: 13, textAlign: "center", marginTop: 8 }}>
                ⚠️ {loadError}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                onClick={() => { stopCamera(); setStep(1); }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                ← Kembali
              </button>
              <button
                onClick={startCapture}
                disabled={!faceDetected || !isLoaded || !isReady}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
                  background: faceDetected && isLoaded && isReady
                    ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "#e2e8f0",
                  color: faceDetected && isLoaded && isReady ? "#fff" : "#94a3b8",
                  fontSize: 14, fontWeight: 700, cursor: faceDetected ? "pointer" : "not-allowed",
                  transition: "all 0.3s",
                }}
              >
                📸 Mulai Capture
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Capture Otomatis */}
        {step === 3 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24, textAlign: "center" }}>
              {isCapturing ? "Sedang Memindai Wajah..." : "Capture Selesai!"}
            </h2>

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Progress</span>
                <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>{captureProgress}/5</span>
              </div>
              <div style={{ height: 10, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(captureProgress / 5) * 100}%`,
                  background: "linear-gradient(90deg, #2563eb, #4ade80)",
                  borderRadius: 100, transition: "width 0.4s ease",
                }} />
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{
                  width: 80, height: 80, borderRadius: 12, overflow: "hidden",
                  background: captures[i] ? "transparent" : "#f1f5f9",
                  border: `2px solid ${captures[i] ? "#4ade80" : "#e2e8f0"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {captures[i]
                    ? <img src={captures[i]} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#cbd5e1", fontSize: 24 }}>📷</span>
                  }
                </div>
              ))}
            </div>

            {isCapturing && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
                <div style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 24 }}>⏳</div>
                <p style={{ marginTop: 8 }}>Jaga wajah tetap terlihat. Gerakkan kepala perlahan...</p>
              </div>
            )}

            {!isCapturing && enrolledData && (
              <div style={{ marginTop: 8 }}>
                {saveError && (
                  <div style={{ background: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 12, color: "#dc2626", fontSize: 13 }}>
                    ⚠️ {saveError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => { setStep(2); setCaptures([]); setCaptureProgress(0); }}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    Ulangi
                  </button>
                  <button
                    onClick={saveEnrollment}
                    disabled={saving}
                    style={{
                      flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff",
                      fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Menyimpan..." : "✅ Simpan Enrollment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Sukses */}
        {step === 4 && (
          <div style={{
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 20, padding: 40, textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #86efac",
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#15803d", marginBottom: 8 }}>
              Wajah Berhasil Didaftarkan!
            </h2>
            <p style={{ color: "#166534", fontSize: 14, marginBottom: 32 }}>
              {captures.length} foto wajah telah diproses dan disimpan. 
              Sekarang Anda bisa absensi menggunakan wajah.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => navigate("/face-clock")}
                style={{
                  padding: "14px 28px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
                }}
              >
                📷 Coba Absen Sekarang
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "14px 28px", borderRadius: 12, border: "1.5px solid #86efac",
                  background: "transparent", color: "#15803d",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
