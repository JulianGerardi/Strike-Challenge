import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Trash2, X } from 'lucide-react'
import type { AssetOverrides, Exercise, ExerciseDraft, SharedConfig } from './data'
import { ASSETS, DEFAULT_DRAFT, DEFAULT_SHARED, INITIAL_EXERCISES, SEED_OVERRIDES, hasOverrides } from './data'
import { Header, Shell, Sidebar } from './components/Layout'
import { Button, FormFooter, Stepper } from './components/ui'
import { Assistant, AssistantLauncher, TourOverlay, guides, loadDock, saveDock, type BotDock, type GuideId, type Screen } from './components/Assistant'
import { ExercisesList } from './screens/ExercisesList'
import { ExerciseDetails } from './screens/ExerciseDetails'
import { SelectAssets } from './screens/SelectAssets'
import { AssetDrawer, BulkEditModal, ConfigureAssets, ConfirmBulkModal, Modal, describeChanges, type BulkChanges } from './screens/ConfigureAssets'
import { Review } from './screens/Review'
import { ExerciseCreated } from './screens/ExerciseCreated'
import { getLang, setCurrentLang, t, type Lang } from './i18n'

const ORDER: Screen[] = ['details', 'assets', 'configure', 'review']
const DEMO_SELECTION = ['a1', 'a2', 'a4']
const NUMBER_WORDS = { en: ['zero', 'one', 'two', 'three', 'four'], es: ['cero', 'un', 'dos', 'tres', 'cuatro'] }

