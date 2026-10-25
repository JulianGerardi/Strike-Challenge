import { locale, t, tv } from './i18n'

export type ExerciseStatus = 'Complete' | 'Scheduled' | 'In progress' | 'Draft'

export interface Exercise {
  id: string
  name: string
  /** 'now', a number of days ago, or an ISO date */
  updated: 'now' | number | string
  assets: number
  /** ISO date, or '' when not scheduled */
  schedule: string
  status: ExerciseStatus
  isNew?: boolean
  /** What was set up in the flow; seeded rows get one from exerciseSetup(). */
  setup?: ExerciseSetup
}

export interface ExerciseSetup {
  assetIds: string[]
  depth: Depth
  startDate: string
  endDate: string
  recurrence: string
  humanValidation: boolean
  shared: SharedConfig
  overrides: Record<string, AssetOverrides>
}

export type AssetType = 'Web application' | 'Mobile application' | 'API'
export type Environment = 'Production' | 'Staging' | 'Development'

export interface Asset {
  id: string
  name: string
  audience: string
  type: AssetType
  environment: Environment
  identifier: string
  status: 'Active' | 'Inactive'
}

export interface TimeWindow {
  start: string
  end: string
}

/** Per-asset overrides. `undefined` means the asset inherits the exercise default. */
export interface AssetOverrides {
  rateLimit?: number
  vpnRequired?: boolean
  excludedTests?: string[]
  window?: TimeWindow
}

export interface SharedConfig {
  rateLimit: number
  vpnRequired: boolean
  excludedTests: string[]
  window: TimeWindow
}

export type Depth = 'Basic' | 'Standard' | 'Comprehensive'

export interface ExerciseDraft {
  name: string
  objective: string
  depth: Depth
  startDate: string
  endDate: string
  recurrence: string
  startTime: string
  endTime: string
  timeZone: string
  humanValidation: boolean
  validationNotes: string
}

export const EXCLUDABLE_TESTS = ['Destructive testing', 'Denial-of-service testing', 'Social engineering', 'Other restricted tests']
export const RATE_LIMITS = [5, 10, 15, 20, 30, 50]
export const RECURRENCES = ['Does not repeat', 'Weekly', 'Monthly', 'Quarterly']
export const TIME_ZONES = ['UTC-5:00 East Time', 'UTC-3:00 Buenos Aires', 'UTC+0:00 London', 'UTC+1:00 Madrid']

