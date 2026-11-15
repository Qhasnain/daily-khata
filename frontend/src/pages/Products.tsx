import { useEffect, useState } from 'react'
import { Pencil, Trash2, ImagePlus, X } from 'lucide-react'
import { api, inr, Product } from '../api'; import { useToast } from '../App'
import ProductImage from '../components/ProductImage'
type Cat={id:number;name:string}
const blank={name:'',brand:'',category_id:'' as any,unit:'packet',price:'',active:true,image_data:null as string|null}

async function compressProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 520 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process this image')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.78)
}

export default function Products(){
  const toast=useToast()
  const [ps,setPs]=useState<Product[]>([])
  const [cs,setCs]=useState<Cat[]>([])
  const [f,setF]=useState<any>(blank)
  const [edit,setEdit]=useState<number|null>(null)
  const [cat,setCat]=useState('')
  const [imageBusy,setImageBusy]=useState(false)
  const load=()=>{api.get<Product[]>('/products').then(setPs).catch(e=>toast(e.message)); api.get<Cat[]>('/categories').then(setCs).catch(e=>toast(e.message))}
  useEffect(load,[])
  const chooseImage=async(file?:File)=>{
    if(!file)return
    setImageBusy(true)
    try{const image_data=await compressProductImage(file);setF((old:any)=>({...old,image_data}));toast('Product image added')}
    catch(e:any){toast(e.message||'Could not load image')}
    finally{setImageBusy(false)}
  }
  const save=async()=>{
    if(!f.name.trim()||f.price===''||+f.price<0) return toast('Enter a name and a valid price')
    const body={...f,price:+f.price,category_id:f.category_id?+f.category_id:null}
    try{edit?await api.put(`/products/${edit}`,body):await api.post('/products',body);toast(edit?'Product updated':'Product added');setF(blank);setEdit(null);load()}
    catch(e:any){toast(e.message)}
  }
  const del=async(p:Product)=>{if(!confirm(`Delete ${p.name}? Past purchases keep their recorded name and price.`))return;await api.del(`/products/${p.id}`);toast('Product deleted');load()}
  const addCat=async()=>{if(!cat.trim())return;try{await api.post('/categories',{name:cat});setCat('');toast('Category added');load()}catch(e:any){toast(e.message)}}
  return <div className="space-y-5"><h1 className="text-2xl font-extrabold">Products</h1>
    <div className="card grid gap-3 sm:grid-cols-3">
      <input className="input" placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
      <input className="input" placeholder="Brand" value={f.brand} onChange={e=>setF({...f,brand:e.target.value})}/>
      <select className="input" value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">Category</option>{cs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input className="input" placeholder="Unit (packet, litre…)" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/>
      <input className="input" type="number" min="0" step="0.5" placeholder="Price ₹" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})}/>Active</label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <div className="flex items-center gap-3">
          <ProductImage name={f.name||'Product preview'} imageData={f.image_data} className="h-16 w-16"/>
          <div className="flex flex-col gap-1">
            <label className="btn-soft inline-flex cursor-pointer items-center gap-2 !py-2">
              <ImagePlus size={16}/>{imageBusy?'Processing image…':f.image_data?'Change image':'Add product image'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={imageBusy} onChange={e=>{void chooseImage(e.target.files?.[0]);e.currentTarget.value=''}}/>
            </label>
            {f.image_data&&<button type="button" className="flex items-center gap-1 text-xs text-red-700" onClick={()=>setF({...f,image_data:null})}><X size={13}/>Remove image</button>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:col-span-3"><button className="btn" disabled={imageBusy} onClick={save}>{edit?'Save changes':'Add product'}</button>{edit&&<button className="btn-soft" onClick={()=>{setF(blank);setEdit(null)}}>Cancel</button>}</div>
    </div>
    <div className="card">{ps.map(p=><div key={p.id} className={`flex items-center justify-between gap-3 border-t border-navy/10 py-2.5 first:border-0 ${p.active?'':'opacity-50'}`}>
      <div className="flex min-w-0 items-center gap-3"><ProductImage name={p.name} imageData={p.image_data} className="h-14 w-14"/><div className="min-w-0"><div className="font-semibold">{p.name}</div><div className="text-xs text-navy/60">{[p.brand,p.category,p.unit].filter(Boolean).join(' · ')}</div></div></div>
      <div className="flex shrink-0 items-center gap-3"><b>{inr(p.price)}</b><button aria-label="Edit" onClick={()=>{setEdit(p.id);setF({...p,category_id:p.category_id??'',price:String(p.price),image_data:p.image_data??null});scrollTo({top:0,behavior:'smooth'})}}><Pencil size={16}/></button><button aria-label="Delete" onClick={()=>del(p)}><Trash2 size={16}/></button></div>
    </div>)}</div>
    <div className="card"><h2 className="mb-3 font-bold">Categories</h2><div className="mb-3 flex flex-wrap gap-2">{cs.map(c=><span key={c.id} className="rounded-full bg-mint px-3 py-1 text-sm">{c.name}</span>)}</div><div className="flex gap-2"><input className="input" placeholder="New category" value={cat} onChange={e=>setCat(e.target.value)}/><button className="btn" onClick={addCat}>Add</button></div></div>
  </div>
}
