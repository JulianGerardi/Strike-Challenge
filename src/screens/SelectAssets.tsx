import { Fragment, useEffect, useState } from 'react'
import type { Asset } from '../data'
import { ASSETS, ASSET_PROFILES, formatDate } from '../data'
import { t, tv } from '../i18n'
import { AssetMark, Badge, Checkbox, DetailItem, DetailRow, ExpandToggle, PageHeader, Pagination, SelectionChip, Td, Th, cx } from '../components/ui'
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
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  const toggleAll = () => setSelected(allOn ? selected.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])))

  return (
    <>
      <PageHeader title={t('Select assets', 'Seleccionar assets')} caption={t('Choose the assets that will be tested as part of this exercise.', 'Elegí los assets que se van a testear en este ejercicio.')} />
      <TableToolbar
        api={api}
        groups={GROUPS}
        placeholder={t('Search assets', 'Buscar assets')}
        right={
          <SelectionChip tour="selection-count" count={selected.length} onClear={() => setSelected([])} />
        }
      />
      {showErrors && selected.length === 0 && <p className="text-[13px] text-[#c23b3b] -mt-[8px]">{t('Select at least one asset to continue.', 'Seleccioná al menos un asset para continuar.')}</p>}
      <div data-tour="assets-table" className="bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="w-[42px]"><Checkbox checked={allOn} indeterminate={!allOn && someOn} onChange={toggleAll} /></Th>
              <Th className="w-[28%]">Asset</Th>
              <Th className="w-[19%]">{t('Type', 'Tipo')}</Th>
              <Th className="w-[12%]">{t('Environment', 'Entorno')}</Th>
              <Th>{t('Identifier', 'Identificador')}</Th>
              <Th className="w-[89px] text-center">{t('Status', 'Estado')}</Th>
              <Th className="w-[50px]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const on = selected.includes(a.id)
              return (
                <Fragment key={a.id}>
                <tr data-tour={i === 0 ? 'asset-row' : undefined} onClick={() => toggle(a.id)} className={cx('h-[51px] cursor-pointer transition-colors', on ? 'bg-[#eefcfc]' : 'hover:bg-[#fafafa]')}>
                  <Td><Checkbox checked={on} onChange={() => toggle(a.id)} /></Td>
                  <Td>
                    <div className="flex items-center gap-[9px]">
                      <AssetMark name={a.name} />
                      <div>
                        <p className="font-bold text-ink">{a.name}</p>
                        <p className="pt-[2px] text-[11px] leading-[17px] text-[#969a9c]">{tv(a.audience)}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone="type">{a.type}</Badge></Td>
                  <Td>{tv(a.environment)}</Td>
                  <Td className="font-code text-[12px] text-[#657069]">{a.identifier}</Td>
                  <Td className="text-center"><Badge>{a.status}</Badge></Td>
                  <Td><ExpandToggle tour={i === 0 ? 'asset-expand' : undefined} open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} label={t(`Show details for ${a.name}`, `Ver detalle de ${a.name}`)} /></Td>
                </tr>
                {open === a.id && <AssetDetail asset={a} />}
                </Fragment>
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

function AssetDetail({ asset }: { asset: Asset }) {
  const p = ASSET_PROFILES[asset.id]
  if (!p) return null
  const f = p.findings
  const total = f.critical + f.high + f.medium + f.low
  const sev: [number, string, string][] = [[f.critical, t('Critical', 'Crítico'), 'bg-[#c23b3b]'], [f.high, t('High', 'Alto'), 'bg-[#e07b39]'], [f.medium, t('Medium', 'Medio'), 'bg-[#e0b339]'], [f.low, t('Low', 'Bajo'), 'bg-[#8fa3a6]']]
  return (
    <DetailRow colSpan={7}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[14px]">
        <DetailItem label={t('Description', 'Descripción')} wide>{t(...p.description)}</DetailItem>
        <DetailItem label={t('Owner team', 'Equipo responsable')}>{p.owner}</DetailItem>
        <DetailItem label={t('Tech stack', 'Tecnología')}>{p.stack}</DetailItem>
        <DetailItem label={t('Region', 'Región')}>{p.region}</DetailItem>
        <DetailItem label={t('Last tested', 'Último testeo')}>{p.lastTested ? formatDate(p.lastTested) : t('Never tested', 'Nunca testeado')}</DetailItem>
        <DetailItem label={t('Open findings', 'Hallazgos abiertos')} wide>
          {total === 0 ? t('No open findings', 'Sin hallazgos abiertos') : (
            <div className="flex flex-wrap gap-x-[14px] gap-y-[4px]">
              {sev.map(([n, label, dot]) => <span key={label} className={cx('inline-flex items-center gap-[6px]', n === 0 && 'text-[#969a9c]')}><span className={cx('size-[7px] rounded-full', n ? dot : 'bg-[#d5d7d8]')} />{n} {label}</span>)}
            </div>
          )}
        </DetailItem>
      </div>
    </DetailRow>
  )
}
