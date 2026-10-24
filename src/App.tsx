import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import type { AssetOverrides, Exercise, ExerciseDraft, SharedConfig } from './data'
import { ASSETS, DEFAULT_DRAFT, DEFAULT_SHARED, INITIAL_EXERCISES, SEED_OVERRIDES, formatDate, hasOverrides } from './data'
import { Header, Shell, Sidebar } from './components/Layout'
import { Button, FormFooter, Stepper } from './components/ui'
import { Assistant, AssistantLauncher, GUIDES, TourOverlay, type GuideId, type Screen } from './components/Assistant'
import { ExercisesList } from './screens/ExercisesList'
import { ExerciseDetails } from './screens/ExerciseDetails'
import { SelectAssets } from './screens/SelectAssets'
import { AssetDrawer, BulkEditModal, ConfigureAssets, ConfirmBulkModal, describeChanges, type BulkChanges } from './screens/ConfigureAssets'
import { Review } from './screens/Review'
import { ExerciseCreated } from './screens/ExerciseCreated'

const ORDER: Screen[] = ['details', 'assets', 'configure', 'review']
const DEMO_SELECTION = ['a1', 'a2', 'a4']
const NUMBER_WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro']

function freshBulk(shared: SharedConfig): BulkChanges {
  const base = { mode: 'Keep current' as const, ...shared }
  return { rateLimit: { ...base, rateLimit: 15 }, vpnRequired: { ...base }, excludedTests: { ...base }, window: { ...base } }
}

export default function App() {
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
      setTour({ guide, index })
      const s = GUIDES[guide].steps[index].screen
      if (s !== screen) go(s)
    },
    [go, screen],
  )

  const moveTour = useCallback(
    (delta: number) => {
      if (!tour) return
      const steps = GUIDES[tour.guide].steps
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
      const steps = GUIDES[t.guide].steps
      const next = steps[from + 1]
      if (!next) return null
      return next.screen === screenRef.current ? { ...t, index: from + 1 } : t
    })
  }, [])

  // Keep the tour in sync when the user moves through the flow on their own.
  useEffect(() => {
    if (!tour) return
    const steps = GUIDES[tour.guide].steps
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
    if (returnTo) setToast('Cambios guardados')
  }

  const editFrom = (target: Screen, origin: Screen) => {
    setReturnTo(r => r ?? origin)
    go(target)
  }

  const onContinue = () => {
    if (screen === 'details') {
      if (!draft.name.trim() || (draft.startDate && draft.endDate && draft.endDate < draft.startDate)) return setShowErrors(true)
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
        { id, name: draft.name, updated: 'Updated just now', assets: selected.length, schedule: formatDate(draft.startDate), status: 'Complete', isNew: true },
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
    setToast(`Aplicaste ${NUMBER_WORDS[n] ?? n} ${n === 1 ? 'cambio' : 'cambios'} a los assets`)
  }

  const drawerAsset = drawer ? ASSETS.find(a => a.id === drawer) : undefined
  const checkedAssets = ASSETS.filter(a => checked.includes(a.id))

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar onHome={() => { setReturnTo(null); go('list') }} />
      <Shell header={<Header introKey={screen} happy={happy} onSmiley={() => { setHappy(true); setChatOpen(true) }} />}>
        {stepIndex >= 0 && <Stepper active={stepIndex} editing={!!returnTo} onGo={i => { setReturnTo(null); go(ORDER[i]) }} />}

        <div key={screen} className="fade-up flex flex-col gap-[18px]">
          {returnTo && stepIndex >= 0 && (
            <div className="flex items-center gap-[10px] px-[14px] py-[10px] bg-[#eefafa] border border-[#cbe9ea] text-[11px] text-[#285b5e]">
              <span className="font-semibold">Editing from {returnTo === 'review' ? 'Review' : 'Configure'}.</span>
              <span>Save your changes to go straight back. You won't need to repeat the other steps.</span>
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
                onCancel={onBack}
                cancelLabel={returnTo || screen === 'details' ? 'Cancel' : 'Back'}
                onContinue={onContinue}
                continueLabel={screen === 'review' ? 'Create exercise' : returnTo === 'review' ? 'Save and return to review' : returnTo ? 'Save and return' : 'Continue'}
              />
            </div>
          )}
          {screen === 'created' && (
            <div className="flex justify-end pt-[48px] sm:pt-[120px]">
              <Button className="min-w-[108px] h-[40px] px-[15px]" onClick={() => go('list')} iconRight={<ArrowRight size={16} strokeWidth={1.75} />}>Continue</Button>
            </div>
          )}
        </div>
        <AssistantLauncher open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </Shell>

      {toast && (
        <div role="status" className="fade-up fixed z-40 bottom-[72px] left-[12px] md:left-[112px] flex items-center gap-[10px] w-[min(344px,calc(100vw-24px))] min-h-[37px] py-[8px] px-[12px] bg-[#e8f8ef] border border-[#c4ecd6] text-[11px] font-semibold">
          <Check size={15} />
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Cerrar"><X size={15} /></button>
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
            setToast(`Guardaste la configuración de ${drawerAsset.name}`)
          }}
        />
      )}

      <Assistant open={chatOpen} setOpen={setChatOpen} screen={screen} tour={tour} onStartTour={startTour} />
      {tour && (
        <TourOverlay
          step={GUIDES[tour.guide].steps[tour.index]}
          index={tour.index}
          total={GUIDES[tour.guide].steps.length}
          onNext={() => moveTour(1)}
          onPrev={() => moveTour(-1)}
          onClose={() => setTour(null)}
          onTargetClick={() => advanceFrom(tour.index)}
        />
      )}
    </div>
  )
}
