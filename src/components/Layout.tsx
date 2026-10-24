import type { ReactNode } from 'react'
import { Box, ChartNoAxesColumnIncreasing, ChevronDown, ClipboardCheck, LayoutGrid, Settings } from 'lucide-react'
import { cx } from './ui'

export function StrikeLogo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  // Pixel "S" mark
  const px = [
    [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 3], [3, 4], [0, 5], [1, 5], [2, 5], [3, 5], [0, 4],
  ]
  return (
    <svg width={size * 0.8} height={size} viewBox="0 0 4 6" fill={color} aria-label="Strike">
      {px.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />)}
      <rect x="3" y="1" width="1.02" height="0.5" opacity=".6" />
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
    <aside className="w-[72px] shrink-0 self-stretch bg-[#111315] border-r border-[#2a2d2f]">
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
export function Smiley({ happy, onClick }: { happy?: boolean; onClick?: () => void }) {
  return (
    <button
      data-tour="smiley"
      onClick={onClick}
      aria-label="Abrir asistente"
      className={cx('smiley grid place-items-center h-[28px] w-[33px] bg-brand', happy && 'is-happy')}
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

export function Header({ happy, onSmiley }: { happy?: boolean; onSmiley?: () => void }) {
  return (
    <header className="sticky top-0 z-20 h-[48px] flex items-center justify-between px-[18px] bg-white/90 backdrop-blur-[10px]">
      <div className="flex items-center gap-[5px]">
        <Smiley happy={happy} onClick={onSmiley} />
        <span className="font-fono text-[14px] leading-[20px] text-[#09090b]">Hola! Sarah</span>
      </div>
      <button className="flex items-center gap-[8px] h-[36px]">
        <span className="grid place-items-center size-[24px] bg-brand text-[9px] font-bold text-[#142f31]">JA</span>
        <span className="text-[14px] font-medium tracking-[-0.2px] text-ink">Jordan Avery</span>
        <ChevronDown size={13} className="text-[#73787a]" />
      </button>
    </header>
  )
}

export function Shell({ children, header }: { children: ReactNode; header: ReactNode }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {header}
      <main className="flex-1 px-[40px] pt-[8px] pb-[96px]">
        <div className="max-w-[1028px] mx-auto flex flex-col gap-[18px]">{children}</div>
      </main>
    </div>
  )
}
