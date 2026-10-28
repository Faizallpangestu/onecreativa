import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
export default function useSalaryRequests(month, all) {
  const [data, setData] = useState({ preview: [], requests: [], period: null, today: "" });
  const [permissions, setPermissions] = useState({ can_prepare: false, can_approve: false });
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const requestRef = useRef(null);
  const refresh = useCallback(async () => {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    setLoading(true);
    try {
      const response = await axios.get("/api/salaries.php", { params: { month, all: all ? 1 : 0, _t: Date.now() }, signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setData(response.data.data); setPermissions(response.data.permissions); setCsrfToken(response.data.csrf_token); setError(""); setNeedsLogin(false);
    } catch (err) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setError(err.response?.data?.message || "Penggajian gagal dimuat. Silakan perbarui kembali."); setNeedsLogin(err.response?.status === 401);
      if ([401, 403].includes(err.response?.status)) { setPermissions({ can_prepare: false, can_approve: false }); setData({ preview: [], requests: [], period: null, today: "" }); setCsrfToken(""); }
    } finally { if (!controller.signal.aborted && requestRef.current === controller) setLoading(false); }
  }, [month, all]);
  useEffect(() => {
    const reload = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh(); window.addEventListener("focus", reload); const timer = setInterval(reload, 60000);
    return () => { requestRef.current?.abort(); window.removeEventListener("focus", reload); clearInterval(timer); };
  }, [refresh]);
  return { data, permissions, csrfToken, loading, error, needsLogin, refresh };
}
