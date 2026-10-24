import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, MapPin, MousePointerClick, Send, X } from 'lucide-react'
import { STEPS, cx } from './ui'
import { getLang, t, tv } from '../i18n'

export type Screen = 'list' | 'details' | 'assets' | 'configure' | 'review' | 'created'

export const screenLabel = (s: Screen) =>
  ({
    list: t('Exercise list', 'Listado de ejercicios'),
    details: t('Step 1 · Exercise details', 'Paso 1 · Detalles del ejercicio'),
    assets: t('Step 2 · Select assets', 'Paso 2 · Seleccionar assets'),
    configure: t('Step 3 · Configure', 'Paso 3 · Configurar'),
    review: t('Step 4 · Review', 'Paso 4 · Revisión'),
    created: t('Exercise created', 'Ejercicio creado'),
  })[s]

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

const GUIDES_ES: Record<GuideId, { title: string; intro: string; steps: TourStep[] }> = {
  create: {
    title: 'Cómo crear un ejercicio',
    intro: 'Un ejercicio agrupa varios assets relacionados bajo una misma configuración. Se crea en 4 etapas:',
    steps: [
      { screen: 'list', target: 'create-exercise', title: 'Creá el ejercicio', text: 'Hacé clic en “Crear ejercicio” para abrir el flujo guiado.', click: true },
      { screen: 'details', target: 'exercise-name', title: 'Poné un nombre', text: 'Escribí un nombre que tu equipo reconozca, por ejemplo “Evaluación de seguridad Q4”.' },
      { screen: 'details', target: 'objective', title: 'Contá el objetivo', text: 'Describí qué querés evaluar. Tenés hasta 400 caracteres.' },
      { screen: 'details', target: 'depth-options', title: 'Elegí la profundidad', text: 'Seleccioná Básico, Estándar o Exhaustivo. Aplica a todos los assets del ejercicio.' },
      { screen: 'details', target: 'start-date', title: 'Definí las fechas', text: 'Elegí la fecha de inicio y luego la de fin. Abajo podés ajustar la ventana horaria.' },
      { screen: 'details', target: 'recurrence', title: 'Recurrencia', text: 'Indicá si el ejercicio se repite o es una única vez.' },
      { screen: 'details', target: 'validation-toggle', title: 'Validación humana', text: 'Viene apagado. Activalo si querés que un especialista valide los hallazgos automáticos.' },
      { screen: 'details', target: 'continue', title: 'Pasá a los assets', text: 'Hacé clic en “Continuar” para seleccionar los assets.', click: true },
      { screen: 'assets', target: 'filter', title: 'Filtrá el inventario', text: 'Usá “Filtrar” para acotar por tipo, entorno o estado. También podés buscar por nombre.' },
      { screen: 'assets', target: 'asset-row', title: 'Seleccioná un asset', text: 'Hacé clic en la fila para sumarla al ejercicio. Repetí con todos los que necesites.', click: true },
      { screen: 'assets', target: 'selection-count', title: 'Revisá cuántos llevás', text: 'El contador muestra cuántos assets van en el ejercicio.' },
      { screen: 'assets', target: 'continue', title: 'Configurá los assets', text: 'Hacé clic en “Continuar” para pasar a la configuración.', click: true },
      { screen: 'configure', target: 'continue', title: 'Configuración', text: 'Los assets ya heredan los valores del ejercicio. Si no necesitás cambios, hacé clic en “Continuar”.', click: true },
      { screen: 'review', target: 'readiness', title: 'Revisá antes de crear', text: 'Este panel te avisa si falta algo. Si necesitás cambiar algo, usá “Editar” en la sección y volvés directo acá.' },
      { screen: 'review', target: 'continue', title: 'Creá el ejercicio', text: 'Hacé clic en “Crear ejercicio”. Esto no inicia las pruebas todavía.', click: true },
    ],
  },
  apply: {
    title: 'Cómo aplicar la configuración a los assets',
    intro: 'Los assets heredan la configuración del ejercicio. Podés cambiarla en bloque o asset por asset:',
    steps: [
      { screen: 'configure', target: 'select-all', title: 'Seleccioná los assets', text: 'Marcá la casilla para seleccionar todos (o marcá fila por fila).', click: true },
      { screen: 'configure', target: 'add-setting', title: 'Abrí la edición masiva', text: 'Hacé clic en “Editar configuración” para cambiar un parámetro en todos los seleccionados.', click: true },
      { screen: 'configure', target: 'bulk-mode-rateLimit', title: 'Elegí qué cambiar', text: 'En “Rate limit” elegí “Aplicar nuevo” y seleccioná el valor. Lo que dejes en “Mantener” no se toca.' },
      { screen: 'configure', target: 'bulk-save', title: 'Guardá', text: 'Hacé clic en “Guardar cambios”.', click: true },
      { screen: 'configure', target: 'confirm-save', title: 'Confirmá el impacto', text: 'Revisá qué campos y cuántos assets cambian, y confirmá.', click: true },
      { screen: 'configure', target: 'edit-asset', title: 'Ajustá un asset', text: 'Hacé clic en el lápiz para abrir la configuración individual.', click: true },
      { screen: 'configure', target: 'drawer-custom-vpnRequired', title: 'Definí una excepción', text: 'Marcá “Valor personalizado” y elegí el valor propio de este asset.', click: true },
      { screen: 'configure', target: 'drawer-save', title: 'Guardá la excepción', text: 'Hacé clic en “Guardar cambios”. En la tabla vas a ver “Valor personalizado”.', click: true },
      { screen: 'configure', target: 'continue', title: 'Pasá a la revisión', text: 'Hacé clic en “Continuar”.', click: true },
      { screen: 'review', target: 'review-custom', title: 'Revisá las excepciones', text: 'Acá ves qué assets tienen configuración propia. “Editar asset” abre el mismo panel sin salir de la revisión.' },
    ],
  },
}

