import { Fragment, useEffect, useState } from 'react'
import { ChevronRight, CirclePlus, Ellipsis } from 'lucide-react'
import type { AssetOverrides, Exercise } from '../data'
import { ASSETS, excludedLabel, exerciseSetup, formatDate, formatSchedule, formatUpdated } from '../data'
import { t, tv } from '../i18n'
import { AssetMark, Badge, Button, DetailItem, DetailRow, ExpandToggle, PageHeader, Pagination, Td, Th, cx } from '../components/ui'
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
  const [open, setOpen] = useState<string | null>(null)
  const rows = api.filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <nav className="flex items-center gap-[7px] text-[12px] leading-[18px]">
        <span className="text-[#7d8284]">{t('Exercises', 'Ejercicios')}</span>
        <ChevronRight size={14} className="text-[#7d8284]" />
        <span className="text-black">{t('New exercise', 'Nuevo ejercicio')}</span>
      </nav>
      <PageHeader
        title={t('Security exercises', 'Ejercicios de seguridad')}
        caption={t('Coordinate and track testing activity across your asset inventory.', 'Coordiná y seguí la actividad de testing en todo tu inventario de assets.')}
        action={<Button data-tour="create-exercise" onClick={onCreate} icon={<CirclePlus size={15} strokeWidth={1.75} />}>{t('Create exercise', 'Crear ejercicio')}</Button>}
      />
      <TableToolbar api={api} groups={GROUPS} placeholder={t('Search exercises', 'Buscar ejercicios')} />
      <div className="bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="w-[36%]">{t('Exercise', 'Ejercicio')}</Th>
              <Th className="w-[12%]">{t('Scope', 'Alcance')}</Th>
              <Th className="w-[22.5%]">{t('Schedule', 'Fecha')}</Th>
              <Th className="w-[21%]">{t('Status', 'Estado')}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const key = e.id + i
              const isOpen = open === key
              return (
                <Fragment key={key}>
                  <tr onClick={() => setOpen(isOpen ? null : key)} className={cx('h-[52px] cursor-pointer transition-colors', isOpen ? 'bg-[#f4fbfb]' : 'hover:bg-[#fafafa]', e.isNew && 'row-new')}>
                    <Td>
                      <div className="flex items-center gap-[8px]">
                        <ExpandToggle tour={i === 0 ? 'exercise-expand' : undefined} open={isOpen} onToggle={() => setOpen(isOpen ? null : key)} label={t(`Show details for ${e.name}`, `Ver detalle de ${e.name}`)} />
                        <div>
                          <p className="font-bold text-[#3e4345]">{e.name}</p>
                          <p className="pt-[3px] text-[11px] leading-[17px] text-[#969a9c]">{e.id} · {formatUpdated(e.updated)}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-medium">{e.assets} {e.assets === 1 ? 'asset' : 'assets'}</Td>
                    <Td className="font-medium">{formatSchedule(e.schedule)}</Td>
                    <Td><Badge>{e.status}</Badge></Td>
                    <Td>
                      <button onClick={ev => ev.stopPropagation()} className="grid place-items-center size-[29px] rounded-[6px] hover:bg-black/5" aria-label={t('More actions', 'Más acciones')}><Ellipsis size={18} /></button>
                    </Td>
                  </tr>
                  {isOpen && <ExerciseDetail exercise={e} />}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={api.filtered.length} onPage={setPage} noun={t('exercises', 'ejercicios')} />
      </div>
    </>
  )
}

function overrideChips(o: AssetOverrides | undefined) {
  if (!o) return []
  const out: string[] = []
  if (o.rateLimit !== undefined) out.push(`${o.rateLimit} req/s`)
  if (o.vpnRequired !== undefined) out.push(o.vpnRequired ? t('VPN required', 'VPN requerida') : t('No VPN', 'Sin VPN'))
  if (o.window) out.push(`${o.window.start}–${o.window.end}`)
  if (o.excludedTests?.length) out.push(t(`Excludes ${o.excludedTests.map(tv).join(', ')}`, `Excluye ${o.excludedTests.map(tv).join(', ')}`))
  return out
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const s = exerciseSetup(exercise)
  const assets = s.assetIds.map(id => ASSETS.find(a => a.id === id)).filter(a => a !== undefined)
  const dates = s.startDate ? `${formatDate(s.startDate)} – ${formatDate(s.endDate)}` : t('Not scheduled', 'Sin programar')
  return (
    <DetailRow colSpan={5}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-[16px] lg:gap-[28px]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4px] text-[#73787a]">{t('Assets in scope', 'Assets incluidos')} · {assets.length}</p>
          <ul className="mt-[8px] bg-white border border-[#e2e3e3] divide-y divide-[#eeefef]">
            {assets.map(a => {
              const chips = overrideChips(s.overrides[a.id])
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px] px-[12px] py-[9px]">
                  <AssetMark name={a.name} />
                  <div className="min-w-0 flex-1 basis-[160px]">
                    <p className="text-[13px] font-bold text-ink truncate">{a.name}</p>
                    <p className="text-[11px] leading-[17px] text-[#969a9c] truncate">{a.identifier} · {tv(a.environment)}</p>
                  </div>
                  <Badge tone="type">{a.type}</Badge>
                  <div className="flex flex-wrap gap-[4px] sm:w-[200px] sm:justify-end">
                    {chips.length ? chips.map(c => <span key={c} className="inline-flex items-center h-[20px] px-[6px] text-[11px] font-semibold bg-brand-soft text-[#17575a]">{c}</span>) : <span className="text-[12px] text-[#969a9c]">{t('Exercise defaults', 'Valores del ejercicio')}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.4px] text-[#73787a]">{t('Configuration', 'Configuración')}</p>
          <div className="mt-[8px] grid grid-cols-2 gap-x-[20px] gap-y-[12px] bg-white border border-[#e2e3e3] p-[14px]">
            <DetailItem label={t('Test depth', 'Profundidad')}>{tv(s.depth)}</DetailItem>
            <DetailItem label={t('Human validation', 'Validación humana')}>{s.humanValidation ? t('Yes', 'Sí') : 'No'}</DetailItem>
            <DetailItem label={t('Dates', 'Fechas')} wide>{dates}</DetailItem>
            <DetailItem label={t('Testing window', 'Ventana de testing')}>{s.shared.window.start}–{s.shared.window.end}</DetailItem>
            <DetailItem label={t('Recurrence', 'Recurrencia')}>{tv(s.recurrence) || '—'}</DetailItem>
            <DetailItem label="Rate limit">{s.shared.rateLimit} req/s</DetailItem>
            <DetailItem label={t('VPN access', 'VPN')}>{s.shared.vpnRequired ? tv('Required') : tv('Not required')}</DetailItem>
            <DetailItem label={t('Excluded tests', 'Pruebas excluidas')} wide>{excludedLabel(s.shared.excludedTests)}</DetailItem>
          </div>
        </div>
      </div>
    </DetailRow>
  )
}
