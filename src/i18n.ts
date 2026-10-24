/**
 * Minimal EN/ES support. Copy is written inline as t('English', 'Español') so both versions
 * sit next to each other. App owns the language state and re-renders the tree when it changes;
 * this module keeps the current value so plain helpers (dates, summaries) can read it too.
 */
export type Lang = 'en' | 'es'

const KEY = 'strike-lang'
let current: Lang = (() => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'es' || v === 'en' ? v : 'en'
  } catch {
    return 'en'
  }
})()

export const getLang = () => current
export function setCurrentLang(l: Lang) {
  current = l
  try { localStorage.setItem(KEY, l) } catch { /* storage unavailable */ }
  document.documentElement.lang = l
}

export const t = (en: string, es: string) => (current === 'es' ? es : en)

/** Spanish for values that come from data (statuses, types, options…). Proper names stay as they are. */
const VALUES_ES: Record<string, string> = {
  Complete: 'Completo',
  Scheduled: 'Programado',
  'In progress': 'En curso',
  Draft: 'Borrador',
  Active: 'Activo',
  Inactive: 'Inactivo',
  'Web application': 'Aplicación web',
  'Mobile application': 'Aplicación móvil',
  Production: 'Producción',
  Development: 'Desarrollo',
  'Customer-facing': 'Clientes',
  'Internal testing': 'Pruebas internas',
  Internal: 'Interno',
  Public: 'Público',
  Basic: 'Básico',
  Standard: 'Estándar',
  Comprehensive: 'Exhaustivo',
  'Does not repeat': 'No se repite',
  Weekly: 'Semanal',
  Monthly: 'Mensual',
  Quarterly: 'Trimestral',
  'Destructive testing': 'Pruebas destructivas',
  'Denial-of-service testing': 'Pruebas de denegación de servicio',
  'Social engineering': 'Ingeniería social',
  'Other restricted tests': 'Otras pruebas restringidas',
  'Keep current': 'Mantener',
  'Apply new': 'Aplicar nuevo',
  Reset: 'Restablecer',
  Inherit: 'Heredar',
  'Set custom': 'Personalizar',
  Status: 'Estado',
  Scope: 'Alcance',
  Type: 'Tipo',
  Environment: 'Entorno',
  'Exercise details': 'Detalles',
  'Select assets': 'Assets',
  Configure: 'Configurar',
  Review: 'Revisión',
  Recommended: 'Recomendado',
  Required: 'Requerido',
  'Not required': 'No requerido',
  'Inherits defaults': 'Hereda valores',
  'Custom overrides': 'Personalizados',
  Configuration: 'Configuración',
  'VPN access': 'Acceso por VPN',
}

export const tv = (value: string) => (current === 'es' ? VALUES_ES[value] ?? value : value)

export const locale = () => (current === 'es' ? 'es-AR' : 'en-US')
