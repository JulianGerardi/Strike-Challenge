import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, MapPin, MousePointerClick, Send, X } from 'lucide-react'
import { STEPS, cx } from './ui'

export type Screen = 'list' | 'details' | 'assets' | 'configure' | 'review' | 'created'

export const SCREEN_LABEL: Record<Screen, string> = {
  list: 'Listado de ejercicios',
  details: 'Paso 1 · Exercise details',
  assets: 'Paso 2 · Select assets',
  configure: 'Paso 3 · Configure',
  review: 'Paso 4 · Review',
  created: 'Ejercicio creado',
}

export interface TourStep {
  screen: Screen
  /** data-tour id of the exact control the user has to use in this step. */
  target: string
  title: string
  text: string
  /** The step is done when the user clicks the highlighted control. */
  click?: boolean
}

export type GuideId = 'create' | 'apply'

export const GUIDES: Record<GuideId, { title: string; intro: string; steps: TourStep[] }> = {
  create: {
    title: 'Cómo crear un ejercicio',
    intro: 'Un ejercicio agrupa varios assets relacionados bajo una misma configuración. Se crea en 4 etapas:',
    steps: [
      { screen: 'list', target: 'create-exercise', title: 'Creá el ejercicio', text: 'Hacé clic en “Create exercise” para abrir el flujo guiado.', click: true },
      { screen: 'details', target: 'exercise-name', title: 'Poné un nombre', text: 'Escribí un nombre que tu equipo reconozca, por ejemplo “Q4 Commerce Security Assessment”.' },
      { screen: 'details', target: 'objective', title: 'Contá el objetivo', text: 'Describí qué querés evaluar. Tenés hasta 400 caracteres.' },
      { screen: 'details', target: 'depth-options', title: 'Elegí la profundidad', text: 'Seleccioná Basic, Standard o Comprehensive. Aplica a todos los assets del ejercicio.' },
      { screen: 'details', target: 'start-date', title: 'Definí las fechas', text: 'Elegí la fecha de inicio y luego la de fin. Abajo podés ajustar la ventana horaria.' },
      { screen: 'details', target: 'recurrence', title: 'Recurrencia', text: 'Indicá si el ejercicio se repite o es una única vez.' },
      { screen: 'details', target: 'validation-toggle', title: 'Validación humana', text: 'Activalo si querés que un especialista valide los hallazgos automáticos.' },
      { screen: 'details', target: 'continue', title: 'Pasá a los assets', text: 'Hacé clic en “Continue” para seleccionar los assets.', click: true },
      { screen: 'assets', target: 'filter', title: 'Filtrá el inventario', text: 'Usá “Filter” para acotar por tipo, entorno o estado. También podés buscar por nombre.' },
      { screen: 'assets', target: 'asset-row', title: 'Seleccioná un asset', text: 'Hacé clic en la fila para sumarla al ejercicio. Repetí con todos los que necesites.', click: true },
      { screen: 'assets', target: 'selection-count', title: 'Revisá cuántos llevás', text: 'El contador muestra cuántos assets van en el ejercicio.' },
      { screen: 'assets', target: 'continue', title: 'Configurá los assets', text: 'Hacé clic en “Continue” para pasar a la configuración.', click: true },
      { screen: 'configure', target: 'continue', title: 'Configuración', text: 'Los assets ya heredan los valores del ejercicio. Si no necesitás cambios, hacé clic en “Continue”.', click: true },
      { screen: 'review', target: 'readiness', title: 'Revisá antes de crear', text: 'Este panel te avisa si falta algo. Si necesitás cambiar algo, usá “Edit” en la sección y volvés directo acá.' },
      { screen: 'review', target: 'continue', title: 'Creá el ejercicio', text: 'Hacé clic en “Create exercise”. Esto no inicia las pruebas todavía.', click: true },
    ],
  },
  apply: {
    title: 'Cómo aplicar la configuración a los assets',
    intro: 'Los assets heredan la configuración del ejercicio. Podés cambiarla en bloque o asset por asset:',
    steps: [
      { screen: 'configure', target: 'select-all', title: 'Seleccioná los assets', text: 'Marcá la casilla para seleccionar todos (o marcá fila por fila).', click: true },
      { screen: 'configure', target: 'add-setting', title: 'Abrí la edición masiva', text: 'Hacé clic en “Add setting” para cambiar un parámetro en todos los seleccionados.', click: true },
      { screen: 'configure', target: 'bulk-mode-rateLimit', title: 'Elegí qué cambiar', text: 'En “Rate limit” elegí “Apply new” y seleccioná el valor. Lo que dejes en “Keep current” no se toca.' },
      { screen: 'configure', target: 'bulk-save', title: 'Guardá', text: 'Hacé clic en “Save changes”.', click: true },
      { screen: 'configure', target: 'confirm-save', title: 'Confirmá el impacto', text: 'Revisá qué campos y cuántos assets cambian, y confirmá.', click: true },
      { screen: 'configure', target: 'edit-asset', title: 'Ajustá un asset', text: 'Hacé clic en el lápiz para abrir la configuración individual.', click: true },
      { screen: 'configure', target: 'drawer-custom-vpnRequired', title: 'Definí una excepción', text: 'Marcá “Set custom value” y elegí el valor propio de este asset.', click: true },
      { screen: 'configure', target: 'drawer-save', title: 'Guardá la excepción', text: 'Hacé clic en “Save changes”. En la tabla vas a ver “Custom override”.', click: true },
      { screen: 'configure', target: 'continue', title: 'Pasá a la revisión', text: 'Hacé clic en “Continue”.', click: true },
      { screen: 'review', target: 'review-custom', title: 'Revisá las excepciones', text: 'Acá ves qué assets tienen configuración propia. “Edit asset” abre el mismo panel sin salir de la revisión.' },
    ],
  },
}

