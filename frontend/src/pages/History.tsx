import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api, inr, dmy, Purchase } from '../api'; import { useToast } from '../App'
export default function HistoryPage(){
  const toast=useToast(); const [rows,setRows]=useState<Purchase[]|null>(null); const [start,setStart]=useState(''); const [end,setEnd]=useState(''); const [product,setProduct]=useState('')
  const load=()=>{const p=new URLSearchParams(); if(start)p.set('start',start); if(end)p.set('end',end); if(product)p.set('product',product); api.get<Purchase[]>('/purchases?'+p).then(setRows).catch(e=>toast(e.message))}
  useEffect(load,[start,end,product])
  const del=async(id:number)=>{ if(!confirm('Delete this purchase? This cannot be undone.')) return; await api.del(`/purchases/${id}`); toast('Purchase deleted'); load() }
  return <div className="space-y-4"><h1 className="text-2xl font-extrabold">Purchase history</h1>
    <div className="grid gap-3 sm:grid-cols-3"><input type="date" className="input" value={start} onChange={e=>setStart(e.target.value)} aria-label="From"/><input type="date" className="input" value={end} onChange={e=>setEnd(e.target.value)} aria-label="To"/><input className="input" placeholder="Search product" value={product} onChange={e=>setProduct(e.target.value)}/></div>
    {!rows?<p className="text-navy/60">Loading…</p>:!rows.length?<div className="card text-sm text-navy/60">No purchases match these filters.</div>:rows.map(p=><div key={p.id} className="card"><div className="flex items-center justify-between"><b>{dmy(p.date)}</b><div className="flex items-center gap-3"><b>{inr(p.total)}</b><button aria-label="Delete purchase" onClick={()=>del(p.id)}><Trash2 size={16}/></button></div></div>
      <div className="mt-2 text-sm text-navy/80">{p.items.map(i=><div key={i.id} className="flex justify-between"><span>{i.name} · {i.quantity} × {inr(i.unit_price)}</span><span>{inr(i.subtotal)}</span></div>)}{p.note&&<div className="mt-1 text-xs text-navy/60">{p.note}</div>}</div></div>)}</div>
}
