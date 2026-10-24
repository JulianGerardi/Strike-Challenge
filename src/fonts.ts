/**
 * Aeonik Fono is a licensed typeface, so its files are not committed (see .gitignore).
 * When they are present in src/assets/fonts they get bundled and registered here;
 * without them the UI falls back to Inter.
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
