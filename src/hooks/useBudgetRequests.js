import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

export default function useBudgetRequests(month = "", monthBy = "period") {
  const [requests, setRequests] = useState([]);
  const [permissions, setPermissions] = useState({ can_submit: false, can_approve: false });
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestRef = useRef(null);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    try {
      const response = await axios.get("/api/budgets.php", { params: { month, month_by: monthBy, _t: Date.now() }, signal: controller.signal });
      if (response.data?.status !== "success" || !Array.isArray(response.data.data)) throw new Error("Respons RAB tidak valid.");
      if (requestRef.current !== controller || controller.signal.aborted) return;
      setRequests(response.data.data);
      setPermissions(response.data.permissions);
      setCsrfToken(response.data.csrf_token);
      setUpdatedAt(new Date());
      setError(""); setNeedsLogin(false);
    } catch (err) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setError(err.response?.data?.message || "Gagal memuat RAB. Silakan perbarui kembali.");
      setNeedsLogin(err.response?.status === 401);
      if ([401, 403].includes(err.response?.status)) { setPermissions({ can_submit: false, can_approve: false }); setRequests([]); setCsrfToken(""); }
    } finally {
      if (requestRef.current === controller && !controller.signal.aborted) setIsLoading(false);
    }
  }, [month, monthBy]);
  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("focus", visibleRefresh);
    const timer = window.setInterval(visibleRefresh, 60000);
    return () => { requestRef.current?.abort(); window.removeEventListener("focus", visibleRefresh); window.clearInterval(timer); };
  }, [refresh]);
  return { requests, permissions, csrfToken, isLoading, error, needsLogin, updatedAt, refresh };
}
