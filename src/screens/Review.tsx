import { Check, TriangleAlert } from 'lucide-react'
import type { AssetOverrides, ExerciseDraft, SharedConfig } from '../data'
import { ASSETS, excludedLabel, formatDate, hasOverrides } from '../data'
import { AssetMark, Badge, PageHeader, cx } from '../components/ui'

function Section({ title, onEdit, children, tour }: { title: string; onEdit: () => void; children: React.ReactNode; tour?: string }) {

  return (
    <section data-tour={tour} className="bg-white">
      <div className="flex items-center justify-between h-[56px] sm:h-[66px] px-[16px] sm:px-[21px] bg-[#effbfb]">
        <h3 className="text-[13px] font-medium">{title}</h3>
        <button data-tour={tour ? `${tour}-edit` : undefined} onClick={onEdit} className="text-[10px] font-bold uppercase tracking-[0.3px] underline underline-offset-2 hover:text-[#2b9ea2]">Edit</button>
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
  if (o.rateLimit !== undefined) parts.push(`Rate limit ${o.rateLimit} req/s (default ${shared.rateLimit})`)
  if (o.vpnRequired !== undefined) parts.push(o.vpnRequired ? 'VPN required' : 'VPN not required')
  if (o.excludedTests !== undefined) parts.push(o.excludedTests.length ? `${o.excludedTests.join(', ')} excluded` : 'No excluded tests')
  if (o.window) parts.push(`Window ${o.window.start}–${o.window.end}`)
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
      <PageHeader title="Review exercise" caption="Confirm the scope and configuration before creating your exercise." />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-[22px] items-start">
        <div className="flex flex-col gap-[14px]">
          <Section title="Exercise details" onEdit={() => onEditStep(0)} tour="review-details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[18px]">
              <div className="sm:col-span-2"><KV k="Exercise name" v={draft.name || '—'} /></div>
              <div className="sm:col-span-2"><KV k="Objective" v={draft.objective || '—'} /></div>
              <KV k="Testing depth" v={draft.depth} />
              <KV k="Dates" v={`${formatDate(draft.startDate)} – ${formatDate(draft.endDate)}`} />
              <KV k="Recurrence" v={draft.recurrence} />
              <KV k="Testing window" v={`${draft.startTime || '—'}–${draft.endTime || '—'} · ${draft.timeZone}`} />
              <KV k="Human validation" v={draft.humanValidation ? 'Included (subject to confirmation)' : 'Not included'} />
            </div>
          </Section>

          <Section title="Scope" onEdit={() => onEditStep(1)} tour="review-scope">
            <div className="flex flex-wrap gap-y-[10px] border-y border-[#e5e5e5] py-[12px] mb-[8px]">
              {[['Assets in scope', assets.length] as const, ...types.map(t => [t, assets.filter(a => a.type === t).length] as const)].map(([k, n], i) => (
                <div key={k} className={cx('px-[24px] first:pl-[8px]', i < 3 && 'border-r border-[#e5e5e5]')}>
                  <p className="text-[16px] font-semibold">{n}</p>
                  <p className="mt-[4px] text-[9px] text-[#73787a]">{k}</p>
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

          <Section title="Shared configuration" onEdit={() => onEditStep(2)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[18px]">
              <KV k="Default rate limit" v={`${shared.rateLimit} requests per second`} />
              <KV k="VPN access" v={shared.vpnRequired ? 'Required' : 'Not required'} />
              <KV k="Excluded tests" v={excludedLabel(shared.excludedTests)} />
              <KV k="Allowed window" v={`${shared.window.start}–${shared.window.end}`} />
            </div>
          </Section>

          <Section title="Custom configurations" onEdit={() => onEditStep(2)} tour="review-custom">
            {custom.length === 0 && <p className="text-[11px] text-[#73787a]">Every asset inherits the shared configuration.</p>}
            {custom.map(a => (
              <div key={a.id} className="flex items-center justify-between py-[12px] border-b border-[#ececec] last:border-0">
                <div className="flex items-center gap-[10px]">
                  <AssetMark name={a.name} />
                  <div>
                    <p className="text-[11px] font-bold">{a.name}</p>
                    <p className="mt-[3px] text-[9px] text-[#73787a]">{overrideSummary(overrides[a.id]!, shared)}</p>
                  </div>
                </div>
                <button onClick={() => onEditAsset(a.id)} className="text-[10px] font-bold uppercase tracking-[0.3px] underline underline-offset-2 hover:text-[#2b9ea2]">Edit asset</button>
              </div>
            ))}
          </Section>
        </div>

        <aside data-tour="readiness" className="lg:sticky top-[64px] bg-white -order-1 lg:order-none">
          <div className={cx('flex items-center gap-[14px] px-[20px] py-[14px] border-l-[4px]', ready ? 'bg-[#e8f8ef] border-[#1f9d6b]' : 'bg-[#fff6e9] border-[#e0a14a]')}>
            <span className="grid place-items-center size-[38px] bg-white">{ready ? <Check size={18} className="text-[#1f9d6b]" /> : <TriangleAlert size={18} className="text-[#c27a17]" />}</span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.6px] text-[#73787a]">Readiness</p>
              <p className="text-[15px] font-semibold">{ready ? 'Ready' : 'Needs attention'}</p>
            </div>
          </div>
          <div className="px-[24px] py-[18px] flex flex-col gap-[14px] text-[10px]">
            {[
              ['Assets reviewed', `${assets.length} / ${assets.length}`],
              ['Missing required setup', missing],
              ['Schedule issues', scheduleIssue ? 1 : 0],
              ['Custom exceptions', custom.length],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-[#505557]">{k}</span><b>{v}</b></div>
            ))}
            <p className="mt-[14px] text-[10px] leading-[15px] text-[#666b6e]">
              {ready ? 'All required configuration is complete. Creating the exercise will not start testing activity.' : 'Resolve the items above before creating the exercise.'}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
