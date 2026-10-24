import { useEffect, useMemo, useRef, useState } from 'react'
import { ListFilter, Search, X } from 'lucide-react'
import { Checkbox, cx } from './ui'

export interface FilterGroup<T> {
  key: string
  label: string
  /** Value of the row for this column. */
  get: (row: T) => string
  /** Fixed option order; defaults to the distinct values in the data. */
  options?: string[]
}

export type ActiveFilters = Record<string, string[]>

/**
 * Search + column filters for a table. Filtering is AND across groups and OR inside a group,
 * the same way most data tables behave.
 */
export function useTableFilters<T>(rows: T[], groups: FilterGroup<T>[], searchOf: (row: T) => string) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<ActiveFilters>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(r => {
      if (q && !searchOf(r).toLowerCase().includes(q)) return false
      return groups.every(g => {
        const sel = active[g.key]
        return !sel?.length || sel.includes(g.get(r))
      })
    })
  }, [rows, groups, active, query, searchOf])

  const options = useMemo(
    () =>
      Object.fromEntries(
        groups.map(g => {
          const opts = g.options ?? Array.from(new Set(rows.map(g.get)))
          return [g.key, opts.map(o => ({ value: o, count: rows.filter(r => g.get(r) === o).length }))]
        }),
      ) as Record<string, { value: string; count: number }[]>,
    [rows, groups],
  )

  const toggle = (key: string, value: string) =>
    setActive(a => {
      const cur = a[key] ?? []
      return { ...a, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] }
    })

  const clear = () => setActive({})
  const count = Object.values(active).reduce((n, v) => n + v.length, 0)

  return { query, setQuery, active, toggle, clear, count, filtered, options }
}

type FiltersApi = ReturnType<typeof useTableFilters<unknown>>

export function TableToolbar<T>({ api, groups, placeholder, right }: { api: FiltersApi; groups: FilterGroup<T>[]; placeholder: string; right?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const chips = groups.flatMap(g => (api.active[g.key] ?? []).map(v => ({ key: g.key, label: g.label, value: v })))

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-[12px] sm:gap-[22px] sm:h-[33px]">
        <div className="flex-1 sm:flex-none sm:pr-[24px] sm:border-r border-[#e7e7e7] h-full flex items-center">
          <label data-tour="search" className="flex items-center gap-[6px] w-full sm:w-[243px] h-[33px] px-[13px] border border-[#e7e7e7] bg-white focus-within:border-[#2bb9bd]">
            <Search size={15} className="text-ink shrink-0" />
            <input
              value={api.query}
              onChange={e => api.setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none text-[10px] tracking-[-0.2px] text-ink placeholder:text-[#9a9fa1]"
            />
            {api.query && (
              <button onClick={() => api.setQuery('')} aria-label="Clear search" className="text-[#9a9fa1] hover:text-ink"><X size={13} /></button>
            )}
          </label>
        </div>
        <div className="relative" ref={ref}>
          <button
            data-tour="filter"
            onClick={() => setOpen(o => !o)}
            className={cx('flex items-center gap-[7px] h-[33px] px-[14px] border bg-white font-semibold text-[10px] uppercase tracking-[0.6px] text-brand-ink transition-colors', open || api.count ? 'border-[#2bb9bd]' : 'border-[#e7e7e7] hover:border-[#cfd1d2]')}
          >
            <ListFilter size={16} strokeWidth={1.75} />
            Filter
            {api.count > 0 && <span className="grid place-items-center min-w-[16px] h-[16px] px-[4px] bg-brand text-[9px] font-sans font-bold">{api.count}</span>}
          </button>
          {open && (
            <div className="fade-up absolute z-30 left-0 top-[39px] w-[260px] bg-white border border-[#e5e5e5] shadow-[0_12px_32px_rgba(17,19,21,.12)]">
              <div className="flex items-center justify-between px-[14px] h-[38px] border-b border-[#eee]">
                <span className="text-[11px] font-semibold">Filter by</span>
                <button onClick={api.clear} disabled={!api.count} className="text-[10px] font-semibold text-[#2b9ea2] disabled:text-[#c3c6c7] uppercase tracking-[0.3px]">Clear all</button>
              </div>
              <div className="max-h-[360px] overflow-auto py-[6px]">
                {groups.map(g => (
                  <div key={g.key} className="px-[14px] py-[8px]">
                    <p className="text-[9px] uppercase tracking-[0.6px] text-[#73787a] mb-[6px]">{g.label}</p>
                    <div className="flex flex-col gap-[7px]">
                      {api.options[g.key].map(o => (
                        <div key={o.value} className="flex items-center justify-between">
                          <Checkbox checked={(api.active[g.key] ?? []).includes(o.value)} onChange={() => api.toggle(g.key, o.value)} label={o.value} />
                          <span className="text-[10px] text-[#9a9fa1]">{o.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-[6px] mt-[10px]">
          {chips.map(c => (
            <span key={c.key + c.value} className="fade-up inline-flex items-center gap-[5px] h-[22px] pl-[8px] pr-[4px] bg-brand-soft border border-[#bde7e9] text-[10px] text-[#17575a]">
              <span className="text-[#5d8e90]">{c.label}:</span> {c.value}
              <button onClick={() => api.toggle(c.key, c.value)} aria-label={`Remove ${c.value}`} className="grid place-items-center size-[14px] hover:bg-black/10"><X size={10} /></button>
            </span>
          ))}
          <button onClick={api.clear} className="text-[10px] font-semibold text-[#2b9ea2] hover:underline ml-[4px]">Clear filters</button>
        </div>
      )}
    </div>
  )
}