const GUIDES_EN: typeof GUIDES_ES = {
  create: {
    title: 'How to create an exercise',
    intro: 'An exercise groups related assets under one configuration. It takes 4 stages:',
    steps: [
      { screen: 'list', target: 'create-exercise', title: 'Create the exercise', text: 'Click “Create exercise” to open the guided flow.', click: true },
      { screen: 'details', target: 'exercise-name', title: 'Name it', text: 'Use a name your team will recognize, for example “Q4 Commerce Security Assessment”.' },
      { screen: 'details', target: 'objective', title: 'Describe the goal', text: 'Explain what you want to assess. You have up to 400 characters.' },
      { screen: 'details', target: 'depth-options', title: 'Pick the depth', text: 'Choose Basic, Standard or Comprehensive. It applies to every asset in the exercise.' },
      { screen: 'details', target: 'start-date', title: 'Set the dates', text: 'Pick the start date, then the end date. Below you can adjust the time window.' },
      { screen: 'details', target: 'recurrence', title: 'Recurrence', text: 'Say whether the exercise repeats or runs once.' },
      { screen: 'details', target: 'validation-toggle', title: 'Human validation', text: 'It starts off. Turn it on if you want an expert to validate the automated findings.' },
      { screen: 'details', target: 'continue', title: 'Go to assets', text: 'Click “Continue” to select the assets.', click: true },
      { screen: 'assets', target: 'filter', title: 'Filter the inventory', text: 'Use “Filter” to narrow by type, environment or status. You can also search by name.' },
      { screen: 'assets', target: 'asset-row', title: 'Select an asset', text: 'Click the row to add it to the exercise. Repeat for every asset you need.', click: true },
      { screen: 'assets', target: 'selection-count', title: 'Check your count', text: 'The counter shows how many assets are in the exercise.' },
      { screen: 'assets', target: 'continue', title: 'Configure the assets', text: 'Click “Continue” to move on to configuration.', click: true },
      { screen: 'configure', target: 'continue', title: 'Configuration', text: 'Assets already inherit the exercise settings. If nothing needs to change, click “Continue”.', click: true },
      { screen: 'review', target: 'readiness', title: 'Review before creating', text: 'This panel tells you if anything is missing. To change something, use “Edit” on the section and you come straight back here.' },
      { screen: 'review', target: 'continue', title: 'Create the exercise', text: 'Click “Create exercise”. This does not start testing yet.', click: true },
    ],
  },
  apply: {
    title: 'How to apply settings to assets',
    intro: 'Assets inherit the exercise settings. You can change them in bulk or one asset at a time:',
    steps: [
      { screen: 'configure', target: 'select-all', title: 'Select the assets', text: 'Tick the box to select them all (or tick row by row).', click: true },
      { screen: 'configure', target: 'add-setting', title: 'Open bulk edit', text: 'Click “Add setting” to change a value on every selected asset.', click: true },
      { screen: 'configure', target: 'bulk-mode-rateLimit', title: 'Choose what changes', text: 'Under “Rate limit” pick “Apply new” and choose the value. Anything left on “Keep current” stays as it is.' },
      { screen: 'configure', target: 'bulk-save', title: 'Save', text: 'Click “Save changes”.', click: true },
      { screen: 'configure', target: 'confirm-save', title: 'Confirm the impact', text: 'Check which fields and how many assets change, then confirm.', click: true },
      { screen: 'configure', target: 'edit-asset', title: 'Adjust one asset', text: 'Click the pencil to open that asset’s own settings.', click: true },
      { screen: 'configure', target: 'drawer-custom-vpnRequired', title: 'Set an exception', text: 'Tick “Set custom value” and choose this asset’s own value.', click: true },
      { screen: 'configure', target: 'drawer-save', title: 'Save the exception', text: 'Click “Save changes”. The table will show “Custom override”.', click: true },
      { screen: 'configure', target: 'continue', title: 'Go to review', text: 'Click “Continue”.', click: true },
      { screen: 'review', target: 'review-custom', title: 'Check the exceptions', text: 'Here you see which assets have their own settings. “Edit asset” opens the same panel without leaving the review.' },
    ],
  },
}

