import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceKpiCard, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  exportToExcel 
} from "./FinancePageComponents";
import { Building2, CheckCircle2, XCircle, Eye, Plus, Phone, Mail } from "lucide-react";
import axios from "axios";

const INITIAL_VENDORS = [
  { id: 1, nama: "CV Sukses Listrik", kategori: "Operasional", kontak: "0812-xxxx-1234", email: "sukseslistrik@gmail.com", alamat: "Jl. Raya Cianjur No. 45", status: "Aktif" },
  { id: 2, nama: "PT Maju Internet", kategori: "Operasional", kontak: "0813-xxxx-5678", email: "sales@majuinternet.net", alamat: "Gedung Cyber Lt. 3, Jakarta", status: "Aktif" },
  { id: 3, nama: "Toko Office Equipment", kategori: "Peralatan", kontak: "0817-xxxx-9012", email: "office.eq@toko.com", alamat: "Jl. Pasirhayam, Cianjur", status: "Aktif" },
  { id: 4, nama: "Percetakan Mitra", kategori: "Modul & Bahan", kontak: "0852-xxxx-3456", email: "mitraprint@gmail.com", alamat: "Jl. Siliwangi No. 12", status: "Aktif" },
  { id: 5, nama: "Cianjur Catering Service", kategori: "Konsumsi", kontak: "0877-xxxx-7890", email: "catering.cjr@gmail.com", alamat: "Komplek BLK Cianjur", status: "Nonaktif" },
  { id: 6, nama: "Klinik Medika Pratama", kategori: "Medical Checkup", kontak: "0811-xxxx-4433", email: "info@medikapratama.id", alamat: "Jl. Dr. Muwardi, Cianjur", status: "Aktif" },
];

export default function VendorsPage() {
  const [data, setData] = useState(INITIAL_VENDORS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    kategori: "Operasional",
    kontak: "",
    email: "",
    alamat: "",
    status: "Aktif",
  });

  useEffect(() => {
    let active = true;
    axios.get("/api/accounting.php?view=lookups")
      .then(res => {
        if (active && res.data?.data?.vendors?.length > 0) {
          const apiVendors = res.data.data.vendors.map((v, i) => ({
            id: v.id || i + 1,
            nama: v.name,
            kategori: v.category || "Operasional",
            kontak: v.phone || "0812-xxxx-xxxx",
            email: v.email || `${v.name.toLowerCase().replace(/\s+/g, ".")}@vendor.com`,
            alamat: v.address || "Cianjur",
            status: "Aktif",
          }));
          setData(apiVendors);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const totalVendor = data.length;
  const vendorAktif = data.filter(d => d.status === "Aktif").length;
  const vendorNonaktif = totalVendor - vendorAktif;

  const filteredData = data.filter(item => {
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.nama.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.kontak.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map((d, idx) => ({
        No: idx + 1,
        "Nama Vendor": d.nama,
        Kategori: d.kategori,
        Kontak: d.kontak,
        Email: d.email,
        Alamat: d.alamat,
        Status: d.status,
      })),
      "Data_Vendor_Rekanan"
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nama) return;
    setBusy(true);
    const newVendor = {
      id: Date.now(),
      nama: form.nama,
      kategori: form.kategori,
      kontak: form.kontak || "0812-xxxx-xxxx",
      email: form.email || "-",
      alamat: form.alamat || "-",
      status: form.status,
    };
    setData([newVendor, ...data]);
    setBusy(false);
    setIsModalOpen(false);
    setForm({
      nama: "",
      kategori: "Operasional",
      kontak: "",
      email: "",
      alamat: "",
      status: "Aktif",
    });
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { header: "Nama Vendor", accessor: "nama", className: "font-semibold text-slate-900" },
    { header: "Kategori", accessor: "kategori" },
    { header: "Kontak", accessor: "kontak", className: "text-slate-600" },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
    { 
      header: "Aksi", 
      accessor: "aksi", 
      align: "center",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedItem(r)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Lihat Detail Vendor"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Data Vendor"
          subtitle="Kelola direktori mitra supplier, vendor pengadaan barang, dan penyedia jasa"
          primaryLabel="+ Tambah Vendor"
          onPrimaryClick={() => setIsModalOpen(true)}
          onSecondaryClick={handleExport}
        />

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Vendor Terdaftar"
            value={totalVendor}
            subtitle="Mitra rekanan terdaftar"
            icon={Building2}
            color="blue"
          />
          <FinanceKpiCard
            title="Vendor Aktif"
            value={vendorAktif}
            subtitle="Sedang aktif bekerjasama"
            icon={CheckCircle2}
            color="emerald"
          />
          <FinanceKpiCard
            title="Vendor Nonaktif"
            value={vendorNonaktif}
            subtitle="Kerjasama berakhir/arsip"
            icon={XCircle}
            color="rose"
          />
        </div>

        <FinanceFilterBar
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari nama vendor, kategori, kontak..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Aktif", label: "Aktif" },
                { value: "Nonaktif", label: "Nonaktif" },
              ],
            },
          ]}
          onReset={() => {
            setStatus("all");
            setSearch("");
          }}
        />

        <FinanceTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredData.length}
        />

        {/* Modal Tambah Vendor */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tambah Vendor Baru"
          subtitle="Daftarkan mitra supplier atau penyedia jasa kantor"
          onSubmit={handleSave}
          submitText="Simpan Vendor"
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Vendor / Badan Usaha</label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Mitra Solusi Tekno"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Layanan / Barang</label>
              <select
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Operasional">Operasional Kantor</option>
                <option value="Peralatan">Peralatan & Hardware</option>
                <option value="Modul & Bahan">Percetakan & Buku</option>
                <option value="Konsumsi">Konsumsi & Katering</option>
                <option value="Medical Checkup">Medical Checkup Siswa</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={form.kontak}
                onChange={e => setForm({ ...form, kontak: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                placeholder="vendor@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Kantor / Toko</label>
              <textarea
                rows={2}
                placeholder="Alamat lengkap vendor..."
                value={form.alamat}
                onChange={e => setForm({ ...form, alamat: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </FinanceModal>

        {/* Modal Detail Vendor */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 mb-1">Detail Profil Vendor</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedItem.nama}</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Kategori:</span><span className="font-semibold text-slate-800">{selectedItem.kategori}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Telepon:</span><span className="font-semibold text-slate-800">{selectedItem.kontak}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-semibold text-slate-800">{selectedItem.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Alamat:</span><span className="font-semibold text-slate-800">{selectedItem.alamat}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
