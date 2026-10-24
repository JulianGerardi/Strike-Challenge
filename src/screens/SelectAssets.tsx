import { useEffect, useState } from 'react'
import type { Asset } from '../data'
import { ASSETS } from '../data'
import { AssetMark, Badge, Checkbox, PageHeader, Pagination, Td, Th, cx } from '../components/ui'
import { TableToolbar, useTableFilters, type FilterGroup } from '../components/TableToolbar'

const PAGE_SIZE = 8

const GROUPS: FilterGroup<Asset>[] = [
  { key: 'type', label: 'Type', get: a => a.type, options: ['Web application', 'Mobile application', 'API'] },
  { key: 'env', label: 'Environment', get: a => a.environment, options: ['Production', 'Staging', 'Development'] },
  { key: 'status', label: 'Status', get: a => a.status, options: ['Active', 'Inactive'] },
]
const searchOf = (a: Asset) => `${a.name} ${a.identifier} ${a.audience}`

export function SelectAssets({ selected, setSelected, showErrors }: { selected: string[]; setSelected: (ids: string[]) => void; showErrors: boolean }) {
  const api = useTableFilters(ASSETS, GROUPS, searchOf)
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [api.query, api.active])
  const rows = api.filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const visibleIds = api.filtered.map(a => a.id)
  const allOn = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id))
  const someOn = visibleIds.some(id => selected.includes(id))
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  const toggleAll = () => setSelected(allOn ? selected.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])))

  return (
    <>
      <PageHeader title="Select assets" caption="Choose the assets that will be tested as part of this exercise." />
      <TableToolbar
        api={api}
        groups={GROUPS}
        placeholder="Search assets"
        right={
          <span data-tour="selection-count" className={cx('inline-flex items-center gap-[6px] h-[28px] px-[10px] text-[11px] font-semibold transition-colors', selected.length ? 'bg-brand-soft text-[#17575a] border border-[#bde7e9]' : 'text-[#969a9c]')}>
            {selected.length} {selected.length === 1 ? 'asset' : 'assets'} selected
            {selected.length > 0 && <button onClick={() => setSelected([])} className="text-[10px] text-[#2b9ea2] hover:underline font-semibold">Clear</button>}
          </span>
        }
      />
      {showErrors && selected.length === 0 && <p className="text-[11px] text-[#c23b3b] -mt-[8px]">Select at least one asset to continue.</p>}
      <div data-tour="assets-table" className="bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="w-[42px]"><Checkbox checked={allOn} indeterminate={!allOn && someOn} onChange={toggleAll} /></Th>
              <Th className="w-[28%]">Asset</Th>
              <Th className="w-[19%]">Type</Th>
              <Th className="w-[12%]">Environment</Th>
              <Th>Identifier</Th>
              <Th className="w-[89px] text-center">Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const on = selected.includes(a.id)
              return (
                <tr key={a.id} data-tour={i === 0 ? 'asset-row' : undefined} onClick={() => toggle(a.id)} className={cx('h-[51px] cursor-pointer transition-colors', on ? 'bg-[#eefcfc]' : 'hover:bg-[#fafafa]')}>
                  <Td><Checkbox checked={on} onChange={() => toggle(a.id)} /></Td>
                  <Td>
                    <div className="flex items-center gap-[9px]">
                      <AssetMark name={a.name} />
                      <div>
                        <p className="font-bold text-ink">{a.name}</p>
                        <p className="pt-[2px] text-[9px] leading-[14px] text-[#969a9c]">{a.audience}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone="type">{a.type}</Badge></Td>
                  <Td>{a.environment}</Td>
                  <Td className="font-code text-[10px] text-[#657069]">{a.identifier}</Td>
                  <Td className="text-center"><Badge>{a.status}</Badge></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={api.filtered.length} onPage={setPage} noun="assets" />
      </div>
    </>
  )
}
