import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Search, Settings2, X, History, ShieldCheck, HeartPulse, Receipt, Wallet, Calculator } from "lucide-react";
import { mutateSalary, salarySourceLabel, calculateBpjsTk, calculateBpjsKes, calculatePph21Ter } from "../utils/salaryApi";
import { formatBudgetMoney, formatBudgetMonth, formatBudgetDate } from "../utils/budgetApi";

const PTKP_OPTIONS = [
  { value: "TK/0", label: "TK/0 · Tidak Kawin / 0 Tanggungan (TER A - PTKP Rp 54 Juta)" },
  { value: "TK/1", label: "TK/1 · Tidak Kawin / 1 Tanggungan (TER A - PTKP Rp 58,5 Juta)" },
  { value: "K/0", label: "K/0 · Kawin / 0 Tanggungan (TER A - PTKP Rp 58,5 Juta)" },
  { value: "TK/2", label: "TK/2 · Tidak Kawin / 2 Tanggungan (TER B - PTKP Rp 63 Juta)" },
  { value: "TK/3", label: "TK/3 · Tidak Kawin / 3 Tanggungan (TER B - PTKP Rp 67,5 Juta)" },
  { value: "K/1", label: "K/1 · Kawin / 1 Tanggungan (TER B - PTKP Rp 63 Juta)" },
  { value: "K/2", label: "K/2 · Kawin / 2 Tanggungan (TER B - PTKP Rp 67,5 Juta)" },
  { value: "K/3", label: "K/3 · Kawin / 3 Tanggungan (TER C - PTKP Rp 72 Juta)" },
];

