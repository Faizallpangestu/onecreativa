import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { Menu } from "lucide-react";

export default function LmsLayout({ children, hideMobileHeader = false, hideBottomNav = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar for Desktop & Mobile */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex flex-col flex-1 h-full relative w-full overflow-hidden bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        
        {/* Mobile Header with Hamburger (hidden if hideMobileHeader is true) */}
        {!hideMobileHeader && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-4 lg:hidden">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-lg font-bold text-slate-900">LMS Ruang Belajar</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto w-full ${hideBottomNav ? 'pb-0' : 'pb-24 lg:pb-0'} relative no-scrollbar`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!hideBottomNav && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
