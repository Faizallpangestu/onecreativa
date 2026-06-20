import axios from "axios";

// Saat development (Vite proxy aktif): gunakan /api → di-proxy ke Apache
// Saat production: ganti dengan URL full backend
export const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

export default api;
