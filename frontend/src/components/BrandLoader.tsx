import BrandMark from './BrandMark'

export default function BrandLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F8F6F0]">
      <div className="qhouse-loader-mark">
        <BrandMark size={104} />
      </div>

      {!compact && (
        <div className="text-center">
          <div className="font-serif text-xl font-semibold tracking-[0.18em] text-[#192D4C]">
            QURESHI'S HOUSE
          </div>
          <div className="mt-2 text-[10px] tracking-[0.22em] text-[#87909C]">
            OUR HOME. OUR ESSENTIALS. OUR KHATA.
          </div>
        </div>
      )}

      <div className="qhouse-loader-track" aria-label="Loading">
        <span />
      </div>

      {compact && (
        <span className="text-xs text-navy/55">
          Preparing your household khata...
        </span>
      )}
    </div>
  )
}
