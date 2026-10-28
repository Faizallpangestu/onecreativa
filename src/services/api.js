import axios from "axios";
import {installSessionHeaders} from "./sessionHeaders";

// Saat development (Vite proxy aktif): gunakan /api → di-proxy ke Apache
// Saat production: folder backend sudah di-copy ke dist, jadi URL-nya langsung /api dan /uploads
export const API_BASE = "/api";

// URL dasar untuk foto karyawan yang tersimpan di uploads/photos
export const PHOTO_BASE_URL = "/api/upload_photo.php?view=photo&file=";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

installSessionHeaders(api);
export default api;
