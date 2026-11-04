import type { HazardClass, Property } from '../types/property';

/**
 * The survey chart. Levels are laid out on a flat plane (Leaflet's CRS.Simple,
 * so `x` runs east and `y` runs north) in the order a resident would noclip
 * through them. Nothing here depends on Leaflet: the layout is plain data and
 * pure functions, which keeps it unit-testable without a DOM.
 */

export interface LevelRegion {
  /** The number in "Level 37". Listings are matched to a region by this. */
  key: string;
  label: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const region = (
  key: string,
  name: string,
  col: number,
  row: number,
  w = 270,
  h = 210
): LevelRegion => ({
  key,
  label: `Level ${key}`,
  name,
  // Columns and rows sit on a 330 x 250 grid, leaving a gutter between districts.
  x: 60 + col * 330,
  y: 40 + row * 250,
  w,
  h,
});

/** Rows count up from the bottom of the chart. */
export const LEVELS: readonly LevelRegion[] = [
  region('0', 'The Lobby', 1, 1, 270, 210),
  region('1', 'Habitable Zone', 2, 1),
  region('2', 'Pipe Dreams', 2, 0),
  region('3', 'Electrical Station', 1, 0),
  region('4', 'Abandoned Offices', 0, 1),
  region('5', 'Terror Hotel', 0, 2),
  region('6', 'Lights Out', 1, 2),
  region('9', 'Suburbs', 2, 2),
  region('11', 'The Infinite City', 3, 2),
  region('37', 'Poolrooms', 3, 0),
];

/** Strip along the south edge for levels the survey has not charted. */
export const UNCHARTED: LevelRegion = {
  key: 'uncharted',
  label: 'Uncharted',
  name: 'Unsurveyed levels',
  x: 60,
  y: -150,
  w: 1260,
  h: 150,
};

export const WORLD_BOUNDS = {
  south: UNCHARTED.y - 30,
  west: 0,
  north: 40 + 2 * 250 + 210 + 40,
  east: 60 + 3 * 330 + 270 + 60,
} as const;

/** The route between levels, in descent order. Drawn as dashed stairwells. */
export const ROUTE: readonly string[] = LEVELS.map((level) => level.key);

const REGIONS_BY_KEY = new Map(LEVELS.map((level) => [level.key, level]));

/** "Level 37" -> "37". Anything without a number is treated as uncharted. */
export const levelKey = (level: string): string | null => {
  const match = /\d+/.exec(level);
  return match ? String(Number(match[0])) : null;
};

export const regionFor = (level: string): LevelRegion => {
  const key = levelKey(level);
  return (key !== null && REGIONS_BY_KEY.get(key)) || UNCHARTED;
};

/** FNV-1a. Small, stable across runs, and good enough to scatter sector names. */
const hash = (input: string): number => {
  let value = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
};

const PADDING = 28;

export interface Placement {
  property: Property;
  region: LevelRegion;
  /** Leaflet `[lat, lng]`, i.e. `[y, x]`. */
  position: [number, number];
}

/**
 * Pin every listing inside its level. A unit's sector decides where in the
 * level it sits, so the same sector always lands in the same spot. Units that
 * share a sector fan out around it, ordered by id so nothing jumps on reload.
 */
export const placeListings = (properties: readonly Property[]): Placement[] => {
  const bySector = new Map<string, Property[]>();

  for (const property of properties) {
    const sectorKey = `${regionFor(property.level).key}|${property.sector.trim().toLowerCase()}`;
    const group = bySector.get(sectorKey);
    if (group) group.push(property);
    else bySector.set(sectorKey, [property]);
  }

  const placements: Placement[] = [];

  for (const [sectorKey, group] of bySector) {
    const sample = group[0];
    const area = regionFor(sample.level);
    const seed = hash(sectorKey);

    const innerW = area.w - PADDING * 2;
    const innerH = area.h - PADDING * 2;
    const baseX = area.x + PADDING + ((seed & 0xffff) / 0xffff) * innerW;
    const baseY = area.y + PADDING + (((seed >>> 16) & 0xffff) / 0xffff) * innerH;

    const ordered = [...group].sort((a, b) => a._id.localeCompare(b._id));

    ordered.forEach((property, index) => {
      let x = baseX;
      let y = baseY;

      if (ordered.length > 1) {
        const angle = (index / ordered.length) * Math.PI * 2;
        x += Math.cos(angle) * 18;
        y += Math.sin(angle) * 18;
      }

      // Keep fanned-out pins inside the level's walls.
      x = Math.min(Math.max(x, area.x + 12), area.x + area.w - 12);
      y = Math.min(Math.max(y, area.y + 12), area.y + area.h - 12);

      placements.push({ property, region: area, position: [y, x] });
    });
  }

  return placements;
};

/** Listings per level, for the legend and the side list. Charted levels first. */
export const groupByRegion = (
  placements: readonly Placement[]
): Array<{ region: LevelRegion; placements: Placement[] }> => {
  const groups = new Map<string, Placement[]>();
  for (const placement of placements) {
    const list = groups.get(placement.region.key);
    if (list) list.push(placement);
    else groups.set(placement.region.key, [placement]);
  }

  return [...LEVELS, UNCHARTED]
    .filter((candidate) => groups.has(candidate.key))
    .map((candidate) => ({ region: candidate, placements: groups.get(candidate.key) ?? [] }));
};

export const PIN_COLORS: Record<HazardClass, string> = {
  safe: '#8d9a58',
  caution: '#f4efd9',
  hostile: '#c4442b',
};
