import { useEffect, useState } from 'react'
import { ChevronRight, CirclePlus, Ellipsis } from 'lucide-react'
import type { Exercise } from '../data'
import { Badge, Button, PageHeader, Pagination, Td, Th, cx } from '../components/ui'
import { TableToolbar, useTableFilters, type FilterGroup } from '../components/TableToolbar'

const PAGE_SIZE = 10

const scopeBucket = (n: number) => (n <= 2 ? '1–2 assets' : n <= 4 ? '3–4 assets' : '5+ assets')

const GROUPS: FilterGroup<Exercise>[] = [
  { key: 'status', label: 'Status', get: e => e.status, options: ['Complete', 'Scheduled', 'In progress', 'Draft'] },
  { key: 'scope', label: 'Scope', get: e => scopeBucket(e.assets), options: ['1–2 assets', '3–4 assets', '5+ assets'] },
]
const searchOf = (e: Exercise) => `${e.name} ${e.id}`

export function ExercisesList({ exercises, onCreate }: { exercises: Exercise[]; onCreate: () => void }) {
  const api = useTableFilters(exercises, GROUPS, searchOf)
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [api.query, api.active])
  const rows = api.filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <nav className="flex items-center gap-[7px] text-[10px] leading-[15px]">
        <span className="text-[#7d8284]">Exercises</span>
        <ChevronRight size={14} className="text-[#7d8284]" />
        <span className="text-black">New exercise</span>
      </nav>
      <PageHeader
        title="Security exercises"
        caption="Coordinate and track testing activity across your asset inventory."
        action={<Button data-tour="create-exercise" onClick={onCreate} icon={<CirclePlus size={15} strokeWidth={1.75} />}>Create exercise</Button>}
      />
      <TableToolbar api={api} groups={GROUPS} placeholder="Search exercises" />
      <div className="bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="w-[36%]">Exercise</Th>
              <Th className="w-[12%]">Scope</Th>
              <Th className="w-[22.5%]">Schedule</Th>
              <Th className="w-[21%]">Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={e.id + i} className={cx('h-[52px] hover:bg-[#fafafa]', e.isNew && 'row-new')}>
                <Td>
                  <p className="font-bold text-[#3e4345]">{e.name}</p>
                  <p className="pt-[3px] text-[9px] leading-[14px] text-[#969a9c]">{e.id} · {e.updated}</p>
                </Td>
                <Td className="font-medium">{e.assets} {e.assets === 1 ? 'asset' : 'assets'}</Td>
                <Td className="font-medium">{e.schedule}</Td>
                <Td><Badge>{e.status}</Badge></Td>
                <Td>
                  <button className="grid place-items-center size-[29px] rounded-[6px] hover:bg-black/5" aria-label="More actions"><Ellipsis size={18} /></button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={api.filtered.length} onPage={setPage} noun="exercises" />
      </div>
    </>
  )
}
