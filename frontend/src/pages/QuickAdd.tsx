import { useEffect, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { api, inr, iso, Product } from '../api'; import { useToast } from '../App'
import ProductImage from '../components/ProductImage'
import BrandLoader from '../components/BrandLoader'
export default function QuickAdd({done}:{done:()=>void}){
  const toast=useToast(); const [ps,setPs]=useState<Product[]>([]); const [q,setQ]=useState<Record<number,number>>({})
  const [date,setDate]=useState(iso(new Date())); const [note,setNote]=useState(''); const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true)
  useEffect(()=>{api.get<Product[]>('/products').then(x=>setPs(x.filter(p=>p.active))).catch(e=>toast(e.message)).finally(()=>setLoading(false))},[])
  const set=(id:number,d:number)=>setQ(s=>({...s,[id]:Math.max(0,(s[id]||0)+d)}))
  const lines=ps.filter(p=>q[p.id]>0); const total=lines.reduce((a,p)=>a+p.price*q[p.id],0)
  const save=async()=>{ if(!lines.length) return toast('Pick at least one product'); setBusy(true)
    try{ await api.post('/purchases',{date,note,items:lines.map(p=>({product_id:p.id,quantity:q[p.id]}))}); toast('Purchase saved'); done() }
    catch(e:any){ toast(e.message) } finally{ setBusy(false) } }
  if(loading) return <BrandLoader compact/>
  return <div className="space-y-5"><h1 className="text-2xl font-extrabold">Add purchase</h1>
    <div className="grid gap-3 md:grid-cols-2"><input type="date" className="input" value={date} max="9999-12-31" onChange={e=>setDate(e.target.value)}/><input className="input" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{ps.map(p=><div key={p.id} className={`card flex items-center justify-between gap-3 transition ${q[p.id]>0?'ring-2 ring-navy':''}`}>
      <div className="flex min-w-0 items-center gap-3"><ProductImage name={p.name} imageData={p.image_data} className="h-20 w-20"/><div className="min-w-0"><div className="font-semibold">{p.name}</div><div className="text-xs text-navy/60">{p.brand&&`${p.brand} · `}{inr(p.price)} / {p.unit}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-navy/45">{p.category}</div></div></div>
      <div className="flex shrink-0 items-center gap-2"><button aria-label={`Remove ${p.name}`} className="btn-soft !p-2" onClick={()=>set(p.id,-1)}><Minus size={16}/></button><span className="w-6 text-center font-bold">{q[p.id]||0}</span><button aria-label={`Add ${p.name}`} className="btn !p-2" onClick={()=>set(p.id,1)}><Plus size={16}/></button></div></div>)}</div>
    {!ps.length&&<p className="text-sm text-navy/60">No active products. Add some under Products.</p>}
    <div className="card sticky bottom-20 md:bottom-4 flex items-center justify-between"><div><div className="text-xs text-navy/60">{lines.map(p=>`${q[p.id]}×${p.price}`).join(' + ')||'Nothing selected'}</div><div className="text-2xl font-extrabold">{inr(total)}</div></div><button className="btn" disabled={busy||!lines.length} onClick={save}>{busy?'Saving…':'Save purchase'}</button></div></div>
}
