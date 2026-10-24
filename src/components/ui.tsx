import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export { cx }

/* ---------- Buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; icon?: ReactNode; iconRight?: ReactNode }

export function Button({ variant = 'primary', icon, iconRight, className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-[7px] h-[36px] px-[14px] font-bold text-[10px] tracking-[0.3px] uppercase text-brand-ink transition-colors whitespace-nowrap',
        variant === 'primary' && 'bg-brand border border-brand-border hover:bg-[#6edadd] disabled:opacity-50',
        variant === 'outline' && 'bg-white border border-[#e7e7e7] hover:border-[#cfd1d2] disabled:opacity-50',
        variant === 'ghost' && 'hover:bg-black/5 disabled:opacity-40',
        className,
      )}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}

export function FormFooter({ onCancel, onContinue, continueLabel = 'Continue', cancelLabel = 'Cancel', disabled, tourId }: { onCancel: () => void; onContinue: () => void; continueLabel?: string; cancelLabel?: string; disabled?: boolean; tourId?: string }) {
  return (
    <div className="flex justify-end items-center">
      <Button variant="ghost" className="w-[108px] h-[40px]" onClick={onCancel}>{cancelLabel}</Button>
      <Button data-tour={tourId} className="min-w-[108px] h-[40px] px-[15px]" onClick={onContinue} disabled={disabled} iconRight={<ArrowRight size={16} strokeWidth={1.75} />}>
        {continueLabel}
      </Button>
    </div>
  )
}

/* ---------- Badges ---------- */

const BADGE_STYLES: Record<string, string> = {
  Complete: 'bg-[#ccfbff] border-[#98f8fe] text-[#17575a]',
  Active: 'bg-[#e9fbe7] border-[#b1ffa8] text-[#17575a]',
  Inactive: 'bg-[#f1f1f1] border-[#dcdcdc] text-[#73787a]',
  Scheduled: 'bg-[#fff6dc] border-[#fde59a] text-[#6b5512]',
  'In progress': 'bg-[#e6efff] border-[#b7cdfd] text-[#22407a]',
  Draft: 'bg-[#f1f1f1] border-[#dcdcdc] text-[#505557]',
  type: 'bg-[#dec5ff] border-[#bf8ffe] text-[#505557]',
  soft: 'bg-[#e7fafb] border-[#bde7e9] text-[#17575a]',
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const key = tone ?? (typeof children === 'string' ? children : 'soft')
  return (
    <span className={cx('inline-flex items-center justify-center px-[7px] py-[3px] border rounded-[1px] font-[680] font-bold text-[8px] leading-[12px] tracking-[0.3px] uppercase whitespace-nowrap', BADGE_STYLES[key] ?? BADGE_STYLES.soft)}>
      {children}
    </span>
  )
}

/* ---------- Checkbox ---------- */

export function Checkbox({ checked, indeterminate, onChange, label, className }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label?: ReactNode; className?: string }) {
  return (
    <label
      onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(!checked) }}
      className={cx('inline-flex items-center gap-[9px] cursor-pointer select-none', className)}
    >
      <span
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        tabIndex={0}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked) } }}
        className={cx('grid place-items-center size-[16px] border rounded-[1px] shrink-0 transition-colors', checked || indeterminate ? 'bg-brand border-[#2bb9bd]' : 'bg-white border-[#b9c0b9] hover:border-[#2bb9bd]')}
      >
        {checked && <Check size={12} strokeWidth={2} className="text-ink" />}
        {!checked && indeterminate && <span className="w-[8px] h-[2px] bg-ink" />}
      </span>
      {label && <span className="text-[11px] text-ink tracking-[-0.2px]">{label}</span>}
    </label>
  )
}

/* ---------- Page header ---------- */

export function PageHeader({ title, caption, action }: { title: string; caption: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h1 className="text-[27px] leading-[31px] font-[450] font-medium tracking-[-0.04px] text-ink">{title}</h1>
        <p className="pt-[3px] text-[11px] leading-[17px] text-[#73787a] tracking-[-0.2px]">{caption}</p>
      </div>
      {action}
    </div>
  )
}

/* ---------- Stepper ---------- */

export const STEPS = ['Exercise details', 'Select assets', 'Configure', 'Review']

