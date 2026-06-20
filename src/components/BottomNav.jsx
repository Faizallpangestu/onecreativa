import { useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, Clock, User, LogOut } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if(window.confirm("Yakin ingin keluar?")) {
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Absen", path: "/face-clock", icon: Camera },
    { label: "Riwayat", path: "/attendance", icon: Clock },
    { label: "Profil", path: "/settings", icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 w-full px-5">
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.08)] px-6 py-4 rounded-[2rem] flex items-center justify-between w-[90%] max-w-[360px]">
        {navItems.map((item) => {
          const isActive = item.path ? location.pathname.startsWith(item.path) : false;
          const Icon = item.icon;
          const isLogout = item.action === "logout";
          
          return (
            <button
              key={item.label}
              onClick={() => isLogout ? handleLogout() : navigate(item.path)}
              className="flex flex-col items-center gap-1 group transition-all relative active:scale-90"
            >
              <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all ${
                isActive ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : "text-slate-400 hover:text-slate-800"
              }`}>
                <Icon 
                  className="w-5 h-5 transition-transform group-hover:scale-110" 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
