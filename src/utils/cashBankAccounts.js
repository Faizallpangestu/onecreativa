import axios from "axios";

/**
 * Normalisasi daftar rekening dari Cash & Bank (/api/accounting.php?view=lookups -> banks)
 * beserta fallback lokal bila belum ada data di API.
 */
export function buildCashBankOptions(lookupData = null) {
  const options = [];
  const seen = new Set();

  const rawBanks = lookupData?.banks || lookupData?.data?.banks || [];
  if (Array.isArray(rawBanks) && rawBanks.length > 0) {
    rawBanks
      .filter(b => Number(b.is_active) !== 0)
      .forEach(b => {
        const bankProvider = String(b.bank_name || "").replace(/^bank\s+/i, "").trim();
        const noRek = String(b.account_number || "").trim();
        const accName = String(b.name || bankProvider || "Rekening").trim();
        const balance = Number(b.balance || 0);
        const value = noRek && noRek !== "-" ? `${accName} (${noRek})` : accName;
        const balStr = `Rp ${balance.toLocaleString("id-ID")}`;
        const label = noRek && noRek !== "-"
          ? `${accName} (${noRek}) — Saldo: ${balStr}`
          : `${accName} — Saldo: ${balStr}`;
        const key = (noRek && noRek !== "-" ? noRek : accName).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            id: `bank-${b.id}`,
            bankAccountId: Number(b.id),
            accountId: Number(b.account_id || 0),
            code: b.code || "",
            name: accName,
            bankName: bankProvider || accName,
            accountNumber: noRek,
            balance,
            value,
            label,
          });
        }
      });
  }

  // Fallback jika tabel cash_bank_accounts belum terisi: ambil dari Master Rekening lokal
  if (options.length === 0) {
    try {
      const rawRek = localStorage.getItem("finance_rekening_data");
      const parsed = rawRek ? JSON.parse(rawRek) : [];
      if (Array.isArray(parsed)) {
        parsed
          .filter(r => !r.status || String(r.status).toLowerCase() === "aktif")
          .forEach((r, idx) => {
            const bankProvider = String(r.bank || "").replace(/^bank\s+/i, "").trim();
            const noRek = String(r.noRek || "").trim();
            const accName = String(r.nama || bankProvider || "Rekening").trim();
            const balance = Number(r.saldo || 0);
            const value = noRek && noRek !== "-" ? `${accName} (${noRek})` : accName;
            const balStr = `Rp ${balance.toLocaleString("id-ID")}`;
            const label = noRek && noRek !== "-"
              ? `${accName} (${noRek}) — Saldo: ${balStr}`
              : `${accName} — Saldo: ${balStr}`;
            const key = (noRek && noRek !== "-" ? noRek : accName).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              options.push({
                id: `local-${r.id || idx}`,
                bankAccountId: Number.isFinite(Number(r.id)) ? Number(r.id) : 0,
                accountId: 0,
                code: "",
                name: accName,
                bankName: bankProvider || accName,
                accountNumber: noRek,
                balance,
                value,
                label,
              });
            }
          });
      }
    } catch {
      // Ignore malformed localStorage cache
    }
  }

  // Fallback terakhir bila sistem benar-benar kosong
  if (options.length === 0) {
    options.push({
      id: "default-bca",
      bankAccountId: 0,
      accountId: 0,
      code: "1002",
      name: "CREATIVA BRIDGING INTERN",
      bankName: "BCA",
      accountNumber: "1832-918-428",
      balance: 0,
      value: "BCA (1832-918-428)",
      label: "CREATIVA BRIDGING INTERN (1832-918-428)",
    });
  }

  return options;
}

export async function fetchCashBankOptions() {
  try {
    const res = await axios.get("/api/accounting.php", {
      params: { view: "lookups", _t: Date.now() },
    });
    return buildCashBankOptions(res.data?.data || res.data);
  } catch {
    return buildCashBankOptions(null);
  }
}

export function findMatchingCashBankOption(options = [], rawValue = "", rawBankId = 0) {
  if (!Array.isArray(options) || options.length === 0) return null;
  const numId = Number(rawBankId || 0);
  if (numId > 0) {
    const byId = options.find(o => Number(o.bankAccountId) === numId);
    if (byId) return byId;
  }

  const target = String(rawValue || "").trim().toLowerCase();
  if (!target) return null;

  const exact = options.find(o => o.value.toLowerCase() === target || o.name.toLowerCase() === target);
  if (exact) return exact;

  const noMatch = target.match(/\b[\d-]{6,25}\b/);
  if (noMatch) {
    const cleanNo = noMatch[0].replace(/[^0-9]/g, "");
    const byNo = options.find(o => o.accountNumber && o.accountNumber.replace(/[^0-9]/g, "") === cleanNo);
    if (byNo) return byNo;
  }

  const partial = options.find(o =>
    target.includes(o.name.toLowerCase()) ||
    o.name.toLowerCase().includes(target) ||
    (o.bankName && target.includes(o.bankName.toLowerCase()))
  );
  return partial || null;
}

