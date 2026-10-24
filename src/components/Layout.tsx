import { useEffect, useState, type ReactNode } from 'react'
import { Box, ChartNoAxesColumnIncreasing, ChevronDown, ClipboardCheck, LayoutGrid, Settings } from 'lucide-react'
import { cx } from './ui'

export function StrikeLogo({ size = 21, color = '#fff' }: { size?: number; color?: string }) {
  // Pixel "S" mark, traced from the brand asset
  const rects = [
    [4, 0, 12, 5], [0, 5, 4, 3], [16, 5, 4, 3], [0, 8, 4, 3], [4, 11, 12, 5],
    [16, 16, 4, 3], [0, 19, 4, 3], [16, 19, 4, 3], [4, 22, 12, 4],
  ]
  return (
    <svg width={(size * 20) / 26} height={size} viewBox="0 0 20 26" fill={color} shapeRendering="crispEdges" aria-label="Strike">
      {rects.map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />)}
    </svg>
  )
}

const NAV = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Box, label: 'Assets' },
  { icon: ClipboardCheck, label: 'Security exercises' },
  { icon: ChartNoAxesColumnIncreasing, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
]

export function Sidebar({ onHome }: { onHome: () => void }) {
  return (
    <aside className="hidden md:block w-[72px] shrink-0 self-stretch bg-[#111315] border-r border-[#2a2d2f]">
      <div className="sticky top-0 h-screen flex flex-col px-[8px] pt-[20px] pb-[14px]">
      <button onClick={onHome} className="flex items-center justify-center pt-[13px] pb-[14px]" aria-label="Home">
        <StrikeLogo />
      </button>
      <nav className="flex flex-col gap-[5px]">
        {NAV.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            title={label}
            onClick={i === 2 ? onHome : undefined}
            className={cx('flex items-center justify-center h-[46px] w-[54px] border-l-2 transition-colors', i === 2 ? 'bg-[#242729] border-brand text-brand' : 'border-transparent text-[#c9cccd] hover:bg-[#1b1e20]')}
          >
            <Icon size={18} strokeWidth={1.6} />
          </button>
        ))}
      </nav>
      <div className="mt-auto flex justify-center pt-[15px] border-t border-[#303335]">
        <span className="grid place-items-center size-[40px] rounded-full border-2 border-brand text-white text-[11px] font-medium">AC</span>
      </div>
      </div>
    </aside>
  )
}

/**
 * Animated smiley: says hello when it mounts, blinks every few seconds,
 * winks and grins on hover, and celebrates when `happy` is true.
 */
export function Smiley({ happy, intro, onClick }: { happy?: boolean; intro?: boolean; onClick?: () => void }) {
  return (
    <button
      data-tour="smiley"
      onClick={onClick}
      aria-label="Abrir asistente"
      className={cx('smiley grid place-items-center h-[28px] w-[33px] bg-brand', happy && 'is-happy', intro && 'is-intro')}
    >
      <svg className="smiley-face" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111315" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <ellipse className="smiley-cheek" cx="6.6" cy="14" rx="1.6" ry="1" fill="#ff8fa3" stroke="none" />
        <ellipse className="smiley-cheek" cx="17.4" cy="14" rx="1.6" ry="1" fill="#ff8fa3" stroke="none" />
        <line className="smiley-eye" x1="9" y1="8.6" x2="9" y2="10" strokeWidth="2.2" />
        <line className="smiley-eye smiley-eye-r" x1="15" y1="8.6" x2="15" y2="10" strokeWidth="2.2" />
        <path className="smiley-mouth smiley-mouth-small" d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path className="smiley-mouth smiley-mouth-big" d="M7.5 13.5h9s-.6 4-4.5 4-4.5-4-4.5-4z" fill="#111315" />
      </svg>
    </button>
  )
}

/** Plays the greeting once on load and again every time the screen changes. */
function useIntro(key: unknown, ms = 2200) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(false)
    const start = setTimeout(() => setOn(true), 120)
    const stop = setTimeout(() => setOn(false), 120 + ms)
    return () => { clearTimeout(start); clearTimeout(stop) }
  }, [key, ms])
  return on
}

export function Header({ happy, onSmiley, introKey }: { happy?: boolean; onSmiley?: () => void; introKey?: unknown }) {
  const intro = useIntro(introKey)
  return (
    <header className="sticky top-0 z-20 h-[48px] flex items-center justify-between px-[16px] md:px-[18px] bg-white/90 backdrop-blur-[10px]">
      <div className="flex items-center gap-[8px] md:gap-[5px]">
        <span className="md:hidden grid place-items-center size-[32px] bg-[#111315]"><StrikeLogo size={16} /></span>
        <Smiley happy={happy} intro={intro} onClick={onSmiley} />
        <span key={String(introKey)} className="greet font-fono font-medium text-[14px] leading-[20px] text-[#09090b] whitespace-nowrap">Hola! Sarah</span>
      </div>
      <button className="flex items-center gap-[8px] h-[36px]">
        <span className="grid place-items-center size-[24px] bg-brand text-[9px] font-bold text-[#142f31]">JA</span>
        <span className="hidden sm:inline text-[14px] font-medium tracking-[-0.2px] text-ink">Jordan Avery</span>
        <ChevronDown size={13} className="text-[#73787a]" />
      </button>
    </header>
  )
}

export function Shell({ children, header }: { children: ReactNode; header: ReactNode }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {header}
      <main className="flex-1 px-[16px] md:px-[40px] pt-[17px] pb-[24px]">
        <div className="max-w-[1028px] mx-auto flex flex-col gap-[18px]">{children}</div>
      </main>
    </div>
  )
}
