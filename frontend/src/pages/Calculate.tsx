import { useState } from 'react'
import { Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api, inr, dmy, iso, Summary, Purchase } from '../api'; import { useToast } from '../App'
const d=(y:number,m:number,day:number)=>new Date(y,m,day); const t=new Date()
const presets:Record<string,()=>[string,string]>={
 'Today':()=>[iso(t),iso(t)], 'Yesterday':()=>{const y=d(t.getFullYear(),t.getMonth(),t.getDate()-1);return[iso(y),iso(y)]},
 'Last 7 days':()=>[iso(d(t.getFullYear(),t.getMonth(),t.getDate()-6)),iso(t)], 'This month':()=>[iso(d(t.getFullYear(),t.getMonth(),1)),iso(t)],
 'Previous month':()=>[iso(d(t.getFullYear(),t.getMonth()-1,1)),iso(d(t.getFullYear(),t.getMonth(),0))],
 'This year':()=>[iso(d(t.getFullYear(),0,1)),iso(t)], 'All time':()=>['','']}
export default function Calculate(){
  const toast=useToast()
  const [start,setStart]=useState(iso(d(t.getFullYear(),t.getMonth(),1)))
  const [end,setEnd]=useState(iso(t))
  const [s,setS]=useState<Summary|null>(null)
  const [busy,setBusy]=useState(false)
  const [pdfBusy,setPdfBusy]=useState(false)
  const run=async(a=start,b=end)=>{
    if(a&&b&&a>b)return toast('Start date is after end date')
    setBusy(true)
    try{const p=new URLSearchParams();if(a)p.set('start',a);if(b)p.set('end',b);setS(await api.get<Summary>('/summary?'+p))}
    catch(e:any){toast(e.message)}finally{setBusy(false)}
  }
  const pick=(k:string)=>{const[a,b]=presets[k]();setStart(a);setEnd(b);run(a,b)}
  const downloadPdf=async()=>{
    if(!s)return
    setPdfBusy(true)
    try{
      const p=new URLSearchParams();if(start)p.set('start',start);if(end)p.set('end',end)
      const purchases=await api.get<Purchase[]>('/purchases?'+p)
      const doc=new jsPDF({unit:'mm',format:'a4'})
      const pageWidth=doc.internal.pageSize.getWidth()
      doc.setTextColor(190,151,73);doc.setFont('times','bold');doc.setFontSize(27);doc.text('Q',14,21)
      doc.setTextColor(25,45,76);doc.setFont('times','bold');doc.setFontSize(17);doc.text("QURESHI'S HOUSE",28,16)
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110,119,132);doc.text('HOUSEHOLD KHATA · ITEMIZED EXPENSE REPORT',28,22)
      doc.setDrawColor(205,177,112);doc.setLineWidth(.5);doc.line(14,28,pageWidth-14,28)
      doc.setTextColor(25,45,76);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Expense summary',14,38)
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(`Period: ${start?dmy(start):'All time'}${end?' to '+dmy(end):''}`,14,45)
      doc.text(`Generated: ${dmy(iso(new Date()))}`,14,51);doc.text(`Entries: ${s.entries}`,14,57)
      doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(`Grand total: Rs. ${s.total.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageWidth-14,45,{align:'right'})
      const rows=purchases.flatMap(p=>p.items.map(i=>[dmy(p.date),i.name,i.category||'-',`${i.quantity}`,`Rs. ${Number(i.unit_price).toFixed(2)}`,`Rs. ${Number(i.subtotal).toFixed(2)}`,p.note||'-']))
      autoTable(doc,{
        startY:64,head:[['Date','Product','Category','Qty','Unit price','Amount','Note']],body:rows,
        theme:'grid',styles:{font:'helvetica',fontSize:7,cellPadding:2.2,textColor:[40,48,60],lineColor:[225,225,225],lineWidth:.15},
        headStyles:{fillColor:[25,45,76],textColor:[255,255,255],fontStyle:'bold'},
        alternateRowStyles:{fillColor:[248,246,240]},
        columnStyles:{0:{cellWidth:19},1:{cellWidth:42},2:{cellWidth:23},3:{cellWidth:12},4:{cellWidth:25},5:{cellWidth:25},6:{cellWidth:'auto'}},
        didDrawPage:()=>{
          const page=doc.getNumberOfPages()
          doc.setFontSize(8);doc.setTextColor(125,130,140)
          doc.text("Qureshi's House · Household Khata",14,doc.internal.pageSize.getHeight()-8)
          doc.text(`Page ${page}`,pageWidth-14,doc.internal.pageSize.getHeight()-8,{align:'right'})
        }
      })
      const finalY=(doc as any).lastAutoTable?.finalY??70
      const pageHeight=doc.internal.pageSize.getHeight()
      if(finalY<pageHeight-22){
        doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(25,45,76)
        doc.text(`Total: Rs. ${s.total.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageWidth-14,finalY+10,{align:'right'})
      }else{
        doc.addPage();doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(25,45,76)
        doc.text(`Grand total: Rs. ${s.total.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`,14,22)
      }
      doc.save(`Qureshis-House-Khata-${start||'all-time'}-${end||'all-time'}.pdf`)
      toast('PDF downloaded')
    }catch(e:any){toast(e.message||'Could not generate PDF')}
    finally{setPdfBusy(false)}
  }
  return <div className="space-y-5"><h1 className="text-2xl font-extrabold">Calculate total</h1>
    <div className="flex flex-wrap gap-2">{Object.keys(presets).map(k=><button key={k} className="btn-soft !py-1.5" onClick={()=>pick(k)}>{k}</button>)}</div>
    <div className="card grid gap-3 sm:grid-cols-3"><input type="date" className="input" value={start} onChange={e=>setStart(e.target.value)} aria-label="Start date"/><input type="date" className="input" value={end} onChange={e=>setEnd(e.target.value)} aria-label="End date"/><button className="btn" disabled={busy} onClick={()=>run()}>{busy?'Calculating…':'Calculate total'}</button></div>
    {s&&(s.entries===0?<div className="card text-sm text-navy/60">No purchases in this period.</div>:<>
      <div className="card bg-mint"><div className="text-sm">Grand total</div><div className="text-4xl font-extrabold">{inr(s.total)}</div><div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4"><span>{s.entries} entries</span><span>{s.milk_quantity} milk pouches</span><span>Avg {inr(s.average_daily)}/day</span><span>{s.highest_day&&`Peak ${dmy(s.highest_day.date)} · ${inr(s.highest_day.total)}`}</span></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-navy">Detailed report</h2><button className="btn flex items-center gap-2" disabled={pdfBusy} onClick={downloadPdf}><Download size={17}/>{pdfBusy?'Preparing PDF…':'Download detailed PDF'}</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-bold">By product</h2>{s.products.map(p=><div key={p.name} className="flex justify-between py-1 text-sm"><span>{p.name} × {p.quantity}</span><b>{inr(p.total)}</b></div>)}</div>
        <div className="card"><h2 className="mb-2 font-bold">By category</h2>{s.categories.map(c=><div key={c.name} className="flex justify-between py-1 text-sm"><span>{c.name}</span><b>{inr(c.total)}</b></div>)}</div></div>
      <div className="card"><h2 className="mb-2 font-bold">By day</h2>{s.daily.map(x=><div key={x.date} className="flex justify-between py-1 text-sm"><span>{dmy(x.date)}</span><b>{inr(x.total)}</b></div>)}</div></>)}</div>
}
