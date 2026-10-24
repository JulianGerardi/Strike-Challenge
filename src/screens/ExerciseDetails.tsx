import { CalendarDays, Clock, Info } from 'lucide-react'
import type { Depth, ExerciseDraft } from '../data'
import { RECURRENCES, TIME_ZONES } from '../data'
import { Badge, FieldLabel, PageHeader, SectionTitle, Select, Toggle, cx, inputClass } from '../components/ui'

const DEPTHS: { id: Depth; text: string; recommended?: boolean }[] = [
  { id: 'Basic', text: 'Focus on common vulnerabilities and essential security checks.' },
  { id: 'Standard', text: 'Broader testing of common attack paths and application logic.', recommended: true },
  { id: 'Comprehensive', text: 'Deeper testing across the agreed scope.' },
]

const card = 'bg-white rounded-[2px] p-[16px] sm:p-[22px] flex flex-col gap-[20px]'

function IconInput({ icon, type, value, onChange, placeholder, tour }: { icon: React.ReactNode; type: 'date' | 'time'; value: string; onChange: (v: string) => void; placeholder: string; tour?: string }) {
  return (
    <label data-tour={tour} className={cx(inputClass(!!value), 'relative flex items-center gap-[8px] h-[38px] px-[9px]')}>
      {icon}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} aria-label={placeholder} className="flex-1 bg-transparent outline-none text-[11px] text-ink [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
    </label>
  )
}

export function ExerciseDetails({ draft, setDraft, showErrors }: { draft: ExerciseDraft; setDraft: (d: ExerciseDraft) => void; showErrors: boolean }) {
  const set = <K extends keyof ExerciseDraft>(k: K, v: ExerciseDraft[K]) => setDraft({ ...draft, [k]: v })
  const nameError = showErrors && !draft.name.trim()
  const datesError = showErrors && draft.startDate && draft.endDate && draft.endDate < draft.startDate

  return (
    <>
      <PageHeader title="Create security exercise" caption="Define the scope and coordinate testing across multiple assets." />

      <section data-tour="details" className={card}>
        <SectionTitle icon="target" title="Exercise details" caption="Give your team a clear, recognizable definition of this engagement." />
        <div>
          <FieldLabel>Exercise name</FieldLabel>
          <input
            data-tour="exercise-name"
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Q4 Commerce Security Assessment"
            className={cx(inputClass(!!draft.name), 'h-[38px] px-[12px] max-w-[420px]', nameError && '!border-[#e05d5d]')}
          />
          {nameError && <p className="mt-[4px] text-[10px] text-[#c23b3b]">Give the exercise a name to continue.</p>}
        </div>
        <div>
          <FieldLabel>Objective</FieldLabel>
          <textarea
            data-tour="objective"
            value={draft.objective}
            maxLength={400}
            onChange={e => set('objective', e.target.value)}
            className={cx(inputClass(!!draft.objective), 'min-h-[96px] px-[12px] py-[11px] leading-[17px] resize-y')}
          />
          <p className="text-right text-[10px] leading-[15px] text-[#969a9c] mt-[6px]">{draft.objective.length}/400 characters</p>
        </div>
      </section>

      <section data-tour="depth" className={card}>
        <SectionTitle icon="depth" title="Testing depth" caption="Choose the level of coverage for the agreed scope." />
        <div role="radiogroup" data-tour="depth-options" className="grid grid-cols-1 sm:grid-cols-3 gap-[11px]">
          {DEPTHS.map(d => {
            const on = draft.depth === d.id
            return (
              <button
                key={d.id}
                role="radio"
                aria-checked={on}
                onClick={() => set('depth', d.id)}
                className={cx('relative text-left sm:min-h-[132px] p-[15px] border flex flex-col transition-colors', on ? 'bg-[#eefcfc] border-[#53cdd2] shadow-[inset_3px_0_0_#53cdd2]' : 'bg-white border-[#dedede] hover:border-[#b5dfe1]')}
              >
                <span className="pt-[4px] text-[13px] leading-[20px] font-bold tracking-[-0.2px]">{d.id}</span>
                <span className="pt-[7px] pr-[24px] pb-[12px] text-[10px] leading-[15px] text-[#666b6e]">{d.text}</span>
                {d.recommended && <span className="mt-auto"><Badge tone="soft">Recommended</Badge></span>}
                <span className="absolute right-[14px] top-[14px] grid place-items-center size-[17px] rounded-full border border-[#aeb3b5] bg-white">
                  {on && <span className="size-[9px] rounded-full bg-[#1fb5bb]" />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section data-tour="schedule" className={card}>
        <SectionTitle icon="schedule" title="Schedule" caption="Set when testing activity is allowed to occur." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
          <div><FieldLabel>Start date</FieldLabel><IconInput tour="start-date" type="date" icon={<CalendarDays size={16} />} value={draft.startDate} onChange={v => set('startDate', v)} placeholder="Pick a date" /></div>
          <div>
            <FieldLabel>End date</FieldLabel>
            <IconInput type="date" icon={<CalendarDays size={16} />} value={draft.endDate} onChange={v => set('endDate', v)} placeholder="Pick a date" />
            {datesError && <p className="mt-[4px] text-[10px] text-[#c23b3b]">End date must be after the start date.</p>}
          </div>
          <div data-tour="recurrence"><FieldLabel>Recurrence</FieldLabel><Select value={draft.recurrence} options={RECURRENCES} onChange={v => set('recurrence', v)} /></div>
          <div><FieldLabel>Start time</FieldLabel><IconInput type="time" icon={<Clock size={16} />} value={draft.startTime} onChange={v => set('startTime', v)} placeholder="Pick a time" /></div>
          <div><FieldLabel>End time</FieldLabel><IconInput type="time" icon={<Clock size={16} />} value={draft.endTime} onChange={v => set('endTime', v)} placeholder="Pick a time" /></div>
          <div><FieldLabel>Time zone</FieldLabel><Select value={draft.timeZone} options={TIME_ZONES} onChange={v => set('timeZone', v)} /></div>
        </div>
      </section>

      <section data-tour="validation" className={cx(card, 'gap-[17px]')}>
        <SectionTitle
          icon="validation"
          title="Include human hacker validation"
          caption="Add expert validation to complement automated findings."
          right={<span data-tour="validation-toggle" className="inline-flex"><Toggle checked={draft.humanValidation} onChange={v => set('humanValidation', v)} /></span>}
        />
        {draft.humanValidation && (
          <div className="fade-up flex flex-col gap-[16px]">
            <div className="flex items-center gap-[9px] px-[14px] py-[10px] bg-[#eefafa] border border-[#cbe9ea] text-[11px] leading-[17px] text-[#285b5e] tracking-[-0.2px]">
              <Info size={17} className="shrink-0" />
              Expert validation can be requested as part of this exercise. Availability and timing are confirmed separately; this setting does not schedule or guarantee a review.
            </div>
            <div>
              <FieldLabel>Validation notes (optional)</FieldLabel>
              <textarea value={draft.validationNotes} onChange={e => set('validationNotes', e.target.value)} className={cx(inputClass(false), 'min-h-[96px] px-[11px] py-[10px] leading-[17px] resize-y')} />
            </div>
          </div>
        )}
      </section>
    </>
  )
}
