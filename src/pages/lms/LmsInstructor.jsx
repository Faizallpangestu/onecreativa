import { useCallback,useEffect,useState } from 'react';
import ModuleFrame from '../../components/ModuleFrame';
import { moduleApi,moduleDate } from '../../utils/moduleApi';
export default function LmsInstructor(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{setLoading(true);setError('');try{setData(await moduleApi('relationships'));}catch(e){setError(e.message);}finally{setLoading(false);}},[]);useEffect(()=>{refresh();},[refresh]);
 return <ModuleFrame title="Instructor & Assignment" description="Pengajar dari assignment kelas yang diizinkan oleh server." error={error} loading={loading} refresh={refresh}><div className="grid gap-4 sm:grid-cols-2">{data?.assignments?.map(a=><article key={a.id} className="rounded-2xl border bg-white p-5"><h2 className="font-bold">{a.sensei_name}</h2><p>{a.class_name}</p><p className="text-sm text-slate-500">{moduleDate(a.starts_on)} ? {a.ends_on?moduleDate(a.ends_on):'Belum ditentukan'}</p><p className="text-sm">{Number(a.is_active)===1?'Assignment aktif':'Assignment nonaktif'}</p></article>)}</div>{!data?.assignments?.length&&<p>Belum ada assignment pengajar untuk cakupan ini.</p>}</ModuleFrame>;
}