export const INITIAL_EXERCISES: Exercise[] = [
  { id: 'EX-1984', name: 'Payments Perimeter Assessment', updated: 2, assets: 3, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1941', name: 'Payments Perimeter Assessment', updated: '2025-09-18', assets: 7, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1937', name: 'Customer Identity Review', updated: 2, assets: 4, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1922', name: 'Partner API Hardening', updated: '2025-09-12', assets: 2, schedule: '2026-06-10', status: 'Scheduled' },
  { id: 'EX-1918', name: 'Customer Identity Review', updated: '2025-09-09', assets: 4, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1903', name: 'Mobile Checkout Assessment', updated: '2025-09-02', assets: 5, schedule: '2026-04-30', status: 'In progress' },
  { id: 'EX-1897', name: 'Payments Perimeter Assessment', updated: '2025-08-28', assets: 7, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1880', name: 'Internal Tools Review', updated: '2025-08-21', assets: 1, schedule: '', status: 'Draft' },
  { id: 'EX-1874', name: 'Customer Identity Review', updated: '2025-08-19', assets: 4, schedule: '2026-05-24', status: 'Complete' },
  { id: 'EX-1861', name: 'Marketing Site Assessment', updated: '2025-08-03', assets: 2, schedule: '2026-07-02', status: 'Scheduled' },
  { id: 'EX-1855', name: 'Customer Identity Review', updated: '2025-07-30', assets: 4, schedule: '2026-05-24', status: 'Complete' },
]

export const ASSETS: Asset[] = [
  { id: 'a1', name: 'Commerce Web', audience: 'Customer-facing', type: 'Web application', environment: 'Production', identifier: 'shop.example.com', status: 'Active' },
  { id: 'a2', name: 'Commerce iOS', audience: 'Customer-facing', type: 'Mobile application', environment: 'Production', identifier: 'com.example.commerce.ios', status: 'Active' },
  { id: 'a3', name: 'Commerce Android', audience: 'Customer-facing', type: 'Mobile application', environment: 'Production', identifier: 'com.example.commerce.android', status: 'Active' },
  { id: 'a4', name: 'Commerce API', audience: 'Customer-facing', type: 'API', environment: 'Production', identifier: 'api.example.com', status: 'Active' },
  { id: 'a5', name: 'Customer Portal', audience: 'Internal testing', type: 'Mobile application', environment: 'Staging', identifier: 'portal.stg.example.com', status: 'Active' },
  { id: 'a6', name: 'Identity API', audience: 'Customer-facing', type: 'API', environment: 'Production', identifier: 'identity.example.com', status: 'Active' },
  { id: 'a7', name: 'Identity Admin', audience: 'Internal', type: 'Web application', environment: 'Production', identifier: 'admin.identity.example.com', status: 'Active' },
  { id: 'a8', name: 'Identity API', audience: 'Internal testing', type: 'API', environment: 'Staging', identifier: 'identity.stg.example.com', status: 'Active' },
  { id: 'a9', name: 'Payments API', audience: 'Customer-facing', type: 'API', environment: 'Production', identifier: 'payments.example.com', status: 'Active' },
  { id: 'a10', name: 'Partner Portal', audience: 'Partners', type: 'Web application', environment: 'Development', identifier: 'partners.dev.example.com', status: 'Inactive' },
  { id: 'a11', name: 'Marketing Site', audience: 'Public', type: 'Web application', environment: 'Production', identifier: 'www.example.com', status: 'Active' },
]

export const DEFAULT_SHARED: SharedConfig = {
  rateLimit: 10,
  vpnRequired: false,
  excludedTests: [],
  window: { start: '09:00', end: '18:00' },
}

/** Custom exceptions shown in the Figma review screen (iOS and API differ from the defaults). */
export const SEED_OVERRIDES: Record<string, AssetOverrides> = {
  a2: { rateLimit: 5, vpnRequired: true },
  a4: { rateLimit: 20, excludedTests: ['Destructive testing'] },
}

/** A new exercise starts empty; only the recommended depth is preselected. */
export const DEFAULT_DRAFT: ExerciseDraft = {
  name: '',
  objective: '',
  depth: 'Standard',
  startDate: '',
  endDate: '',
  recurrence: '',
  startTime: '',
  endTime: '',
  timeZone: '',
  humanValidation: false,
  validationNotes: '',
}

export function effective(shared: SharedConfig, o: AssetOverrides | undefined): SharedConfig {
  return {
    rateLimit: o?.rateLimit ?? shared.rateLimit,
    vpnRequired: o?.vpnRequired ?? shared.vpnRequired,
    excludedTests: o?.excludedTests ?? shared.excludedTests,
    window: o?.window ?? shared.window,
  }
}

export function hasOverrides(o: AssetOverrides | undefined) {
  return !!o && Object.values(o).some(v => v !== undefined)
}

export function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale(), { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatUpdated(u: Exercise['updated']) {
  if (u === 'now') return t('Updated just now', 'Actualizado recién')
  if (typeof u === 'number') return t(`Updated ${u} days ago`, `Actualizado hace ${u} días`)
  const d = new Date(u + 'T00:00:00').toLocaleDateString(locale(), { month: 'short', day: 'numeric' })
  return t(`Updated ${d}`, `Actualizado el ${d}`)
}

export const formatSchedule = (iso: string) => (iso ? formatDate(iso) : t('Not scheduled', 'Sin programar'))

export function excludedLabel(list: string[]) {
  return list.length ? list.map(tv).join(', ') : t('None', 'Ninguna')
}

const SEED_SCOPES: [RegExp, string[]][] = [
  [/Payments/, ['a9', 'a4', 'a1', 'a6', 'a2', 'a3', 'a11']],
  [/Identity/, ['a6', 'a7', 'a8', 'a1']],
  [/Partner/, ['a10', 'a4']],
  [/Mobile/, ['a2', 'a3', 'a4', 'a9', 'a5']],
  [/Marketing/, ['a11', 'a1']],
  [/Internal/, ['a7']],
]

/** Setup behind a list row. Seeded rows get a stable one derived from their name. */
export function exerciseSetup(e: Exercise): ExerciseSetup {
  if (e.setup) return e.setup
  const pool = SEED_SCOPES.find(([re]) => re.test(e.name))?.[1] ?? ASSETS.map(a => a.id)
  const assetIds = pool.slice(0, e.assets)
  const n = Number(e.id.replace(/\D/g, ''))
  const start = e.schedule
  const end = start ? new Date(new Date(start + 'T00:00:00').getTime() + 11 * 864e5).toISOString().slice(0, 10) : ''
  const overrides: Record<string, AssetOverrides> = {}
  if (assetIds.includes('a2')) overrides.a2 = SEED_OVERRIDES.a2
  if (assetIds.includes('a4')) overrides.a4 = SEED_OVERRIDES.a4
  return {
    assetIds,
    depth: (['Standard', 'Comprehensive', 'Basic'] as Depth[])[n % 3],
    startDate: start,
    endDate: end,
    recurrence: n % 4 === 0 ? 'Quarterly' : 'Does not repeat',
    humanValidation: n % 2 === 1,
    shared: { ...DEFAULT_SHARED, excludedTests: n % 3 === 1 ? ['Social engineering'] : [] },
    overrides,
  }
}
