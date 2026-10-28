import axios from "axios";
import { normalizeRole } from "./roleAccess";

const EMPLOYEES_API_URL = "/api/employees.php";


export function cacheLpkStudents(accounts) {
  const students = accounts
    .filter(u => normalizeRole(u.role_name) === "peserta_intensif")
    .map(u => ({
      id: Number(u.user_id) || u.user_id,
      employee_id: u.id,
      name: u.name,
      nama_lengkap: u.name,
      email: u.email || "",
      phone: u.phone || "",
      role_name: "peserta_intensif",
      level: u.level || "",
      batch: u.batch || "",
      avatar: u.foto_profil || null,
    }));

  return students;
}

/** Retrieves authorized student identities from the API; failures remain visible to the caller. */
export async function syncLpkStudents() {
  try {
    const res = await axios.get(EMPLOYEES_API_URL, { params: { scope: "lms", _t: Date.now() } });
    if (res.data?.status !== "success" || !Array.isArray(res.data.data)) {
      throw new Error("Respons data siswa tidak valid.");
    }
    const all = Array.isArray(res.data) ? res.data : (res.data?.data || []);

    return cacheLpkStudents(all);
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Data siswa belum tersedia.');
  }
}

/** Bandingkan id secara aman (string vs number). */
export const sameId = (a, b) => String(a) === String(b);
