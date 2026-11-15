import { useState, createContext, useContext, useCallback, useEffect } from 'react'
import { LayoutDashboard, PlusCircle, Package, History, Calculator, Bell, CheckCircle2 } from 'lucide-react'
import Dashboard from './pages/Dashboard'; import QuickAdd from './pages/QuickAdd'; import Products from './pages/Products'
import HistoryPage from './pages/History'; import Calculate from './pages/Calculate'
import BrandMark from './components/BrandMark'; import BrandLoader from './components/BrandLoader'

const Toast = createContext<(m:string)=>void>(()=>{})
export const useToast = ()=>useContext(Toast)
const tabs = [['dash','Dashboard',LayoutDashboard],['add','Add purchase',PlusCircle],['hist','History',History],['calc','Calculate total',Calculator],['prod','Products',Package]] as const

function urlBase64ToUint8Array(base64String:string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)))
}

export default function App(){
  const [tab,setTab]=useState<string>('dash')
  const [msg,setMsg]=useState('')
  const [v,setV]=useState(0)
  const [showIntro,setShowIntro]=useState(()=>!sessionStorage.getItem('qhouse-intro-seen'))
  const [pushEnabled,setPushEnabled]=useState(false)
  const [pushBusy,setPushBusy]=useState(false)

  useEffect(()=>{
    if(!showIntro) return
    const timer=window.setTimeout(()=>{
      sessionStorage.setItem('qhouse-intro-seen','1')
      setShowIntro(false)
    },1450)
    return ()=>window.clearTimeout(timer)
  },[showIntro])

  useEffect(()=>{
    if(!('serviceWorker' in navigator) || !('PushManager' in window)) return
    navigator.serviceWorker.register('/sw.js').then(async registration=>{
      const subscription=await registration.pushManager.getSubscription()
      if(subscription) setPushEnabled(true)
    }).catch(()=>{})
  },[])

  const toast=useCallback((m:string)=>{
    setMsg(m)
    setTimeout(()=>setMsg(''),3000)
  },[])
  const go=(t:string)=>{setTab(t);setV(x=>x+1)}

  const enableDailyReminder=async()=>{
    if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)){
      toast('Is browser mein push notifications supported nahi hain.')
      return
    }
    setPushBusy(true)
    try{
      const permission=await Notification.requestPermission()
      if(permission!=='granted'){
        toast(permission==='denied'?'Chrome settings mein notifications allow karein.':'Notification permission allow karein.')
        return
      }
      const registration=await navigator.serviceWorker.register('/sw.js')
      const keyResponse=await fetch('/api/push/public-key')
      if(!keyResponse.ok) throw new Error('Push service abhi configured nahi hai. Thodi der baad try karein.')
      const {publicKey}=await keyResponse.json()
      const existing=await registration.pushManager.getSubscription()
      const subscription=existing || await registration.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(publicKey) as BufferSource
      })
      const saved=await fetch('/api/push/subscribe',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(subscription)
      })
      if(!saved.ok) throw new Error('Device register nahi hua. Please retry karein.')
      setPushEnabled(true)
      toast('Daily 11 PM reminder is enabled on this device! ❤️')
    }catch(error){
      toast(error instanceof Error?error.message:'Reminder enable nahi ho paya.')
    }finally{
      setPushBusy(false)
    }
  }

  return <Toast.Provider value={toast}>
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 p-5 border-r border-navy/10">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={42} tone="navy"/>
          <div><div className="text-base font-extrabold tracking-tight">Qureshi's House</div><div className="text-[10px] text-navy/60">Our Home. Our Essentials.</div></div>
        </div>
        {tabs.map(([k,l,I])=><button key={k} onClick={()=>go(k)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${tab===k?'bg-navy text-white':'hover:bg-sky/50'}`}><I size={18}/>{l}</button>)}
      </aside>
      <main className="flex-1 p-4 pb-24 md:p-8 max-w-5xl w-full mx-auto" key={v}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            {pushEnabled?<CheckCircle2 size={20} className="text-emerald-600"/>:<Bell size={20} className="text-navy"/>}
            <div>
              <div className="text-sm font-bold">{pushEnabled?'Daily reminder enabled':'Daily 11 PM reminder'}</div>
              <div className="text-xs text-navy/60">{pushEnabled?'This device is subscribed':'Get a reminder to update today’s purchases'}</div>
            </div>
          </div>
          {!pushEnabled&&<button onClick={enableDailyReminder} disabled={pushBusy} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pushBusy?'Enabling…':'Enable reminder'}</button>}
        </div>
        {tab==='dash'&&<Dashboard go={go}/>}
        {tab==='add'&&<QuickAdd done={()=>go('dash')}/>}
        {tab==='hist'&&<HistoryPage/>}
        {tab==='calc'&&<Calculate/>}
        {tab==='prod'&&<Products/>}
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex justify-around items-center bg-white border-t border-navy/10 py-2">
        {(['dash','hist','add','calc','prod'] as const).map(k=>{
          const [key,label,I]=tabs.find(([itemKey])=>itemKey===k)!
          const isAdd=key==='add'
          return <button key={key} aria-label={label} onClick={()=>go(key)} className={isAdd?'h-14 w-14 flex items-center justify-center rounded-2xl bg-navy text-white shadow-md active:scale-95 transition':`p-2.5 rounded-xl transition ${tab===key?'bg-navy text-white':''}`}>
            <I size={isAdd?30:20} strokeWidth={isAdd?2.4:2}/>
          </button>
        })}
      </nav>
      {msg&&<div role="status" className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-navy px-4 py-2.5 text-sm text-white shadow-lg">{msg}</div>}
      {showIntro&&<BrandLoader/>}
    </div>
  </Toast.Provider>
}
