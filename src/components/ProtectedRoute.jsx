import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const userStr = localStorage.getItem("user");

  if (!userStr) {
    // Jika tidak ada data user di localStorage, redirect ke halaman login
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login, izinkan akses ke komponen anak (children)
  return children;
}
