import { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Pencil, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import type { Asset, AssetOverrides, ExerciseDraft, SharedConfig, TimeWindow } from '../data'
import { ASSETS, EXCLUDABLE_TESTS, RATE_LIMITS, effective, excludedLabel, formatDate, hasOverrides } from '../data'
import { AssetMark, Badge, Button, Checkbox, FieldLabel, PageHeader, PickerInput, Segmented, Select, Td, Th, cx } from '../components/ui'
import { PixelIcon } from '../components/PixelIcon'
import { t, tv } from '../i18n'
import { TableToolbar, useTableFilters, type FilterGroup } from '../components/TableToolbar'

type FieldKey = keyof AssetOverrides
const FIELDS: FieldKey[] = ['rateLimit', 'vpnRequired', 'excludedTests', 'window']
const fieldLabel = (f: FieldKey) =>
  ({
    rateLimit: t('Rate limit', 'Rate limit'),
    vpnRequired: t('VPN requirement', 'Requisito de VPN'),
    excludedTests: t('Excluded test types', 'Tipos de prueba excluidos'),
    window: t('Allowed testing window', 'Ventana de testing permitida'),
  })[f]

type Mode = 'Keep current' | 'Apply new' | 'Reset'
export interface BulkChange { mode: Mode; rateLimit: number; vpnRequired: boolean; excludedTests: string[]; window: TimeWindow }
export type BulkChanges = Record<FieldKey, BulkChange>

const vpnText = (v: boolean) => (v ? 'Required' : 'Not required')
const windowText = (w: TimeWindow) => `${w.start}–${w.end}`

/* ------------------------------------------------------------------ */

function TimeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex-1">
      <FieldLabel>{label}</FieldLabel>
      <PickerInput type="time" icon={<Clock size={16} />} value={value} onChange={onChange} label={label} />
    </div>
  )
}

function ExcludedPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-[11px] border border-[#cfd1d2] p-[12px]">
      {EXCLUDABLE_TESTS.map(test => (
        <Checkbox key={test} checked={value.includes(test)} onChange={on => onChange(on ? [...value, test] : value.filter(x => x !== test))} label={tv(test)} />
      ))}
    </div>
  )
}

