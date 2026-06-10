/**
 * Split per-system library aggregator.
 *
 * This file combines per-system modules into a single LIBRARY export and
 * exposes libraryFor(systemId). To add or edit entries for a console,
 * edit the corresponding file in src/library/.
 */

import { NES } from './library/nes.js';
import { GBA } from './library/gba.js';
import { GB } from './library/gb.js';
import { GBC } from './library/gbc.js';
import { SNES } from './library/snes.js';
import { NDS } from './library/nds.js';
import { N64 } from './library/n64.js';
import { VB } from './library/vb.js';

// Combine all per-system arrays into one master library
export const LIBRARY = [
  ...NDS,
  ...GBA,
  ...NES,
  ...GB,
  ...GBC,
  ...SNES,
  ...N64,
  ...VB,
];

// Helper to get entries for a specific system
export function libraryFor(systemId) {
  return LIBRARY.filter((e) => e.system === systemId);
}
