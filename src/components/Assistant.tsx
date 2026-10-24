import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, MapPin, Send, X } from 'lucide-react'
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
  target: string
  title: string
  text: string
}

export type GuideId = 'create' | 'apply'

export const GUIDES: Record<GuideId, { title: string; intro: string; steps: TourStep[] }> = {
  create: {
    title: 'Cómo crear un ejercicio',
    intro: 'Un ejercicio agrupa varios assets relacionados bajo una misma configuración. Se crea en 4 etapas:',
    steps: [
      { screen: 'list', target: 'create-exercise', title: 'Empezá desde el listado', text: 'Presioná “Create exercise” para abrir el flujo guiado.' },
      { screen: 'details', target: 'stepper', title: 'El stepper te ubica', text: 'Siempre vas a ver en qué etapa estás y cuáles te quedan por completar.' },
      { screen: 'details', target: 'details', title: 'Nombre y objetivo', text: 'Dale un nombre reconocible y explicá qué querés evaluar.' },
      { screen: 'details', target: 'depth', title: 'Profundidad de las pruebas', text: 'Elegí Basic, Standard o Comprehensive. Aplica a todo el ejercicio.' },
      { screen: 'details', target: 'schedule', title: 'Cronograma', text: 'Definí fechas, ventana horaria, recurrencia y zona horaria.' },
      { screen: 'details', target: 'validation', title: 'Validación humana', text: 'Si lo activás, un especialista valida los hallazgos automáticos.' },
      { screen: 'details', target: 'continue', title: 'Continuá', text: 'Cuando el formulario esté completo, pasá a seleccionar los assets.' },
      { screen: 'assets', target: 'filter', title: 'Buscá y filtrá', text: 'Filtrá el inventario por tipo, entorno o estado para encontrar rápido lo que necesitás.' },
      { screen: 'assets', target: 'assets-table', title: 'Seleccioná los assets', text: 'Marcá todos los assets que forman parte del ejercicio. Podés hacer clic en toda la fila.' },
      { screen: 'assets', target: 'selection-count', title: 'Cantidad seleccionada', text: 'El contador queda visible para que no pierdas de vista el alcance.' },
      { screen: 'assets', target: 'continue', title: 'Siguiente etapa', text: 'Continuá para configurar los assets seleccionados.' },
      { screen: 'review', target: 'readiness', title: 'Revisá y creá', text: 'El panel de readiness te avisa si falta algo antes de crear el ejercicio.' },
      { screen: 'review', target: 'continue', title: 'Crear el ejercicio', text: 'Si está todo listo, creá el ejercicio. Esto no inicia las pruebas todavía.' },
    ],
  },
  apply: {
    title: 'Cómo aplicar la configuración a los assets',
    intro: 'Los assets heredan la configuración del ejercicio. Vos decidís qué cambiar en bloque y qué excepciones tiene cada uno:',
    steps: [
      { screen: 'configure', target: 'defaults', title: 'Valores del ejercicio', text: 'Esta barra muestra lo que heredan todos los assets. Con el lápiz volvés a editarlo.' },
      { screen: 'configure', target: 'config-table', title: 'Tabla de configuración', text: 'Cada fila muestra el valor efectivo. “Custom override” marca lo que difiere del default.' },
      { screen: 'configure', target: 'filter', title: 'Encontrá excepciones', text: 'Filtrá por “Custom overrides” o por VPN para revisar diferencias entre assets.' },
      { screen: 'configure', target: 'add-setting', title: 'Edición masiva', text: 'Seleccioná varios assets en la tabla y usá “Add setting” para cambiarles un parámetro a todos juntos. Antes de guardar vas a ver el impacto.' },
      { screen: 'configure', target: 'edit-asset', title: 'Ajuste individual', text: 'El lápiz abre el drawer del asset: elegí “Inherit default” o “Set custom value” campo por campo.' },
      { screen: 'configure', target: 'continue', title: 'Pasá a revisión', text: 'Cuando termines, continuá para revisar todo junto.' },
      { screen: 'review', target: 'review-custom', title: 'Revisá las excepciones', text: 'Acá ves qué assets tienen configuración propia y podés editarlos antes de crear.' },
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

export function TourOverlay({ step, index, total, onNext, onPrev, onClose }: { step: TourStep; index: number; total: number; onNext: () => void; onPrev: () => void; onClose: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null)
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
      const r = el?.getBoundingClientRect() ?? null
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
      <button
        data-tour="assistant"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="fixed z-50 bottom-0 left-[112px] grid place-items-center w-[44px] h-[48px] bg-brand shadow-[0_6px_18px_rgba(17,19,21,.18)] hover:bg-[#6edadd] transition-colors"
      >
        {open ? <X size={20} /> : <Bot size={20} strokeWidth={1.75} />}
        {!open && !tour && <span className="absolute -top-[3px] -right-[3px] size-[9px] rounded-full bg-[#1fb5bb] border-2 border-white animate-pulse" />}
      </button>

      {open && (
        <div role="dialog" aria-label="Asistente de Strike" className="fade-up fixed z-50 bottom-[58px] left-[112px] w-[360px] h-[540px] max-h-[calc(100vh-80px)] flex flex-col bg-[#fafafa] shadow-[0_24px_64px_rgba(17,19,21,.28)] border border-[#e5e5e5]">
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
