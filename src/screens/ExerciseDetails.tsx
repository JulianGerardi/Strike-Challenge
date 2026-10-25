import { CalendarDays, Clock, Info } from 'lucide-react'
import type { Depth, ExerciseDraft } from '../data'
import { RECURRENCES, TIME_ZONES } from '../data'
import { t, tv } from '../i18n'
import { Badge, FieldLabel, PageHeader, PickerInput, SectionTitle, Select, Toggle, cx, inputClass } from '../components/ui'

const DEPTHS: { id: Depth; text: () => string; recommended?: boolean }[] = [
  { id: 'Basic', text: () => t('Focus on common vulnerabilities and essential security checks.', 'Foco en vulnerabilidades comunes y controles de seguridad esenciales.') },
  { id: 'Standard', text: () => t('Broader testing of common attack paths and application logic.', 'Testing más amplio de vectores de ataque comunes y lógica de la aplicación.'), recommended: true },
  { id: 'Comprehensive', text: () => t('Deeper testing across the agreed scope.', 'Testing en profundidad sobre todo el alcance acordado.') },
]

const card = 'bg-white rounded-[2px] p-[16px] sm:p-[22px] flex flex-col gap-[20px]'


export function ExerciseDetails({ draft, setDraft, showErrors }: { draft: ExerciseDraft; setDraft: (d: ExerciseDraft) => void; showErrors: boolean }) {
  const set = <K extends keyof ExerciseDraft>(k: K, v: ExerciseDraft[K]) => setDraft({ ...draft, [k]: v })
  const nameError = showErrors && !draft.name.trim()
  const startMissing = showErrors && !draft.startDate
  const endMissing = showErrors && !draft.endDate
  const datesError = showErrors && draft.startDate && draft.endDate && draft.endDate < draft.startDate

  return (
    <>
      <PageHeader title={t('Create security exercise', 'Crear ejercicio de seguridad')} caption={t('Define the scope and coordinate testing across multiple assets.', 'Definí el alcance y coordiná el testing en varios assets.')} />

      <section data-tour="details" className={card}>
        <SectionTitle icon="target" title={t('Exercise details', 'Detalles del ejercicio')} caption={t('Give your team a clear, recognizable definition of this engagement.', 'Dale a tu equipo una definición clara y reconocible de este trabajo.')} />
        <div>
          <FieldLabel>{t('Exercise name', 'Nombre del ejercicio')}</FieldLabel>
          <input
            data-tour="exercise-name"
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            placeholder={t('e.g. Q4 Commerce Security Assessment', 'ej. Evaluación de seguridad Q4')}
            className={cx(inputClass(), 'h-[38px] px-[12px] max-w-[420px]', nameError && '!border-[#e05d5d]')}
          />
          {nameError && <p className="mt-[4px] text-[12px] text-[#c23b3b]">{t('Give the exercise a name to continue.', 'Poné un nombre al ejercicio para continuar.')}</p>}
        </div>
        <div>
          <FieldLabel>{t('Objective', 'Objetivo')}</FieldLabel>
          <textarea
            data-tour="objective"
            value={draft.objective}
            maxLength={400}
            onChange={e => set('objective', e.target.value)}
            className={cx(inputClass(), 'min-h-[96px] px-[12px] py-[11px] leading-[20px] resize-y')}
          />
          <p className="text-right text-[12px] leading-[18px] text-[#969a9c] mt-[6px]">{draft.objective.length}/400 {t('characters', 'caracteres')}</p>
        </div>
      </section>

      <section data-tour="depth" className={card}>
        <SectionTitle icon="depth" title={t('Testing depth', 'Profundidad del testing')} caption={t('Choose the level of coverage for the agreed scope.', 'Elegí el nivel de cobertura para el alcance acordado.')} />
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
                <span className="pt-[4px] text-[15px] leading-[22px] font-bold tracking-[-0.2px]">{tv(d.id)}</span>
                <span className="pt-[7px] pr-[24px] pb-[12px] text-[12px] leading-[18px] text-[#666b6e]">{d.text()}</span>
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
        <SectionTitle icon="schedule" title={t('Schedule', 'Calendario')} caption={t('Set when testing activity is allowed to occur.', 'Definí cuándo puede ocurrir la actividad de testing.')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
          <div><FieldLabel>{t('Start date', 'Fecha de inicio')}</FieldLabel><PickerInput tour="start-date" error={startMissing} type="date" icon={<CalendarDays size={16} />} value={draft.startDate} onChange={v => set('startDate', v)} label={t('Pick a date', 'Elegí una fecha')} />{startMissing && <p className="mt-[4px] text-[12px] text-[#c23b3b]">{t('Pick a start date.', 'Elegí la fecha de inicio.')}</p>}</div>
          <div>
            <FieldLabel>{t('End date', 'Fecha de fin')}</FieldLabel>
            <PickerInput type="date" error={endMissing || !!datesError} icon={<CalendarDays size={16} />} value={draft.endDate} onChange={v => set('endDate', v)} label={t('Pick a date', 'Elegí una fecha')} />
            {endMissing && <p className="mt-[4px] text-[12px] text-[#c23b3b]">{t('Pick an end date.', 'Elegí la fecha de fin.')}</p>}
            {datesError && <p className="mt-[4px] text-[12px] text-[#c23b3b]">{t('End date must be after the start date.', 'La fecha de fin debe ser posterior a la de inicio.')}</p>}
          </div>
          <div data-tour="recurrence"><FieldLabel>{t('Recurrence', 'Recurrencia')}</FieldLabel><Select value={draft.recurrence} options={RECURRENCES} placeholder={t('Select recurrence', 'Elegí la recurrencia')} onChange={v => set('recurrence', v)} /></div>
          <div><FieldLabel>{t('Start time', 'Hora de inicio')}</FieldLabel><PickerInput type="time" icon={<Clock size={16} />} value={draft.startTime} onChange={v => set('startTime', v)} label={t('Pick a time', 'Elegí una hora')} /></div>
          <div><FieldLabel>{t('End time', 'Hora de fin')}</FieldLabel><PickerInput type="time" icon={<Clock size={16} />} value={draft.endTime} onChange={v => set('endTime', v)} label={t('Pick a time', 'Elegí una hora')} /></div>
          <div><FieldLabel>{t('Time zone', 'Zona horaria')}</FieldLabel><Select value={draft.timeZone} options={TIME_ZONES} placeholder={t('Select a time zone', 'Elegí la zona horaria')} onChange={v => set('timeZone', v)} /></div>
        </div>
      </section>

      <section data-tour="validation" className={cx(card, 'gap-[17px]')}>
        <SectionTitle
          icon="validation"
          title={t('Include human hacker validation', 'Incluir validación de un hacker humano')}
          caption={t('Add expert validation to complement automated findings.', 'Sumá validación experta para complementar los hallazgos automáticos.')}
          right={<span data-tour="validation-toggle" className="inline-flex"><Toggle checked={draft.humanValidation} onChange={v => set('humanValidation', v)} /></span>}
        />
        {draft.humanValidation && (
          <div className="fade-up flex flex-col gap-[16px]">
            <div className="flex items-center gap-[9px] px-[14px] py-[10px] bg-[#eefafa] border border-[#cbe9ea] text-[13px] leading-[20px] text-[#285b5e] tracking-[-0.2px]">
              <Info size={17} className="shrink-0" />
              {t('Expert validation can be requested as part of this exercise. Availability and timing are confirmed separately; this setting does not schedule or guarantee a review.', 'Podés pedir validación experta como parte de este ejercicio. La disponibilidad y los tiempos se confirman aparte; esta opción no agenda ni garantiza una revisión.')}
            </div>
            <div>
              <FieldLabel>{t('Validation notes (optional)', 'Notas para la validación (opcional)')}</FieldLabel>
              <textarea value={draft.validationNotes} onChange={e => set('validationNotes', e.target.value)} className={cx(inputClass(), 'min-h-[96px] px-[11px] py-[10px] leading-[20px] resize-y')} />
            </div>
          </div>
        )}
      </section>
    </>
  )
}
