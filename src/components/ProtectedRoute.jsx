import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import { getRoleLandingPath, normalizeRole } from "../utils/roleAccess";
import { canAccessFinancePath } from "../utils/financeNavigation";
import GlobalLoading from "./GlobalLoading";
import { clearLoginCache, sessionUser } from "../utils/loginSession";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let request;
    const verify = async () => {
      request?.abort();
      const current = new AbortController();
      request = current;
      try {
        const { data } = await axios.get("/api/session.php", { signal: current.signal });
        if (!active || request !== current || current.signal.aborted) return;
        const user = sessionUser(data);
        setSession({ path: location.pathname, user });
      } catch (error) {
        if (!active || request !== current || current.signal.aborted) return;
        if (error.response?.status === 401) {
          clearLoginCache();
          setSession({ path: location.pathname, user: null });
        } else {
          setSession({ path: location.pathname, error: "Gagal memeriksa sesi login. Periksa koneksi lalu coba lagi." });
        }
      }
    };
    const whenVisible = () => { if (document.visibilityState === "visible") void verify(); };
    void verify();
    window.addEventListener("focus", whenVisible);
    document.addEventListener("visibilitychange", whenVisible);
    const timer = window.setInterval(whenVisible, 60000);
    return () => {
      active = false;
      request?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", whenVisible);
      document.removeEventListener("visibilitychange", whenVisible);
    };
  }, [location.pathname, retry]);

  if (!session || session.path !== location.pathname) return <GlobalLoading />;
  if (session.error) return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{session.error}</p>
      <button type="button" onClick={() => { setSession(null); setRetry(value => value + 1); }} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Coba Lagi</button>
    </div>
  );
  const user = session.user;
  if (!user) return <Navigate to="/login" replace />;

  const currentRole = normalizeRole(user.role_name);

  // Periksa apakah role diizinkan (jika array allowedRoles diberikan)
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const canonical = role => ({hr_admin:'hr',finance_admin:'finance'})[normalizeRole(role)] || normalizeRole(role);
    if (!allowedRoles.map(canonical).includes(canonical(currentRole))) {
      return <Navigate to={getRoleLandingPath(user.role_name)} replace />;
    }
  }

  if (["finance", "finance_admin"].includes(currentRole) && !canAccessFinancePath(location.pathname)) {
    return <Navigate to={getRoleLandingPath(user.role_name)} replace />;
  }

  // Jika sudah login dan memiliki akses, izinkan akses ke komponen anak (children)
  return children;
}
