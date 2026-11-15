import { useState, createContext, useContext, useCallback } from 'react'
import { LayoutDashboard, PlusCircle, Package, History, Calculator } from 'lucide-react'
import Dashboard from './pages/Dashboard'; import QuickAdd from './pages/QuickAdd'; import Products from './pages/Products'
import HistoryPage from './pages/History'; import Calculate from './pages/Calculate'
const Toast = createContext<(m:string)=>void>(()=>{}); export const useToast = ()=>useContext(Toast)
const tabs = [['dash','Dashboard',LayoutDashboard],['add','Add purchase',PlusCircle],['hist','History',History],['calc','Calculate total',Calculator],['prod','Products',Package]] as const
export default function App(){
  const [tab,setTab]=useState<string>('dash'); const [msg,setMsg]=useState(''); const [v,setV]=useState(0)
  const toast=useCallback((m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2600)},[])
  const go=(t:string)=>{setTab(t);setV(x=>x+1)}
  return <Toast.Provider value={toast}>
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 p-5 border-r border-navy/10">
        <div className="mb-6"><div className="text-xl font-extrabold tracking-tight">Daily Khata</div><div className="text-xs text-navy/60">Your Daily Purchases. One Smart Khata.</div></div>
        {tabs.map(([k,l,I])=><button key={k} onClick={()=>go(k)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${tab===k?'bg-navy text-white':'hover:bg-sky/50'}`}><I size={18}/>{l}</button>)}
      </aside>
      <main className="flex-1 p-4 pb-24 md:p-8 max-w-5xl w-full mx-auto" key={v}>
        {tab==='dash'&&<Dashboard go={go}/>}{tab==='add'&&<QuickAdd done={()=>go('dash')}/>}{tab==='hist'&&<HistoryPage/>}{tab==='calc'&&<Calculate/>}{tab==='prod'&&<Products/>}
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex justify-around bg-white border-t border-navy/10 py-2">
        {tabs.map(([k,l,I])=><button key={k} aria-label={l} onClick={()=>go(k)} className={`p-2.5 rounded-xl ${tab===k?'bg-navy text-white':''}`}><I size={20}/></button>)}
      </nav>
      {msg&&<div role="status" className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-navy px-4 py-2.5 text-sm text-white shadow-lg">{msg}</div>}
    </div></Toast.Provider>
}
