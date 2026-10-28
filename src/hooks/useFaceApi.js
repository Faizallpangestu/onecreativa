import { useState, useEffect, useCallback } from "react";

const MODEL_URL = "/models";

let modelsLoaded = false;
let faceapi = null;
let preloadingPromise = null;

export const preloadFaceModels = () => {
  if (modelsLoaded) return Promise.resolve();
  if (preloadingPromise) return preloadingPromise;

  preloadingPromise = (async () => {
    try {
      // Dynamic import face-api.js
      const fa = await import("face-api.js");
      faceapi = fa;

      // Ensure models load concurrently
      await Promise.all([
        fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
    } catch (err) {
      console.error("face-api.js preload error:", err);
      throw err;
    }
  })();
  return preloadingPromise;
};

export function useFaceApi() {
  const [isLoaded, setIsLoaded] = useState(modelsLoaded);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (modelsLoaded && faceapi) {
      return;
    }

    const load = async () => {
      try {
        await preloadFaceModels();
        setIsLoaded(true);
      } catch (err) {
        setLoadError(err.message || "Gagal memuat model wajah");
      }
    };

    load();
  }, []);

  /**
   * Deteksi wajah + ambil descriptor dari sebuah element (video/canvas/img)
   * @returns {Promise<{descriptor: Float32Array|null, detection: object|null}>}
   */
  const detectFace = useCallback(async (mediaElement) => {
    if (!faceapi || !modelsLoaded || !mediaElement) {
      return { descriptor: null, detection: null };
    }
    try {
      const detection = await faceapi
        .detectSingleFace(mediaElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return { descriptor: null, detection: null };
      return { descriptor: detection.descriptor, detection };
    } catch (err) {
      console.error("detectFace error:", err);
      return { descriptor: null, detection: null };
    }
  }, []);

  /**
   * Bandingkan descriptor dengan daftar enrolled descriptors
   * @param {Float32Array} descriptor - descriptor dari webcam saat ini
   * @param {Array<{employee_id, employee_name, descriptors: Array}>} enrolled - data dari server
   * @param {number} threshold - 0.4 default (lebih kecil = lebih ketat)
   * @returns {{match: object|null, distance: number, confidence: number}}
   */
  const matchFace = useCallback((descriptor, enrolled, threshold = 0.42) => {
    if (!faceapi || !descriptor || !enrolled?.length) {
      return { match: null, distance: 1, confidence: 0 };
    }

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const person of enrolled) {
      if (!person.descriptors?.length) continue;

      // Setiap person bisa punya multiple descriptors (dari enrollment 5 foto)
      for (const rawDesc of person.descriptors) {
        const stored = new Float32Array(Object.values(rawDesc));
        const dist = faceapi.euclideanDistance(descriptor, stored);

        if (dist < bestDistance) {
          bestDistance = dist;
          bestMatch = person;
        }
      }
    }

    if (bestDistance <= threshold) {
      // Confidence: convert distance 0-threshold → 100-0% (inverted, higher = better)
      const confidence = Math.max(0, Math.min(1, 1 - bestDistance / threshold));
      return { match: bestMatch, distance: bestDistance, confidence };
    }

    return { match: null, distance: bestDistance, confidence: 0 };
  }, []);

  /**
   * Ambil descriptor dari multiple frames untuk enrollment
   * @param {HTMLVideoElement} videoEl
   * @param {number} count - jumlah sampel (default 5)
   * @param {Function} onProgress - callback(current, total)
   * @returns {Promise<Float32Array[]>}
   */
  const captureDescriptors = useCallback(async (videoEl, count = 5, onProgress) => {
    const descriptors = [];

    for (let i = 0; i < count; i++) {
      // Delay antar capture
      await new Promise((r) => setTimeout(r, 800));

      const { descriptor } = await detectFace(videoEl);
      if (descriptor) {
        descriptors.push(Array.from(descriptor)); // convert Float32Array → Array for JSON
        onProgress?.(descriptors.length, count);
      } else {
        i--; // retry jika tidak terdeteksi
        await new Promise((r) => setTimeout(r, 500));
      }

      if (descriptors.length >= count) break;
    }

    return descriptors;
  }, [detectFace]);

  /**
   * Draw bounding box + label pada canvas overlay
   */
  const drawDetection = useCallback((canvas, videoEl, detection, label, color = "#4ade80") => {
    if (!canvas || !videoEl || !detection || !faceapi) return;

    const dims = faceapi.matchDimensions(canvas, videoEl, true);
    const resized = faceapi.resizeResults(detection, dims);

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw box
    const box = resized.detection.box;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.width, box.height, 8);
    ctx.stroke();

    // Draw label
    if (label) {
      ctx.fillStyle = color;
      const padding = 6;
      const fontSize = 14;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const textW = ctx.measureText(label).width;
      ctx.fillRect(box.x - 1, box.y - fontSize - padding * 2, textW + padding * 2, fontSize + padding * 2);
      ctx.fillStyle = "#000";
      ctx.fillText(label, box.x + padding - 1, box.y - padding);
    }
  }, []);

  return { isLoaded, loadError, detectFace, matchFace, captureDescriptors, drawDetection };
}