function FieldEditor({ field, value, onChange }: { field: FieldKey; value: BulkChange; onChange: (v: BulkChange) => void }) {
  if (field === 'rateLimit')
    return (
      <div>
        <FieldLabel>{t('Requests per second', 'Solicitudes por segundo')}</FieldLabel>
        <Select value={value.rateLimit} options={RATE_LIMITS} onChange={v => onChange({ ...value, rateLimit: v })} />
      </div>
    )
  if (field === 'vpnRequired')
    return <Segmented full value={vpnText(value.vpnRequired)} options={['Required', 'Not required'] as const} onChange={v => onChange({ ...value, vpnRequired: v === 'Required' })} />
  if (field === 'excludedTests') return <ExcludedPicker value={value.excludedTests} onChange={v => onChange({ ...value, excludedTests: v })} />
  return (
    <div className="flex gap-[14px]">
      <TimeInput label={t('Start time', 'Hora de inicio')} value={value.window.start} onChange={v => onChange({ ...value, window: { ...value.window, start: v } })} />
      <TimeInput label={t('End time', 'Hora de fin')} value={value.window.end} onChange={v => onChange({ ...value, window: { ...value.window, end: v } })} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function Modal({ title, caption, children, onClose, footer, tourId }: { title: string; caption: string; children: React.ReactNode; onClose: () => void; footer: React.ReactNode; tourId?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 bg-[#111315]/40 grid place-items-center p-[12px] sm:p-[24px]" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div data-tour={tourId} role="dialog" aria-modal="true" aria-label={title} className="fade-up w-full max-w-[620px] max-h-[calc(100vh-48px)] flex flex-col bg-white shadow-[0_24px_64px_rgba(17,19,21,.25)]">
        <div className="relative px-[16px] sm:px-[24px] pt-[24px] pb-[20px] bg-[#f7f7f7] border-b border-[#e5e5e5]">
          <h2 className="text-[20px] leading-[26px] font-medium">{title}</h2>
          <p className="mt-[6px] text-[13px] text-[#666b6e]">{caption}</p>
          <button onClick={onClose} aria-label={t('Close', 'Cerrar')} className="absolute right-[22px] top-[24px] text-[#505557] hover:text-ink"><X size={18} /></button>
        </div>
        <div className="overflow-auto px-[16px] sm:px-[24px] py-[18px]">{children}</div>
        <div className="flex justify-end gap-[8px] px-[18px] py-[12px] bg-[#f3f3f2]">{footer}</div>
      </div>
    </div>
  )
}

export function BulkEditModal({ count, shared, changes, setChanges, onClose, onSave }: { count: number; shared: SharedConfig; changes: BulkChanges; setChanges: (c: BulkChanges) => void; onClose: () => void; onSave: () => void }) {
  const dirty = Object.values(changes).some(c => c.mode !== 'Keep current')
  return (
    <Modal
      tourId="bulk-modal"
      title={t('Edit asset settings', 'Editar configuración de assets')}
      caption={t(`Choose only the settings you want to change for ${count} selected ${count === 1 ? 'asset' : 'assets'}.`, `Elegí solo lo que querés cambiar en ${count} ${count === 1 ? 'asset seleccionado' : 'assets seleccionados'}.`)}
      onClose={onClose}
      footer={<><Button variant="ghost" className="w-[108px] h-[40px]" onClick={onClose}>{t('Cancel', 'Cancelar')}</Button><Button data-tour="bulk-save" className="h-[40px] px-[16px]" disabled={!dirty} onClick={onSave}>{t('Save changes', 'Guardar cambios')}</Button></>}
    >
      <div className="flex flex-col divide-y divide-[#efefef]">
        {FIELDS.map(f => {
          const c = changes[f]
          const hint =
            c.mode === 'Apply new' ? t('Replace this field for every selected asset.', 'Reemplaza este campo en todos los assets seleccionados.') : c.mode === 'Reset' ? t('Return every selected asset to the exercise default', 'Vuelve todos los assets seleccionados al valor del ejercicio') + ` (${f === 'rateLimit' ? `${shared.rateLimit} req/s` : f === 'vpnRequired' ? tv(vpnText(shared.vpnRequired)) : f === 'window' ? windowText(shared.window) : excludedLabel(shared.excludedTests)}).` : t('Leave each selected asset unchanged.', 'Deja cada asset seleccionado como está.')
          return (
            <div key={f} className="py-[14px] flex flex-col gap-[12px]">
              <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-[12px]">
                <div>
                  <p className="text-[14px] font-semibold">{fieldLabel(f)}</p>
                  <p className="mt-[6px] text-[11px] text-[#969a9c]">{hint}</p>
                </div>
                <span data-tour={`bulk-mode-${f}`} className="inline-flex"><Segmented size="sm" value={c.mode} options={['Keep current', 'Apply new', 'Reset'] as const} onChange={m => setChanges({ ...changes, [f]: { ...c, mode: m } })} /></span>
              </div>
              {c.mode === 'Apply new' && <div className="fade-up"><FieldEditor field={f} value={c} onChange={v => setChanges({ ...changes, [f]: v })} /></div>}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export function describeChanges(changes: BulkChanges, shared: SharedConfig) {
  const out: string[] = []
  const c = changes
  const reset = t('reset to default', 'vuelve al valor por defecto')
  const vpn = (v: boolean) => tv(vpnText(v)).toLowerCase()
  const tests = t('Excluded tests', 'Pruebas excluidas')
  const win = t('Testing window', 'Ventana de testing')
  if (c.rateLimit.mode === 'Apply new') out.push(`Rate limit: ${c.rateLimit.rateLimit} req/s`)
  if (c.rateLimit.mode === 'Reset') out.push(`Rate limit: ${reset} (${shared.rateLimit} req/s)`)
  if (c.vpnRequired.mode === 'Apply new') out.push(`VPN: ${vpn(c.vpnRequired.vpnRequired)}`)
  if (c.vpnRequired.mode === 'Reset') out.push(`VPN: ${reset} (${vpn(shared.vpnRequired)})`)
  if (c.excludedTests.mode === 'Apply new') out.push(`${tests}: ${excludedLabel(c.excludedTests.excludedTests)}`)
  if (c.excludedTests.mode === 'Reset') out.push(`${tests}: ${reset} (${excludedLabel(shared.excludedTests)})`)
  if (c.window.mode === 'Apply new') out.push(`${win}: ${windowText(c.window.window)}`)
  if (c.window.mode === 'Reset') out.push(`${win}: ${reset} (${windowText(shared.window)})`)
  return out
}

export function ConfirmBulkModal({ assets, lines, onClose, onSave }: { assets: Asset[]; lines: string[]; onClose: () => void; onSave: () => void }) {
  const types = Array.from(new Set(assets.map(a => a.type)))
  return (
    <Modal
      tourId="confirm-modal"
      title={t('Confirm bulk changes', 'Confirmar cambios masivos')}
      caption={t(`Review the impact before updating ${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}.`, `Revisá el impacto antes de actualizar ${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}.`)}
      onClose={onClose}
      footer={<><Button variant="ghost" className="w-[108px] h-[40px]" onClick={onClose}>{t('Cancel', 'Cancelar')}</Button><Button data-tour="confirm-save" className="h-[40px] px-[16px]" onClick={onSave}>{t('Save changes', 'Guardar cambios')}</Button></>}
    >
      <div className="flex gap-[10px] px-[14px] py-[10px] bg-[#fff6e9] text-[13px] leading-[20px] text-[#8a4b0f]">
        <TriangleAlert size={16} className="shrink-0 mt-[1px]" />
        <p><b>{t(`This action updates ${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}.`, `Esta acción actualiza ${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}.`)}</b> {t('Existing custom values in the fields below will be replaced. Unchanged fields and credentials will not be affected.', 'Se reemplazan los valores personalizados de estos campos. Los demás campos y las credenciales no cambian.')}</p>
      </div>
      <p className="mt-[18px] mb-[10px] text-[13px] font-semibold">{t('Fields to update', 'Campos a actualizar')}</p>
      <ul className="flex flex-col gap-[9px]">
        {lines.map(l => <li key={l} className="flex items-center gap-[8px] text-[13px] text-[#3e4345]"><Check size={14} className="text-[#1f9d6b]" />{l}</li>)}
      </ul>
      <p className="mt-[18px] mb-[10px] text-[13px] font-semibold">{t('Affected assets', 'Assets afectados')}</p>
      <div className="flex flex-col items-start gap-[8px]">
        {types.map(type => <Badge key={type} tone="type">{tv(type)} · {assets.filter(a => a.type === type).length}</Badge>)}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */

export function AssetDrawer({ asset, shared, overrides, onClose, onSave }: { asset: Asset; shared: SharedConfig; overrides: AssetOverrides; onClose: () => void; onSave: (o: AssetOverrides) => void }) {
  const [local, setLocal] = useState<AssetOverrides>(overrides)
  const eff = effective(shared, local)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])

  const setCustom = (f: FieldKey, on: boolean) => {
    const next = { ...local }
    if (on) (next as Record<FieldKey, unknown>)[f] = eff[f]
    else delete next[f]
    setLocal(next)
  }
  const inheritText: Record<FieldKey, string> = {
    rateLimit: t(`Inherit default (${shared.rateLimit} req/s)`, `Heredar (${shared.rateLimit} req/s)`),
    vpnRequired: t('Inherit default', 'Heredar') + ` (${tv(vpnText(shared.vpnRequired)).toLowerCase()})`,
    excludedTests: t('Inherit default', 'Heredar') + ` (${excludedLabel(shared.excludedTests).toLowerCase()})`,
    window: t('Inherit exercise', 'Heredar del ejercicio') + ` (${windowText(shared.window)})`,
  }
  const asChange: BulkChange = { mode: 'Apply new', ...eff }

  return (
    <div className="fixed inset-0 z-40" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-[#111315]/25 pointer-events-none" />
      <aside data-tour="drawer" role="dialog" aria-label={`${t('Asset configuration', 'Configuración del asset')} ${asset.name}`} className="slide-in absolute right-0 top-0 h-full w-full max-w-[404px] bg-white flex flex-col shadow-[-12px_0_40px_rgba(17,19,21,.15)]">
        <div className="relative px-[22px] pt-[30px] pb-[20px] bg-[#f7f7f7] border-b border-[#e5e5e5]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3px] text-[#3e4345]">{t('Asset configuration', 'Configuración del asset')}</p>
          <h2 className="mt-[6px] text-[20px] leading-[26px] font-medium">{asset.name}</h2>
          <button onClick={onClose} aria-label={t('Close', 'Cerrar')} className="absolute right-[22px] top-[30px] text-[#505557] hover:text-ink"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto px-[22px] py-[24px]">
          <div className="flex items-center gap-[12px] px-[16px] py-[12px] bg-[#f6f7f7] border-l-[3px] border-brand">
            <span className="grid place-items-center size-[40px] bg-brand text-[14px] font-bold text-[#3e4345]">{asset.name[0]}</span>
            <div>
              <p className="text-[13px] font-bold">{asset.name}</p>
              <p className="mt-[3px] text-[12px] text-[#666b6e]">{tv(asset.type)} · {tv(asset.environment)}</p>
              <p className="mt-[3px] font-code text-[11px] text-[#969a9c]">{asset.identifier}</p>
            </div>
          </div>
          {FIELDS.map(f => {
            const custom = local[f] !== undefined
            return (
              <div key={f} className="py-[20px] border-b border-[#e5e5e5] flex flex-col gap-[16px]">
                <p className="text-[14px] font-semibold">{f === 'vpnRequired' ? t('VPN access', 'Acceso por VPN') : fieldLabel(f)}</p>
                <div className="flex items-center gap-[20px] pl-[10px]">
                  <Checkbox checked={!custom} onChange={() => setCustom(f, false)} label={inheritText[f]} />
                  <span data-tour={`drawer-custom-${f}`} className="inline-flex"><Checkbox checked={custom} onChange={() => setCustom(f, true)} label={t('Set custom value', 'Valor personalizado')} /></span>
                </div>
                {custom && (
                  <div className="fade-up">
                    <FieldEditor field={f} value={asChange} onChange={v => setLocal({ ...local, [f]: v[f] })} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-end gap-[8px] px-[18px] py-[10px] bg-[#f3f3f2]">
          <Button variant="ghost" className="w-[108px] h-[40px]" onClick={onClose}>{t('Cancel', 'Cancelar')}</Button>
          <Button data-tour="drawer-save" className="h-[40px] px-[16px]" onClick={() => onSave(local)}>{t('Save changes', 'Guardar cambios')}</Button>
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */

type Row = Asset & { eff: SharedConfig; o: AssetOverrides }

const GROUPS: FilterGroup<Row>[] = [
  { key: 'type', label: 'Type', get: r => r.type, options: ['Web application', 'Mobile application', 'API'] },
  { key: 'config', label: 'Configuration', get: r => (hasOverrides(r.o) ? 'Custom overrides' : 'Inherits defaults'), options: ['Inherits defaults', 'Custom overrides'] },
  { key: 'vpn', label: 'VPN access', get: r => vpnText(r.eff.vpnRequired), options: ['Required', 'Not required'] },
]
const searchOf = (r: Row) => `${r.name} ${r.identifier}`

function Val({ children, custom }: { children: React.ReactNode; custom: boolean }) {
  return (
    <div>
      <p>{children}</p>
      {custom && <p className="flex items-center gap-[4px] text-[10px] font-semibold text-[#17575a] mt-[1px]"><span className="size-[5px] rounded-full bg-[#2bb9bd]" />{t('Custom override', 'Valor personalizado')}</p>}
    </div>
  )
}

export function ConfigureAssets({
  draft, shared, selectedIds, overrides, checked, setChecked, onAddSetting, onEditAsset, onEditDefaults,
}: {
  draft: ExerciseDraft; shared: SharedConfig; selectedIds: string[]; overrides: Record<string, AssetOverrides>
  checked: string[]; setChecked: (ids: string[]) => void; onAddSetting: () => void; onEditAsset: (id: string) => void; onEditDefaults: () => void
}) {
  const rows: Row[] = useMemo(
    () => ASSETS.filter(a => selectedIds.includes(a.id)).map(a => ({ ...a, o: overrides[a.id] ?? {}, eff: effective(shared, overrides[a.id]) })),
    [selectedIds, overrides, shared],
  )
  const api = useTableFilters(rows, GROUPS, searchOf)
  const ids = api.filtered.map(r => r.id)
  const allOn = ids.length > 0 && ids.every(id => checked.includes(id))
  const someOn = ids.some(id => checked.includes(id))
  const toggle = (id: string) => setChecked(checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id])

  return (
    <>
      <PageHeader
        title={t('Configure assets', 'Configurar assets')}
        caption={t('Review inherited settings, adjust individual assets, and resolve exceptions before testing.', 'Revisá la configuración heredada, ajustá assets puntuales y resolvé excepciones antes del testing.')}
        action={
          <div className="relative group">
            <Button data-tour="add-setting" variant="outline" onClick={onAddSetting} disabled={checked.length === 0} icon={<SlidersHorizontal size={15} strokeWidth={1.75} />}>{t('Add setting', 'Editar configuración')}</Button>
            {checked.length === 0 && (
              <span className="pointer-events-none absolute right-0 top-[42px] z-10 w-[220px] px-[10px] py-[8px] bg-ink text-white text-[12px] leading-[17px] opacity-0 group-hover:opacity-100 transition-opacity">
                {t('Select one or more assets in the table to edit their settings together.', 'Seleccioná uno o más assets de la tabla para editarlos juntos.')}
              </span>
            )}
          </div>
        }
      />

      <div data-tour="defaults" className="flex flex-wrap lg:flex-nowrap items-center gap-x-[18px] gap-y-[12px] px-[16px] py-[14px] bg-[#f7f7f7] border border-[#e2e3e3]">
        <div className="flex items-center gap-[10px] pr-[24px] lg:border-r border-[#dcdcdc] basis-full lg:basis-auto">
          <span className="section-icon grid place-items-center size-[30px] bg-brand"><PixelIcon name="sliders" size={18} /></span>
          <span className="text-[12px] font-bold">{t('Exercise defaults', 'Valores del ejercicio')}</span>
        </div>
        {[
          [t('Test depth', 'Profundidad'), tv(draft.depth)],
          [t('Include human verification', 'Validación humana'), draft.humanValidation ? t('Yes', 'Sí') : 'No'],
          [t('Date', 'Fecha'), `${formatDate(draft.startDate)} - ${formatDate(draft.endDate)}`],
          [t('Testing window', 'Ventana de testing'), windowText(shared.window)],
        ].map(([k, v], i) => (
          <div key={k} className={cx('flex-1 min-w-[120px] pr-[14px]', i < 3 && 'lg:border-r border-[#dcdcdc]')}>
            <p className="text-[10px] uppercase tracking-[0.4px] text-[#73787a]">{k}</p>
            <p className="mt-[4px] text-[12px] font-semibold truncate">{v}</p>
          </div>
        ))}
        <button onClick={onEditDefaults} aria-label={t('Edit exercise defaults', 'Editar valores del ejercicio')} className="grid place-items-center size-[30px] hover:bg-black/5"><Pencil size={17} /></button>
      </div>

      <TableToolbar
        api={api}
        groups={GROUPS}
        placeholder={t('Search assets', 'Buscar assets')}
        right={checked.length > 0 && <span className="text-[13px] font-semibold text-[#17575a]">{t(`${checked.length} selected for bulk edit`, `${checked.length} ${checked.length === 1 ? 'seleccionado' : 'seleccionados'} para edición masiva`)}</span>}
      />

      <div data-tour="config-table" className="bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="w-[42px]"><span data-tour="select-all" className="inline-flex"><Checkbox checked={allOn} indeterminate={!allOn && someOn} onChange={() => setChecked(allOn ? [] : ids)} /></span></Th>
              <Th>Asset</Th>
              <Th>{t('Type', 'Tipo')}</Th>
              <Th>Rate limit</Th>
              <Th>{t('VPN access', 'VPN')}</Th>
              <Th>{t('Excluded tests', 'Pruebas excluidas')}</Th>
              <Th>{t('Time start', 'Inicio')}</Th>
              <Th>{t('Time end', 'Fin')}</Th>
              <Th className="w-[50px]" />
            </tr>
          </thead>
          <tbody>
            {api.filtered.map(r => {
              const on = checked.includes(r.id)
              return (
                <tr key={r.id} className={cx('h-[54px] transition-colors', on ? 'bg-[#eefcfc]' : 'hover:bg-[#fafafa]')}>
                  <Td><Checkbox checked={on} onChange={() => toggle(r.id)} /></Td>
                  <Td>
                    <div className="flex items-center gap-[9px]">
                      <AssetMark name={r.name} />
                      <div>
                        <p className="font-bold text-ink">{r.name}</p>
                        <p className="text-[11px] leading-[17px] text-[#969a9c]">{r.identifier}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone="type">{r.type}</Badge></Td>
                  <Td><Val custom={r.o.rateLimit !== undefined}>{r.eff.rateLimit} req/s</Val></Td>
                  <Td><Val custom={r.o.vpnRequired !== undefined}>{tv(vpnText(r.eff.vpnRequired))}</Val></Td>
                  <Td><Val custom={r.o.excludedTests !== undefined}>{excludedLabel(r.eff.excludedTests)}</Val></Td>
                  <Td><Val custom={r.o.window !== undefined}>{r.eff.window.start} hs</Val></Td>
                  <Td><Val custom={r.o.window !== undefined}>{r.eff.window.end} hs</Val></Td>
                  <Td>
                    <button data-tour="edit-asset" onClick={() => onEditAsset(r.id)} aria-label={`${t('Edit', 'Editar')} ${r.name}`} className="grid place-items-center size-[30px] hover:bg-black/5"><Pencil size={17} /></button>
                  </Td>
                </tr>
              )
            })}
            {api.filtered.length === 0 && (
              <tr><td colSpan={9} className="py-[28px] text-center text-[13px] text-[#969a9c]">{t('No assets match your filters.', 'Ningún asset coincide con los filtros.')}</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}
