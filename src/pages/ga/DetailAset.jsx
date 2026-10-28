import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, Edit2, Printer, MapPin, Tag, Calendar, DollarSign,
  Package, Info, Clock, ArrowRight, CheckCircle, AlertTriangle,
  Wrench, UserCheck, XCircle, RefreshCw, QrCode
} from "lucide-react";
import QRCode from "react-qr-code";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useSEO } from "../../hooks/useSEO";

function conditionBadge(c) {
  if (c === "Baik")         return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (c === "Rusak Ringan") return "bg-amber-50 text-amber-700 border-amber-200";
  if (c === "Rusak Berat")  return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-red-50 text-red-700 border-red-200";
}
function statusBadge(s) {
  if (s === "Aktif")       return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "Maintenance") return "bg-purple-50 text-purple-700 border-purple-200";
  if (s === "Tidak Aktif") return "bg-slate-100 text-slate-500 border-slate-200";
  return "bg-pink-50 text-pink-700 border-pink-200";
}
function actionIcon(type) {
  const icons = {
    tambah: <Package className="w-4 h-4 text-blue-500" />,
    pindah: <ArrowRight className="w-4 h-4 text-indigo-500" />,
    update_kondisi: <RefreshCw className="w-4 h-4 text-amber-500" />,
    maintenance: <Wrench className="w-4 h-4 text-purple-500" />,
    stock_opname: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    pinjam: <UserCheck className="w-4 h-4 text-pink-500" />,
    kembali: <CheckCircle className="w-4 h-4 text-teal-500" />,
    hapus: <XCircle className="w-4 h-4 text-red-500" />,
  };
  return icons[type] || <Info className="w-4 h-4 text-slate-400" />;
}
function actionLabel(type) {
  const labels = { tambah:"Ditambahkan", pindah:"Dipindahkan", update_kondisi:"Update Kondisi", maintenance:"Maintenance", stock_opname:"Stock Opname", pinjam:"Dipinjam", kembali:"Dikembalikan", hapus:"Dihapus" };
  return labels[type] || type;
}
function formatRp(val) {
  if (!val || val == 0) return "-";
  return "Rp " + Number(val).toLocaleString("id-ID");
}

const TABS = ["info","riwayat","qr"];

