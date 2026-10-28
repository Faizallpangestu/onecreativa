import axios from 'axios';
export async function moduleApi(endpoint, method = 'get', body) {
  try {
    const [name,query] = endpoint.split('?');
    const response = await axios({url:`/api/${name}.php${query?`?${query}`:''}`, method, data:body});
    if (response.data?.status !== 'success' || response.data.data === undefined) throw new Error(response.data?.message || 'Respons server tidak valid.');
    return response.data.data;
  } catch (error) {
    const id = error.response?.data?.request_id || error.response?.headers?.['x-request-id'];
    throw new Error(`${error.response?.data?.message || error.message || 'Data gagal dimuat.'}${id ? ` (ID: ${id})` : ''}`);
  }
}
export async function currentActor() {
  const {data} = await axios.get('/api/session.php');
  if(data?.status !== 'success' || !data.actor)throw new Error(data?.message || 'Sesi tidak valid.');
  return data.actor;
}
export const moduleDate = value => {
  if (!value) return '—';
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  const date = new Date(`${text.slice(0,10)}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat('id-ID', {dateStyle:'medium', timeZone:'Asia/Jakarta'}).format(date);
};
export const money = value => {
  if(value === null || value === undefined)return '—';
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if(!match)return '—';
  return `${match[1]}Rp ${new Intl.NumberFormat('id-ID').format(BigInt(match[2]))},${(match[3]||'').padEnd(2,'0')}`;
};
