import { useState } from 'react'
import { api, inr, dmy, iso, Summary } from '../api'; import { useToast } from '../App'
const d=(y:number,m:number,day:number)=>new Date(y,m,day); const t=new Date()
const presets:Record<string,()=>[string,string]>={
 'Today':()=>[iso(t),iso(t)], 'Yesterday':()=>{const y=d(t.getFullYear(),t.getMonth(),t.getDate()-1);return[iso(y),iso(y)]},
 'Last 7 days':()=>[iso(d(t.getFullYear(),t.getMonth(),t.getDate()-6)),iso(t)], 'This month':()=>[iso(d(t.getFullYear(),t.getMonth(),1)),iso(t)],
 'Previous month':()=>[iso(d(t.getFullYear(),t.getMonth()-1,1)),iso(d(t.getFullYear(),t.getMonth(),0))],
 'This year':()=>[iso(d(t.getFullYear(),0,1)),iso(t)], 'All time':()=>['','']}
export default function Calculate(){
  const toast=useToast(); const [start,setStart]=useState(iso(d(t.getFullYear(),t.getMonth(),1))); const [end,setEnd]=useState(iso(t)); const [s,setS]=useState<Summary|null>(null); const [busy,setBusy]=useState(false)
  const run=async(a=start,b=end)=>{ if(a&&b&&a>b) return toast('Start date is after end date'); setBusy(true)
    try{ const p=new URLSearchParams(); if(a)p.set('start',a); if(b)p.set('end',b); setS(await api.get<Summary>('/summary?'+p)) }catch(e:any){toast(e.message)}finally{setBusy(false)} }
  const pick=(k:string)=>{const [a,b]=presets[k](); setStart(a); setEnd(b); run(a,b)}
  return <div className="space-y-5"><h1 className="text-2xl font-extrabold">Calculate total</h1>
    <div className="flex flex-wrap gap-2">{Object.keys(presets).map(k=><button key={k} className="btn-soft !py-1.5" onClick={()=>pick(k)}>{k}</button>)}</div>
    <div className="card grid gap-3 sm:grid-cols-3"><input type="date" className="input" value={start} onChange={e=>setStart(e.target.value)} aria-label="Start date"/><input type="date" className="input" value={end} onChange={e=>setEnd(e.target.value)} aria-label="End date"/><button className="btn" disabled={busy} onClick={()=>run()}>{busy?'Calculating…':'Calculate total'}</button></div>
    {s&&(s.entries===0?<div className="card text-sm text-navy/60">No purchases in this period.</div>:<>
      <div className="card bg-mint"><div className="text-sm">Grand total</div><div className="text-4xl font-extrabold">{inr(s.total)}</div><div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4"><span>{s.entries} entries</span><span>{s.milk_quantity} milk pouches</span><span>Avg {inr(s.average_daily)}/day</span><span>{s.highest_day&&`Peak ${dmy(s.highest_day.date)} · ${inr(s.highest_day.total)}`}</span></div></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-bold">By product</h2>{s.products.map(p=><div key={p.name} className="flex justify-between py-1 text-sm"><span>{p.name} × {p.quantity}</span><b>{inr(p.total)}</b></div>)}</div>
        <div className="card"><h2 className="mb-2 font-bold">By category</h2>{s.categories.map(c=><div key={c.name} className="flex justify-between py-1 text-sm"><span>{c.name}</span><b>{inr(c.total)}</b></div>)}</div></div>
      <div className="card"><h2 className="mb-2 font-bold">By day</h2>{s.daily.map(x=><div key={x.date} className="flex justify-between py-1 text-sm"><span>{dmy(x.date)}</span><b>{inr(x.total)}</b></div>)}</div></>)}</div>
}