function freshBulk(shared: SharedConfig): BulkChanges {
  const base = { mode: 'Keep current' as const, ...shared }
  return { rateLimit: { ...base, rateLimit: 15 }, vpnRequired: { ...base }, excludedTests: { ...base }, window: { ...base } }
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(getLang)
  const setLang = (l: Lang) => {
    setCurrentLang(l)
    setLangState(l)
  }
  const [screen, setScreen] = useState<Screen>('list')
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)
  const [draft, setDraft] = useState<ExerciseDraft>(DEFAULT_DRAFT)
  const [selected, setSelected] = useState<string[]>([])
  const [overrides, setOverrides] = useState<Record<string, AssetOverrides>>(SEED_OVERRIDES)
  const [checked, setChecked] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [bulk, setBulk] = useState<BulkChanges | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [drawer, setDrawer] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; assets: number; custom: number } | null>(null)
  const [happy, setHappy] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [tour, setTour] = useState<{ guide: GuideId; index: number } | null>(null)
  // Set when a step is opened to edit something from a later screen; saving returns there.
  const [returnTo, setReturnTo] = useState<Screen | null>(null)
  const nextId = useRef(2048)
  const [discarding, setDiscarding] = useState(false)
  const [dock, setDockState] = useState<BotDock>(loadDock)
  const setDock = (d: BotDock) => {
    saveDock(d)
    setDockState(d)
  }
  // True when the tour itself took the user from the list into the flow: closing it should take them back.
  const tourFromHome = useRef(false)

  const shared: SharedConfig = useMemo(
    () => ({ ...DEFAULT_SHARED, window: { start: draft.startTime || DEFAULT_SHARED.window.start, end: draft.endTime || DEFAULT_SHARED.window.end } }),
    [draft.startTime, draft.endTime],
  )

  const go = useCallback((s: Screen) => {
    if (s === 'configure' || s === 'review') setSelected(sel => (sel.length ? sel : DEMO_SELECTION))
    setShowErrors(false)
    setToast(null)
    setScreen(s)
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!happy) return
    const t = window.setTimeout(() => setHappy(false), 2200)
    return () => window.clearTimeout(t)
  }, [happy])

  /* ---------- Tour ---------- */

  const startTour = useCallback(
    (guide: GuideId, index: number) => {
      setChatOpen(false)
      setBulk(null)
      setConfirming(false)
      setDrawer(null)
      if (!tour) tourFromHome.current = screen === 'list' || screen === 'created'
      setTour({ guide, index })
      const s = guides()[guide].steps[index].screen
      if (s !== screen) go(s)
    },
    [go, screen, tour],
  )

  const moveTour = useCallback(
    (delta: number) => {
      if (!tour) return
      const steps = guides()[tour.guide].steps
      const index = tour.index + delta
      if (index < 0) return
      if (index >= steps.length) {
        setTour(null)
        return
      }
      setTour({ ...tour, index })
      if (steps[index].screen !== screen) go(steps[index].screen)
    },
    [tour, screen, go],
  )

  const screenRef = useRef(screen)
  screenRef.current = screen

  // The user clicked the highlighted control. If that click moved them to another screen, the sync
  // effect below already picked the right step; otherwise move on to the next step of this screen.
  const advanceFrom = useCallback((from: number) => {
    setTour(t => {
      if (!t || t.index !== from) return t
      const steps = guides()[t.guide].steps
      const next = steps[from + 1]
      if (!next) return null
      return next.screen === screenRef.current ? { ...t, index: from + 1 } : t
    })
  }, [])

  // Keep the tour in sync when the user moves through the flow on their own.
  useEffect(() => {
    if (!tour) return
    const steps = guides()[tour.guide].steps
    if (steps[tour.index].screen === screen) return
    const ahead = steps.findIndex((s, i) => i > tour.index && s.screen === screen)
    const any = steps.findIndex(s => s.screen === screen)
    const idx = ahead >= 0 ? ahead : any
    if (idx >= 0) setTour({ ...tour, index: idx })
    else setTour(null)
  }, [screen, tour])

  /* ---------- Flow ---------- */

  const stepIndex = ORDER.indexOf(screen)

  // Next screen in the flow, unless the user came here to edit something: then go back to where they were.
  const finish = (next: Screen) => {
    const target = returnTo ?? next
    setReturnTo(null)
    go(target)
    if (returnTo) setToast(t('Changes saved', 'Cambios guardados'))
  }

  const editFrom = (target: Screen, origin: Screen) => {
    setReturnTo(r => r ?? origin)
    go(target)
  }

  const onContinue = () => {
    if (screen === 'details') {
      if (!draft.name.trim() || !draft.startDate || !draft.endDate || draft.endDate < draft.startDate) return setShowErrors(true)
      return finish('assets')
    }
    if (screen === 'assets') {
      if (!selected.length) return setShowErrors(true)
      setChecked([])
      return finish('configure')
    }
    if (screen === 'configure') return finish('review')
    if (screen === 'review') {
      const id = `EX-${nextId.current++}`
      const custom = selected.filter(a => hasOverrides(overrides[a])).length
      setCreated({ id, assets: selected.length, custom })
      setExercises(list => [
        { id, name: draft.name, updated: 'now', assets: selected.length, schedule: draft.startDate, status: 'Complete', isNew: true, setup: { assetIds: selected, depth: draft.depth, startDate: draft.startDate, endDate: draft.endDate, recurrence: draft.recurrence, humanValidation: draft.humanValidation, shared, overrides: Object.fromEntries(selected.filter(a => overrides[a]).map(a => [a, overrides[a]])) } },
        ...list.map(e => ({ ...e, isNew: false })),
      ])
      setHappy(true)
      return go('created')
    }
  }

  const onBack = () => {
    if (returnTo) {
      const r = returnTo
      setReturnTo(null)
      return go(r)
    }
    if (screen === 'details') return go('list')
    go(ORDER[stepIndex - 1])
  }

  // Drop everything set up for the exercise in progress and go back to the list.
  const discardExercise = () => {
    setDraft(DEFAULT_DRAFT)
    setSelected([])
    setOverrides(SEED_OVERRIDES)
    setChecked([])
    setReturnTo(null)
    setBulk(null)
    setConfirming(false)
    setDrawer(null)
    setDiscarding(false)
    go('list')
  }

  const closeTour = () => {
    setTour(null)
    if (tourFromHome.current && screen !== 'list' && screen !== 'created') discardExercise()
    tourFromHome.current = false
  }

  const resetFlow = () => {
    setDraft(DEFAULT_DRAFT)
    setSelected([])
    setOverrides(SEED_OVERRIDES)
    setChecked([])
    setReturnTo(null)
    go('details')
  }

  const applyBulk = () => {
    if (!bulk) return
    const lines = describeChanges(bulk, shared)
    setOverrides(prev => {
      const next = { ...prev }
      for (const id of checked) {
        const o: AssetOverrides = { ...next[id] }
        for (const f of Object.keys(bulk) as (keyof BulkChanges)[]) {
          const c = bulk[f]
          if (c.mode === 'Apply new') (o as Record<string, unknown>)[f] = c[f]
          if (c.mode === 'Reset') delete o[f]
        }
        next[id] = o
      }
      return next
    })
    setBulk(null)
    setConfirming(false)
    setChecked([])
    const n = lines.length
    const word = NUMBER_WORDS[lang][n] ?? n
    setToast(t(`Applied ${word} ${n === 1 ? 'change' : 'changes'} to the assets`, `Aplicaste ${word} ${n === 1 ? 'cambio' : 'cambios'} a los assets`))
  }

  const drawerAsset = drawer ? ASSETS.find(a => a.id === drawer) : undefined
  const checkedAssets = ASSETS.filter(a => checked.includes(a.id))

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar onHome={() => { setReturnTo(null); go('list') }} />
      <Shell header={<Header lang={lang} onLang={setLang} introKey={screen} happy={happy} onSmiley={() => { setHappy(true); setChatOpen(true) }} />}>
        {stepIndex >= 0 && <Stepper active={stepIndex} editing={!!returnTo} onGo={i => { setReturnTo(null); go(ORDER[i]) }} />}

        <div key={screen} className="fade-up flex flex-col gap-[18px]">
          {returnTo && stepIndex >= 0 && (
            <div className="flex items-center gap-[10px] px-[14px] py-[10px] bg-[#eefafa] border border-[#cbe9ea] text-[13px] text-[#285b5e]">
              <span className="font-semibold">{returnTo === 'review' ? t('Editing from Review.', 'Editando desde la revisión.') : t('Editing from Configure.', 'Editando desde Configurar.')}</span>
              <span>{t("Save your changes to go straight back. You won't need to repeat the other steps.", 'Guardá los cambios para volver directo. No vas a tener que repetir los otros pasos.')}</span>
            </div>
          )}
          {screen === 'list' && <ExercisesList exercises={exercises} onCreate={resetFlow} />}
          {screen === 'details' && <ExerciseDetails draft={draft} setDraft={setDraft} showErrors={showErrors} />}
          {screen === 'assets' && <SelectAssets selected={selected} setSelected={setSelected} showErrors={showErrors} />}
          {screen === 'configure' && (
            <ConfigureAssets
              draft={draft}
              shared={shared}
              selectedIds={selected}
              overrides={overrides}
              checked={checked}
              setChecked={setChecked}
              onAddSetting={() => setBulk(freshBulk(shared))}
              onEditAsset={setDrawer}
              onEditDefaults={() => editFrom('details', 'configure')}
            />
          )}
          {screen === 'review' && (
            <Review draft={draft} shared={shared} selectedIds={selected} overrides={overrides} onEditStep={i => editFrom(ORDER[i], 'review')} onEditAsset={setDrawer} />
          )}
          {screen === 'created' && created && <ExerciseCreated id={created.id} draft={draft} assetCount={created.assets} customCount={created.custom} />}

          {stepIndex >= 0 && (
            <div className="pt-[22px]">
              <FormFooter
                tourId="continue"
                extra={
                  stepIndex > 0 && (
                    <button data-tour="discard" onClick={() => setDiscarding(true)} className="inline-flex items-center gap-[6px] h-[40px] px-[4px] text-[12px] font-bold uppercase tracking-[0.3px] text-[#b23a3a] hover:text-[#8f2424]">
                      <Trash2 size={14} strokeWidth={1.9} />
                      {t('Cancel exercise', 'Cancelar ejercicio')}
                    </button>
                  )
                }
                onCancel={onBack}
                cancelLabel={returnTo || screen === 'details' ? t('Cancel', 'Cancelar') : t('Back', 'Atrás')}
                onContinue={onContinue}
                continueLabel={screen === 'review' ? t('Create exercise', 'Crear ejercicio') : returnTo === 'review' ? t('Save and return to review', 'Guardar y volver a la revisión') : returnTo ? t('Save and return', 'Guardar y volver') : t('Continue', 'Continuar')}
              />
            </div>
          )}
          {screen === 'created' && (
            <div className="flex justify-end pt-[48px] sm:pt-[120px]">
              <Button className="min-w-[108px] h-[40px] px-[15px]" onClick={() => go('list')} iconRight={<ArrowRight size={16} strokeWidth={1.75} />}>{t('Continue', 'Continuar')}</Button>
            </div>
          )}
        </div>
      </Shell>
      <AssistantLauncher open={chatOpen} hidden={chatOpen || !!tour || !!bulk || !!drawer || discarding} dock={dock} setDock={setDock} onClose={() => setChatOpen(false)} onToggle={() => setChatOpen(true)} />

      {toast && (
        <div role="status" className="fade-up fixed z-40 bottom-[16px] left-[12px] md:left-[112px] flex items-center gap-[10px] w-[min(344px,calc(100vw-24px))] min-h-[37px] py-[8px] px-[12px] bg-[#e8f8ef] border border-[#c4ecd6] text-[13px] font-semibold">
          <Check size={15} />
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} aria-label={t('Close', 'Cerrar')}><X size={15} /></button>
        </div>
      )}

      {bulk && !confirming && (
        <BulkEditModal count={checked.length} shared={shared} changes={bulk} setChanges={setBulk} onClose={() => setBulk(null)} onSave={() => setConfirming(true)} />
      )}
      {bulk && confirming && (
        <ConfirmBulkModal assets={checkedAssets} lines={describeChanges(bulk, shared)} onClose={() => setConfirming(false)} onSave={applyBulk} />
      )}
      {drawerAsset && (
        <AssetDrawer
          key={drawerAsset.id}
          asset={drawerAsset}
          shared={shared}
          overrides={overrides[drawerAsset.id] ?? {}}
          onClose={() => setDrawer(null)}
          onSave={o => {
            setOverrides(prev => ({ ...prev, [drawerAsset.id]: o }))
            setDrawer(null)
            setToast(t(`Saved the settings for ${drawerAsset.name}`, `Guardaste la configuración de ${drawerAsset.name}`))
          }}
        />
      )}

      {discarding && (
        <Modal
          tourId="discard-modal"
          title={t('Cancel this exercise?', '¿Cancelar este ejercicio?')}
          caption={t('Everything you set up for this exercise will be discarded.', 'Se va a descartar todo lo que configuraste para este ejercicio.')}
          onClose={() => setDiscarding(false)}
          footer={
            <>
              <Button variant="ghost" className="h-[40px] px-[14px]" onClick={() => setDiscarding(false)}>{t('Keep editing', 'Seguir editando')}</Button>
              <Button data-tour="discard-confirm" className="h-[40px] px-[16px] !bg-[#c23b3b] !border-[#a52f2f] !text-white hover:!bg-[#a52f2f]" onClick={() => { discardExercise(); setToast(t('Exercise discarded', 'Ejercicio descartado')) }}>
                {t('Discard exercise', 'Descartar ejercicio')}
              </Button>
            </>
          }
        >
          <p className="text-[13px] leading-[20px] text-[#3e4345]">
            {t(`You will lose the details, the ${selected.length} selected ${selected.length === 1 ? 'asset' : 'assets'} and any custom settings. Nothing has been created yet.`, `Vas a perder los detalles, ${selected.length === 1 ? 'el asset seleccionado' : `los ${selected.length} assets seleccionados`} y la configuración personalizada. Todavía no se creó nada.`)}
          </p>
        </Modal>
      )}

      <Assistant open={chatOpen} setOpen={setChatOpen} side={dock.side} screen={screen} tour={tour} onStartTour={startTour} />
      {tour && (
        <TourOverlay
          step={guides()[tour.guide].steps[tour.index]}
          index={tour.index}
          total={guides()[tour.guide].steps.length}
          onNext={() => moveTour(1)}
          onPrev={() => moveTour(-1)}
          onClose={closeTour}
          onTargetClick={() => advanceFrom(tour.index)}
        />
      )}
    </div>
  )
}
