import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { api, inr, Product } from '../api'; import { useToast } from '../App'
import ProductImage from '../components/ProductImage'
type Cat={id:number;name:string}; const blank={name:'',brand:'',category_id:'' as any,unit:'packet',price:'',active:true}
export default function Products(){
  const toast=useToast(); const [ps,setPs]=useState<Product[]>([]); const [cs,setCs]=useState<Cat[]>([]); const [f,setF]=useState<any>(blank); const [edit,setEdit]=useState<number|null>(null); const [cat,setCat]=useState('')
  const load=()=>{api.get<Product[]>('/products').then(setPs).catch(e=>toast(e.message)); api.get<Cat[]>('/categories').then(setCs)}
  useEffect(load,[])
  const save=async()=>{ if(!f.name.trim()||f.price===''||+f.price<0) return toast('Enter a name and a valid price')
    const body={...f,price:+f.price,category_id:f.category_id?+f.category_id:null}
    try{ edit?await api.put(`/products/${edit}`,body):await api.post('/products',body); toast(edit?'Product updated':'Product added'); setF(blank); setEdit(null); load() }catch(e:any){toast(e.message)} }
  const del=async(p:Product)=>{ if(!confirm(`Delete ${p.name}? Past purchases keep their recorded name and price.`)) return; await api.del(`/products/${p.id}`); toast('Product deleted'); load() }
  const addCat=async()=>{ if(!cat.trim()) return; try{await api.post('/categories',{name:cat}); setCat(''); toast('Category added'); load()}catch(e:any){toast(e.message)} }
  return <div className="space-y-5"><h1 className="text-2xl font-extrabold">Products</h1>
    <div className="card grid gap-3 sm:grid-cols-3"><input className="input" placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input className="input" placeholder="Brand" value={f.brand} onChange={e=>setF({...f,brand:e.target.value})}/>
      <select className="input" value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">Category</option>{cs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input className="input" placeholder="Unit (packet, litre…)" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/><input className="input" type="number" min="0" step="0.5" placeholder="Price ₹" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})}/>Active</label>
      <div className="flex gap-2 sm:col-span-3"><button className="btn" onClick={save}>{edit?'Save changes':'Add product'}</button>{edit&&<button className="btn-soft" onClick={()=>{setF(blank);setEdit(null)}}>Cancel</button>}</div></div>
    <div className="card">{ps.map(p=><div key={p.id} className={`flex items-center justify-between gap-3 border-t border-navy/10 py-2.5 first:border-0 ${p.active?'':'opacity-50'}`}><div className="flex min-w-0 items-center gap-3"><ProductImage name={p.name} className="h-14 w-14"/><div className="min-w-0"><div className="font-semibold">{p.name}</div><div className="text-xs text-navy/60">{[p.brand,p.category,p.unit].filter(Boolean).join(' · ')}</div></div></div>
      <div className="flex shrink-0 items-center gap-3"><b>{inr(p.price)}</b><button aria-label="Edit" onClick={()=>{setEdit(p.id);setF({...p,category_id:p.category_id??'',price:String(p.price)});scrollTo({top:0,behavior:'smooth'})}}><Pencil size={16}/></button><button aria-label="Delete" onClick={()=>del(p)}><Trash2 size={16}/></button></div></div>)}</div>
    <div className="card"><h2 className="mb-3 font-bold">Categories</h2><div className="mb-3 flex flex-wrap gap-2">{cs.map(c=><span key={c.id} className="rounded-full bg-mint px-3 py-1 text-sm">{c.name}</span>)}</div><div className="flex gap-2"><input className="input" placeholder="New category" value={cat} onChange={e=>setCat(e.target.value)}/><button className="btn" onClick={addCat}>Add</button></div></div></div>
}
