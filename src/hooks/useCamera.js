import { useState, useRef, useCallback, useEffect } from "react";

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState("prompt"); // 'prompt'|'granted'|'denied'

  const startCamera = useCallback(async (constraints = {}) => {
    setError(null);
    setIsReady(false);

    try {
      const defaultConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
          ...constraints.video,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      streamRef.current = stream;
      setPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        setIsReady(true);
      }
    } catch (err) {
      setPermission("denied");
      if (err.name === "NotAllowedError") {
        setError("Izin kamera ditolak. Aktifkan kamera di pengaturan browser.");
      } else if (err.name === "NotFoundError") {
        setError("Kamera tidak ditemukan. Pastikan kamera terhubung.");
      } else {
        setError(`Error kamera: ${err.message}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  // Capture snapshot dari video sebagai base64 JPEG
  const captureSnapshot = useCallback((quality = 0.8) => {
    if (!videoRef.current || !isReady) return null;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", quality);
  }, [isReady]);

  // Auto cleanup saat unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { videoRef, isReady, error, permission, startCamera, stopCamera, captureSnapshot };
}