export default function DetailAset() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const [searchParams] = useSearchParams();
  const defaultTab = TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "info";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (user.role_name || "").toLowerCase();
  const isAdmin = ["admin", "super_admin"].includes(role);

  const [asset, setAsset]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState(defaultTab);
  

  useSEO({ title: `Detail Aset ${asset ? asset.name : ''}`, description: "Melihat rincian, kondisi, dan histori aset" });

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assets.php?id=${id}`);
      setAsset(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAsset(); }, [id]);

  const handlePrintQR = () => {
    const svgEl = document.getElementById("asset-qr-svg");
    const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
    const printContent = `<!DOCTYPE html>
      <html><head><title>QR Code - ${asset?.asset_code}</title>
      <style>
        body { margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; font-family:sans-serif; }
        .card { text-align:center; padding:28px 32px; border:2px dashed #000; border-radius:20px; display:inline-block; }
        .code { font-size:13px; font-weight:bold; color:#000; letter-spacing:0.1em; margin-top:6px; }
        h2 { font-size:16px; font-weight:bold; color:#000; margin:10px 0 2px; }
        p { font-size:12px; color:#333; margin:2px 0; }
        .divider { border:none; border-top:1px dashed #ccc; margin:10px 0; }
        svg { display:block; margin:0 auto; width:160px; height:160px; }
      </style></head><body>
      <div class="card">
        ${svgData}
        <hr class="divider"/>
        <h2>${asset?.name}</h2>
        <p class="code">${asset?.asset_code}</p>
        <p>${asset?.location}</p>
        <p>${asset?.category}</p>
      </div>
      <script>
        setTimeout(function() {
          window.print();
        }, 300);
      </script>
      </body></html>`;
    const win = window.open("", "_blank", "width=420,height=520");
    if (win) {
      win.document.open();
      win.document.write(printContent);
      win.document.close();
    } else {
      alert("Pop-up diblokir. Izinkan pop-up untuk mencetak QR.");
    }
  };

  if (loading) return (
    <Layout hideMobileHeader hideBottomNav hideSidebar>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!asset) return (
    <Layout hideMobileHeader hideBottomNav hideSidebar>
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
        <p className="font-bold text-slate-700">Aset tidak ditemukan</p>
        <button onClick={() => navigate("/assets")} className="mt-4 text-sm text-blue-600 font-semibold">Kembali ke Daftar</button>
      </div>
    </Layout>
  );

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-24">
        {/* Header Flat Banner */}
        <div className="bg-white border-b border-slate-200 pt-6 pb-6">
          <div className="px-5 sm:px-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => navigate("/assets")} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {!isAdmin && (
                  <>
                    <button onClick={() => navigate(`/assets/edit/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-700">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setTab("qr"); handlePrintQR(); }} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-700">
                      <Printer className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-none w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {asset.photo_path ? (
                  <img src={`/uploads/${asset.photo_path}`} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-blue-600 text-xs font-bold">{asset.asset_code}</p>
                <h1 className="text-xl font-black text-slate-800 leading-tight">{asset.name}</h1>
                <div className="flex gap-2 mt-1.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${conditionBadge(asset.condition)}`}>{asset.condition}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge(asset.status)}`}>{asset.status}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-5 bg-slate-100 rounded-2xl p-1">
              {[
                {key:"info",label:"Info"},
                {key:"riwayat",label:"Riwayat"},
                ...(isAdmin ? [] : [{key:"qr",label:"QR Code"}])
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${tab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 max-w-4xl mx-auto mt-5">

          {/* ── Tab: Info ── */}
          {tab === "info" && (
            <div className="space-y-4">
              {/* Detail Grid */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Informasi Aset</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Tag className="w-3.5 h-3.5 text-purple-500" />, label: "Kategori", value: asset.category },
                    { icon: <Package className="w-3.5 h-3.5 text-blue-500" />, label: "Merek", value: asset.brand || "-" },
                    { icon: <Package className="w-3.5 h-3.5 text-blue-500" />, label: "Model", value: asset.model || "-" },
                    { icon: <Info className="w-3.5 h-3.5 text-slate-400" />, label: "Serial Number", value: asset.serial_number || "-" },
                    { icon: <MapPin className="w-3.5 h-3.5 text-blue-500" />, label: "Lokasi", value: asset.location },
                    { icon: <Calendar className="w-3.5 h-3.5 text-amber-500" />, label: "Tanggal Beli", value: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("id-ID") : "-" },
                    { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />, label: "Harga Beli", value: formatRp(asset.purchase_price) },
                    { icon: <Clock className="w-3.5 h-3.5 text-slate-400" />, label: "Ditambahkan", value: new Date(asset.created_at).toLocaleDateString("id-ID") },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.icon}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
                {asset.description && (
                  <div className="mt-3 bg-slate-50 rounded-2xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Deskripsi</p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{asset.description}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {!isAdmin && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <h2 className="text-sm font-extrabold text-slate-700 mb-3">Aksi Cepat</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate(`/assets/scan?code=${asset.asset_code}`)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-sm font-bold px-4 py-3 rounded-2xl transition-all">
                      <QrCode className="w-4 h-4" /> Scan & Update
                    </button>
                    <button onClick={() => navigate(`/assets/edit/${id}`)} className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-sm font-bold px-4 py-3 rounded-2xl transition-all">
                      <Edit2 className="w-4 h-4" /> Edit Aset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Riwayat ── */}
          {tab === "riwayat" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-extrabold text-slate-700 mb-5 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" /> Riwayat Aset</h2>
              {(!asset.histories || asset.histories.length === 0) ? (
                <div className="text-center py-10">
                  <Clock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium text-sm">Belum ada riwayat</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />
                  <div className="space-y-0">
                    {asset.histories.map((h, i) => (
                      <div key={i} className="flex gap-4 pb-5 relative">
                        <div className="flex-none w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 relative">
                          {actionIcon(h.action_type)}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-2xl p-3 mt-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-extrabold text-slate-800">{actionLabel(h.action_type)}</p>
                            <p className="text-[10px] text-slate-400 font-medium flex-none">
                              {new Date(h.performed_at).toLocaleDateString("id-ID", { day:"numeric",month:"short",year:"numeric" })}
                            </p>
                          </div>
                          {h.notes && <p className="text-[12px] text-slate-500 font-medium mt-1">{h.notes}</p>}
                          {(h.from_location || h.to_location) && h.from_location !== h.to_location && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">{h.from_location}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] text-indigo-600 font-bold">{h.to_location}</span>
                            </div>
                          )}
                          {h.condition_before && h.condition_before !== h.condition_after && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[11px] text-slate-400">{h.condition_before}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] text-amber-600 font-bold">{h.condition_after}</span>
                            </div>
                          )}
                          {h.performed_by_name && (
                            <p className="text-[10px] text-slate-400 mt-1.5">oleh {h.performed_by_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: QR Code ── */}
          {tab === "qr" && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center">
                <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-slate-200 mb-5" id="qr-container">
                  <QRCode id="asset-qr-svg" value={asset.asset_code} size={180} />
                </div>
                <h2 className="text-xl font-black text-slate-800 text-center mb-1">{asset.name}</h2>
                <p className="text-blue-600 font-bold text-lg tracking-widest mb-1">{asset.asset_code}</p>
                <p className="text-slate-400 text-sm font-medium mb-6">{asset.location}</p>

                <button
                  onClick={handlePrintQR}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all"
                >
                  <Printer className="w-5 h-5" /> Cetak QR Code
                </button>
              </div>

              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-2">Cara Penggunaan</p>
                <ul className="space-y-1.5">
                  {[
                    "Cetak QR Code dan tempel pada aset fisik",
                    "Gunakan halaman Scan QR untuk membaca kode",
                    "Setiap scan dapat langsung mencatat perpindahan atau update kondisi",
                    "QR Code berisi kode unik: " + asset.asset_code
                  ].map((t, i) => (
                    <li key={i} className="text-[12px] text-blue-700 font-medium flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-none mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
