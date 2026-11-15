import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'

const PRODUCT_IMAGES: Array<{ match: (name: string) => boolean; src: string }> = [
  { match: name => name.includes('amul gold'), src: 'https://budgetbee.net/cdn/shop/files/01_23e63370-d0e7-4d2c-8b54-1970b384ac0b.jpg?v=1748849911&width=600' },
  { match: name => name.includes('amul masti dahi') && (name.includes('₹10') || name.includes('10')), src: 'https://www.mystore.in/s/62ea2c599d1398fa16dbae0a/67b3681abbcbcceb916ddcb3/8901262200011_1-640x640.png' },
  { match: name => name.includes('amul masti dahi'), src: 'https://cdn.grofers.com/app/assets/products/sliding_images/jpeg/73bcc2db-0799-4014-ab75-029bfcdb8375.jpg?ts=1726473603' },
  { match: name => name.includes('toast') || name.includes('rusk'), src: 'https://www.asiacontinental.co.uk/cdn/shop/files/bi-22_884x.jpg?v=1756741312' },
]

export default function ProductImage({ name, className = '', imageData }: { name: string; className?: string; imageData?: string | null }) {
  const normalized = name.toLowerCase()
  const source = imageData || PRODUCT_IMAGES.find(item => item.match(normalized))?.src
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [source])
  if (!source || failed) return <div className={`flex shrink-0 items-center justify-center rounded-xl bg-[#F2F0E9] text-[#192D4C]/55 ${className}`}><Package size={28}/></div>
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ${className}`}>
    <img src={source} alt={name} loading="lazy" className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />
  </div>
}
