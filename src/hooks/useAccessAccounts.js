import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { employeeData } from "../utils/employeeApi";

export default function useAccessAccounts(scope) {
  const cacheKey = `cached_access_accounts_${scope || 'all'}`;
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestRef = useRef(null);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setIsLoading(true);
    try {
      const res = await axios.get("/api/employees.php", {
        params: { scope, _t: Date.now() },
        signal: request.signal,
      });
      const accountList = employeeData(res.data);

      if (requestRef.current !== request || request.signal.aborted) return false;
      setAccounts(accountList);
      setUpdatedAt(new Date());
      setLoadError("");
      return true;
    } catch (error) {
      if (request.signal.aborted || requestRef.current !== request) return false;
      const msg = error.response?.data?.message || error.message || "Gagal memuat data terbaru. Silakan perbarui lagi.";
      if ([401, 403].includes(error.response?.status)) setAccounts([]);
      setLoadError(msg);
      return false;
    } finally {
      if (requestRef.current === request && !request.signal.aborted) setIsLoading(false);
    }
  }, [scope]);

  const removeAccount = useCallback((userId) => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsLoading(false);
    setAccounts(current => current.filter(account => String(account.user_id) !== String(userId)));
  }, []);

  useEffect(() => {
    // Discard account lists left by older versions or a different login.
    localStorage.removeItem(cacheKey);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const timer = window.setInterval(refreshWhenVisible, 60000);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(timer);
    };
  }, [refresh, cacheKey]);

  return { accounts, isLoading, loadError, updatedAt, refresh, removeAccount };
}
