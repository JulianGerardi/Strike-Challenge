import { Check, TriangleAlert } from 'lucide-react'
import type { AssetOverrides, ExerciseDraft, SharedConfig } from '../data'
import { ASSETS, excludedLabel, formatDate, hasOverrides } from '../data'
import { t, tv } from '../i18n'
import { AssetMark, Badge, PageHeader, cx } from '../components/ui'

function Section({ title, onEdit, children, tour }: { title: string; onEdit: () => void; children: React.ReactNode; tour?: string }) {

  return (
    <section data-tour={tour} className="bg-white">
      <div className="flex items-center justify-between h-[56px] sm:h-[66px] px-[16px] sm:px-[21px] bg-[#effbfb]">
        <h3 className="text-[13px] font-medium">{title}</h3>
        <button data-tour={tour ? `${tour}-edit` : undefined} onClick={onEdit} className="text-[10px] font-bold uppercase tracking-[0.3px] underline underline-offset-2 hover:text-[#2b9ea2]">{t('Edit', 'Editar')}</button>
      </div>
      <div className="px-[16px] sm:px-[21px] py-[20px]">{children}</div>
    </section>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.6px] text-[#73787a]">{k}</p>
      <p className="mt-[8px] text-[11px] font-semibold leading-[17px]">{v}</p>
    </div>
  )
}

export function overrideSummary(o: AssetOverrides, shared: SharedConfig) {
  const parts: string[] = []
  if (o.rateLimit !== undefined) parts.push(t(`Rate limit ${o.rateLimit} req/s (default ${shared.rateLimit})`, `Rate limit ${o.rateLimit} req/s (por defecto ${shared.rateLimit})`))
  if (o.vpnRequired !== undefined) parts.push(o.vpnRequired ? t('VPN required', 'Requiere VPN') : t('VPN not required', 'No requiere VPN'))
  if (o.excludedTests !== undefined) parts.push(o.excludedTests.length ? t(`${excludedLabel(o.excludedTests)} excluded`, `Excluidas: ${excludedLabel(o.excludedTests)}`) : t('No excluded tests', 'Sin pruebas excluidas'))
  if (o.window) parts.push(t(`Window ${o.window.start}–${o.window.end}`, `Ventana ${o.window.start}–${o.window.end}`))
  return parts.join(' · ')
}

