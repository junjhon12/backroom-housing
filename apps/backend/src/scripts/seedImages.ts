import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from '../config/paths';
import type { HazardClass } from '../models/Property';

/**
 * Seeded listings ship with generated "survey photographs". Keeping them as
 * deterministic SVGs means the demo has a complete gallery without committing
 * binary assets, and every fresh `npm run db:seed` produces the same results.
 */
interface Palette {
  wall: string;
  wallShade: string;
  ceiling: string;
  floor: string;
  floorShade: string;
  door: string;
  trim: string;
  light: string;
}

const PALETTES: Record<HazardClass, Palette> = {
  safe: {
    wall: '#d9ca8d',
    wallShade: '#c4b478',
    ceiling: '#e7dcb2',
    floor: '#8a7a4e',
    floorShade: '#74663f',
    door: '#2a2418',
    trim: '#efe6c4',
    light: '#fff8d6',
  },
  caution: {
    wall: '#b9b98a',
    wallShade: '#9d9d70',
    ceiling: '#cdcd9e',
    floor: '#6f6f48',
    floorShade: '#59593a',
    door: '#211f16',
    trim: '#dedeb4',
    light: '#f4f0c8',
  },
  hostile: {
    wall: '#9c8a7a',
    wallShade: '#7c6b5e',
    ceiling: '#b3a091',
    floor: '#3a2e2a',
    floorShade: '#2a211e',
    door: '#120e0c',
    trim: '#c9b6a6',
    light: '#e8c9a8',
  },
};

const SEED_IMAGE_PATTERN = /^seed-\d{2}-\d{2}\.svg$/;

const pad = (value: number): string => String(value).padStart(2, '0');

const fileName = (propertyNumber: number, shot: number): string =>
  `seed-${pad(propertyNumber)}-${pad(shot)}.svg`;

/** Small deterministic PRNG so each listing looks individual but never changes. */
const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  width: number,
  opacity = 1
): string =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" />`;

/** The second shot is framed slightly tighter. */
const shorten = (shot: number): number => (shot === 0 ? 340 : 388);

/**
 * Draws a one-point-perspective corridor: outer frame at the canvas edge,
 * inner frame at the vanishing rectangle. Wall, floor and ceiling lines all
 * converge on the same opening so the scene reads as a room immediately.
 */
