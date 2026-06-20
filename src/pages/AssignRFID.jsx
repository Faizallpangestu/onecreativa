import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const EMPLOYEES_API_URL =
  "/api/employees.php";

function normalizeEmployeesResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export default function AssignRFID() {
  const rfidInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    rfid_uid: "",
  });

  const loadEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API_URL);
      setEmployees(normalizeEmployeesResponse(res.data));
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetch employees:", error);
      setEmployees([]);
      setErrorMessage("Data employee gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (form.employee_id) {
      rfidInputRef.current?.focus();
    }
  }, [form.employee_id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.employee_id || !form.rfid_uid) {
      setErrorMessage("Employee dan RFID UID wajib diisi.");
      setSuccessMessage("");
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => String(employee.id) === form.employee_id
    );

    if (!selectedEmployee) {
      setErrorMessage("Employee tidak ditemukan.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.put(EMPLOYEES_API_URL, {
        ...selectedEmployee,
        rfid_uid: form.rfid_uid.trim(),
      });

      setSuccessMessage(
        `RFID ${form.rfid_uid.trim()} berhasil di-assign ke ${selectedEmployee.name}.`
      );
      setErrorMessage("");
      setForm({
        employee_id: String(selectedEmployee.id),
        rfid_uid: "",
      });
      await loadEmployees();
      rfidInputRef.current?.focus();
    } catch (error) {
      console.error("Error assign RFID:", error);
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message ?? "RFID gagal di-assign."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRfidKeyDown = async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    await handleSubmit(event);
  };

  const filteredEmployees = employees.filter((employee) => {
    const keyword = searchQuery.toLowerCase();
    const searchableText = [employee.nik, employee.name, employee.rfid_uid]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });

  const selectedEmployee = employees.find(
    (employee) => String(employee.id) === form.employee_id
  );
  const assignedCount = employees.filter((employee) => employee.rfid_uid).length;
  const unassignedCount = employees.length - assignedCount;



  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

            <header className="mb-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.26em] text-blue-600">
                RFID
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Assign RFID
              </h1>
            </header>

            <section className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Assigned
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {assignedCount}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Employee yang sudah punya UID RFID.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Waiting Assignment
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {unassignedCount}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Employee yang belum dipasangkan kartu RFID.
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-3xl bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Mode Scan Reader
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pilih employee, lalu tempel kartu RFID ke reader. UID akan
                  masuk ke kolom RFID dan biasanya otomatis submit saat reader
                  mengirim tombol Enter.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 sm:grid-cols-[1.4fr_1fr] md:grid-cols-[1.4fr_1fr_auto]"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Employee
                  </span>
                  <select
                    value={form.employee_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_id: e.target.value,
                        rfid_uid: "",
                      })
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    <option value="">Pilih employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.nik} - {employee.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    RFID UID
                  </span>
                  <input
                    ref={rfidInputRef}
                    type="text"
                    value={form.rfid_uid}
                    onChange={(e) =>
                      setForm({ ...form, rfid_uid: e.target.value })
                    }
                    onKeyDown={handleRfidKeyDown}
                    placeholder="Tempel kartu RFID di reader"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                </label>

                <div className="flex items-end sm:col-span-2 md:col-span-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>

              {errorMessage ? (
                <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>
              ) : null}

              {successMessage ? (
                <p className="mt-4 text-sm text-emerald-600">
                  {successMessage}
                </p>
              ) : null}

              {selectedEmployee ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Employee terpilih:
                  <span className="ml-2 font-semibold text-slate-900">
                    {selectedEmployee.nik} - {selectedEmployee.name}
                  </span>
                  <span className="ml-2 text-slate-500">
                    {selectedEmployee.rfid_uid
                      ? `(UID saat ini: ${selectedEmployee.rfid_uid})`
                      : "(Belum ada UID terdaftar)"}
                  </span>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Employee RFID Directory
                  </h2>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                      <path
                        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 sm:w-72"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="px-5 py-8 text-sm text-slate-500 sm:px-6">
                  Memuat data employee...
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      <th className="px-4 py-4 sm:px-6">NIK</th>
                      <th className="px-4 py-4 sm:px-6">Nama</th>
                      <th className="hidden md:table-cell px-4 py-4 sm:px-6">RFID UID</th>
                      <th className="px-4 py-4 sm:px-6">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!isLoading && filteredEmployees.length === 0 ? (
                      <tr>
                        <td
                          className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6"
                          colSpan="4"
                        >
                          Belum ada data employee.
                        </td>
                      </tr>
                    ) : null}

                    {filteredEmployees.map((employee) => {
                      const hasRfid = Boolean(employee.rfid_uid);
                      const isSelected =
                        String(employee.id) === form.employee_id;

                      return (
                        <tr
                          key={employee.id}
                          className={`border-t border-slate-100 text-sm text-slate-700 transition ${
                            isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                          }`}
                          onClick={() =>
                            setForm({
                              ...form,
                              employee_id: String(employee.id),
                              rfid_uid: "",
                            })
                          }
                        >
                          <td className="px-4 py-4 font-mono text-[13px] sm:px-6">
                            {employee.nik}
                          </td>
                          <td className="px-4 py-4 sm:px-6">
                            <p className="font-semibold text-slate-900">
                              {employee.name}
                            </p>
                          </td>
                          <td className="hidden md:table-cell px-4 py-4 font-mono text-[13px] sm:px-6">
                            {employee.rfid_uid || "-"}
                          </td>
                          <td className="px-4 py-4 sm:px-6">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                hasRfid
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {hasRfid ? "Assigned" : "Not assigned"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
      </div>
    </Layout>
  );
}
