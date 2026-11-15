export type Product = { id:number; name:string; brand:string; category_id:number|null; category:string; unit:string; price:number; active:boolean; image_data?:string|null }
export type Item = { id:number; product_id?:number|null; name:string; category:string; quantity:number; unit_price:number; subtotal:number }
export type Purchase = { id:number; date:string; note:string; total:number; items:Item[] }
export type Summary = { total:number; entries:number; milk_quantity:number; days:number; average_daily:number; highest_day:{date:string;total:number}|null;
  products:{name:string;quantity:number;total:number}[]; categories:{name:string;total:number}[]; daily:{date:string;total:number}[] }
async function call<T>(path:string, method='GET', body?:unknown): Promise<T> {
  const res = await fetch('/api'+path, { method, headers:{'Content-Type':'application/json'}, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(typeof e.detail==='string' ? e.detail : 'Something went wrong. Check the values and try again.') }
  return res.json()
}
export const api = {
  get:<T,>(p:string)=>call<T>(p), post:<T,>(p:string,b:unknown)=>call<T>(p,'POST',b),
  put:<T,>(p:string,b:unknown)=>call<T>(p,'PUT',b), del:<T,>(p:string)=>call<T>(p,'DELETE'),
}
export const inr = (n:number)=> '₹'+n.toLocaleString('en-IN',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})
export const iso = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
export const dmy = (s:string)=> s.split('-').reverse().join('/')