const buildScene = (propertyNumber: number, shot: number, hazard: HazardClass): string => {
  const palette = PALETTES[hazard];
  const random = mulberry32(propertyNumber * 97 + shot * 31 + 7);

  // The vanishing rectangle every perspective line is pulled toward.
  const innerLeft = 420;
  const innerRight = 780;
  const innerTop = 240;
  const innerBottom = 560;
  const innerWidth = innerRight - innerLeft;

  // Each listing opens onto a door at a slightly different point, and the
  // second shot is a closer, off-centre angle of the same unit.
  const doorWidth = shot === 0 ? 120 : 150;
  const doorCentre =
    shot === 0
      ? 600 + (random() - 0.5) * 90
      : 600 + (random() > 0.5 ? 1 : -1) * (110 + random() * 50);
  const doorLeft = doorCentre - doorWidth / 2;
  const doorRight = doorCentre + doorWidth / 2;
  const doorTop = shorten(shot);

  const parts: string[] = [];

  parts.push(`<rect width="1200" height="800" fill="${palette.wall}" />`);

  // Ceiling and floor planes.
  parts.push(
    `<polygon points="0,0 1200,0 ${innerRight},${innerTop} ${innerLeft},${innerTop}" fill="${palette.ceiling}" />`
  );
  parts.push(
    `<polygon points="0,800 1200,800 ${innerRight},${innerBottom} ${innerLeft},${innerBottom}" fill="${palette.floor}" />`
  );

  // Side walls.
  parts.push(
    `<polygon points="0,0 ${innerLeft},${innerTop} ${innerLeft},${innerBottom} 0,800" fill="${palette.wall}" />`
  );
  parts.push(
    `<polygon points="1200,0 ${innerRight},${innerTop} ${innerRight},${innerBottom} 1200,800" fill="${palette.wallShade}" />`
  );

  // Wallpaper stripes, interpolated along each wall's receding edges.
  for (let step = 0; step <= 12; step += 1) {
    const t = step / 12;
    const outerY = t * 800;
    const innerY = innerTop + t * (innerBottom - innerTop);
    parts.push(line(0, outerY, innerLeft, innerY, palette.wallShade, 3, 0.55));
    parts.push(line(1200, outerY, innerRight, innerY, palette.wallShade, 3, 0.45));
  }

  // Carpet seams and ceiling panel joints converging on the opening.
  for (let step = 0; step <= 8; step += 1) {
    const t = step / 8;
    const outerX = t * 1200;
    const innerX = innerLeft + t * innerWidth;
    parts.push(line(outerX, 800, innerX, innerBottom, palette.floorShade, 2, 0.6));
    parts.push(line(outerX, 0, innerX, innerTop, palette.ceiling, 2, 0.5));
  }

  // Baseboards: grounded and slightly brighter than the wall.
  parts.push(line(0, 800, innerLeft, innerBottom, palette.trim, 8, 0.45));
  parts.push(line(1200, 800, innerRight, innerBottom, palette.trim, 8, 0.35));

  // Ceiling fluorescent panels, shrinking toward the opening.
  const lightCount = 3 + Math.floor(random() * 2);
  for (let index = 0; index < lightCount; index += 1) {
    const depth = index / lightCount;
    const y = 30 + depth * 170;
    const halfWidth = 110 - depth * 65;
    const height = 26 - depth * 12;
    const centre = 600 + (shot === 0 ? 0 : -40 + depth * 40);
    parts.push(
      `<polygon points="${(centre - halfWidth).toFixed(1)},${y.toFixed(1)} ${(centre + halfWidth).toFixed(1)},${y.toFixed(1)} ${(centre + halfWidth * 0.82).toFixed(1)},${(y + height).toFixed(1)} ${(centre - halfWidth * 0.82).toFixed(1)},${(y + height).toFixed(1)}" fill="${palette.light}" opacity="${(0.92 - depth * 0.25).toFixed(2)}" />`
    );
  }

  // The opening itself: a dark door set into the far wall.
  parts.push(
    `<rect x="${innerLeft}" y="${innerTop}" width="${innerWidth}" height="${innerBottom - innerTop}" fill="${palette.wallShade}" />`
  );
  parts.push(
    `<rect x="${doorLeft.toFixed(1)}" y="${doorTop.toFixed(1)}" width="${doorWidth}" height="${(innerBottom - doorTop).toFixed(1)}" fill="${palette.door}" />`
  );
  parts.push(
    `<rect x="${(doorLeft - 8).toFixed(1)}" y="${(doorTop - 8).toFixed(1)}" width="${doorWidth + 16}" height="${(innerBottom - doorTop + 8).toFixed(1)}" fill="none" stroke="${palette.trim}" stroke-width="5" opacity="0.8" />`
  );
  parts.push(
    `<circle cx="${(doorRight - 16).toFixed(1)}" cy="${(doorTop + 100).toFixed(1)}" r="4" fill="${palette.trim}" opacity="0.75" />`
  );

  // A soft pool of light on the floor under the opening.
  parts.push(
    `<ellipse cx="${doorCentre.toFixed(1)}" cy="${(innerBottom + 70).toFixed(1)}" rx="170" ry="46" fill="${palette.light}" opacity="0.12" />`
  );

  // Grain and a vignette keep the flat vectors from looking like clip art.
  parts.push(
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>`,
    `<rect width="1200" height="800" filter="url(#grain)" opacity="0.09" />`,
    `<radialGradient id="vignette" cx="50%" cy="50%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0" /><stop offset="100%" stop-color="#000" stop-opacity="0.42" /></radialGradient>`,
    `<rect width="1200" height="800" fill="url(#vignette)" />`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="Survey photograph of the unit"><rect width="1200" height="800" fill="${palette.wall}" />${parts.join('')}</svg>`;
};

/** Removes only generated seed photographs, never a real upload. */
export const resetSeedImages = (): void => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const entry of fs.readdirSync(UPLOADS_DIR)) {
    if (SEED_IMAGE_PATTERN.test(entry)) {
      fs.unlinkSync(path.join(UPLOADS_DIR, entry));
    }
  }
};

/** Writes two survey photographs for a listing and returns their public URLs. */
export const createSeedImages = (
  propertyNumber: number,
  hazard: HazardClass
): string[] => {
  const urls: string[] = [];

  for (const shot of [0, 1]) {
    const name = fileName(propertyNumber, shot);
    fs.writeFileSync(path.join(UPLOADS_DIR, name), buildScene(propertyNumber, shot, hazard), 'utf8');
    urls.push(`/uploads/${name}`);
  }

  return urls;
};
