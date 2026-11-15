import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api, inr, dmy, Summary, Purchase } from '../api'
import BrandLoader from '../components/BrandLoader'
type D = { today_total:number; month:Summary; last7:{date:string;total:number}[]; recent:Purchase[] }
const COLORS=['#172B4D','#B9DCEB','#B9DCC8','#7aa5c4','#8fc4a8']
export default function Dashboard({go}:{go:(t:string)=>void}){
  const [d,setD]=useState<D|null>(null); const [err,setErr]=useState('')
  useEffect(()=>{api.get<D>('/dashboard').then(setD).catch(e=>setErr(e.message))},[])
  if(err) return <p className="card text-red-700">Can’t reach the server. {err}</p>
  if(!d) return <BrandLoader compact/>
  const stats=[['Today',inr(d.today_total)],['This month',inr(d.month.total)],['Milk this month',`${d.month.milk_quantity} pouches`],['Entries this month',String(d.month.entries)]]
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Welcome to Qureshi's House</h1>
      <div className="flex gap-2"><button className="btn" onClick={()=>go('add')}>Add purchase</button><button className="btn-soft" onClick={()=>go('calc')}>Calculate total</button></div></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([l,v],i)=><div key={l} className={`card ${i===0?'bg-mint':''}`}><div className="text-xs text-navy/60">{l}</div><div className="mt-1 text-xl font-extrabold">{v}</div></div>)}</div>
    <div className="grid gap-4 md:grid-cols-5">
      <div className="card md:col-span-3"><h2 className="mb-3 font-bold">Last 7 days</h2><div className="h-52"><ResponsiveContainer><BarChart data={d.last7.map(x=>({...x,date:dmy(x.date).slice(0,5)}))}><XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12}/><Tooltip formatter={(v:number)=>inr(v)}/><Bar dataKey="total" fill="#172B4D" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div className="card md:col-span-2"><h2 className="mb-3 font-bold">By category</h2>{d.month.categories.length?<div className="h-52"><ResponsiveContainer><PieChart><Pie data={d.month.categories} dataKey="total" nameKey="name" innerRadius={40} outerRadius={75}>{d.month.categories.map((_,i)=><Cell key={i} fill={COLORS[i%5]}/>)}</Pie><Tooltip formatter={(v:number)=>inr(v)}/></PieChart></ResponsiveContainer></div>:<p className="text-sm text-navy/60">No purchases this month yet.</p>}</div>
    </div>
    <div className="card"><h2 className="mb-3 font-bold">Recent purchases</h2>{d.recent.length?d.recent.map(p=><div key={p.id} className="flex justify-between border-t border-navy/10 py-2 text-sm first:border-0"><span>{dmy(p.date)} · {p.items.map(i=>`${i.quantity}× ${i.name}`).join(', ')}</span><b>{inr(p.total)}</b></div>):<p className="text-sm text-navy/60">Nothing recorded yet. Add your first purchase.</p>}</div>
  </div>
}