/** Guides in the current language. Both versions have the same steps, so indexes are stable across a switch. */
export const guides = () => (getLang() === 'es' ? GUIDES_ES : GUIDES_EN)

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
          <span className="text-[9px] uppercase tracking-[0.6px] text-[#2b9ea2] font-bold">{t(`Step ${index + 1} of ${total}`, `Paso ${index + 1} de ${total}`)}</span>
          <button onClick={onClose} aria-label={t('Close tour', 'Cerrar tour')} className="text-[#73787a] hover:text-ink"><X size={15} /></button>
        </div>
        <div className="h-[3px] mx-[14px] mt-[8px] bg-[#eef0f0]">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="px-[14px] pt-[10px] pb-[12px]">
          <p className="text-[13px] font-semibold">{step.title}</p>
          <p className="mt-[4px] text-[11px] leading-[16px] text-[#505557]">{step.text}</p>
          {step.click && rect && (
            <p className="mt-[8px] flex items-center gap-[5px] text-[10px] font-semibold text-[#17575a]"><MousePointerClick size={12} />{t('Click the highlighted control to continue', 'Hacé clic en lo resaltado para seguir')}</p>
          )}
          {!rect && (
            <p className="mt-[8px] text-[10px] text-[#a0631a]">{t('This element is not visible right now. Go back a step to bring it up.', 'Este elemento no está visible ahora. Volvé un paso atrás para hacerlo aparecer.')}</p>
          )}
        </div>
        <div className="flex items-center justify-between px-[10px] py-[8px] bg-[#f7f7f7]">
          <button onClick={onPrev} disabled={index === 0} className="h-[28px] px-[10px] text-[10px] font-bold uppercase tracking-[0.3px] disabled:opacity-30">{t('Back', 'Atrás')}</button>
          <button onClick={onNext} className="inline-flex items-center gap-[6px] h-[28px] px-[12px] bg-brand border border-brand-border text-[10px] font-bold uppercase tracking-[0.3px]">
            {index + 1 === total ? t('Finish', 'Terminar') : t('Next', 'Siguiente')} <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

