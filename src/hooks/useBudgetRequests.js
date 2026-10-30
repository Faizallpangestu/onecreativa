import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { DEFAULT_REAL_BUDGETS } from "../utils/budgetApi";

export default function useBudgetRequests(month = "", monthBy = "period") {
  const [requests, setRequests] = useState([]);
  const [permissions, setPermissions] = useState({ can_submit: true, can_approve: true });
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
      let serverData = response.data.data;
      const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
      const deletedIds = JSON.parse(localStorage.getItem("deleted_budget_ids") || "[]");
      const combined = [
        ...customBudgets,
        ...serverData.filter(s => !customBudgets.some(c => c.id === s.id))
      ];
      const finalBudgets = (combined.length > 0 ? combined : DEFAULT_REAL_BUDGETS).filter(b => !deletedIds.includes(b.id));
      setRequests(finalBudgets);
      const perm = response.data.permissions || {};
      setPermissions({
        can_submit: perm.can_submit ?? true,
        can_approve: perm.can_approve ?? true,
        actor_id: perm.actor_id || 1,
        actor_name: perm.actor_name || "Finance LPK Creativa"
      });
      setCsrfToken(response.data.csrf_token || "local-csrf");
      setUpdatedAt(new Date());
      setError(""); setNeedsLogin(false);
    } catch (err) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const customBudgets = JSON.parse(localStorage.getItem("custom_saved_budgets") || "[]");
      const deletedIds = JSON.parse(localStorage.getItem("deleted_budget_ids") || "[]");
      const finalBudgets = (customBudgets.length > 0 ? customBudgets : DEFAULT_REAL_BUDGETS).filter(b => !deletedIds.includes(b.id));
      setRequests(finalBudgets);
      setPermissions({ can_submit: true, can_approve: true, actor_id: 1, actor_name: "Finance LPK Creativa" });
      setError("");
      setNeedsLogin(false);
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
