// Thin localStorage wrapper. Stores only preferences and recent-game metadata.
// ROM files themselves are NEVER persisted.

const PREF_KEY = 'retrohub.prefs.v1';
const RECENT_KEY = 'retrohub.recent.v1';
const RECENT_MAX = 12;

const DEFAULT_PREFS = {
  accent: '#ff3b6b',
  volume: 0.5,
  startOnLoaded: true,
  debug: false,
  dataPath: 'https://cdn.emulatorjs.org/stable/data/',
  lastSystem: null,
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadPrefs() {
  try {
    const stored = safeParse(localStorage.getItem(PREF_KEY), {});
    return { ...DEFAULT_PREFS, ...stored };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* storage may be blocked; silently ignore */
  }
}

export function resetPrefs() {
  try {
    localStorage.removeItem(PREF_KEY);
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PREFS };
}

export function loadRecent() {
  try {
    const arr = safeParse(localStorage.getItem(RECENT_KEY), []);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addRecent(entry) {
  const list = loadRecent();
  const filtered = list.filter(
    (e) => !(e.system === entry.system && e.name === entry.name),
  );
  filtered.unshift({
    system: entry.system,
    name: entry.name,
    size: entry.size ?? 0,
    playedAt: Date.now(),
  });
  const trimmed = filtered.slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  return trimmed;
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}