// Bot lines are functions so they follow the language switch; user lines stay as typed.
type MsgBody = { from: 'user'; text: string } | { from: 'bot'; say: () => string } | { from: 'bot'; guide: GuideId }
type Msg = MsgBody & { id: number }

const quick = () => [
  t('How do I create an exercise?', '¿Cómo creo un ejercicio?'),
  t('How do I apply settings to assets?', '¿Cómo aplico la configuración a los assets?'),
  t('Which step am I on?', '¿En qué paso estoy?'),
]

function intent(text: string): 'create' | 'apply' | 'where' | 'filters' | 'hello' | 'unknown' {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/(donde|paso|estoy|ubic|where|which step|am i)/.test(q)) return 'where'
  if (/(asset|activo|aplic|apply|masiv|bulk|config|setting|override|excepci|exception)/.test(q)) return 'apply'
  if (/(crea|nuevo|ejercicio|empez|new|exercise|start)/.test(q)) return 'create'
  if (/(filt|busc|search|tabla|table)/.test(q)) return 'filters'
  if (/(hola|buen|hey|hi\b|hello)/.test(q)) return 'hello'
  return 'unknown'
}

function GuideCard({ guide, screen, tourIndex, onStart, onJump }: { guide: GuideId; screen: Screen; tourIndex: number | null; onStart: () => void; onJump: (i: number) => void }) {
  const g = guides()[guide]
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
                  {(active || (isHere && i === here)) && <span className="ml-[6px] inline-flex items-center gap-[2px] text-[9px] font-bold text-[#17575a]"><MapPin size={9} />{active ? t('in progress', 'en curso') : t('you are here', 'estás acá')}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <button onClick={onStart} className="w-full h-[34px] flex items-center justify-center gap-[6px] bg-ink text-white text-[10px] font-bold uppercase tracking-[0.4px] hover:bg-[#24282a]">
        {here >= 0 ? t('Show me from where I am', 'Mostrarme desde donde estoy') : t('Start tour', 'Iniciar tour')} <ArrowRight size={13} />
      </button>
    </div>
  )
}

