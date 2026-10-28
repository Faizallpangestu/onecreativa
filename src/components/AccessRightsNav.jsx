import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";

export default function AccessRightsNav({ activeTab }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { label: "Semua Akses Kantor", path: "/access-rights", key: "all" },
    { label: "Akses HRD & Admin", path: "/access-rights-hr", key: "hr" },
    { label: "Akses GA", path: "/access-rights-ga", key: "ga" },
    { label: "Akses Finance", path: "/access-rights-finance", key: "finance" },
  ];

  const isActive = (tab) => {
    if (activeTab) return activeTab === tab.key;
    return currentPath === tab.path;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Navigasi Hak Akses Kantor" className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition shadow-sm ${
                active
                  ? "bg-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-600/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
      >
        <Settings className="w-3.5 h-3.5 text-slate-400" />
        <span>Pengaturan Sistem</span>
      </Link>
    </div>
  );
}

