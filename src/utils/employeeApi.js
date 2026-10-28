export function employeeData(payload) {
  if (payload?.status !== 'success' || !Array.isArray(payload.data)) throw new Error(payload?.message || 'Respons employee tidak valid.');
  return payload.data;
}
export function employeeError(error, fallback) {
  const text = error?.response?.data?.message || error?.message || fallback;
  const id = error?.response?.data?.request_id || error?.response?.headers?.['x-request-id'];
  return `${text}${id ? ` (ID permintaan: ${id})` : ''}`;
}
export function employeeForm(employee = {}) {
  const active = employee.is_active != null ? Number(employee.is_active) : 1;
  return { 
    id: employee.id ?? null, 
    nik: employee.nik ?? '', 
    name: employee.name ?? '', 
    email: employee.email ?? '', 
    password: '', 
    role_name: employee.role_name ?? 'karyawan', 
    phone: employee.phone ?? '', 
    department_id: employee.department_id ?? '', 
    position_name: employee.position_name ?? '', 
    gender: employee.gender ?? 'Laki-laki', 
    join_date: employee.join_date ?? '', 
    birth_date: employee.birth_date ?? '', 
    base_salary: employee.base_salary ?? '0', 
    work_type: employee.work_type ?? 'WFO', 
    is_active: active, 
    manager_employee_id: employee.manager_employee_id ?? ''
  };
}