export function Assistant({
  open, setOpen, screen, tour, onStartTour, side = 'right',
}: {
  open: boolean; setOpen: (v: boolean) => void; screen: Screen; side?: 'left' | 'right'
  tour: { guide: GuideId; index: number } | null
  onStartTour: (guide: GuideId, index: number) => void
}) {
  const idRef = useRef(1)
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 0, from: 'bot', say: () => t('Hi Sarah! 👋 I’m the Strike assistant. I can show you how to create an exercise and how to apply its settings to the assets, highlighting each step on screen.', '¡Hola Sarah! 👋 Soy el asistente de Strike. Te puedo mostrar cómo crear un ejercicio y cómo aplicar su configuración a los assets, marcándote en pantalla cada paso.') },
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
          const left = idx === undefined ? 0 : STEPS.length - idx - 1
          push({
            from: 'bot',
            say: () =>
              idx === undefined
                ? screen === 'list'
                  ? t(`You are on: ${screenLabel(screen)}. From here you can create a new exercise.`, `Estás en: ${screenLabel(screen)}. Desde acá podés crear un ejercicio nuevo.`)
                  : t(`You are on: ${screenLabel(screen)}. Go back to the list to see your exercise.`, `Estás en: ${screenLabel(screen)}. Volvé al listado para ver tu ejercicio.`)
                : t(
                    `You are on ${screenLabel(screen)}. ${left === 1 ? '1 stage' : `${left} stages`} left. Want me to highlight what to do here?`,
                    `Estás en ${screenLabel(screen)}. Te ${left === 1 ? 'queda 1 etapa' : `quedan ${left} etapas`} para terminar. ¿Querés que te marque en pantalla qué hacer acá?`,
                  ),
          })
          if (idx !== undefined) push({ from: 'bot', guide: screen === 'configure' ? 'apply' : 'create' })
        } else if (kind === 'filters') {
          push({ from: 'bot', say: () => t('Every table has search and a “Filter” button: combine filters by column (type, environment, status, configuration). Active filters show up as chips you can remove one by one.', 'Todas las tablas tienen búsqueda y el botón “Filtrar”: combiná filtros por columna (tipo, entorno, estado, configuración). Los filtros activos aparecen como chips y los podés quitar de a uno.') })
        } else if (kind === 'hello') {
          push({ from: 'bot', say: () => t('Hi! Want to see how to create an exercise or how to apply settings to the assets?', '¡Hola! ¿Querés ver cómo crear un ejercicio o cómo aplicar la configuración a los assets?') })
        } else {
          push({ from: 'bot', say: () => t('I’m not sure I understood. I can guide you to create an exercise, apply settings to assets, or tell you which step you are on.', 'No estoy seguro de haber entendido. Puedo guiarte para crear un ejercicio, aplicar configuración a los assets o decirte en qué paso estás.') })
        }
      }, 650)
    },
    [push, screen],
  )

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    reply(text)
  }

  const startFromHere = (guide: GuideId) => {
    const here = guides()[guide].steps.findIndex(s => s.screen === screen)
    onStartTour(guide, Math.max(0, here))
  }

  const stepIdx = STEP_INDEX[screen]

  return (
    <>

      {open && (
        <div className={cx('fixed z-50 inset-x-[12px] bottom-[12px] sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2', side === 'right' ? 'sm:right-[84px]' : 'sm:left-[84px] md:left-[160px]')}>
        <div role="dialog" aria-label={t('Strike assistant', 'Asistente de Strike')} className="chat-pop w-full sm:w-[360px] h-[540px] max-h-[calc(100dvh-96px)] sm:max-h-[calc(100dvh-32px)] flex flex-col bg-[#fafafa] shadow-[0_24px_64px_rgba(17,19,21,.28)] border border-[#e5e5e5] rounded-[14px] overflow-hidden">
          <div className="flex items-center gap-[10px] px-[14px] h-[54px] bg-[#111315] text-white shrink-0">
            <span className="grid place-items-center size-[30px] bg-brand text-ink"><Bot size={17} /></span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold">Strike Assistant</p>
              <p className="text-[10px] text-[#9fe9eb]">{t('I’ll guide you step by step', 'Te guío paso a paso')}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t('Close', 'Cerrar')} className="text-[#c9cccd] hover:text-white"><X size={16} /></button>
          </div>

          <div className="px-[14px] py-[9px] bg-white border-b border-[#ececec] shrink-0">
            <p className="flex items-center gap-[5px] text-[9px] uppercase tracking-[0.5px] text-[#73787a]"><MapPin size={10} className="text-[#2b9ea2]" />{t('You are on', 'Estás en')}</p>
            <p className="mt-[2px] text-[11px] font-semibold">{screenLabel(screen)}</p>
            <div className="mt-[6px] flex gap-[3px]">
              {STEPS.map((s, i) => (
                <span key={s} title={tv(s)} className={cx('h-[4px] flex-1 transition-colors duration-300', stepIdx === undefined ? (screen === 'created' ? 'bg-brand-dark' : 'bg-[#e5e7e7]') : i < stepIdx ? 'bg-brand-dark' : i === stepIdx ? 'bg-brand' : 'bg-[#e5e7e7]')} />
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
                  {'say' in m ? m.say() : m.text}
                </div>
              ),
            )}
            {typing && (
              <div className="self-start px-[11px] py-[9px] bg-white border border-[#e5e5e5] typing text-[14px] leading-[8px]" aria-label={t('Typing', 'Escribiendo')}>
                <span>•</span><span>•</span><span>•</span>
              </div>
            )}
          </div>

          <div className="px-[10px] pt-[8px] flex gap-[5px] overflow-x-auto shrink-0 [scrollbar-width:none]">
            {quick().map(q => (
              <button key={q} onClick={() => reply(q)} className="shrink-0 h-[24px] px-[9px] bg-white border border-[#bde7e9] text-[10px] text-[#17575a] hover:bg-brand-soft whitespace-nowrap">{q}</button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); send() }} className="flex items-center gap-[6px] m-[10px] h-[38px] px-[10px] bg-white border border-[#dcdcdc] focus-within:border-[#2bb9bd] shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('Type your question…', 'Escribí tu pregunta…')} className="flex-1 bg-transparent outline-none text-[11px]" />
            <button type="submit" aria-label={t('Send', 'Enviar')} disabled={!input.trim()} className="grid place-items-center size-[26px] bg-brand disabled:opacity-40"><Send size={13} /></button>
          </form>
        </div>
        </div>
      )}
    </>
  )
}

