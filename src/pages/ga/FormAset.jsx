import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Save, Upload, X, Package, AlertCircle, Check
} from "lucide-react";
import QRCode from "react-qr-code";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useSEO } from "../../hooks/useSEO";

const CATEGORIES = ["Elektronik","Furniture","Kendaraan","Alat Tulis","Peralatan Dapur","Lainnya"];
const CONDITIONS  = ["Baik","Rusak Ringan","Rusak Berat","Tidak Layak"];
const STATUSES    = ["Aktif","Maintenance","Tidak Aktif","Dipinjam"];
const LOCATIONS   = ["Kantor Pusat","Ruang Meeting","Ruang Server","Gudang","Lobby","Lantai 1","Lantai 2","Dapur","Toilet","Parkiran","Area Produksi","Lainnya"];

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 font-semibold">{error}</p>}
    </div>
  );
}

export default function FormAset({ isModal = false, modalId = null, onClose = () => {}, onSuccess = () => {} }) {
  const navigate = useNavigate();
  const params   = useParams();
  const id       = isModal ? modalId : params.id;
  const isEdit   = Boolean(id);
  

  const [form, setForm] = useState({
    name: "", category: "Elektronik", brand: "", model: "",
    serial_number: "", purchase_date: "", purchase_price: "",
    location: "Kantor Pusat", condition: "Baik", status: "Aktif", description: ""
  });
  const [photoFile, setPhotoFile]   = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [assetCode, setAssetCode]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [success, setSuccess]       = useState(false);
  const [showQR, setShowQR]         = useState(false);
  const photoRef = useRef(null);
  

  useSEO({ title: isEdit ? "Edit Aset" : "Tambah Aset", description: isEdit ? "Ubah data aset perusahaan" : "Daftarkan aset baru ke sistem" });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/assets.php?id=${id}`)
        .then((res) => {
          const a = res.data?.data || {};
          setForm({
            name: a.name || "", category: a.category || "Elektronik",
            brand: a.brand || "", model: a.model || "",
            serial_number: a.serial_number || "",
            purchase_date: a.purchase_date || "", purchase_price: a.purchase_price || "",
            location: a.location || "Kantor Pusat", condition: a.condition || "Baik",
            status: a.status || "Aktif", description: a.description || ""
          });
          setAssetCode(a.asset_code || "");
          if (a.photo_path) setExistingPhoto(`/uploads/${a.photo_path}`);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Nama aset wajib diisi";
    if (!form.location.trim()) errs.location = "Lokasi wajib diisi";
    return errs;
  };

  

  const handlePrintQR = () => {
    const svgEl = document.getElementById('print-qr-svg');
    const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
    
    const printContent = `<!DOCTYPE html>
      <html><head><title>QR Code Aset - ${assetCode}</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; font-family: sans-serif; }
        .card { text-align: center; padding: 32px; border: 2px dashed #000; border-radius: 16px; display: inline-block; }
        h2 { font-size: 16px; font-weight: bold; color: #000; margin: 12px 0 4px; }
        p { font-size: 12px; color: #333; margin: 0; }
        .code { font-size: 14px; font-weight: bold; color: #000; margin-top: 6px; letter-spacing: 0.1em; }
        svg { width: 140px; height: 140px; display: block; margin: 0 auto; }
      </style></head><body>
      <div class="card">
        ${svgData}
        <h2>${form.name}</h2>
        <p class="code">${assetCode}</p>
        <p>${form.location}</p>
      </div>
      <script>
        setTimeout(function() {
          window.print();
        }, 300);
      </script>
      </body></html>
    `;
    const win = window.open("", "_blank", "width=400,height=500");
    if (win) {
      win.document.open();
      win.document.write(printContent);
      win.document.close();
    } else {
      alert("Pop-up diblokir. Izinkan pop-up untuk mencetak QR.");
    }
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all";
  const selectClass = inputClass;

  if (loading) {
    const loader = <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    return isModal ? loader : (
      <Layout hideMobileHeader hideBottomNav hideSidebar>
        {loader}
      </Layout>
    );
  }

  const content = (
    <div className={`bg-slate-50 ${isModal ? 'p-0' : 'min-h-full pb-24'}`}>
      {!isModal && (
        <div className="bg-white border-b border-slate-200 py-4">
          <div className="px-5 sm:px-8 max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate("/assets")} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {assetCode && (
              <span className="text-blue-600 text-xs font-bold bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">{assetCode}</span>
            )}
          </div>
        </div>
      )}
      <div className={`${isModal ? 'p-6' : 'px-5 sm:px-8 max-w-4xl mx-auto mt-6'}`}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const errs = validate();
          if (Object.keys(errs).length > 0) { setErrors(errs); return; }
          setErrors({});
          setSaving(true);
      
          try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v !== null && v !== undefined ? String(v) : ""));
            if (photoFile) fd.append("photo", photoFile);
      
            let res;
            if (isEdit) {
              fd.append("id", id);
              res = await api.post("/assets.php", fd);
            } else {
              res = await api.post("/assets.php", fd);
              setAssetCode(res.data?.asset_code || "");
            }
            
            if (isModal) {
              onSuccess();
              if (isEdit) { onClose(); return; }
            }
            
            setSuccess(true);
            setShowQR(true);
            
          } catch (err) {
            alert(err.response?.data?.message || "Gagal menyimpan aset");
          } finally {
            setSaving(false);
          }
        }} className="space-y-5">

            {/* Success Banner + QR Preview */}
            {success && showQR && assetCode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-800">Aset berhasil {isEdit ? "diperbarui" : "ditambahkan"}!</p>
                    <p className="text-sm text-emerald-600">Kode: <strong>{assetCode}</strong></p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                    <QRCode id="print-qr-svg" value={assetCode} size={140} />
                  </div>
                  <p className="text-sm font-bold text-emerald-700 text-center">{form.name}</p>
                  <div className="flex justify-center gap-3 w-full">
                    <button type="button" onClick={handlePrintQR} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-2xl transition-all">
                      <Package className="w-4 h-4" /> Cetak QR
                    </button>
                    <button type="button" onClick={() => isModal ? onClose() : navigate("/assets")} className="flex-1 flex items-center justify-center gap-2 bg-white border border-emerald-200 text-emerald-700 text-sm font-bold py-2.5 rounded-2xl transition-all">
                      {isModal ? "Tutup" : "Ke Daftar Aset"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Foto Aset */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500" /> Foto Aset</h2>
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all relative overflow-hidden"
                onClick={() => photoRef.current?.click()}
              >
                {(photoPreview || existingPhoto) ? (
                  <>
                    <img src={photoPreview || existingPhoto} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); setExistingPhoto(null); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Klik untuk upload foto</p>
                    <p className="text-[11px] text-slate-300 mt-1">JPG, PNG, WebP maks. 5MB</p>
                  </>
                )}
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>

            {/* Info Dasar */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-2"><Package className="w-4 h-4 text-blue-500" /> Informasi Dasar</h2>
              <Field label="Nama Aset" required error={errors.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Contoh: Laptop Dell Latitude 5420" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Kategori">
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectClass}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Merek">
                  <input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputClass} placeholder="Dell, HP, ASUS..." />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Model">
                  <input value={form.model} onChange={(e) => set("model", e.target.value)} className={inputClass} placeholder="Latitude 5420" />
                </Field>
                <Field label="Serial Number">
                  <input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} className={inputClass} placeholder="SN123456..." />
                </Field>
              </div>
              <Field label="Deskripsi">
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Deskripsi tambahan..." />
              </Field>
            </div>

            {/* Pembelian */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Informasi Pembelian</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tanggal Beli">
                  <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Harga Beli (Rp)">
                  <input type="number" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} className={inputClass} placeholder="5000000" min={0} />
                </Field>
              </div>
            </div>

            {/* Status & Lokasi */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-emerald-500" /> Status & Lokasi</h2>
              <Field label="Lokasi" required error={errors.location}>
                <select value={form.location} onChange={(e) => set("location", e.target.value)} className={selectClass}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Kondisi">
                  <select value={form.condition} onChange={(e) => set("condition", e.target.value)} className={selectClass}>
                    {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectClass}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving || success}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                ) : success ? (
                  <><Check className="w-4 h-4" /> Tersimpan!</>
                ) : (
                  <><Save className="w-4 h-4" /> {isEdit ? "Simpan Perubahan" : "Simpan & Generate QR Code"}</>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );

  if (isModal) return content;

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      {content}
    </Layout>
  );
}
