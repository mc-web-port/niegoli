 // System catalog mapping RetroHub IDs to EmulatorJS cores.
 // EmulatorJS core names are taken from the stable /data/cores manifest.
 // File extensions are advisory only — EmulatorJS does the real loading.

 export const SYSTEMS = [
   // Nintendo family first (ordered roughly by release date)
   {
     id: 'nes',
     name: 'NES / Famicom',
     short: 'NES',
     core: 'nes',
     icon: '/nes.png',
     extensions: ['.nes', '.fds', '.unf', '.unif'],
     description: '8-bit Nintendo Entertainment System. Very stable in EmulatorJS.',
     badges: [],
   },
   {
     id: 'gb',
     name: 'Game Boy',
     short: 'GB',
     core: 'gb',
     icon: '/gb.png',
     extensions: ['.gb'],
     description: 'Original Game Boy handheld.',
     badges: [],
   },
   {
     id: 'snes',
     name: 'Super Nintendo',
     short: 'SNES',
     core: 'snes',
     icon: '/snes.png',
     extensions: ['.smc', '.sfc', '.fig', '.swc'],
     description: '16-bit Super Nintendo. Runs well on most modern hardware.',
     badges: [],
   },
   {
     id: 'vb',
     name: 'Virtual Boy',
     short: 'VB',
     core: 'vb',
     icon: '/VB.png',
     extensions: ['.vb', '.vbk'],
     description: 'Nintendo Virtual Boy — experimental support and limited compatibility in-browser.',
     badges: [],
   },
   {
     id: 'n64',
     name: 'Nintendo 64',
     short: 'N64',
     core: 'n64',
     icon: '/N64.png',
     extensions: ['.n64', '.z64', '.v64'],
     description: 'Nintendo 64. Browser performance and accuracy vary widely.',
     badges: [],
   },
   {
     id: 'gbc',
     name: 'Game Boy Color',
     short: 'GBC',
     core: 'gb',
     icon: '/gbc.png',
     extensions: ['.gbc', '.gb'],
     description: 'Game Boy Color. Uses the same core as Game Boy.',
     badges: [],
   },
   {
     id: 'gba',
     name: 'Game Boy Advance',
     short: 'GBA',
     core: 'gba',
     icon: '/gba.png',
     extensions: ['.gba'],
     description: '32-bit Game Boy Advance. Generally smooth.',
     badges: [],
   },
   {
     id: 'nds',
     name: 'Nintendo DS',
     short: 'NDS',
     core: 'nds',
     icon: '/nds.png',
     extensions: ['.nds'],
     description: 'Dual-screen Nintendo DS. Performance varies; touch input is awkward in browsers.',
     badges: ['Experimental'],
   },

   // Sega family next
   {
     id: 'segaMD',
     name: 'Sega Genesis / Mega Drive',
     short: 'GEN',
     core: 'segaMD',
     icon: '/segagen.png',
     extensions: ['.md', '.gen', '.smd', '.bin'],
     description: '16-bit Sega Genesis / Mega Drive.',
     badges: [],
   },
   {
     id: 'segaMS',
     name: 'Sega Master System',
     short: 'SMS',
     core: 'segaMS',
     icon: '/segamaster.png',
     extensions: ['.sms'],
     description: '8-bit Sega Master System.',
     badges: [],
   },
   {
     id: 'segaGG',
     name: 'Sega Game Gear',
     short: 'GG',
     core: 'segaGG',
     icon: '/gg.png',
     extensions: ['.gg'],
     description: 'Sega’s 8-bit handheld.',
     badges: [],
   },

   // Sony / PlayStation last
   {
     id: 'psx',
     name: 'PlayStation',
     short: 'PSX',
     core: 'psx',
     icon: '/ps.png',
     extensions: ['.bin', '.cue', '.iso', '.img', '.pbp', '.chd'],
     description: 'Sony PlayStation. Most games require a PSX BIOS file you legally own.',
     badges: ['BIOS may be required'],
   },
 ];

 export function getSystem(id) {
   return SYSTEMS.find((s) => s.id === id) || null;
 }