/** Robot face for the launcher: blinks, and its antenna light pulses. */
function BotFace() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111315" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5v3" />
      <circle className="bot-antenna" cx="12" cy="3" r="1.3" fill="#111315" stroke="none" />
      <rect x="4.5" y="7" width="15" height="11.5" rx="3" />
      <path d="M2.5 11.5v3M21.5 11.5v3" />
      <rect className="bot-eye" x="8.4" y="10.6" width="2" height="3" rx="1" fill="#111315" stroke="none" />
      <rect className="bot-eye" x="13.6" y="10.6" width="2" height="3" rx="1" fill="#111315" stroke="none" />
      <path d="M10 16h4" />
    </svg>
  )
}

const INTERACTIVE = 'button, a, input, select, textarea, label, [role="checkbox"], [role="switch"], [role="radio"]'
const SIZE = 52

/** Where the launcher lives: which edge, how far down (0–1 of the viewport), and whether it is tucked away. */
export interface BotDock { side: 'left' | 'right'; y: number; tucked: boolean }
const DOCK_KEY = 'strike-bot-dock'

export function loadDock(): BotDock {
  try {
    const d = JSON.parse(localStorage.getItem(DOCK_KEY) ?? 'null')
    if (d && (d.side === 'left' || d.side === 'right') && typeof d.y === 'number') return { side: d.side, y: d.y, tucked: !!d.tucked }
  } catch { /* storage unavailable */ }
  return { side: 'right', y: 0.5, tucked: false }
}

export function saveDock(d: BotDock) {
  try { localStorage.setItem(DOCK_KEY, JSON.stringify(d)) } catch { /* storage unavailable */ }
}

// Left edge of the usable area: the sidebar is only there on wide screens.
const leftInset = () => (document.querySelector('aside')?.getBoundingClientRect().right ?? 0) + 16

/** Is there readable text right under (x, y)? Uses the caret API so blank space inside a cell doesn't count. */
function textAt(x: number, y: number) {
  const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null }
  let node: Node | null = null
  let offset = 0
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y)
    if (r) { node = r.startContainer; offset = r.startOffset }
  } else if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y)
    if (p) { node = p.offsetNode; offset = p.offset }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false
  const len = node.textContent.length
  for (const o of [offset - 1, offset]) {
    if (o < 0 || o >= len) continue
    const range = document.createRange()
    range.setStart(node, o)
    range.setEnd(node, o + 1)
    const b = range.getBoundingClientRect()
    if (x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) return true
  }
  return false
}

/**
 * Floating launcher. It starts on the right at mid-height, can be dragged to either edge
 * (it snaps to the nearest one and remembers the spot) and tucked into a small tab.
 * Wherever it sits, it slides to the nearest free spot when text or a control of the page is
 * underneath, so it never covers information or an action. It steps aside during a tour.
 */
