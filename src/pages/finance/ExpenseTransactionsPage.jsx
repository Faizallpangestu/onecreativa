import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { accountingGet, accountingMutate } from "../../utils/accountingApi";
import { Eye, Plus, Pencil, Trash2, AlertTriangle, Building2, UserCheck, Clock } from "lucide-react";

function getNowDateTimeLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatWaktuIndo(dtString, fallbackDate) {
  if (!dtString && !fallbackDate) return "—";
  try {
    const raw = dtString || fallbackDate;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const datePart = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    if (raw.includes("T") || raw.includes(":") || raw.includes(" ")) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${datePart}, ${hours}:${minutes} WIB`;
    }
    return `${datePart}, 10:00 WIB`;
  } catch (e) {
    return dtString || fallbackDate || "—";
  }
}

const INITIAL_EXPENSE_DATA = [
  { id: 1, tanggal: "2026-10-01", waktuPelunasan: "2026-10-01T14:30", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Pembelian", deskripsi: "Laptop Admin", sumberDana: "Bank BCA Operasional", nominal: 7500000, status: "Paid", vendor: "Toko Office Equipment" },
  { id: 2, tanggal: "2026-09-29", waktuPelunasan: "2026-09-29T10:15", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Operasional", deskripsi: "Listrik Kantor Gedung LPK", sumberDana: "Petty Cash (Kasir)", nominal: 1200000, status: "Paid", vendor: "CV Sukses Listrik" },
  { id: 3, tanggal: "2026-09-25", waktuPelunasan: "2026-09-25T16:00", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Reimbursement", deskripsi: "Transport Dinas", sumberDana: "Petty Cash (Kasir)", nominal: 500000, status: "Paid", vendor: "Staff Admin" },
  { id: 4, tanggal: "2026-09-20", waktuPelunasan: "2026-09-20T09:00", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Gaji Karyawan", deskripsi: "Gaji Bulanan", sumberDana: "Bank BCA Operasional", nominal: 25000000, status: "Paid", vendor: "Karyawan LPK" },
  { id: 5, tanggal: "2026-09-18", waktuPelunasan: "2026-09-18T11:45", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Operasional", deskripsi: "Langganan Internet Dedicated Fiber", sumberDana: "Bank BCA Operasional", nominal: 850000, status: "Paid", vendor: "PT Maju Internet" },
  { id: 6, tanggal: "2026-09-14", waktuPelunasan: "2026-09-14T13:20", petugasPelunasan: "FINANCE LPK CREATIVA", kategori: "Pembelian", deskripsi: "Buku Pelajaran & Modul N5", sumberDana: "Petty Cash (Kasir)", nominal: 3200000, status: "Paid", vendor: "Percetakan Mitra" },
];

export default function ExpenseTransactionsPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_expense_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => {
            const desk = item.deskripsi || item.keterangan || item.uraian || item.description || (item.vendor ? `Pengadaan ${item.vendor}` : "Beban Operasional LPK");
            const sumber = item.sumberDana || item.akun || item.rekening || item.source || item.bank || (Number(item.nominal || item.amount || 0) > 5000000 ? "Bank BCA Operasional" : "Petty Cash (Kasir)");
            let vendorName = item.vendor || item.pihak;
            if (!vendorName || vendorName === "—" || vendorName === "Staff/Vendor") {
              if (desk.includes("CV Sukses Listrik")) vendorName = "CV Sukses Listrik";
              else if (desk.includes("PT Maju Internet")) vendorName = "PT Maju Internet";
              else if (desk.includes("Toko Office") || desk.includes("Office Equipment")) vendorName = "Toko Office Equipment";
              else if (desk.includes("Percetakan Mitra")) vendorName = "Percetakan Mitra";
              else if (desk.includes("Toko ATK Sentosa") || desk.includes("ATK Sentosa")) vendorName = "Toko ATK Sentosa";
              else if (desk.includes("Klinik Medika")) vendorName = "Klinik Medika Pratama";
              else if (desk.includes("PLN")) vendorName = "PLN Persero";
              else vendorName = item.vendor || "CV Sukses Listrik";
            }
            const waktu = item.waktuPelunasan || item.paid_at || (item.tanggal ? `${item.tanggal}T10:30` : getNowDateTimeLocal());
            const petugas = item.petugasPelunasan || item.dilunasiOleh || "FINANCE LPK CREATIVA";
            return {
              ...item,
              id: item.id || idx + 1,
              deskripsi: desk,
              keterangan: desk,
              sumberDana: sumber,
              akun: sumber,
              vendor: vendorName,
              pihak: vendorName,
              waktuPelunasan: waktu,
              petugasPelunasan: petugas,
              nominal: Number(item.nominal || item.amount || 0),
              status: item.status || "Lunas",
            };
          });
        }
      }
    } catch (e) {}
    return INITIAL_EXPENSE_DATA;
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [kategori, setKategori] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("finance_expense_data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // Master vendor list untuk autocomplete agar nama vendor selalu sama & sinkron
  const [vendorList, setVendorList] = useState(() => {
    try {
      const vRaw = localStorage.getItem("finance_vendors_data");
      if (vRaw) {
        const parsed = JSON.parse(vRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(v => v.nama || v.name).filter(Boolean);
        }
      }
    } catch (e) {}
    return [
      "CV Sukses Listrik",
      "PT Maju Internet",
      "Toko Office Equipment",
      "Percetakan Mitra",
      "Toko ATK Sentosa",
      "Klinik Medika Pratama",
      "PLN Persero",
    ];
  });

  useEffect(() => {
    const updateVendors = () => {
      try {
        const vRaw = localStorage.getItem("finance_vendors_data");
        if (vRaw) {
          const parsed = JSON.parse(vRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVendorList(parsed.map(v => v.nama || v.name).filter(Boolean));
          }
        }
      } catch (e) {}
    };
    window.addEventListener("storage", updateVendors);
    window.addEventListener("finance_vendors_updated", updateVendors);

    let bc = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("finance_vendors_channel");
      bc.onmessage = () => {
        updateVendors();
      };
    }

    return () => {
      window.removeEventListener("storage", updateVendors);
      window.removeEventListener("finance_vendors_updated", updateVendors);
      if (bc) bc.close();
    };
  }, []);

  // Form State
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    waktuPelunasan: getNowDateTimeLocal(),
    petugasPelunasan: "FINANCE LPK CREATIVA",
    kategori: "Operasional Kantor",
    deskripsi: "",
    sumberDana: "Petty Cash (Kasir)",
    nominal: "",
    status: "Paid",
    vendor: "CV Sukses Listrik",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      waktuPelunasan: getNowDateTimeLocal(),
      petugasPelunasan: "FINANCE LPK CREATIVA",
      kategori: "Operasional Kantor",
      deskripsi: "",
      sumberDana: "Petty Cash (Kasir)",
      nominal: "",
      status: "Paid",
      vendor: "CV Sukses Listrik",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      tanggal: item.tanggal,
      waktuPelunasan: item.waktuPelunasan || (item.tanggal ? `${item.tanggal}T10:30` : getNowDateTimeLocal()),
      petugasPelunasan: item.petugasPelunasan || "FINANCE LPK CREATIVA",
      kategori: item.kategori,
      deskripsi: item.deskripsi || item.keterangan || "",
      sumberDana: item.sumberDana || item.akun || "Petty Cash (Kasir)",
      nominal: item.nominal,
      status: item.status,
      vendor: item.vendor || item.pihak || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    const targetId = String(deletingItem.id);
    const updated = data.filter(d => String(d.id) !== targetId);
    setData(updated);

    // Langsung simpan perubahan ke localStorage
    try {
      localStorage.setItem("finance_expense_data", JSON.stringify(updated));
      const deletedIds = JSON.parse(localStorage.getItem("finance_expense_deleted_ids") || "[]");
      if (!deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        localStorage.setItem("finance_expense_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {}

    try {
      await accountingMutate({
        action: "delete",
        id: deletingItem.id,
        type: "expense",
      });
    } catch {
      // Local state fallback
    }
    setBusy(false);
    setDeletingItem(null);
  };

  useEffect(() => {
    let active = true;
    accountingGet("ledger", { type: "expense" })
      .then(res => {
        if (active && res.data?.rows?.length > 0) {
          const deletedIds = JSON.parse(localStorage.getItem("finance_expense_deleted_ids") || "[]");
          const apiRows = res.data.rows
            .map((r, i) => ({
              id: r.ledger_id || r.id || i + 1,
              tanggal: r.transaction_date || r.date,
              kategori: r.category || "Operasional",
              deskripsi: r.description || "Pengeluaran",
              sumberDana: r.cash_account_name || "Kas/Bank",
              nominal: Number(r.outgoing_amount || r.amount || 0),
              status: r.approval_status === "approved" ? "Approved" : r.payment_status === "paid" ? "Paid" : "Pending",
              vendor: r.party_name || r.vendor_name || "—",
            }))
            .filter(r => !deletedIds.includes(String(r.id)));

          const hasSaved = localStorage.getItem("finance_expense_data");
          if (!hasSaved && apiRows.length > 0) {
            setData(apiRows);
          }
        }
      })
      .catch(() => {
        // Fallback to initial starter data
      });
    return () => { active = false; };
  }, []);

  const filteredData = data.filter(item => {
    if (kategori !== "all" && item.kategori.toLowerCase() !== kategori.toLowerCase()) return false;
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.deskripsi.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.sumberDana.toLowerCase().includes(q) ||
        (item.vendor && item.vendor.toLowerCase().includes(q))
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
        Tanggal: d.tanggal,
        Kategori: d.kategori,
        Deskripsi: d.deskripsi,
        "Sumber Dana": d.sumberDana,
        Nominal: d.nominal,
        Status: d.status,
        Pihak: d.vendor,
      })),
      "Transaksi_Pengeluaran"
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.deskripsi || !form.nominal) return;
    setBusy(true);

    if (editingItem) {
      setData(data.map(d => d.id === editingItem.id ? {
        ...d,
        tanggal: form.waktuPelunasan ? form.waktuPelunasan.slice(0, 10) : form.tanggal,
        waktuPelunasan: form.waktuPelunasan || getNowDateTimeLocal(),
        petugasPelunasan: form.petugasPelunasan || "FINANCE LPK CREATIVA",
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        keterangan: form.deskripsi,
        sumberDana: form.sumberDana,
        akun: form.sumberDana,
        nominal: Number(form.nominal),
        status: form.status,
        vendor: form.vendor || "Staff/Vendor",
        pihak: form.vendor || "Staff/Vendor",
      } : d));
      try {
        await accountingMutate({
          action: "update",
          id: editingItem.id,
          type: "expense",
          transaction_date: form.waktuPelunasan ? form.waktuPelunasan.slice(0, 10) : form.tanggal,
          description: form.deskripsi,
          category: form.kategori,
          amount: Number(form.nominal),
          party_name: form.vendor,
        });
      } catch {}
    } else {
      const newItem = {
        id: Date.now(),
        tanggal: form.waktuPelunasan ? form.waktuPelunasan.slice(0, 10) : form.tanggal,
        waktuPelunasan: form.waktuPelunasan || getNowDateTimeLocal(),
        petugasPelunasan: form.petugasPelunasan || "FINANCE LPK CREATIVA",
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        keterangan: form.deskripsi,
        sumberDana: form.sumberDana,
        akun: form.sumberDana,
        nominal: Number(form.nominal),
        status: form.status,
        vendor: form.vendor || "Staff/Vendor",
        pihak: form.vendor || "Staff/Vendor",
      };
      try {
        await accountingMutate({
          action: "create",
          type: "expense",
          transaction_date: form.waktuPelunasan ? form.waktuPelunasan.slice(0, 10) : form.tanggal,
          description: form.deskripsi,
          category: form.kategori,
          amount: Number(form.nominal),
          party_name: form.vendor,
        });
      } catch {
        // Local state update ensures immediate UX response
      }

      // Potong saldo rekening di COA (finance_rekening_data) jika pengeluaran langsung Paid
      if (newItem.status === "Paid") {
        try {
          const rekRaw = localStorage.getItem("finance_rekening_data");
          if (rekRaw) {
            const rekList = JSON.parse(rekRaw);
            const amt = Number(newItem.nominal) || 0;
            if (Array.isArray(rekList) && amt > 0) {
              const updated = rekList.map(r => {
                const sDana = (newItem.sumberDana || "").toLowerCase();
                const match = (r.bank && r.bank.toLowerCase().includes(sDana)) ||
                              (r.nama && r.nama.toLowerCase().includes(sDana)) ||
                              (sDana.includes("bca") && (r.noRek?.includes("1832-918-428") || r.noRek?.includes("1234567890")));
                if (match) {
                  return { ...r, saldo: Math.max(0, (Number(r.saldo) || 0) - amt) };
                }
                return r;
              });
              localStorage.setItem("finance_rekening_data", JSON.stringify(updated));
            }
          }
        } catch (e) {
          console.warn("Gagal update saldo rekening pengeluaran:", e);
        }
      }

      setData([newItem, ...data]);
    }

    setBusy(false);
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      waktuPelunasan: getNowDateTimeLocal(),
      petugasPelunasan: "FINANCE LPK CREATIVA",
      kategori: "Operasional Kantor",
      deskripsi: "",
      sumberDana: "Petty Cash (Kasir)",
      nominal: "",
      status: "Paid",
      vendor: "CV Sukses Listrik",
    });
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { 
      header: "Tanggal & Jam", 
      accessor: "waktuPelunasan", 
      className: "whitespace-nowrap font-medium text-slate-700 text-xs",
      render: (r) => formatWaktuIndo(r.waktuPelunasan, r.tanggal)
    },
    { 
      header: "Pihak / Vendor", 
      accessor: "vendor", 
      className: "font-semibold text-slate-900",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {r.vendor || r.pihak || "—"}
        </span>
      )
    },
    { header: "Kategori", accessor: "kategori", className: "text-slate-600 font-medium text-xs" },
    { 
      header: "Deskripsi Pengeluaran", 
      accessor: "deskripsi", 
      className: "max-w-xs truncate text-xs text-slate-600",
      render: (r) => r.deskripsi || r.keterangan || r.uraian || r.description || (r.vendor ? `Pengadaan ${r.vendor}` : "Beban Operasional LPK")
    },
    { 
      header: "Sumber Dana", 
      accessor: "sumberDana",
      className: "text-xs font-semibold text-slate-700",
      render: (r) => r.sumberDana || r.akun || r.rekening || r.bank || (Number(r.nominal) > 5000000 ? "Bank BCA Operasional" : "Petty Cash (Kasir)")
    },
    { header: "Nominal", accessor: "nominal", align: "right", className: "font-bold text-slate-900 font-mono text-xs", render: (r) => formatRupiah(r.nominal) },
    { 
      header: "Petugas Pelunasan", 
      accessor: "petugasPelunasan",
      render: (r) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
          <UserCheck className="w-3 h-3 text-blue-600" />
          {r.petugasPelunasan || "FINANCE LPK CREATIVA"}
        </span>
      )
    },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status || "Lunas"} /> },
    { 
      header: "Aksi", 
      accessor: "aksi", 
      align: "center",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedItem(r)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Edit Data"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(r)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Data"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Transaksi Pengeluaran"
          subtitle="Kelola dan pantau seluruh transaksi pengeluaran operasional"
          primaryLabel="+ Ajukan Pengeluaran"
          onPrimaryClick={handleOpenCreate}
          onSecondaryClick={handleExport}
        />

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari transaksi / deskripsi..."
          dropdowns={[
            {
              value: kategori,
              onChange: setKategori,
              options: [
                { value: "all", label: "Semua Kategori" },
                { value: "Operasional", label: "Operasional Kantor" },
                { value: "Pembelian", label: "Pembelian & Inventaris" },
                { value: "Reimbursement", label: "Klaim Reimbursement" },
                { value: "Gaji Karyawan", label: "Gaji Karyawan" },
              ],
            },
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Approved", label: "Approved (Disetujui)" },
                { value: "Pending", label: "Pending (Menunggu)" },
                { value: "Paid", label: "Paid (Sudah Ditransfer)" },
              ],
            },
          ]}
          onReset={() => {
            setKategori("all");
            setStatus("all");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
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

        {/* Modal Ajukan / Edit Pengeluaran */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Pengeluaran" : "Ajukan Pengeluaran Baru"}
          subtitle={editingItem ? "Perbarui informasi pengeluaran biaya operasional" : "Catat pengeluaran biaya operasional atau pengadaan kantor"}
          onSubmit={handleSave}
          submitText={editingItem ? "Perbarui Pengeluaran" : "Ajukan Pengeluaran"}
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Tanggal & Jam Pelunasan
              </label>
              <input
                type="datetime-local"
                required
                value={form.waktuPelunasan}
                onChange={e => setForm({ ...form, waktuPelunasan: e.target.value, tanggal: e.target.value ? e.target.value.slice(0, 10) : form.tanggal })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Petugas Pelunasan (Nama User)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: FINANCE LPK CREATIVA"
                value={form.petugasPelunasan}
                onChange={e => setForm({ ...form, petugasPelunasan: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-500" /> Pihak / Vendor Penerima
              </label>
              <input
                type="text"
                required
                list="expenseVendorListOptions"
                placeholder="Contoh: CV Sukses Listrik"
                value={form.vendor}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
              />
              <datalist id="expenseVendorListOptions">
                {vendorList.map((v, i) => (
                  <option key={i} value={v} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengeluaran</label>
              <select
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Operasional Kantor">Operasional Kantor</option>
                <option value="Pembelian">Pembelian Peralatan / Aset</option>
                <option value="Reimbursement">Reimbursement Staff</option>
                <option value="Gaji Karyawan">Penggajian</option>
                <option value="Lainnya">Beban Lain-lain</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Pengeluaran</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembelian Laptop Admin atau Tagihan Listrik"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Dana Kas/Bank</label>
              <select
                value={form.sumberDana}
                onChange={e => setForm({ ...form, sumberDana: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
              >
                <option value="Petty Cash (Kasir)">Petty Cash (Kas Kecil Tunai & Vendor Kecil)</option>
                <option value="Bank BCA Operasional">Bank BCA Operasional (LPK Creativa Bridging Intern)</option>
                <option value="Rekening Cadangan Mandiri">Rekening Cadangan Mandiri</option>
                <option value="E-Wallet Bisnis">E-Wallet Bisnis (DANA / Flip)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.nominal}
                onChange={e => setForm({ ...form, nominal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pelunasan</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="Paid">Lunas (Paid - Sudah Ditransfer)</option>
                <option value="Approved">Approved (Disetujui)</option>
                <option value="Pending">Pending (Diajukan)</option>
              </select>
            </div>
          </div>
        </FinanceModal>

        {/* Modal Konfirmasi Hapus */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Hapus Pengeluaran?</h3>
              <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pengeluaran <strong className="text-slate-800">{deletingItem.deskripsi}</strong> senilai <strong className="text-slate-800">{formatRupiah(deletingItem.nominal)}</strong>?
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {busy ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Item */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 mb-1">Detail Pengeluaran</h3>
              <p className="text-xs text-slate-400 mb-4">Informasi pengajuan biaya pengeluaran operasional</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal & Jam:</span><span className="font-semibold text-slate-800">{formatWaktuIndo(selectedItem.waktuPelunasan, selectedItem.tanggal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Petugas Pelunasan:</span><span className="font-semibold text-blue-700">{selectedItem.petugasPelunasan || "FINANCE LPK CREATIVA"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Pihak / Vendor:</span><span className="font-bold text-slate-900">{selectedItem.vendor || selectedItem.pihak || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kategori:</span><span className="font-semibold text-slate-800">{selectedItem.kategori}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Deskripsi:</span><span className="font-semibold text-slate-800">{selectedItem.deskripsi}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sumber Dana:</span><span className="font-semibold text-slate-800">{selectedItem.sumberDana}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nominal:</span><span className="font-bold text-rose-600 text-sm">{formatRupiah(selectedItem.nominal)}</span></div>
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
