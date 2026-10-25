import type { ExerciseDraft } from '../data'
import { formatDate } from '../data'
import { t, tv } from '../i18n'
import { Badge } from '../components/ui'

// Pixel confetti offsets for the burst around the tick
const BURST = [[-52, -30], [52, -34], [-44, 36], [56, 28], [0, -58], [-62, 4], [64, -2], [8, 60]]

export function ExerciseCreated({ id, draft, assetCount, customCount }: { id: string; draft: ExerciseDraft; assetCount: number; customCount: number }) {
  return (
    <div className="flex flex-col items-center pt-[64px]">
      <div className="relative size-[64px]">
        <span className="done-shadow absolute left-[8px] top-[8px] size-[64px] bg-[#d9f7f8]" />
        {BURST.map(([dx, dy], i) => (
          <span key={i} className="done-px absolute left-[29px] top-[29px] size-[6px] bg-brand" style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as React.CSSProperties} />
        ))}
        <span className="done-box absolute inset-0 grid place-items-center bg-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111315" strokeWidth="1.9" strokeLinecap="square" strokeLinejoin="miter">
            <path className="done-check" d="M4.5 12.5l5 5L19.5 7" />
          </svg>
        </span>
      </div>
      <h1 className="mt-[34px] text-center text-[26px] leading-[32px] sm:text-[34px] sm:leading-[40px] font-medium tracking-[-0.3px]">{t('Exercise created', 'Ejercicio creado')}</h1>
      <p className="mt-[10px] max-w-[364px] text-center text-[14px] leading-[22px] text-[#73787a]">
        {t('Your exercise has been created. Review its configuration before coordinating the testing activities.', 'Tu ejercicio fue creado. Revisá su configuración antes de coordinar las actividades de testing.')}
      </p>
      <div data-tour="created-card" className="mt-[20px] w-full bg-white px-[14px] sm:px-[20px] py-[24px] sm:py-[32px] fade-up">
        <div className="flex items-stretch">
          <div className="flex-1 px-[16px] py-[12px] bg-[#b6f8fa] border-l-[4px] border-[#145c62]">
            <p className="text-[10px] uppercase tracking-[0.3px]">{t('Security exercise', 'Ejercicio de seguridad')}</p>
            <p className="mt-[4px] text-[14px] font-bold">{draft.name}</p>
          </div>
          <div className="grid place-items-center px-[14px] bg-[#effcfd]"><Badge>Complete</Badge></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-[12px] gap-y-[22px] px-[6px] sm:px-[14px] pt-[28px] sm:pt-[36px]">
          {[
            [t('Exercise ID', 'ID del ejercicio'), id],
            [t('Assets included', 'Assets incluidos'), `${assetCount} ${assetCount === 1 ? 'asset' : 'assets'}`],
            [t('Testing depth', 'Profundidad'), tv(draft.depth)],
            [t('Scheduled dates', 'Fechas programadas'), `${formatDate(draft.startDate)} – ${formatDate(draft.endDate)}`],
            [t('Human validation', 'Validación humana'), draft.humanValidation ? t('Requested', 'Solicitada') : t('Not requested', 'No solicitada')],
            [t('Configuration', 'Configuración'), t(`${customCount} custom ${customCount === 1 ? 'exception' : 'exceptions'}`, `${customCount} ${customCount === 1 ? 'excepción personalizada' : 'excepciones personalizadas'}`)],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] uppercase tracking-[0.4px] text-[#73787a]">{k}</p>
              <p className="mt-[6px] text-[12px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