const STEP_INDEX: Partial<Record<Screen, number>> = { details: 0, assets: 1, configure: 2, review: 3 }

/* ------------------------------------------------------------------ */
/* Tour overlay                                                        */
/* ------------------------------------------------------------------ */

function findTarget(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
  return all.find(el => el.getClientRects().length > 0) ?? null
}

/** The target's box clipped to its scrolling ancestors, so wide table rows on small screens stay inside the view. */
function visibleRect(el: Element) {
  const r = el.getBoundingClientRect()
  let left = r.left, right = r.right
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.scrollWidth > p.clientWidth && getComputedStyle(p).overflowX !== 'visible') {
      const pr = p.getBoundingClientRect()
      left = Math.max(left, pr.left); right = Math.min(right, pr.right)
    }
  }
  return new DOMRect(left, r.top, Math.max(0, right - left), r.height)
}

export function TourOverlay({ step, index, total, onNext, onPrev, onClose, onTargetClick }: { step: TourStep; index: number; total: number; onNext: () => void; onPrev: () => void; onClose: () => void; onTargetClick: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const clickRef = useRef(onTargetClick)
  clickRef.current = onTargetClick

  // Click steps finish when the user uses the highlighted control itself.
  useEffect(() => {
    if (!step.click) return
    const onDoc = (e: MouseEvent) => {
      const el = findTarget(step.target)
      if (!el || !el.contains(e.target as Node)) return
      // Bind to this step now: by the time the timer fires the overlay may already show the next one.
      const advance = clickRef.current
      window.setTimeout(advance, 250)
    }
    document.addEventListener('click', onDoc, true)
    return () => document.removeEventListener('click', onDoc, true)
  }, [step])
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(150)

  useEffect(() => {
    let raf = 0
    let tries = 0
    const scrollOnce = () => {
      const el = findTarget(step.target)
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      else if (tries++ < 30) raf = requestAnimationFrame(scrollOnce)
    }
    scrollOnce()
    return () => cancelAnimationFrame(raf)
  }, [step.target, step.screen])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = findTarget(step.target)
      const r = el ? visibleRect(el) : null
      setRect(prev => (prev && r && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height ? prev : r))
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [step.target])

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [step, rect?.width])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose, onNext, onPrev])

  const pad = 6
  const W = 300
  let top = 120
  let left = window.innerWidth / 2 - W / 2
  if (rect) {
    const below = rect.bottom + pad + 14
    top = below + cardH < window.innerHeight - 12 ? below : Math.max(12, rect.top - pad - 14 - cardH)
    left = Math.min(Math.max(12, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - 12)
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {rect ? (
        <div
          className="tour-ring absolute border-2 border-brand"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0a0c0e]/55" />
      )}
      <div ref={cardRef} className="tour-card absolute pointer-events-auto bg-white shadow-[0_18px_48px_rgba(0,0,0,.28)] fade-up" style={{ top, left, width: W }} role="dialog" aria-label={step.title}>
        <div className="flex items-center justify-between px-[14px] pt-[12px]">
          <span className="text-[9px] uppercase tracking-[0.6px] text-[#2b9ea2] font-bold">Paso {index + 1} de {total}</span>
          <button onClick={onClose} aria-label="Cerrar tour" className="text-[#73787a] hover:text-ink"><X size={15} /></button>
        </div>
        <div className="h-[3px] mx-[14px] mt-[8px] bg-[#eef0f0]">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="px-[14px] pt-[10px] pb-[12px]">
          <p className="text-[13px] font-semibold">{step.title}</p>
          <p className="mt-[4px] text-[11px] leading-[16px] text-[#505557]">{step.text}</p>
          {step.click && rect && (
            <p className="mt-[8px] flex items-center gap-[5px] text-[10px] font-semibold text-[#17575a]"><MousePointerClick size={12} />Hacé clic en lo resaltado para seguir</p>
          )}
          {!rect && (
            <p className="mt-[8px] text-[10px] text-[#a0631a]">Este elemento no está visible ahora. Volvé un paso atrás para hacerlo aparecer.</p>
          )}
        </div>
        <div className="flex items-center justify-between px-[10px] py-[8px] bg-[#f7f7f7]">
          <button onClick={onPrev} disabled={index === 0} className="h-[28px] px-[10px] text-[10px] font-bold uppercase tracking-[0.3px] disabled:opacity-30">Atrás</button>
          <button onClick={onNext} className="inline-flex items-center gap-[6px] h-[28px] px-[12px] bg-brand border border-brand-border text-[10px] font-bold uppercase tracking-[0.3px]">
            {index + 1 === total ? 'Terminar' : 'Siguiente'} <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

type MsgBody = { from: 'user' | 'bot'; text: string } | { from: 'bot'; guide: GuideId }
type Msg = MsgBody & { id: number }

const QUICK = ['¿Cómo creo un ejercicio?', '¿Cómo aplico la configuración a los assets?', '¿En qué paso estoy?']

function intent(text: string): 'create' | 'apply' | 'where' | 'filters' | 'hello' | 'unknown' {
  const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/(donde|paso|estoy|ubic)/.test(t)) return 'where'
  if (/(asset|activo|aplic|masiv|bulk|config|override|excepci)/.test(t)) return 'apply'
  if (/(crea|nuevo|ejercicio|empez)/.test(t)) return 'create'
  if (/(filtr|busc|tabla)/.test(t)) return 'filters'
  if (/(hola|buen|hey|hi)/.test(t)) return 'hello'
  return 'unknown'
}