export default function SalaryBaseSettings({ initialMonth, employeeId, onSaved, refreshKey }) {
  const [month, setMonth] = useState(initialMonth);
  const [employees, setEmployees] = useState([]);
  const [csrf, setCsrf] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(employeeId || null);

  const load = useCallback(async signal => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/salaries.php", { params: { view: "base_salary", month, _t: Date.now() }, signal });
      setEmployees(response.data.data.employees); setCsrf(response.data.csrf_token);
    } catch (err) {
      if (!axios.isCancel(err)) { setError(err.response?.data?.message || "Pengaturan gaji gagal dimuat."); setEmployees([]); }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [month]);

  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const employee = employees.find(row => Number(row.employee_id) === Number(selected));
  const filtered = employees.filter(row => [row.employee_name, row.employee_code].some(value => value.toLowerCase().includes(search.toLowerCase())));

  return <section className="rab-panel salary-base-panel">
    <div className="rab-panel-header">
      <h2>Atur Gaji Pokok &amp; Potongan Standar per Karyawan</h2>
      <p>Atur gaji pokok, kepesertaan BPJS Ketenagakerjaan (3%), BPJS Kesehatan (1%), status PTKP / PPh 21 TER, dan kasbon per karyawan. Standar ini otomatis diterapkan pada draft penggajian bulanan.</p>
    </div>
    <div className="salary-base-help">
      <Settings2 size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
      <div>
        <strong>Kompensasi &amp; Potongan Standar Sesuai Regulasi Keuangan Nasional</strong>
        <p>Bulan absensi menentukan periode mulai berlakunya gaji pokok &amp; potongan (contoh: berlaku {formatBudgetMonth(month)}). Potongan BPJS TK 3% (JHT 2% + JP 1% cap Rp10.042.300 sesuai PP 44 &amp; 45/2015), BPJS Kesehatan 1% (cap Rp12.000.000 sesuai Perpres 64/2020), dan PPh 21 TER (PMK 168/2023) dihitung otomatis secara akurat.</p>
      </div>
    </div>
    {error && <div className="rab-error" role="alert">{error}</div>}
    {notice && <div className="rab-notice" role="status">{notice}</div>}
    <div className="rab-filters">
      <label className="rab-search">
        <Search size={16} />
        <input aria-label="Cari pengaturan gaji" placeholder="Cari nama atau NIK karyawan…" value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      <label className="salary-base-month">
        Gaji &amp; Potongan untuk absensi
        <input aria-label="Bulan pengaturan gaji" type="month" min="1900-01" max="2299-12" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} />
      </label>
    </div>

    <div className="rab-table-scroll">
      <table className="rab-table salary-base-table">
        <thead>
          <tr>
            <th>Karyawan</th>
            <th>Gaji Pokok</th>
            <th>BPJS TK (3%)</th>
            <th>BPJS Kes (1%)</th>
            <th>PPh 21 (TER)</th>
            <th>Kasbon Rutin</th>
            <th>Total Potongan</th>
            <th>Estimasi THP Standar</th>
            <th>Mulai Berlaku</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="rab-empty">Memuat pengaturan master gaji &amp; potongan…</td></tr>
          ) : !filtered.length ? (
            <tr><td colSpan={10} className="rab-empty">Tidak ada karyawan yang sesuai.</td></tr>
          ) : filtered.map(row => (
            <tr key={row.employee_id}>
              <td>
                <strong>{row.employee_name}</strong>
                <span className="rab-cell-caption">{row.employee_code} · {row.position_name}</span>
                {row.ptkp_status && <span className="rab-cell-caption" style={{ color: "#475569" }}>PTKP: {row.ptkp_status} · NPWP: {row.npwp || "—"}</span>}
              </td>
              <td>
                <strong>{formatBudgetMoney(row.base_salary)}</strong>
                {Number(row.base_salary) <= 0 && <span className="salary-row-issue">Gaji belum diatur</span>}
              </td>
              <td>
                <span>{formatBudgetMoney(row.standard_tk)}</span>
                <span className="rab-cell-caption">{row.bpjs_tk_number ? `No: ${row.bpjs_tk_number}` : "JHT 2% + JP 1%"}</span>
              </td>
              <td>
                <span>{formatBudgetMoney(row.standard_kes)}</span>
                <span className="rab-cell-caption">{row.bpjs_kes_number ? `No: ${row.bpjs_kes_number}` : "Pekerja 1%"}</span>
              </td>
              <td>
                <span>{formatBudgetMoney(row.standard_pph21)}</span>
                <span className="rab-cell-caption">TER {row.ptkp_status || "TK/0"}</span>
              </td>
              <td>
                <span>{formatBudgetMoney(row.standard_kasbon)}</span>
              </td>
              <td>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>{formatBudgetMoney(row.total_standard_deductions)}</span>
              </td>
              <td>
                <strong style={{ color: "#15803d", fontSize: "14px" }}>{formatBudgetMoney(row.standard_thp)}</strong>
              </td>
              <td>
                <span>{salarySourceLabel(row.salary_source)}</span>
                <span className="rab-cell-caption">{row.base_salary_effective_month ? `Sejak ${formatBudgetMonth(row.base_salary_effective_month)}` : "Nilai awal"}</span>
                {row.history.some(rate => rate.effective_month > month) && <span className="salary-row-issue">Ada perubahan bulan berikutnya</span>}
              </td>
              <td>
                <button className="rab-button rab-button-primary" onClick={() => { setNotice(""); setSelected(Number(row.employee_id)); }}>
                  <Settings2 size={15} />Atur Gaji &amp; Potongan
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {!loading && (
      <div className="rab-pagination">
        <span>{filtered.length} karyawan · Finance dan Admin dapat mengatur gaji pokok, BPJS, PPh 21, dan potongan kasbon.</span>
      </div>
    )}

    {employee && !loading && (
      <SalaryBaseEditor
        key={`${employee.employee_id}:${employee.revision}:${month}`}
        employee={employee}
        month={month}
        csrf={csrf}
        onClose={() => setSelected(null)}
        onSaved={async saved => {
          setSelected(null);
          setNotice(`Gaji pokok & potongan ${employee.employee_name} berhasil disimpan: Gaji ${formatBudgetMoney(saved.amount)}, mulai absensi ${formatBudgetMonth(saved.effective_month)}. Perubahan otomatis diterapkan pada perhitungan draft penggajian.`);
          await load();
          onSaved();
        }}
      />
    )}
  </section>;
}

function SalaryBaseEditor({ employee, month, csrf, onClose, onSaved }) {
  const [amount, setAmount] = useState(String(Number(employee.base_salary) || ""));
  const [effectiveMonth, setEffectiveMonth] = useState(month);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Potongan BPJS Ketenagakerjaan
  const [bpjsTkAuto, setBpjsTkAuto] = useState(employee.bpjs_tk_deduction_rate === null || employee.bpjs_tk_deduction_rate === undefined);
  const [bpjsTkCustom, setBpjsTkCustom] = useState(employee.bpjs_tk_deduction_rate ? String(employee.bpjs_tk_deduction_rate) : "");
  const [bpjsTkNumber, setBpjsTkNumber] = useState(employee.bpjs_tk_number || "");

  // Potongan BPJS Kesehatan
  const [bpjsKesAuto, setBpjsKesAuto] = useState(employee.bpjs_kes_deduction_rate === null || employee.bpjs_kes_deduction_rate === undefined);
  const [bpjsKesCustom, setBpjsKesCustom] = useState(employee.bpjs_kes_deduction_rate ? String(employee.bpjs_kes_deduction_rate) : "");
  const [bpjsKesNumber, setBpjsKesNumber] = useState(employee.bpjs_kes_number || "");

  // Potongan PPh 21 TER
  const [ptkpStatus, setPtkpStatus] = useState(employee.ptkp_status || employee.marital_status || "TK/0");
  const [npwpNumber, setNpwpNumber] = useState(employee.npwp || "");
  const [pph21Auto, setPph21Auto] = useState(employee.pph21_deduction_rate === null || employee.pph21_deduction_rate === undefined);
  const [pph21Custom, setPph21Custom] = useState(employee.pph21_deduction_rate ? String(employee.pph21_deduction_rate) : "");

  // Potongan Kasbon / Pinjaman Rutin
  const [kasbonAmount, setKasbonAmount] = useState(String(Number(employee.kasbon_deduction_rate || 0) || "0"));

  // Real-time calculations
  const baseNum = Math.max(0, Number(amount) || 0);
  const tkNat = calculateBpjsTk(baseNum);
  const kesNat = calculateBpjsKes(baseNum);
  const pphNat = calculatePph21Ter(baseNum, ptkpStatus);

  const effectiveTk = bpjsTkAuto ? tkNat.total : Math.max(0, Number(bpjsTkCustom) || 0);
  const effectiveKes = bpjsKesAuto ? kesNat.total : Math.max(0, Number(bpjsKesCustom) || 0);
  const effectivePph = pph21Auto ? pphNat.amount : Math.max(0, Number(pph21Custom) || 0);
  const effectiveKasbon = Math.max(0, Number(kasbonAmount) || 0);

  const totalDeductions = effectiveTk + effectiveKes + effectivePph + effectiveKasbon;
  const standardThp = Math.max(0, baseNum - totalDeductions);

  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const payload = {
        action: "set_base_salary",
        employee_id: employee.employee_id,
        revision: employee.revision,
        amount,
        effective_month: effectiveMonth,
        reason,
        bpjs_tk_deduction: bpjsTkAuto ? "" : bpjsTkCustom,
        bpjs_kes_deduction: bpjsKesAuto ? "" : bpjsKesCustom,
        pph21_deduction: pph21Auto ? "" : pph21Custom,
        kasbon_deduction: kasbonAmount,
        ptkp_status: ptkpStatus,
        bpjs_tk_number: bpjsTkNumber,
        bpjs_kes_number: bpjsKesNumber,
        npwp: npwpNumber,
      };
      const saved = await mutateSalary(payload, csrf);
      await onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.message || "Pengaturan gaji & potongan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="rab-modal-backdrop">
    <section className="rab-modal salary-base-modal" role="dialog" aria-modal="true" aria-labelledby="salary-base-title" style={{ maxWidth: "860px" }}>
      <div className="rab-modal-heading">
        <div>
          <p>{employee.employee_code} · {employee.position_name}</p>
          <h2 id="salary-base-title">Atur Gaji Pokok &amp; Potongan · {employee.employee_name}</h2>
        </div>
        <button disabled={busy} aria-label="Tutup pengaturan gaji" onClick={onClose}><X size={20} /></button>
      </div>

      <form onSubmit={save}>
        <div className="rab-form-body">
          <p className="salary-help">
            Atur gaji pokok dan seluruh potongan rutin (BPJS Ketenagakerjaan, BPJS Kesehatan, PPh 21, dan kasbon). Nilai ini menjadi master standar saat sistem menghitung gaji bulanan karyawan.
          </p>
          {error && <div className="rab-error" role="alert">{error}</div>}

          {/* SECTION 1: Gaji Pokok & Periode Berlaku */}
          <div className="salary-master-section">
            <h3 style={{ fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#1e293b" }}>
              <Wallet size={18} style={{ color: "#2563eb" }} /> 1. Gaji Pokok &amp; Periode Berlaku
            </h3>
            <div className="salary-base-fields">
              <label>
                <span>Gaji Pokok per Bulan (Rp) *</span>
                <input
                  aria-label="Nominal gaji pokok"
                  required
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="9999999999999.99"
                  step="0.01"
                  disabled={busy}
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="Contoh: 10000000"
                />
              </label>
              <label>
                <span>Bulan Absensi Mulai Berlaku *</span>
                <input
                  aria-label="Mulai berlaku gaji pokok"
                  required
                  type="month"
                  min="1900-01"
                  max="2299-12"
                  disabled={busy}
                  value={effectiveMonth}
                  onChange={event => setEffectiveMonth(event.target.value)}
                />
              </label>
            </div>
          </div>

          {/* SECTION 2: Pengaturan Potongan Standar Nasional */}
          <div className="salary-master-section" style={{ marginTop: "18px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#1e293b" }}>
              <ShieldCheck size={18} style={{ color: "#059669" }} /> 2. Pengaturan Potongan Standar Nasional (BPJS &amp; Pajak)
            </h3>

            {/* BPJS Ketenagakerjaan */}
            <div className="salary-subcard" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>BPJS Ketenagakerjaan (3%)</strong>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "#2563eb", fontWeight: 500 }}>
                  <input type="checkbox" checked={bpjsTkAuto} onChange={e => setBpjsTkAuto(e.target.checked)} disabled={busy} />
                  <span>Otomatis Standar Nasional 3% (JHT 2% + JP 1%)</span>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Nomor Kartu Peserta BPJS TK</span>
                  <input type="text" maxLength={50} value={bpjsTkNumber} onChange={e => setBpjsTkNumber(e.target.value)} placeholder="Contoh: 82739874093809" disabled={busy} />
                </label>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Potongan Pekerja per Bulan (Rp)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={bpjsTkAuto || busy}
                    value={bpjsTkAuto ? tkNat.total : bpjsTkCustom}
                    onChange={e => setBpjsTkCustom(e.target.value)}
                    style={bpjsTkAuto ? { background: "#f1f5f9", color: "#334155" } : {}}
                  />
                </label>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                Regulasi PP 44 &amp; 45 / 2015: Potongan pekerja 3% ({formatBudgetMoney(effectiveTk)}) · Ditanggung Perusahaan ({formatBudgetMoney(Math.round(baseNum * 0.037 + Math.min(baseNum, 10042300) * 0.02 + baseNum * 0.0054))}).
              </p>
            </div>

            {/* BPJS Kesehatan */}
            <div className="salary-subcard" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>BPJS Kesehatan (1%)</strong>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "#2563eb", fontWeight: 500 }}>
                  <input type="checkbox" checked={bpjsKesAuto} onChange={e => setBpjsKesAuto(e.target.checked)} disabled={busy} />
                  <span>Otomatis Standar Nasional 1% (Cap Upah Rp12.000.000)</span>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Nomor Kartu BPJS Kesehatan</span>
                  <input type="text" maxLength={50} value={bpjsKesNumber} onChange={e => setBpjsKesNumber(e.target.value)} placeholder="Contoh: 73814872364987198" disabled={busy} />
                </label>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Potongan Pekerja per Bulan (Rp)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={bpjsKesAuto || busy}
                    value={bpjsKesAuto ? kesNat.total : bpjsKesCustom}
                    onChange={e => setBpjsKesCustom(e.target.value)}
                    style={bpjsKesAuto ? { background: "#f1f5f9", color: "#334155" } : {}}
                  />
                </label>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                Regulasi Perpres 64/2020: Potongan pekerja 1% ({formatBudgetMoney(effectiveKes)}) · Ditanggung Perusahaan 4% ({formatBudgetMoney(Math.round(Math.min(baseNum, 12000000) * 0.04))}).
              </p>
            </div>

            {/* PPh 21 TER */}
            <div className="salary-subcard" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>PPh 21 (Pajak TER Bulanan)</strong>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "#2563eb", fontWeight: 500 }}>
                  <input type="checkbox" checked={pph21Auto} onChange={e => setPph21Auto(e.target.checked)} disabled={busy} />
                  <span>Otomatis Skema TER PP 58/2023 &amp; PMK 168/2023</span>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px" }}>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Status PTKP Karyawan *</span>
                  <select value={ptkpStatus} onChange={e => setPtkpStatus(e.target.value)} disabled={busy}>
                    {PTKP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Nomor NPWP Karyawan</span>
                  <input type="text" maxLength={50} value={npwpNumber} onChange={e => setNpwpNumber(e.target.value)} placeholder="Nomor NPWP 16 digit" disabled={busy} />
                </label>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Estimasi PPh 21 per Bulan (Rp)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={pph21Auto || busy}
                    value={pph21Auto ? pphNat.amount : pph21Custom}
                    onChange={e => setPph21Custom(e.target.value)}
                    style={pph21Auto ? { background: "#f1f5f9", color: "#334155" } : {}}
                  />
                </label>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                Kategori {pphNat.category} · Tarif TER Bulanan: <strong>{pphNat.ratePercent}</strong> · Pajak Bulanan: <strong>{formatBudgetMoney(effectivePph)}</strong>.
              </p>
            </div>

            {/* Kasbon / Pinjaman Rutin */}
            <div className="salary-subcard" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>Potongan Kasbon / Pinjaman Rutin Bulanan</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Nominal Angsuran Pinjaman per Bulan (Rp)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={kasbonAmount}
                    onChange={e => setKasbonAmount(e.target.value)}
                    placeholder="0 jika tidak ada pinjaman"
                    disabled={busy}
                  />
                </label>
                <div style={{ display: "flex", alignItems: "center", fontSize: "11px", color: "#64748b", paddingTop: "14px" }}>
                  Nominal ini otomatis memotong take home pay setiap bulan hingga pinjaman selesai.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Live Simulator Ringkasan Gaji & Potongan Standar */}
          <div className="salary-live-sim" style={{ marginTop: "18px", padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1px solid #bbf7d0" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
              <Calculator size={16} /> Ringkasan Standar Finansial (Master Take Home Pay)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "#4b5563", fontSize: "11px" }}>Gaji Pokok</span>
                <strong style={{ display: "block", color: "#1e293b", fontSize: "14px" }}>{formatBudgetMoney(baseNum)}</strong>
              </div>
              <div>
                <span style={{ color: "#4b5563", fontSize: "11px" }}>BPJS TK (3%)</span>
                <span style={{ display: "block", color: "#dc2626", fontWeight: 600 }}>-{formatBudgetMoney(effectiveTk)}</span>
              </div>
              <div>
                <span style={{ color: "#4b5563", fontSize: "11px" }}>BPJS Kesehatan (1%)</span>
                <span style={{ display: "block", color: "#dc2626", fontWeight: 600 }}>-{formatBudgetMoney(effectiveKes)}</span>
              </div>
              <div>
                <span style={{ color: "#4b5563", fontSize: "11px" }}>PPh 21 TER</span>
                <span style={{ display: "block", color: "#dc2626", fontWeight: 600 }}>-{formatBudgetMoney(effectivePph)}</span>
              </div>
              {effectiveKasbon > 0 && (
                <div>
                  <span style={{ color: "#4b5563", fontSize: "11px" }}>Kasbon Rutin</span>
                  <span style={{ display: "block", color: "#dc2626", fontWeight: 600 }}>-{formatBudgetMoney(effectiveKasbon)}</span>
                </div>
              )}
              <div style={{ borderLeft: "2px solid #86efac", paddingLeft: "10px" }}>
                <span style={{ color: "#15803d", fontWeight: 700, fontSize: "11px" }}>Estimasi THP Bersih</span>
                <strong style={{ display: "block", color: "#15803d", fontSize: "16px" }}>{formatBudgetMoney(standardThp)}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 4: Alasan Pengaturan & Riwayat */}
          <div style={{ marginTop: "18px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#475569" }}>
              <span style={{ fontWeight: 600 }}>Alasan Pengaturan / Perubahan Kompensasi &amp; Potongan *</span>
              <textarea
                aria-label="Alasan perubahan gaji"
                required
                maxLength={1000}
                rows={2}
                disabled={busy}
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Contoh: Pemutakhiran gaji pokok dan aktivasi potongan BPJS TK 3%, BPJS Kes 1%, dan PPh 21 TER 2026."
              />
            </label>
          </div>

          <h3 className="rab-history-title" style={{ marginTop: "20px" }}>
            <History size={16} /> Riwayat Pengaturan Gaji &amp; Potongan
          </h3>
          <ol className="rab-timeline">
            {employee.history.map(rate => (
              <li key={rate.id}>
                <span className="rab-timeline-dot" />
                <div>
                  <strong>{formatBudgetMoney(rate.amount)} · mulai {formatBudgetMonth(rate.effective_month)}</strong>
                  <p>{rate.actor_name} · {formatBudgetDate(rate.created_at)}</p>
                  <p className="rab-history-note">{rate.reason}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="salary-help" style={{ marginTop: "10px" }}>
            Nilai awal dari data karyawan/jabatan: {formatBudgetMoney(employee.baseline_salary)}. Digunakan sebelum pengaturan per bulan mulai berlaku.
          </p>
        </div>

        <div className="rab-modal-footer rab-detail-actions">
          <button type="button" className="rab-button" disabled={busy} onClick={onClose}>Batal</button>
          <button className="rab-button rab-button-primary" type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan Gaji Pokok & Potongan"}
          </button>
        </div>
      </form>
    </section>
  </div>;
}
