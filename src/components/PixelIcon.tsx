/**
 * 10×10 pixel icons drawn in the style of the "Icon Wrapper" mark from the design.
 * Each pixel fades in with a diagonal stagger the first time the icon mounts.
 */
const GRIDS = {
  // Exercise details: the original target-and-arrow mark
  target: [
    '..#####.#.',
    '.#......##',
    '#..##..#..',
    '#.#...#..#',
    '#.#.##...#',
    '#.#.##.#.#',
    '#.#....#.#',
    '#..####..#',
    '.#......#.',
    '..######..',
  ],
  // Testing depth: three stacked layers
  depth: [
    '...####...',
    '.##....##.',
    '...####...',
    '#........#',
    '.##....##.',
    '...####...',
    '#........#',
    '.##....##.',
    '...####...',
    '..........',
  ],
  // Schedule: calendar
  schedule: [
    '..#....#..',
    '##########',
    '#........#',
    '##########',
    '#........#',
    '#.#.#.#..#',
    '#........#',
    '#.#.#.##.#',
    '#.....##.#',
    '##########',
  ],
  // Human validation: shield with a check
  validation: [
    '...####...',
    '###....###',
    '#........#',
    '#......#.#',
    '#.#...#..#',
    '#..#.#...#',
    '.#..#...#.',
    '..#....#..',
    '...#..#...',
    '....##....',
  ],
  // Exercise defaults: sliders
  sliders: [
    '..........',
    '..#.......',
    '#####.####',
    '..#.......',
    '..........',
    '.......#..',
    '#####.####',
    '.......#..',
    '..........',
    '..........',
  ],
} as const

export type PixelIconName = keyof typeof GRIDS

export function PixelIcon({ name, size = 20, color = '#111315' }: { name: PixelIconName; size?: number; color?: string }) {
  const cells = GRIDS[name].flatMap((row, y) => [...row].map((c, x) => (c === '#' ? [x, y] : null)).filter(Boolean) as number[][])
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color} shapeRendering="crispEdges" aria-hidden>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} className="px-in" style={{ animationDelay: `${(x + y) * 22}ms` }} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  )
}