export function Stepper({ active, onGo }: { active: number; onGo?: (i: number) => void }) {
  return (
    <div data-tour="stepper" className="flex items-center justify-center w-full h-[60px]">
      <div className="flex items-center w-[850px] max-w-full">
        {STEPS.map((label, i) => {
          const done = i < active
          const current = i === active
          return (
            <div key={label} className={cx('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <button
                disabled={!done}
                onClick={() => onGo?.(i)}
                className="flex items-center gap-[8px] py-[10px] disabled:cursor-default"
                aria-current={current ? 'step' : undefined}
              >
                {done ? (
                  <span className="grid place-items-center size-[22px] bg-brand-dark border border-brand-dark">
                    <Check size={13} strokeWidth={2} className="text-white" />
                  </span>
                ) : (
                  <span className={cx('grid place-items-center size-[22px] text-[9px] font-medium tracking-[0.4px]', current ? 'bg-brand text-[#102c2e]' : 'bg-white text-[#686d6f]')}>{i + 1}</span>
                )}
                <span className={cx('text-[10px] leading-[15px] font-medium uppercase tracking-[-0.016px] whitespace-nowrap', done ? 'text-brand-dark' : current ? 'text-ink' : 'text-[#8b9092]')}>{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cx('flex-1 h-px mx-[16px] transition-colors duration-500', done ? (i + 1 === active ? 'bg-brand' : 'bg-brand-dark') : 'bg-[#d7d9da]')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Form controls ---------- */

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block text-[11px] leading-[17px] font-semibold text-ink mb-[6px]">{children}</span>
}

const inputBase = 'w-full bg-white border text-[11px] tracking-[-0.2px] text-ink outline-none transition-colors placeholder:text-[#9a9fa1]'

export function inputClass(filled: boolean) {
  return cx(inputBase, filled ? 'border-[#2bb9bd]' : 'border-[#cfd1d2]', 'focus:border-[#2bb9bd] focus:shadow-[0_0_0_3px_rgba(124,229,232,.25)]')
}

export function Select<T extends string | number>({ value, options, onChange, placeholder, format }: { value: T | ''; options: readonly T[]; onChange: (v: T) => void; placeholder?: string; format?: (v: T) => string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => {
          const raw = e.target.value
          const opt = options.find(o => String(o) === raw)
          if (opt !== undefined) onChange(opt)
        }}
        className={cx(inputClass(value !== ''), 'appearance-none h-[38px] px-[10px] pr-[30px]')}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => (
          <option key={String(o)} value={String(o)}>{format ? format(o) : String(o)}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-ink" />
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', full }: { value: T; options: readonly T[]; onChange: (v: T) => void; size?: 'sm' | 'md'; full?: boolean }) {
  return (
    <div className={cx('inline-flex bg-[#f0f0f0] p-[2px]', full && 'w-full')}>
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cx(
            'transition-colors font-medium tracking-[-0.1px]',
            size === 'sm' ? 'text-[9px] px-[8px] h-[24px]' : 'text-[10px] px-[12px] h-[28px]',
            full && 'flex-1',
            value === o ? 'bg-brand text-ink shadow-[0_1px_0_rgba(0,0,0,.04)]' : 'text-[#505557] hover:text-ink',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('relative w-[38px] h-[21px] rounded-[18px] transition-colors', checked ? 'bg-[#29bcc2]' : 'bg-[#cfd1d2]')}
    >
      <span className={cx('absolute top-[2px] size-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.18)] transition-all', checked ? 'left-[19px]' : 'left-[2px]')} />
    </button>
  )
}

/* ---------- Sections ---------- */

export function SectionIcon() {
  return (
    <span className="grid place-items-center w-[31px] h-[29px] bg-brand shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9" /><path d="M16 3h5v5" /><path d="m21 3-9 9" />
      </svg>
    </span>
  )
}

export function SectionTitle({ title, caption, right }: { title: string; caption: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-[8px]">
      <SectionIcon />
      <div className="flex-1">
        <p className="text-[13px] leading-[20px] font-semibold tracking-[-0.1px] text-ink">{title}</p>
        <p className="pt-[2px] text-[10px] leading-[15px] text-[#666b6e] tracking-[-0.2px]">{caption}</p>
      </div>
      {right}
    </div>
  )
}

/* ---------- Table helpers ---------- */

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cx('h-[43px] px-[12px] text-left font-fono font-bold text-[10px] leading-[15px] tracking-[-0.2px] text-[#24282a] border-b border-[#e2e3e3] bg-white', className)}>{children}</th>
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx('px-[12px] py-[9px] border-b border-[#e2e3e3] text-[11px] leading-[17px] tracking-[-0.2px] text-[#3e4345]', className)}>{children}</td>
}

export function Pagination({ page, pageSize, total, onPage, noun }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; noun: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="flex items-center justify-between min-h-[52px] px-[16px] py-[8px] border-t border-[#e7e7e7] bg-white">
      <p className="text-[12px] leading-[16px] font-semibold text-[#71717a]">
        {total === 0 ? `No ${noun.toLowerCase()} match your filters` : `Showing ${from} to ${to} of ${total} ${noun}`}
      </p>
      <div className="flex items-center gap-[4px]">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid place-items-center size-[28px] rounded-[6px] disabled:opacity-40 hover:bg-black/5" aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)} className={cx('grid place-items-center size-[28px] rounded-[6px] text-[12px] font-semibold', p === page ? 'bg-[#ccfbff] text-ink' : 'text-[#71717a] hover:bg-black/5')}>
            {p}
          </button>
        ))}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid place-items-center size-[28px] rounded-[6px] disabled:opacity-40 hover:bg-black/5" aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function AssetMark({ name }: { name: string }) {
  return <span className="grid place-items-center size-[28px] bg-brand text-[10px] font-extrabold text-[#171a1c] shrink-0">{name[0]}</span>
}
