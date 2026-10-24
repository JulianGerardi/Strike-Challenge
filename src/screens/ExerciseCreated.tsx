import { Check } from 'lucide-react'
import type { ExerciseDraft } from '../data'
import { formatDate } from '../data'
import { Badge } from '../components/ui'

export function ExerciseCreated({ id, draft, assetCount, customCount }: { id: string; draft: ExerciseDraft; assetCount: number; customCount: number }) {
  return (
    <div className="flex flex-col items-center pt-[64px]">
      <div className="relative size-[64px] fade-up">
        <span className="absolute left-[8px] top-[8px] size-[64px] bg-[#d9f7f8]" />
        <span className="absolute inset-0 grid place-items-center bg-brand"><Check size={26} strokeWidth={1.75} /></span>
      </div>
      <h1 className="mt-[34px] text-[30px] leading-[36px] font-medium tracking-[-0.3px]">Exercise created</h1>
      <p className="mt-[10px] max-w-[364px] text-center text-[12px] leading-[19px] text-[#73787a]">
        Your exercise has been created. Review its configuration before coordinating the testing activities.
      </p>
      <div data-tour="created-card" className="mt-[20px] w-full bg-white px-[20px] py-[32px] fade-up">
        <div className="flex items-stretch">
          <div className="flex-1 px-[16px] py-[12px] bg-[#b6f8fa] border-l-[4px] border-[#145c62]">
            <p className="text-[8px] uppercase tracking-[0.3px]">Security exercise</p>
            <p className="mt-[4px] text-[14px] font-bold">{draft.name}</p>
          </div>
          <div className="grid place-items-center px-[14px] bg-[#effcfd]"><Badge>Complete</Badge></div>
        </div>
        <div className="grid grid-cols-3 gap-y-[22px] px-[14px] pt-[36px]">
          {[
            ['Exercise ID', id],
            ['Assets included', `${assetCount} assets`],
            ['Testing depth', draft.depth],
            ['Scheduled dates', `${formatDate(draft.startDate)} – ${formatDate(draft.endDate)}`],
            ['Human validation', draft.humanValidation ? 'Requested' : 'Not requested'],
            ['Configuration', `${customCount} custom ${customCount === 1 ? 'exception' : 'exceptions'}`],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[8px] uppercase tracking-[0.4px] text-[#73787a]">{k}</p>
              <p className="mt-[6px] text-[10px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
