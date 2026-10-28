import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-200">
            <AlertTriangle className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Oops! Terjadi Kesalahan</h1>
          <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
            Sistem mendeteksi adanya gangguan pada halaman ini. Anda tidak perlu khawatir, silakan muat ulang halaman.
          </p>
          <pre className="text-left bg-rose-50 p-4 rounded-xl text-rose-700 text-xs w-full max-w-2xl overflow-auto mb-8 whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
            {"\n"}
            {this.state.error && this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-[#0c2e59] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#1a4176] transition-colors focus:ring-4 focus:ring-blue-100 outline-none"
            aria-label="Muat ulang halaman"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