export function AssistantLauncher({ open, onToggle, onClose, hidden, dock, setDock }: { open: boolean; onToggle: () => void; onClose: () => void; hidden?: boolean; dock: BotDock; setDock: (d: BotDock) => void }) {
  const [shift, setShift] = useState(0)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  useEffect(() => {
    if (dock.tucked || drag) return
    let raf = 0
    const blocked = (offset: number) => {
      const cx = dock.side === 'right' ? window.innerWidth - 16 - SIZE / 2 : leftInset() + SIZE / 2
      const cy = window.innerHeight * dock.y + offset
      if (cy - SIZE / 2 < 56 || cy + SIZE / 2 > window.innerHeight - 8) return true
      for (let dx = -24; dx <= 24; dx += 12) {
        for (let dy = -24; dy <= 24; dy += 12) {
          if (dx * dx + dy * dy > 27 * 27) continue
          const x = cx + dx, y = cy + dy
          if (textAt(x, y)) return true
          if (document.elementsFromPoint(x, y).some(el => !!el.closest(INTERACTIVE) && !el.closest('[role="dialog"]'))) return true
        }
      }
      return false
    }
    const check = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      el.style.pointerEvents = 'none' // look at what is underneath, not at the launcher itself
      try {
        for (let step = 0; step * 24 <= window.innerHeight; step++) {
          for (const off of step ? [-step * 24, step * 24] : [0]) {
            if (!blocked(off)) { setShift(off); return }
          }
        }
      } finally {
        el.style.pointerEvents = ''
      }
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(check) }
    queue()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    const iv = window.setInterval(queue, 500)
    return () => { window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); window.clearInterval(iv); cancelAnimationFrame(raf) }
  }, [dock, drag])

  if (dock.tucked) {
    return (
      <button
        data-tour="assistant"
        onClick={() => setDock({ ...dock, tucked: false })}
        aria-label={t('Show assistant', 'Mostrar asistente')}
        title={t('Show assistant', 'Mostrar asistente')}
        className={cx('fade-up fixed z-50 grid place-items-center w-[22px] h-[56px] bg-brand shadow-[0_6px_18px_rgba(17,19,21,.18)] hover:w-[28px] transition-[width]', dock.side === 'right' ? 'right-0 rounded-l-[12px]' : 'left-0 rounded-r-[12px]')}
        style={{ top: `calc(${dock.y * 100}% - 28px)` }}
      >
        <Bot size={14} />
      </button>
    )
  }

  const onPointerDown = (e: React.PointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return
    p.moved = true
    setDrag({ x: e.clientX, y: e.clientY })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const p = press.current
    if (p?.moved) {
      const y = Math.min(0.9, Math.max(0.12, e.clientY / window.innerHeight))
      setShift(0)
      setDock({ ...dock, side: e.clientX < window.innerWidth / 2 ? 'left' : 'right', y })
    }
    setDrag(null)
  }

  const docked = { top: `${dock.y * 100}%`, transform: `translateY(calc(-50% + ${shift}px))${hidden ? ' scale(.6)' : ''}`, ...(dock.side === 'right' ? { right: 16 } : { left: leftInset() }) }
  const dragging = drag ? { left: drag.x - SIZE / 2, top: drag.y - SIZE / 2 } : null

  return (
    <div
      ref={ref}
      className={cx('group fixed z-50', !drag && 'transition-[transform,opacity,top] duration-300 ease-out', hidden && 'opacity-0 pointer-events-none')}
      style={dragging ?? docked}
    >
      <button
        data-tour="assistant"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { press.current = null; setDrag(null) }}
        onClick={() => { if (!press.current?.moved) onToggle(); press.current = null }}
        aria-label={open ? t('Close assistant', 'Cerrar asistente') : t('Open assistant', 'Abrir asistente')}
        title={t('Drag to move', 'Arrastrá para moverlo')}
        className={cx('bot-launcher relative grid place-items-center size-[52px] rounded-full bg-brand shadow-[0_10px_28px_rgba(17,19,21,.22)] transition-colors hover:bg-[#6edadd] touch-none', drag ? 'cursor-grabbing scale-110' : 'cursor-grab', !open && !drag && 'is-floating')}
      >
        <span className="bot-ping absolute inset-0 rounded-full" />
        <span key={open ? 'x' : 'bot'} className="bot-swap grid place-items-center">{open ? <X size={22} /> : <BotFace />}</span>
      </button>
      {!drag && (
        <button
          onClick={() => { onClose(); setDock({ ...dock, tucked: true }) }}
          aria-label={t('Hide assistant', 'Ocultar asistente')}
          title={t('Hide assistant', 'Ocultar asistente')}
          className={cx('absolute -top-[4px] grid place-items-center size-[20px] rounded-full bg-ink text-white opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity', dock.side === 'right' ? '-left-[4px]' : '-right-[4px]')}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
