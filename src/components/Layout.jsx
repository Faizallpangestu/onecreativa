import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Layout({ children, hideMobileHeader = false, hideBottomNav = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-white text-slate-900 justify-center sm:py-6 sm:px-4">
      {/* Container Mobile App (Phone Bezel on Desktop) */}
      <div className="flex flex-col h-full w-full sm:max-w-[410px] bg-white sm:rounded-[3rem] sm:border-[14px] sm:border-[#0a1930] shadow-2xl relative overflow-hidden">
        
        {/* Dynamic Island / Notch Mockup */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a1930] rounded-b-2xl z-50"></div>

        {/* Mobile Header with Hamburger (hidden if hideMobileHeader is true) */}
        {!hideMobileHeader && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-4 lg:hidden pt-8 sm:pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Buka menu navigasi"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span className="text-lg font-bold text-slate-900">HRIS</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full max-w-[100vw] pb-24 lg:pb-0 relative no-scrollbar">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
