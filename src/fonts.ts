/**
 * Aeonik Fono (licensed by Julian for web use) lives in src/assets/fonts. Every weight found
 * there is bundled and registered here; if the files are ever removed the UI falls back to Inter.
 */
const files = import.meta.glob('./assets/fonts/AeonikFono-*.otf', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const WEIGHTS: Record<string, string> = { Light: '300', Regular: '400', Medium: '500', Bold: '700' }

export function loadBrandFonts() {
  for (const [path, url] of Object.entries(files)) {
    const weight = WEIGHTS[path.match(/AeonikFono-(\w+)\.otf$/)?.[1] ?? '']
    if (!weight) continue
    new FontFace('Aeonik Fono', `url(${url})`, { weight, display: 'swap' })
      .load()
      .then(face => document.fonts.add(face))
      .catch(() => { /* fall back to Inter */ })
  }
}