function GuideCard({ guide, screen, tourIndex, onStart, onJump }: { guide: GuideId; screen: Screen; tourIndex: number | null; onStart: () => void; onJump: (i: number) => void }) {
  const g = GUIDES[guide]
  const here = g.steps.findIndex(s => s.screen === screen)
  return (
    <div className="bg-white border border-[#e5e5e5] w-full">
      <div className="px-[12px] pt-[10px] pb-[8px]">
        <p className="text-[12px] font-semibold">{g.title}</p>
        <p className="mt-[4px] text-[10.5px] leading-[15px] text-[#505557]">{g.intro}</p>
      </div>
      <ol className="px-[6px] pb-[6px]">
        {g.steps.map((s, i) => {
          const active = tourIndex === i
          const isHere = tourIndex === null && s.screen === screen
          return (
            <li key={i}>
              <button
                onClick={() => onJump(i)}
                className={cx('w-full flex items-start gap-[8px] px-[6px] py-[5px] text-left transition-colors', active ? 'bg-brand' : isHere ? 'bg-brand-soft' : 'hover:bg-[#f5f5f5]')}
              >
                <span className={cx('grid place-items-center size-[16px] shrink-0 text-[8px] font-bold mt-[1px]', active || isHere ? 'bg-ink text-white' : 'bg-[#eef0f0] text-[#505557]')}>{i + 1}</span>
                <span className="text-[10.5px] leading-[15px]">
                  {s.title}
                  {(active || (isHere && i === here)) && <span className="ml-[6px] inline-flex items-center gap-[2px] text-[9px] font-bold text-[#17575a]"><MapPin size={9} />{active ? 'en curso' : 'estás acá'}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <button onClick={onStart} className="w-full h-[34px] flex items-center justify-center gap-[6px] bg-ink text-white text-[10px] font-bold uppercase tracking-[0.4px] hover:bg-[#24282a]">
        {here >= 0 ? 'Mostrarme desde donde estoy' : 'Iniciar tour'} <ArrowRight size={13} />
      </button>
    </div>
  )
}

export function Assistant({
  open, setOpen, screen, tour, onStartTour,
}: {
  open: boolean; setOpen: (v: boolean) => void; screen: Screen
  tour: { guide: GuideId; index: number } | null
  onStartTour: (guide: GuideId, index: number) => void
}) {
  const idRef = useRef(1)
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 0, from: 'bot', text: '¡Hola Sarah! 👋 Soy el asistente de Strike. Te puedo mostrar cómo crear un ejercicio y cómo aplicar su configuración a los assets, marcándote en pantalla cada paso.' },
  ])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll so the start of the newest message is visible (guide cards are taller than the panel).
  useEffect(() => {
    const list = listRef.current
    const last = list?.lastElementChild as HTMLElement | null
    if (!list || !last) return
    list.scrollTo({ top: Math.max(0, last.offsetTop - 12), behavior: 'smooth' })
  }, [msgs, typing, open])

  const push = useCallback((m: MsgBody) => setMsgs(ms => [...ms, { ...m, id: idRef.current++ }]), [])

  const reply = useCallback(
    (text: string) => {
      push({ from: 'user', text })
      setTyping(true)
      const kind = intent(text)
      window.setTimeout(() => {
        setTyping(false)
        if (kind === 'create' || kind === 'apply') {
          push({ from: 'bot', guide: kind })
        } else if (kind === 'where') {
          const idx = STEP_INDEX[screen]
          push({
            from: 'bot',
            text:
              idx === undefined
                ? `Estás en: ${SCREEN_LABEL[screen]}. ${screen === 'list' ? 'Desde acá podés crear un ejercicio nuevo.' : 'Volvé al listado para ver tu ejercicio.'}`
                : `Estás en ${SCREEN_LABEL[screen]}. Te ${STEPS.length - idx - 1 === 1 ? 'queda 1 etapa' : `quedan ${STEPS.length - idx - 1} etapas`} para terminar. ¿Querés que te marque en pantalla qué hacer acá?`,
          })
          if (idx !== undefined) push({ from: 'bot', guide: screen === 'configure' ? 'apply' : 'create' })
        } else if (kind === 'filters') {
          push({ from: 'bot', text: 'Todas las tablas tienen búsqueda y el botón “Filter”: combiná filtros por columna (tipo, entorno, estado, configuración). Los filtros activos aparecen como chips y los podés quitar de a uno.' })
        } else if (kind === 'hello') {
          push({ from: 'bot', text: '¡Hola! ¿Querés ver cómo crear un ejercicio o cómo aplicar la configuración a los assets?' })
        } else {
          push({ from: 'bot', text: 'No estoy seguro de haber entendido. Puedo guiarte para crear un ejercicio, aplicar configuración a los assets o decirte en qué paso estás.' })
        }
      }, 650)
    },
    [push, screen],
  )

  const send = () => {
    const t = input.trim()
    if (!t) return
    setInput('')
    reply(t)
  }

  const startFromHere = (guide: GuideId) => {
    const here = GUIDES[guide].steps.findIndex(s => s.screen === screen)
    onStartTour(guide, Math.max(0, here))
  }

  const stepIdx = STEP_INDEX[screen]

  return (
    <>

      {open && (
        <div role="dialog" aria-label="Asistente de Strike" className="fade-up fixed z-50 bottom-[72px] left-[12px] md:left-[112px] w-[min(360px,calc(100vw-24px))] h-[540px] max-h-[calc(100dvh-140px)] flex flex-col bg-[#fafafa] shadow-[0_24px_64px_rgba(17,19,21,.28)] border border-[#e5e5e5]">
          <div className="flex items-center gap-[10px] px-[14px] h-[54px] bg-[#111315] text-white shrink-0">
            <span className="grid place-items-center size-[30px] bg-brand text-ink"><Bot size={17} /></span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold">Strike Assistant</p>
              <p className="text-[10px] text-[#9fe9eb]">Te guío paso a paso</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-[#c9cccd] hover:text-white"><X size={16} /></button>
          </div>

          <div className="px-[14px] py-[9px] bg-white border-b border-[#ececec] shrink-0">
            <p className="flex items-center gap-[5px] text-[9px] uppercase tracking-[0.5px] text-[#73787a]"><MapPin size={10} className="text-[#2b9ea2]" />Estás en</p>
            <p className="mt-[2px] text-[11px] font-semibold">{SCREEN_LABEL[screen]}</p>
            <div className="mt-[6px] flex gap-[3px]">
              {STEPS.map((s, i) => (
                <span key={s} title={s} className={cx('h-[4px] flex-1 transition-colors duration-300', stepIdx === undefined ? (screen === 'created' ? 'bg-brand-dark' : 'bg-[#e5e7e7]') : i < stepIdx ? 'bg-brand-dark' : i === stepIdx ? 'bg-brand' : 'bg-[#e5e7e7]')} />
              ))}
            </div>
          </div>

          <div ref={listRef} className="relative flex-1 overflow-auto px-[12px] py-[12px] flex flex-col gap-[8px]">
            {msgs.map(m =>
              'guide' in m ? (
                <div key={m.id} className="fade-up">
                  <GuideCard
                    guide={m.guide}
                    screen={screen}
                    tourIndex={tour?.guide === m.guide ? tour.index : null}
                    onStart={() => startFromHere(m.guide)}
                    onJump={i => onStartTour(m.guide, i)}
                  />
                </div>
              ) : (
                <div key={m.id} className={cx('fade-up max-w-[85%] px-[11px] py-[8px] text-[11px] leading-[16px]', m.from === 'user' ? 'self-end bg-ink text-white' : 'self-start bg-white border border-[#e5e5e5]')}>
                  {m.text}
                </div>
              ),
            )}
            {typing && (
              <div className="self-start px-[11px] py-[9px] bg-white border border-[#e5e5e5] typing text-[14px] leading-[8px]" aria-label="Escribiendo">
                <span>•</span><span>•</span><span>•</span>
              </div>
            )}
          </div>

          <div className="px-[10px] pt-[8px] flex gap-[5px] overflow-x-auto shrink-0 [scrollbar-width:none]">
            {QUICK.map(q => (
              <button key={q} onClick={() => reply(q)} className="shrink-0 h-[24px] px-[9px] bg-white border border-[#bde7e9] text-[10px] text-[#17575a] hover:bg-brand-soft whitespace-nowrap">{q}</button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); send() }} className="flex items-center gap-[6px] m-[10px] h-[38px] px-[10px] bg-white border border-[#dcdcdc] focus-within:border-[#2bb9bd] shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribí tu pregunta…" className="flex-1 bg-transparent outline-none text-[11px]" />
            <button type="submit" aria-label="Enviar" disabled={!input.trim()} className="grid place-items-center size-[26px] bg-brand disabled:opacity-40"><Send size={13} /></button>
          </form>
        </div>
      )}
    </>
  )
}

/** Launcher that sits in the page flow under the content, as in the design. */
export function AssistantLauncher({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="self-start">
      <button
        data-tour="assistant"
        onClick={onToggle}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="grid place-items-center w-[44px] h-[48px] bg-brand hover:bg-[#6edadd] transition-colors"
      >
        {open ? <X size={20} /> : <Bot size={20} strokeWidth={1.75} />}
      </button>
    </div>
  )
}
