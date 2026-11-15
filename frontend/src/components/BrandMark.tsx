type Props = { size?: number; tone?: 'gold' | 'navy' }

export default function BrandMark({ size = 88, tone = 'gold' }: Props) {
  const ink = tone === 'gold' ? '#D5B77A' : '#192D4C'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Qureshi's House Q monogram">
      <circle className="qhouse-orbit" cx="60" cy="60" r="49" fill="none" stroke={ink} strokeWidth="1.8" strokeDasharray="285 24" strokeLinecap="round" transform="rotate(-42 60 60)" />
      <text x="53" y="86" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="91" fontWeight="400" fill={ink}>Q</text>
    </svg>
  )
}
