import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { budgetImageUrl, formatBudgetMoney } from "../utils/budgetApi";

import {accountingGet,accountingError} from "../utils/accountingApi";
const CATEGORIES = ["Perlengkapan Kantor", "Operasional Kantor", "Perawatan Gedung", "Peralatan Kelas", "Fasilitas Asrama", "Lainnya"];
const newItem = () => ({ key: crypto.randomUUID(), category: "Perlengkapan Kantor", description: "", quantity: 1, unit: "pcs", unit_price: "" });

export default function BudgetRequestForm({ initial, saving, error, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    department_id: initial?.department_id || "",
    id: initial?.id, version: initial?.version, request_key: crypto.randomUUID(),
    title: initial?.title || "", period: initial?.period?.slice(0, 7) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, notes: initial?.notes || "",
    items: initial?.items?.map(item => ({ ...item, key: crypto.randomUUID() })) || [newItem()],
    attachment_link: initial?.attachment_link || "", attachment_action: "keep", attachment_file: null,
    copy_attachment_from: !initial?.id ? initial?.copy_attachment_from : undefined,
  }));
  const [departments,setDepartments]=useState([]);
  const [departmentError,setDepartmentError]=useState("");
  useEffect(()=>{let active=true;accountingGet("lookups").then(r=>{if(active)setDepartments(r.data.departments);}).catch(e=>{if(active)setDepartmentError(accountingError(e));});return()=>{active=false;};},[]);
  const [imagePreview, setImagePreview] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const fileInput = useRef(null);
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);
  const preview = form.attachment_file ? imagePreview : form.attachment_action === "keep" && initial?.attachment_key ? budgetImageUrl(initial.id || initial.copy_attachment_from, initial.attachment_key) : "";
  const selectImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024 || !file.size) {
      setAttachmentError("Pilih gambar JPG, PNG, atau WebP maksimal 2 MB.");
      event.target.value = "";
      return;
    }
    setAttachmentError("");
    setImagePreview(URL.createObjectURL(file));
    setForm(previous => ({ ...previous, attachment_file: file, attachment_action: "upload" }));
  };
  const updateItem = (key, field, value) => setForm(previous => ({ ...previous, items: previous.items.map(item => item.key === key ? { ...item, [field]: value } : item) }));
  const total = form.items.reduce((sum, item) => sum + Math.round(Number(item.unit_price || 0) * 100) * Number(item.quantity || 0), 0) / 100;
  return (
    <div className="rab-modal-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="rab-form-title" className="rab-modal rab-form-modal">
        <div className="rab-modal-heading"><div><h2 id="rab-form-title">{initial?.id ? "Edit Draft RAB" : "Buat RAB Kebutuhan Kantor"}</h2><p>Rincikan kebutuhan sebelum mengajukannya ke Admin.</p></div><button disabled={saving} onClick={onClose} aria-label="Tutup formulir"><X size={20} /></button></div>
        <form onSubmit={event => { event.preventDefault(); onSave({ ...form, submit: event.nativeEvent.submitter?.value === "submit" }); }}>
          <div className="rab-form-body">
            {error && <div role="alert" className="rab-error">{error}</div>}
            <div className="rab-form-grid"><label>Judul RAB<input autoFocus required maxLength={180} placeholder="Contoh: Kebutuhan kantor bulan Oktober" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Periode RAB<input required type="month" min="1900-01" max="2299-12" value={form.period} onChange={event => setForm({ ...form, period: event.target.value })} /></label></div>
            {departmentError&&<p className="rab-error">{departmentError}</p>}<label>Departemen *<select required value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})}><option value="">Pilih departemen</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
            <div className="rab-items-heading"><h3>Rincian Kebutuhan</h3><button type="button" disabled={saving || form.items.length >= 200} onClick={() => setForm({ ...form, items: [...form.items, newItem()] })}><Plus size={16} />Tambah Item</button></div>
            <div className="rab-items">
              {form.items.map((item, index) => <div className="rab-item" key={item.key}>
                <div className="rab-item-heading"><strong>Kebutuhan {index + 1}</strong><button type="button" aria-label={`Hapus kebutuhan ${index + 1}`} disabled={saving || form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter(row => row.key !== item.key) })}><Trash2 size={16} /></button></div>
                <div className="rab-form-grid"><label>Kategori<select value={item.category} onChange={event => updateItem(item.key, "category", event.target.value)}>{[...new Set([...CATEGORIES, item.category])].map(category => <option key={category}>{category}</option>)}</select></label><label>Kebutuhan<input required maxLength={500} placeholder="Nama barang atau kebutuhan" value={item.description} onChange={event => updateItem(item.key, "description", event.target.value)} /></label></div>
                <div className="rab-item-numbers"><label>Jumlah<input required type="number" min="1" max="999999" step="1" value={item.quantity} onChange={event => updateItem(item.key, "quantity", event.target.value)} /></label><label>Satuan<input required maxLength={40} value={item.unit} onChange={event => updateItem(item.key, "unit", event.target.value)} /></label><label>Harga Satuan (Rp)<input required type="number" min="0.01" step="0.01" value={item.unit_price} onChange={event => updateItem(item.key, "unit_price", event.target.value)} /></label><div className="rab-item-total"><span>Subtotal</span><strong>{formatBudgetMoney(Math.round(Number(item.unit_price || 0) * 100) * Number(item.quantity || 0) / 100)}</strong></div></div>
              </div>)}
            </div>
            <label>Catatan Pengajuan<textarea maxLength={2000} rows={3} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Tujuan atau alasan kebutuhan kantor ini" /></label>
            <div className="rab-attachment rab-attachment-form">
              <h3>Lampiran Pengajuan <small>Opsional</small></h3>
              <p>Tambahkan foto barang, penawaran harga, atau link referensi untuk diperiksa Admin.</p>
              <label>Gambar Referensi<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={selectImage} /><small>JPG, PNG, atau WebP · maksimal 2 MB</small></label>
              {attachmentError && <p className="rab-error" role="alert">{attachmentError}</p>}
              {preview && <div className="rab-selected-image"><img src={preview} alt="Pratinjau lampiran RAB" /><div><span>{form.attachment_file?.name || initial?.attachment_name}</span><button type="button" disabled={saving} onClick={() => { setAttachmentError(""); setImagePreview(""); fileInput.current.value = ""; setForm({ ...form, attachment_file: null, attachment_action: "remove" }); }}><Trash2 size={15} />Hapus gambar</button></div></div>}
              <label>Link Referensi<input type="url" maxLength={2048} pattern="[hH][tT][tT][pP][sS]?://.*" placeholder="https://contoh.com/produk-atau-penawaran" value={form.attachment_link} disabled={saving} onChange={event => setForm({ ...form, attachment_link: event.target.value })} /></label>
            </div>
          </div>
          <div className="rab-modal-footer"><div className="rab-form-total"><span>Total Pengajuan</span><strong>{formatBudgetMoney(total)}</strong></div><div className="rab-footer-buttons"><button type="button" disabled={saving} onClick={onClose} className="rab-button">Batal</button><button type="submit" value="draft" disabled={saving} className="rab-button">{saving ? "Menyimpan…" : "Simpan Draft"}</button>{!initial?.id && <button type="submit" value="submit" disabled={saving} className="rab-button rab-button-primary">Ajukan RAB</button>}</div></div>
        </form>
      </section>
    </div>
  );
}