export function Review({ draft, shared, selectedIds, overrides, onEditStep, onEditAsset }: { draft: ExerciseDraft; shared: SharedConfig; selectedIds: string[]; overrides: Record<string, AssetOverrides>; onEditStep: (i: number) => void; onEditAsset: (id: string) => void }) {
  const assets = ASSETS.filter(a => selectedIds.includes(a.id))
  const custom = assets.filter(a => hasOverrides(overrides[a.id]))
  const types = ['Web application', 'Mobile application', 'API'] as const
  const scheduleIssue = !draft.startDate || !draft.endDate || draft.endDate < draft.startDate
  const missing = (draft.name.trim() ? 0 : 1) + (assets.length ? 0 : 1)
  const ready = !scheduleIssue && missing === 0

  return (
    <>
      <PageHeader title={t('Review exercise', 'Revisar ejercicio')} caption={t('Confirm the scope and configuration before creating your exercise.', 'Confirmá el alcance y la configuración antes de crear el ejercicio.')} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-[22px] items-start">
        <div className="flex flex-col gap-[14px]">
          <Section title={t('Exercise details', 'Detalles del ejercicio')} onEdit={() => onEditStep(0)} tour="review-details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[18px]">
              <div className="sm:col-span-2"><KV k={t('Exercise name', 'Nombre')} v={draft.name || '—'} /></div>
              <div className="sm:col-span-2"><KV k={t('Objective', 'Objetivo')} v={draft.objective || '—'} /></div>
              <KV k={t('Testing depth', 'Profundidad')} v={tv(draft.depth)} />
              <KV k={t('Dates', 'Fechas')} v={`${formatDate(draft.startDate)} – ${formatDate(draft.endDate)}`} />
              <KV k={t('Recurrence', 'Recurrencia')} v={tv(draft.recurrence)} />
              <KV k={t('Testing window', 'Ventana de testing')} v={`${draft.startTime || '—'}–${draft.endTime || '—'} · ${draft.timeZone}`} />
              <KV k={t('Human validation', 'Validación humana')} v={draft.humanValidation ? t('Included (subject to confirmation)', 'Incluida (sujeta a confirmación)') : t('Not included', 'No incluida')} />
            </div>
          </Section>

          <Section title={t('Scope', 'Alcance')} onEdit={() => onEditStep(1)} tour="review-scope">
            <div className="flex flex-wrap gap-y-[10px] border-y border-[#e5e5e5] py-[12px] mb-[8px]">
              {[[t('Assets in scope', 'Assets en alcance'), assets.length] as const, ...types.map(t => [t, assets.filter(a => a.type === t).length] as const)].map(([k, n], i) => (
                <div key={k} className={cx('px-[24px] first:pl-[8px]', i < 3 && 'border-r border-[#e5e5e5]')}>
                  <p className="text-[16px] font-semibold">{n}</p>
                  <p className="mt-[4px] text-[9px] text-[#73787a]">{tv(k)}</p>
                </div>
              ))}
            </div>
            {assets.map(a => (
              <div key={a.id} className="flex items-center justify-between py-[9px] border-b border-[#f0f0f0] last:border-0">
                <div>
                  <p className="text-[10px] font-bold">{a.name}</p>
                  <p className="font-code text-[9px] text-[#969a9c]">{a.identifier}</p>
                </div>
                <Badge tone="type">{a.type}</Badge>
              </div>
            ))}
          </Section>

          <Section title={t('Shared configuration', 'Configuración compartida')} onEdit={() => onEditStep(2)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[18px]">
              <KV k={t('Default rate limit', 'Rate limit por defecto')} v={t(`${shared.rateLimit} requests per second`, `${shared.rateLimit} solicitudes por segundo`)} />
              <KV k={t('VPN access', 'Acceso por VPN')} v={shared.vpnRequired ? t('Required', 'Requerido') : t('Not required', 'No requerido')} />
              <KV k={t('Excluded tests', 'Pruebas excluidas')} v={excludedLabel(shared.excludedTests)} />
              <KV k={t('Allowed window', 'Ventana permitida')} v={`${shared.window.start}–${shared.window.end}`} />
            </div>
          </Section>

          <Section title={t('Custom configurations', 'Configuraciones personalizadas')} onEdit={() => onEditStep(2)} tour="review-custom">
            {custom.length === 0 && <p className="text-[11px] text-[#73787a]">{t('Every asset inherits the shared configuration.', 'Todos los assets heredan la configuración compartida.')}</p>}
            {custom.map(a => (
              <div key={a.id} className="flex items-center justify-between py-[12px] border-b border-[#ececec] last:border-0">
                <div className="flex items-center gap-[10px]">
                  <AssetMark name={a.name} />
                  <div>
                    <p className="text-[11px] font-bold">{a.name}</p>
                    <p className="mt-[3px] text-[9px] text-[#73787a]">{overrideSummary(overrides[a.id]!, shared)}</p>
                  </div>
                </div>
                <button onClick={() => onEditAsset(a.id)} className="text-[10px] font-bold uppercase tracking-[0.3px] underline underline-offset-2 hover:text-[#2b9ea2]">{t('Edit asset', 'Editar asset')}</button>
              </div>
            ))}
          </Section>
        </div>

        <aside data-tour="readiness" className="lg:sticky top-[64px] bg-white -order-1 lg:order-none">
          <div className={cx('flex items-center gap-[14px] px-[20px] py-[14px] border-l-[4px]', ready ? 'bg-[#e8f8ef] border-[#1f9d6b]' : 'bg-[#fff6e9] border-[#e0a14a]')}>
            <span className="grid place-items-center size-[38px] bg-white">{ready ? <Check size={18} className="text-[#1f9d6b]" /> : <TriangleAlert size={18} className="text-[#c27a17]" />}</span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.6px] text-[#73787a]">{t('Readiness', 'Estado')}</p>
              <p className="text-[15px] font-semibold">{ready ? t('Ready', 'Listo') : t('Needs attention', 'Requiere atención')}</p>
            </div>
          </div>
          <div className="px-[24px] py-[18px] flex flex-col gap-[14px] text-[10px]">
            {[
              [t('Assets reviewed', 'Assets revisados'), `${assets.length} / ${assets.length}`],
              [t('Missing required setup', 'Configuración faltante'), missing],
              [t('Schedule issues', 'Problemas de calendario'), scheduleIssue ? 1 : 0],
              [t('Custom exceptions', 'Excepciones personalizadas'), custom.length],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-[#505557]">{k}</span><b>{v}</b></div>
            ))}
            <p className="mt-[14px] text-[10px] leading-[15px] text-[#666b6e]">
              {ready ? t('All required configuration is complete. Creating the exercise will not start testing activity.', 'Toda la configuración requerida está completa. Crear el ejercicio no inicia la actividad de testing.') : t('Resolve the items above before creating the exercise.', 'Resolvé los puntos de arriba antes de crear el ejercicio.')}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
