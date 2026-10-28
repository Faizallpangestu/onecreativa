import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[99999]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-slate-500 font-semibold tracking-wide animate-pulse">Memuat halaman...</p>
    </div>
  );
}
