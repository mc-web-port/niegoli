import { SYSTEMS, getSystem } from './systems.js';
import { LIBRARY, libraryFor } from './library.js';
import {
  loadPrefs, savePrefs, resetPrefs,
  loadRecent, addRecent, clearRecent,
} from './storage.js';
import {
  launchEmulator, destroyEmulator, requestEmulatorFullscreen,
} from './emulator.js';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  prefs: loadPrefs(),
  recent: loadRecent(),
  systemId: null,
  romFile: null,
};

 // Supported languages and simple translations for common UI labels and modal text
const LANGS = {
  en: {
    flag: '🇺🇸',
    suggest: 'Suggest',
    changelog: 'Changelog',
    ai: 'AI Assistant',
    askPlaceholder: 'Ask something...',
    ai_send: 'Ask',
    ai_composing: 'Assistant is composing...',
    ai_you: 'You',
    ai_assistant: 'Assistant',
    ai_welcome: 'Hi — I\'m the ConsoleHUB assistant. Ask me about launching games, uploading ROMs, or settings.',
    settings: 'Settings',
    languageTitle: 'Language',
    suggestTitle: 'Suggestions',
    publish: 'Publish',
    saveLocal: 'Save locally',
    whatsNew: "What's new",
    close: 'Close',
    suggestPlaceholder: 'Short suggestion...',
    publicSuggestionsTitle: 'Public suggestions',
    localSuggestionsTitle: 'Your saved suggestions',
    publicSuggestionsEmpty: 'No public suggestions yet.',
    localSuggestionsEmpty: 'You have no saved suggestions.',
    publicSuggestionsNote: 'Public suggestions are stored as shared comments on the network (collection: "comment").',
    settings_label_accent: 'Accent color',
    settings_label_volume: 'Volume',
    settings_label_startonload: 'Start automatically when game loads',
    settings_label_debug: 'Verbose emulator debug logging',
    settings_label_datapath: 'EmulatorJS data path',
    settings_hint_datapath: 'Leave default unless you self-host EmulatorJS.',
    settings_reset: 'Reset',
    upload_drop: 'Drop ROM here',
    upload_browse: 'or click to browse',
    upload_accepted_prefix: 'Accepted:',
    upload_icon: '⬒',
  },
  es: {
    flag: '🇪🇸',
    suggest: 'Sugerir',
    changelog: 'Cambios',
    ai: 'Asistente IA',
    askPlaceholder: 'Preguntar algo...',
    ai_send: 'Preguntar',
    ai_composing: 'El asistente está escribiendo...',
    ai_you: 'Tú',
    ai_assistant: 'Asistente',
    ai_welcome: 'Hola — soy el asistente de ConsoleHUB. Pregúntame sobre cómo lanzar juegos, subir ROMs o los ajustes.',
    settings: 'Ajustes',
    languageTitle: 'Idioma',
    suggestTitle: 'Sugerencias',
    publish: 'Publicar',
    saveLocal: 'Guardar localmente',
    whatsNew: 'Qué hay de nuevo',
    close: 'Cerrar',
    suggestPlaceholder: 'Sugerencia breve...',
    publicSuggestionsTitle: 'Sugerencias públicas',
    localSuggestionsTitle: 'Tus sugerencias guardadas',
    publicSuggestionsEmpty: 'Aún no hay sugerencias públicas.',
    localSuggestionsEmpty: 'No tienes sugerencias guardadas.',
    publicSuggestionsNote: 'Las sugerencias públicas se almacenan como comentarios compartidos en la red (colección: "comment").',
    settings_label_accent: 'Color de acento',
    settings_label_volume: 'Volumen',
    settings_label_startonload: 'Iniciar automáticamente cuando se carga el juego',
    settings_label_debug: 'Registro de depuración detallado del emulador',
    settings_label_datapath: 'Ruta de datos de EmulatorJS',
    settings_hint_datapath: 'Deja el valor por defecto a menos que alojes EmulatorJS tú mismo.',
    settings_reset: 'Restablecer',
    upload_drop: 'Suelta el ROM aquí',
    upload_browse: 'o toca para subir',
    upload_accepted_prefix: 'Aceptado:',
    upload_icon: '⬒',
  },
  fr: {
    flag: '🇫🇷',
    suggest: 'Suggérer',
    changelog: 'Journal',
    ai: "Assistant IA",
    askPlaceholder: 'Poser une question...',
    ai_send: 'Demander',
    ai_composing: "L'assistant écrit...",
    ai_you: 'Vous',
    ai_assistant: "Assistant",
    ai_welcome: "Bonjour — je suis l'assistant ConsoleHUB. Demandez-moi comment lancer des jeux, télécharger des ROMs ou régler les paramètres.",
    settings: 'Paramètres',
    languageTitle: 'Langue',
    suggestTitle: 'Suggestions',
    publish: 'Publier',
    saveLocal: 'Enregistrer localement',
    whatsNew: 'Nouveautés',
    close: 'Fermer',
    suggestPlaceholder: "Brève suggestion...",
    publicSuggestionsTitle: 'Suggestions publiques',
    localSuggestionsTitle: 'Vos suggestions enregistrées',
    publicSuggestionsEmpty: "Pas encore de suggestions publiques.",
    localSuggestionsEmpty: "Vous n'avez aucune suggestion enregistrée.",
    publicSuggestionsNote: "Les suggestions publiques sont stockées comme commentaires partagés sur le réseau (collection : \"comment\").",
    settings_label_accent: "Couleur d'accent",
    settings_label_volume: "Volume",
    settings_label_startonload: "Démarrer automatiquement au chargement du jeu",
    settings_label_debug: "Journal de débogage détaillé de l'émulateur",
    settings_label_datapath: "Chemin de données EmulatorJS",
    settings_hint_datapath: "Laisser par défaut sauf si vous hébergez EmulatorJS vous-même.",
    settings_reset: "Réinitialiser",
    upload_drop: 'Déposez le ROM ici',
    upload_browse: 'ou cliquez pour parcourir',
    upload_accepted_prefix: 'Accepté :',
    upload_icon: '⬒',
  },
};

// Ensure preferences include language
if (!state.prefs.lang) {
  state.prefs.lang = 'en';
  savePrefs(state.prefs);
}

function applyLanguage() {
  const lang = state.prefs.lang || 'en';
  const t = LANGS[lang] || LANGS.en;

  // Topbar buttons / labels
  const flagEl = document.getElementById('lang-flag');
  const suggestLabel = document.getElementById('label-suggest');
  const changelogLabel = document.getElementById('label-changelog');
  const settingsLabel = document.getElementById('label-settings');

  if (flagEl) flagEl.textContent = t.flag;
  if (suggestLabel) suggestLabel.textContent = t.suggest;
  if (changelogLabel) changelogLabel.textContent = t.changelog;
  if (settingsLabel) settingsLabel.textContent = t.settings;

  // Modal and dialog titles
  const changelogTitle = document.getElementById('changelog-title');
  const suggestTitle = document.getElementById('suggest-title');
  const settingsTitle = document.getElementById('settings-title');
  const aiTitle = document.getElementById('ai-title');
  const aiInput = document.getElementById('ai-input');

  if (changelogTitle) changelogTitle.textContent = t.changelog;
  if (suggestTitle) suggestTitle.textContent = t.suggestTitle || t.suggest;
  if (settingsTitle) settingsTitle.textContent = t.settings;
  if (aiTitle && t.ai) aiTitle.textContent = t.ai;
  // place the "ask something" placeholder into the pinned AI input row
  if (aiInput && t.askPlaceholder) aiInput.placeholder = t.askPlaceholder;

  // AI modal controls: send/close button labels and aria labels
  const aiSendBtn = document.getElementById('ai-send');
  const closeAi = document.getElementById('closeAiBtn');
  const closeAiX = document.getElementById('closeAiXBtn');
  if (aiSendBtn && t.ai_send) aiSendBtn.textContent = t.ai_send;
  if (closeAi && t.close) closeAi.textContent = t.close;
  if (closeAiX && t.close) closeAiX.setAttribute('aria-label', t.close);

  // Suggest modal buttons and labels
  const publishBtn = document.getElementById('suggest-publish');
  const saveLocalBtn = document.getElementById('suggest-save-local');
  const closeSuggestX = document.getElementById('closeSuggestXBtn');
  const suggestInput = document.getElementById('suggest-input');
  const suggestLabelPublish = document.getElementById('suggest-label-publish');
  const publicTitle = document.getElementById('public-suggestions-title');
  const localTitle = document.getElementById('local-suggestions-title');
  const suggestFooter = document.getElementById('suggest-footer');

  if (publishBtn && t.publish) publishBtn.textContent = t.publish;
  if (saveLocalBtn && t.saveLocal) saveLocalBtn.textContent = t.saveLocal;
  if (closeSuggestX && t.close) closeSuggestX.setAttribute('aria-label', t.close);
  if (suggestInput && t.suggestPlaceholder) suggestInput.placeholder = t.suggestPlaceholder;
  if (suggestLabelPublish && t.publish) suggestLabelPublish.textContent = t.publish;
  if (publicTitle && t.publicSuggestionsTitle) publicTitle.textContent = t.publicSuggestionsTitle;
  if (localTitle && t.localSuggestionsTitle) localTitle.textContent = t.localSuggestionsTitle;
  if (suggestFooter && t.publicSuggestionsNote) suggestFooter.textContent = t.publicSuggestionsNote;

  // Changelog modal headings and items
  const whatsNewEl = document.getElementById('changelog-whatsnew');
  if (whatsNewEl && t.whatsNew) whatsNewEl.textContent = t.whatsNew;
  const changelogItem1 = document.getElementById('changelog-item1');
  const changelogItem2 = document.getElementById('changelog-item2');
  const changelogFooter = document.getElementById('changelog-footer');
  if (changelogItem1 && t.changelog_item1) changelogItem1.textContent = t.changelog_item1;
  if (changelogItem2 && t.changelog_item2) changelogItem2.textContent = t.changelog_item2;
  if (changelogFooter && t.changelog_footer) changelogFooter.textContent = t.changelog_footer;

  // Upload zone localized text
  const uploadDrop = document.getElementById('upload-drop');
  const uploadBrowse = document.getElementById('upload-browse');
  const uploadIcon = document.getElementById('upload-icon');
  if (uploadDrop && t.upload_drop) uploadDrop.textContent = t.upload_drop;
  if (uploadBrowse && t.upload_browse) uploadBrowse.textContent = t.upload_browse;
  if (uploadIcon && t.upload_icon) uploadIcon.textContent = t.upload_icon;

  // Accepted prefix for upload accept line (kept here so language changes update it)
  const uploadAcceptEl = document.getElementById('upload-accept');
  if (uploadAcceptEl && t.upload_accepted_prefix) {
    // If current system was already selected, update its accepted list as well
    const rawSys = getSystem(state.systemId);
    const exts = (rawSys && rawSys.extensions) ? rawSys.extensions.join(', ') : '';
    uploadAcceptEl.textContent = exts ? `${t.upload_accepted_prefix} ${exts}` : '';
  }

  // Changelog close buttons
  const closeChangelogBtn = document.getElementById('closeChangelogBtn');
  const closeChangelogX = document.getElementById('closeChangelogXBtn');
  if (closeChangelogBtn && t.close) closeChangelogBtn.textContent = t.close;
  if (closeChangelogX && t.close) closeChangelogX.setAttribute('aria-label', t.close);

  // Settings close buttons and labels
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const closeSettingsX = document.getElementById('closeSettingsXBtn');
  if (closeSettingsBtn && t.close) closeSettingsBtn.textContent = t.close;
  if (closeSettingsX && t.close) closeSettingsX.setAttribute('aria-label', t.close);

  // Settings labels (non-dynamic form text)
  const labelAccent = document.getElementById('label-accent');
  const labelVolume = document.getElementById('label-volume');
  const labelStart = document.getElementById('label-startonload');
  const labelDebug = document.getElementById('label-debug');
  const labelDatapath = document.getElementById('label-datapath');
  const hintDatapath = document.getElementById('datapath-hint');
  const settingsResetBtn = document.getElementById('settings-reset');

  if (labelAccent && t.settings_label_accent) labelAccent.textContent = t.settings_label_accent;
  if (labelVolume && t.settings_label_volume) labelVolume.textContent = t.settings_label_volume;
  if (labelStart && t.settings_label_startonload) labelStart.textContent = t.settings_label_startonload;
  if (labelDebug && t.settings_label_debug) labelDebug.textContent = t.settings_label_debug;
  if (labelDatapath && t.settings_label_datapath) labelDatapath.textContent = t.settings_label_datapath;
  if (hintDatapath && t.settings_hint_datapath) hintDatapath.textContent = t.settings_hint_datapath;
  if (settingsResetBtn && t.settings_reset) settingsResetBtn.textContent = t.settings_reset;

  // Fallback: update any remaining modal headings by id if present
  const idsToPatch = ['accounts-title', 'changelog-title', 'suggest-title', 'ai-title', 'settings-title'];
  idsToPatch.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // If element still has English text and we have a localized counterpart, update conservatively
    if (id === 'suggest-title' && t.suggestTitle) el.textContent = t.suggestTitle;
    if (id === 'changelog-title' && t.changelog) el.textContent = t.changelog;
    if (id === 'settings-title' && t.settings) el.textContent = t.settings;
  });
}

function translateSystem(sys) {
  const lang = state.prefs.lang || 'en';
  // Per-system overrides: only translate fields we have translations for.
  // Keep original fields as fallbacks.
  const translations = {
    en: {},
    es: {
      nes: {
        name: 'NES / Famicom',
        short: 'NES',
        description: 'Nintendo Entertainment System de 8 bits. Muy estable en EmulatorJS.',
      },
      snes: {
        name: 'Super Nintendo',
        short: 'SNES',
        description: 'Super Nintendo de 16 bits. Funciona bien en la mayoría del hardware moderno.',
      },
      gb: {
        name: 'Game Boy',
        short: 'GB',
        description: 'Game Boy portátil original.',
      },
      gbc: {
        name: 'Game Boy Color',
        short: 'GBC',
        description: 'Game Boy Color. Usa el mismo núcleo que Game Boy.',
      },
      gba: {
        name: 'Game Boy Advance',
        short: 'GBA',
        description: 'Game Boy Advance de 32 bits. Generalmente fluido.',
      },
      nds: {
        name: 'Nintendo DS',
        short: 'NDS',
        description: 'Nintendo DS de doble pantalla. El rendimiento varía; la entrada táctil es incómoda en navegadores.',
      },
      segaMD: {
        name: 'Sega Genesis / Mega Drive',
        short: 'GEN',
        description: 'Sega Genesis / Mega Drive de 16 bits.',
      },
      segaMS: {
        name: 'Sega Master System',
        short: 'SMS',
        description: 'Sega Master System de 8 bits.',
      },
      segaGG: {
        name: 'Sega Game Gear',
        short: 'GG',
        description: 'Consola portátil Sega Game Gear.',
      },
      psx: {
        name: 'PlayStation',
        short: 'PSX',
        description: 'Sony PlayStation. La mayoría de juegos requieren un archivo BIOS de PSX que poseas legalmente.',
      },
      n64: {
        name: 'Nintendo 64',
        short: 'N64',
        description: 'Nintendo 64. El rendimiento en navegador y la precisión varían ampliamente.',
      },
      vb: {
        name: 'Virtual Boy',
        short: 'VB',
        description: 'Nintendo Virtual Boy — soporte experimental y compatibilidad limitada en el navegador.',
      },
    },
    fr: {
      nes: { name: 'NES / Famicom', short: 'NES', description: 'Nintendo Entertainment System 8 bits.' },
      snes: { name: 'Super Nintendo', short: 'SNES', description: 'Super Nintendo 16 bits.' },
      gb: { name: 'Game Boy', short: 'GB', description: 'Game Boy originale.' },
      gbc: { name: 'Game Boy Color', short: 'GBC', description: 'Game Boy Color.' },
      gba: { name: 'Game Boy Advance', short: 'GBA', description: 'Game Boy Advance 32 bits.' },
      nds: { name: 'Nintendo DS', short: 'NDS', description: 'Nintendo DS à double écran.' },
      segaMD: { name: 'Sega Genesis / Mega Drive', short: 'GEN', description: 'Sega Genesis / Mega Drive.' },
      segaMS: { name: 'Sega Master System', short: 'SMS', description: 'Sega Master System.' },
      segaGG: { name: 'Sega Game Gear', short: 'GG', description: 'Console portable Sega Game Gear.' },
      psx: { name: 'PlayStation', short: 'PSX', description: 'Sony PlayStation (un BIOS peut être requis).' },
      n64: { name: 'Nintendo 64', short: 'N64', description: 'Nintendo 64.' },
      vb: { name: 'Virtual Boy', short: 'VB', description: 'Virtual Boy — support expérimental.' },
    },
  };

  const map = (translations[lang] && translations[lang][sys.id]) || {};
  return {
    id: sys.id,
    icon: sys.icon,
    core: sys.core,
    badges: sys.badges || [],
    name: map.name || sys.name,
    short: map.short || sys.short,
    description: map.description || sys.description,
  };
}

function openLanguageMenu() {
  // Simple ephemeral menu anchored to button
  const btn = document.getElementById('langBtn');
  if (!btn) return;
  // remove any existing menu
  const existing = document.getElementById('lang-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'lang-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 1200;
  menu.style.background = 'var(--bg-2)';
  menu.style.border = '1px solid var(--line)';
  menu.style.borderRadius = '8px';
  menu.style.padding = '6px';
  menu.style.display = 'grid';
  menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.6)';

  const rect = btn.getBoundingClientRect();
  // position near topbar (fixed page)
  menu.style.left = `${Math.max(8, rect.left)}px`;
  menu.style.top = `${rect.bottom + 8}px`;

  for (const code of Object.keys(LANGS)) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'btn';
    item.style.padding = '8px 12px';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    item.style.background = 'transparent';
    item.style.border = 'none';
    item.style.cursor = 'pointer';
    item.innerHTML = `<span style="font-size:18px">${LANGS[code].flag}</span><span style="font-weight:600">${code.toUpperCase()}</span>`;
    item.addEventListener('click', () => {
      state.prefs.lang = code;
      savePrefs(state.prefs);
      applyLanguage();
      menu.remove();
    });
    menu.appendChild(item);
  }

  // click outside to close
  document.body.appendChild(menu);
  setTimeout(() => {
    const onDoc = (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', onDoc);
      }
    };
    document.addEventListener('click', onDoc);
  }, 0);
}

 // Network-backed suggestions via WebsimSocket
 // room is created lazily to avoid consuming memory/network resources until needed.
 let room = null;
 let publicSuggestionsCache = [];

 // Create and initialize the shared room instance on demand.
 async function ensureRoomInitialized() {
   if (room) return room;
   try {
     room = new WebsimSocket();
     if (typeof room.initialize === 'function') {
       await room.initialize();
     }
     return room;
   } catch (e) {
     // If initialization fails, clear room to allow future retries.
     room = null;
     throw e;
   }
 }

 // Create or fetch a persistent system account record so the app can reference
 // a single "system" entity on the shared network. Stored in collection:
 // "system_account_v1". The record will include an abilities list reflecting the
 // app's capabilities.
 async function ensureSystemAccount() {
   try {
    // Ensure the network room is available (lazy init). If it fails, bail gracefully.
    try { await ensureRoomInitialized(); } catch (e) { return null; }

    // Try to find an existing system account (we expect at most one)
    const existing = room.collection('system_account_v1').getList() || [];
    if (Array.isArray(existing) && existing.length) {
      const rec = existing[0];
      window.systemAccount = rec;
      return rec;
    }
    // Create a new system account record describing app abilities
    const abilities = [
      'persistent_records',
      'presence',
      'room_state',
      'comments_integration',
      'file_upload_support',
      'emulator_launch',
      'recent_games_storage',
    ];
    const created = await room.collection('system_account_v1').create({
      name: 'ConsoleHUB System',
      description: 'Automated system account for ConsoleHUB features and integrations.',
      abilities,
      created_at: new Date().toISOString(),
    });
    window.systemAccount = created;
    return created;
  } catch (e) {
    console.warn('[ConsoleHUB] ensureSystemAccount failed:', e);
    return null;
  }
}

 // Initialize network connection and subscriptions; safe to call at boot.
 async function initNetwork() {
   try {
     if (!room || typeof room.initialize !== 'function') {
       publicSuggestionsCache = [];
       return;
     }
     await room.initialize();

     // comment subscription disabled (accounts/features removed)
   publicSuggestionsCache = [];

     // Kick off creation/fetch of the system account (fire-and-forget is fine)
     // This will populate window.systemAccount when available.
     try { await ensureSystemAccount(); } catch (e) { /* ignore */ }
   } catch (e) {
     console.warn('[ConsoleHUB] initNetwork failed:', e);
     publicSuggestionsCache = [];
   }
 }

 // Do not auto-start network initialization at boot to reduce memory and background activity.
 // Network will be initialized lazily when a network-backed action is requested.

// ---------- Accounts modal (simple view + create) ----------
/* Network-backed user accounts.
   Users are persisted into the shared collection 'user_account_v1'.
   We still keep a tiny local session marker (username + timestamp) in localStorage
   to avoid needing interactive auth on every page load. Passwords are stored as-is
   here for simplicity (not secure) — this mirrors the previous local-only behavior
   but makes accounts visible on the network. */
async function loadUsersNetwork() {
  // Try to read users from the network; fall back to localStorage-stored accounts when network is unavailable.
  try {
    await ensureRoomInitialized();
    if (room && room.collection) {
      const list = room.collection('user_account_v1').getList() || [];
      return Array.isArray(list) ? list.slice().reverse() : [];
    }
  } catch (e) {
    console.warn('[ConsoleHUB] loadUsersNetwork (network) failed:', e);
  }
  // Local fallback
  try {
    const raw = localStorage.getItem('retrohub.accounts') || '[]';
    const local = JSON.parse(raw);
    return Array.isArray(local) ? local.slice() : [];
  } catch (e) {
    return [];
  }
}

async function createUserNetwork(username, password) {
  // Prefer network creation but persist locally as a fallback so logins still work offline.
  try {
    // Try lazy init; if network is unavailable, fall back to local-only creation.
    try { await ensureRoomInitialized(); } catch (e) { /* fallback to local below */ }

    if (room && room.collection) {
      const rec = await room.collection('user_account_v1').create({
        username,
        password,
        created_at: new Date().toISOString(),
      });
      // Also save a lightweight local copy
      try {
        const raw = localStorage.getItem('retrohub.accounts') || '[]';
        const arr = JSON.parse(raw);
        arr.push({ username, password, created_at: rec.created_at || new Date().toISOString() });
        localStorage.setItem('retrohub.accounts', JSON.stringify(arr.slice(-200)));
      } catch (e) { /* ignore local save errors */ }
      return rec;
    }
  } catch (e) {
    console.warn('[ConsoleHUB] createUserNetwork (network) failed:', e);
  }
  // Network unavailable: create a local-only account record
  try {
    const created_at = new Date().toISOString();
    const rec = { id: `local-${Date.now()}`, username, password, created_at };
    const raw = localStorage.getItem('retrohub.accounts') || '[]';
    const arr = JSON.parse(raw);
    arr.push(rec);
    localStorage.setItem('retrohub.accounts', JSON.stringify(arr.slice(-200)));
    return rec;
  } catch (e) {
    console.warn('[ConsoleHUB] createUserNetwork (local) failed:', e);
    return null;
  }
}

/*
  Session management: store simple session records on the shared network so
  sessions are global across pages. Sessions are stored in collection:
  'user_session_v1' with shape { username, clientId, created_at }.

  Note: room.collection methods may throw if network is unavailable; these
  helpers fall back to an ephemeral in-memory session object for best-effort.
*/
let __ephemeralSession = null;

async function setSession(username) {
  __ephemeralSession = { username, at: Date.now() };
  try {
    if (!room || !room.collection) return;
    // Remove any existing session for this client, then create a new one.
    const clientId = room.clientId || (room.client && room.client.id) || null;
    // Create a session record attached to this clientId
    await room.collection('user_session_v1').create({
      username,
      clientId,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // network error: keep ephemeral session so UI still reflects signed-in state
    console.warn('[ConsoleHUB] setSession (network) failed:', e);
  }
}

async function clearSession() {
  __ephemeralSession = null;
  try {
    if (!room || !room.collection) return;
    const clientId = room.clientId || (room.client && room.client.id) || null;
    if (!clientId) return;
    // Find any sessions for this client and delete them (we can only delete our own records)
    const list = room.collection('user_session_v1').getList() || [];
    for (const rec of (list || [])) {
      if (rec.clientId === clientId) {
        try { await room.collection('user_session_v1').delete(rec.id); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    console.warn('[ConsoleHUB] clearSession (network) failed:', e);
  }
}

function getSession() {
  // If we have an ephemeral session (set during signup/login), prefer it immediately
  if (__ephemeralSession && __ephemeralSession.username) {
    return __ephemeralSession;
  }

  // Prefer network-backed session discovery if available (synchronous read of collection snapshot)
  try {
    if (room && room.collection) {
      const clientId = room.clientId || (room.client && room.client.id) || null;
      if (clientId) {
        const list = room.collection('user_session_v1').getList() || [];
        // getList returns newest->oldest; find a session matching this clientId
        const found = Array.isArray(list) ? list.find((s) => s.clientId === clientId) : null;
        if (found) return { username: found.username, at: new Date(found.created_at).getTime() };
      }
    }
  } catch (e) {
    console.warn('[ConsoleHUB] getSession (network) probe failed:', e);
  }
  // Fallback to ephemeral session if network not available
  return __ephemeralSession;
}

function renderAccountsInfo() {
  const info = document.getElementById('accounts-info');
  const status = document.getElementById('acct-status');
  const logoutBtn = document.getElementById('acct-logout');
  const loginBtn = document.getElementById('acct-login');
  const signupBtn = document.getElementById('acct-signup');

  if (status) status.textContent = '';

  const session = getSession();
  if (session && session.username) {
    if (info) {
      const sa = window.systemAccount;
      info.innerHTML = sa
        ? `<div style="font-weight:600">${escapeHtml(sa.name || 'ConsoleHUB System')}</div>
           <div class="muted small">${escapeHtml(sa.description || '')}</div>
           <div class="muted small" style="margin-top:6px;">Created: ${new Date(sa.created_at || Date.now()).toLocaleString()}</div>
           <div class="muted small">Abilities: ${(Array.isArray(sa.abilities) ? sa.abilities.join(', ') : '')}</div>`
        : '<div class="muted small">No system account found.</div>';
    }
    if (status) status.textContent = `Signed in as ${session.username}`;
    if (logoutBtn) logoutBtn.style.display = '';
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
  } else {
    if (info) info.innerHTML = '<div class="muted small">No system account found.</div>';
    if (status) status.textContent = 'Not signed in.';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
    if (signupBtn) signupBtn.style.display = '';
  }
}

async function handleCreateSystemAccount() {
  const btn = document.getElementById('create-system-account');
  if (btn) btn.disabled = true;
  try {
    // Require a signed-in local user to create the network system account.
    const session = getSession();
    if (!session || !session.username) {
      const box = document.getElementById('error-box');
      if (box) { box.textContent = 'You must be signed in to create the system account.'; box.hidden = false; setTimeout(() => { if (box) box.hidden = true; }, 2500); }
      return null;
    }

    const created = await ensureSystemAccount();
    if (created) {
      renderAccountsInfo();
      const box = document.getElementById('error-box');
      if (box) { box.textContent = 'System account available.'; box.hidden = false; setTimeout(() => { if (box) box.hidden = true; }, 2000); }
    } else {
      const box = document.getElementById('error-box');
      if (box) { box.textContent = 'Failed to create system account.'; box.hidden = false; setTimeout(() => { if (box) box.hidden = true; }, 2000); }
    }
    return created;
  } catch (e) {
    console.warn('create system account failed', e);
    return null;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openAccounts() {
  const m = document.getElementById('accountsModal');
  if (!m) return;
  renderAccountsInfo();
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  const done = document.getElementById('create-system-account');
  if (done) done.focus();
}
function closeAccounts() {
  const m = document.getElementById('accountsModal');
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
}

// ---------- View switching ----------
// The <body> class (mode-menu | mode-player) is the single source of truth.
// CSS keys all view visibility off it.
function showMenu() {
  const body = document.body;
  body.classList.remove('mode-player');
  body.classList.add('mode-menu');
  const app = document.getElementById('app');
  if (app) app.dataset.view = 'menu';
  const dash   = document.getElementById('dashboardView');
  const player = document.getElementById('playerView');
  if (dash)   dash.removeAttribute('aria-hidden');
  if (player) player.setAttribute('aria-hidden', 'true');
  const main = document.getElementById('main');
  if (main) main.focus({ preventScroll: true });
}

function showPlayer() {
  const body = document.body;
  body.classList.remove('mode-menu');
  body.classList.add('mode-player');
  const app = document.getElementById('app');
  if (app) app.dataset.view = 'emulator';
  const dash   = document.getElementById('dashboardView');
  const player = document.getElementById('playerView');
  if (dash)   dash.setAttribute('aria-hidden', 'true');
  if (player) player.removeAttribute('aria-hidden');
}

// ---------- Sidebar ----------
function renderSidebar() {
  // Use a document fragment and simple markup to minimize reflows.
  const list = $('#system-list');
  list.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const rawSys of SYSTEMS) {
    const sys = translateSystem(rawSys);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'system-item';
    btn.dataset.id = sys.id;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');

    // Only load image paths lazily; keep markup minimal.
    const img = (sys && typeof sys.icon === 'string' && sys.icon.match(/\.png$/i))
      ? `<img class="sys-img" src="${sys.icon}" alt="${sys.short}" loading="lazy" decoding="async">`
      : `${sys ? sys.icon : '?'}`;

    btn.innerHTML = `
      <span class="sys-icon" aria-hidden="true">${img}</span>
      <span class="sys-meta">
        <span class="sys-name">${escapeHtml(sys.name)}</span>
        ${sys.badges && sys.badges.length ? `<span class="sys-badge">${escapeHtml(sys.badges[0])}</span>` : ''}
      </span>`;
    btn.addEventListener('click', () => selectSystem(sys.id));
    frag.appendChild(btn);
  }
  list.appendChild(frag);
}

function selectSystem(id) {
  const rawSys = getSystem(id);
  if (!rawSys) return;
  const sys = translateSystem(rawSys);

  state.systemId = id;
  state.prefs.lastSystem = id;
  savePrefs(state.prefs);

  $$('.system-item').forEach((el) => {
    const active = el.dataset.id === id;
    el.classList.toggle('active', active);
    el.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  $('#system-eyebrow').textContent = sys.short;
  $('#system-title').textContent = sys.name;
  $('#system-desc').textContent = sys.description;

  const badgeWrap = $('#system-badge');
  badgeWrap.innerHTML = '';
  for (const b of sys.badges) {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = b;
    badgeWrap.appendChild(span);
  }

  const lang = state.prefs.lang || 'en';
  const t = LANGS[lang] || LANGS.en;
  $('#upload-accept').textContent =
    (t.upload_accepted_prefix || 'Accepted:') + ' ' + (rawSys.extensions || []).join(', ');
  $('#rom-input').setAttribute('accept', (rawSys.extensions || []).join(','));

  renderLibrary(id);
  clearRom();
  hideError();
}

// ---------- Library ----------
function renderLibrary(systemId) {
  const panel = document.getElementById('library-panel');
  const list  = document.getElementById('library-list');
  const empty = document.getElementById('library-empty');
  if (!panel || !list) return;

  const entries = libraryFor(systemId) || [];
  list.innerHTML = '';

  if (!entries.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  // Limit items rendered at once to avoid heavy DOM on low devices.
  const MAX_RENDER = 50;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < entries.length && i < MAX_RENDER; i++) {
    const entry = entries[i];
    const sys = getSystem(entry.system);
    const li = document.createElement('li');
    li.className = 'library-item';

    const libIconHtml = (sys && typeof sys.icon === 'string' && sys.icon.match(/\.png$/i))
      ? `<img class="sys-img" src="${sys.icon}" alt="${sys.short}" loading="lazy" decoding="async">`
      : `${sys ? sys.icon : '?'}`;
    li.innerHTML = `
      <button type="button" class="library-btn">
        <span class="library-icon" aria-hidden="true">${libIconHtml}</span>
        <span class="library-meta">
          <span class="library-name" title="${entry.title}">${entry.title}</span>
          <span class="library-sub muted small">▶ Tap to play</span>
        </span>
      </button>`;
    li.querySelector('.library-btn').addEventListener('click', () => launchFromLibrary(entry));
    frag.appendChild(li);
  }
  // If there are more items, show a lightweight indicator instead of rendering everything.
  if (entries.length > MAX_RENDER) {
    const more = document.createElement('div');
    more.className = 'muted small';
    more.style.padding = '8px';
    more.textContent = `Showing ${MAX_RENDER} of ${entries.length} entries — refine selection for more.`;
    frag.appendChild(more);
  }
  list.appendChild(frag);
}

function launchFromLibrary(entry) {
  const sys = getSystem(entry.system);
  if (!sys) { showError('Unknown system in library entry.'); return; }

  if (state.systemId !== entry.system) selectSystem(entry.system);
  state.romFile = null; // library uses a URL, not a Blob
  hideError();

  try {
    const container = $('#emu-frame-wrap');
    launchEmulator(container, {
      core: sys.core,
      systemName: sys.name,
      gameName: entry.title,
      gameUrl: entry.file,
      dataPath: state.prefs.dataPath,
      volume: state.prefs.volume,
      startOnLoaded: state.prefs.startOnLoaded,
      debug: state.prefs.debug,
      accent: state.prefs.accent,
    });

    $('#emu-system').textContent = sys.short;
    $('#emu-game').textContent = entry.title;

    state.recent = addRecent({
      system: sys.id,
      name: entry.title,
      size: 0,
    });
    renderRecent();

    showPlayer();
  } catch (err) {
    showError(err && err.message
      ? err.message
      : 'Failed to launch library game.');
  }
}

// ---------- ROM handling ----------
function setRom(file) {
  if (!file) { clearRom(); return; }
  state.romFile = file;
  $('#rom-status').hidden = false;
  $('#rom-name').textContent = file.name;
  $('#rom-size').textContent = formatSize(file.size);
  $('#launch-btn').disabled = !state.systemId;
  hideError();
}

function clearRom() {
  state.romFile = null;
  $('#rom-status').hidden = true;
  $('#rom-name').textContent = '';
  $('#rom-size').textContent = '';
  $('#launch-btn').disabled = true;
  const input = $('#rom-input');
  if (input) input.value = '';
}

function formatSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------- Recent games ----------
function renderRecent() {
  const list = $('#recent-list');
  list.innerHTML = '';
  const recent = Array.isArray(state.recent) ? state.recent : [];
  if (!recent.length) {
    $('#recent-empty').hidden = false;
    return;
  }
  $('#recent-empty').hidden = true;

  // Use fragment to minimize reflows
  const frag = document.createDocumentFragment();
  for (const entry of recent) {
    const sys = getSystem(entry.system);
    const li = document.createElement('li');
    li.className = 'recent-item';

    const recentIconHtml = (sys && typeof sys.icon === 'string' && sys.icon.match(/\.png$/i))
      ? `<img class="sys-img" src="${sys.icon}" alt="${sys.short}" loading="lazy" decoding="async">`
      : `${sys ? sys.icon : '?'}`;
    li.innerHTML = `
      <button type="button" class="recent-btn" data-system="${entry.system}">
        <span class="recent-icon" aria-hidden="true">${recentIconHtml}</span>
        <span class="recent-meta">
          <span class="recent-name" title="${entry.name}">${entry.name}</span>
          <span class="recent-sub muted small">
            ${sys ? sys.short : entry.system} · ${formatSize(entry.size)}
          </span>
        </span>
      </button>`;
    li.querySelector('.recent-btn').addEventListener('click', () => {
      selectSystem(entry.system);
      $('#main').scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash($('#upload-zone'));
    });
    frag.appendChild(li);
  }
  list.appendChild(frag);
}

function flash(el) {
  if (!el) return;
  el.classList.remove('flash');
  // force reflow to restart animation
  void el.offsetWidth;
  el.classList.add('flash');
}

// ---------- Errors ----------
function showError(msg) {
  const box = $('#error-box');
  box.textContent = msg;
  box.hidden = false;
}
function hideError() { $('#error-box').hidden = true; }

// ---------- Launch ----------
function launchSelected() {
  const sys = getSystem(state.systemId);
  if (!sys) { showError('Choose a system from the sidebar first.'); return; }
  if (!state.romFile) { showError('Select a ROM file before launching.'); return; }

  try {
    const container = $('#emu-frame-wrap');
    launchEmulator(container, {
      core: sys.core,
      systemName: sys.name,
      gameName: state.romFile.name,
      gameFile: state.romFile,
      dataPath: state.prefs.dataPath,
      volume: state.prefs.volume,
      startOnLoaded: state.prefs.startOnLoaded,
      debug: state.prefs.debug,
      accent: state.prefs.accent,
    });

    $('#emu-system').textContent = sys.short;
    $('#emu-game').textContent = state.romFile.name;

    state.recent = addRecent({
      system: sys.id,
      name: state.romFile.name,
      size: state.romFile.size,
    });
    renderRecent();

    showPlayer();
  } catch (err) {
    showError(err && err.message ? err.message : 'Failed to launch emulator.');
  }
}

function backToMenu() {
  destroyEmulator($('#emu-frame-wrap'));
  showMenu();
}

// ---------- Settings ----------
function isSettingsOpen() {
  const m = document.getElementById('settingsModal');
  return !!(m && m.classList.contains('is-open'));
}
function openSettings() {
  const m = document.getElementById('settingsModal');
  if (!m) return;
  const accent = $('#setting-accent');
  const volume = $('#setting-volume');
  const startOnLoad = $('#setting-startonload');
  const debug = $('#setting-debug');
  const dataPath = $('#setting-datapath');
  if (accent)      accent.value      = state.prefs.accent;
  if (volume)      volume.value      = state.prefs.volume;
  if (startOnLoad) startOnLoad.checked = state.prefs.startOnLoaded;
  if (debug)       debug.checked     = state.prefs.debug;
  if (dataPath)    dataPath.value    = state.prefs.dataPath;
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  const done = document.getElementById('closeSettingsBtn');
  if (done) done.focus();
}
function closeSettings() {
  const m = document.getElementById('settingsModal');
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
}

function saveSettings() {
  const dpEl = $('#setting-datapath');
  const dp = ((dpEl && dpEl.value) || '').trim()
    || 'https://cdn.emulatorjs.org/stable/data/';
  const accent = $('#setting-accent');
  const volume = $('#setting-volume');
  const startOnLoad = $('#setting-startonload');
  const debug = $('#setting-debug');
  state.prefs = {
    ...state.prefs,
    accent: (accent && accent.value) || '#ff3b6b',
    volume: parseFloat(volume && volume.value) || 0,
    startOnLoaded: !!(startOnLoad && startOnLoad.checked),
    debug: !!(debug && debug.checked),
    dataPath: dp.endsWith('/') ? dp : dp + '/',
  };
  savePrefs(state.prefs);
  applyAccent();
  closeSettings();
}

function applyAccent() {
  document.documentElement.style.setProperty('--accent', state.prefs.accent);
}

/* Suggestions modal: lets the user publish a suggestion (added to 'retrohub.publicSuggestions')
   or save it locally ('retrohub.suggestions'), and view both lists inside a modal. */
/* Changelog modal: shows on page load unless user disables it */
function openChangelog() {
  const m = document.getElementById('changelogModal');
  if (!m) return;
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  const closeBtn = document.getElementById('closeChangelogBtn');
  if (closeBtn) closeBtn.focus();
}
function closeChangelog() {
  const m = document.getElementById('changelogModal');
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
}
function dontShowChangelogAgain() {
  try { localStorage.setItem('retrohub.changelog.hidden', '1'); } catch (e) { /* ignore */ }
  closeChangelog();
}

async function openSuggest() {
  const m = document.getElementById('suggestModal');
  if (!m) return;

  // Try to refresh public suggestions from the network when opening the modal.
  try {
    await ensureRoomInitialized();
    if (room && room.collection) {
      try {
        const list = room.collection('comment').getList() || [];
        // Normalize into cache (newest first as getList returns newest->oldest)
        publicSuggestionsCache = Array.isArray(list) ? list.slice() : [];
      } catch (e) {
        // non-fatal: keep existing cache
        console.warn('[ConsoleHUB] fetch public suggestions failed:', e);
      }
    }
  } catch (e) {
    // ignore network init failures
  }

  renderSuggestions();
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  const ta = document.getElementById('suggest-input');
  if (ta) ta.focus();
}

function closeSuggest() {
  const m = document.getElementById('suggestModal');
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
}



function loadPublicSuggestions() {
  // Return the latest snapshot from the network cache (falls back to empty array).
  return publicSuggestionsCache || [];
}

async function publishSuggestion(obj) {
  // Prefer using the websim comments helper when available (gives user edit UI and stable API),
  // fall back to the raw room collection if necessary.
  try {
    // Use websim.postComment if available (handles UI + network reliably)
    if (window.websim && typeof window.websim.postComment === 'function') {
      await window.websim.postComment({ content: obj.text });
      return true;
    }

    // Otherwise try the lazy-initialized room API (best-effort)
    await ensureRoomInitialized();
    if (!room || !room.collection) throw new Error('Network unavailable');
    await room.collection('comment').create({
      text: obj.text,
      at: obj.at,
    });
    return true;
  } catch (e) {
    console.warn('[ConsoleHUB] publish failed:', e);
    return false;
  }
}

function renderSuggestions() {
  const pubWrap = document.getElementById('public-suggestions');
  const lang = state.prefs.lang || 'en';
  const t = LANGS[lang] || LANGS.en;

  if (pubWrap) {
    const list = loadPublicSuggestions();
    // If comments are objects from the network, prefer .text or .content fields
    const html = (list && list.length)
      ? list.map((s) => {
          const text = s.text || s.content || s.message || '';
          const at = s.at || s.created_at || s.createdAt || Date.now();
          return `<div style="padding:6px;border-bottom:1px dashed rgba(255,255,255,0.02);"><div style="font-weight:600">${escapeHtml(text)}</div><div class="muted small">${new Date(at).toLocaleString()}</div></div>`;
        }).join('')
      : `<div class="muted small">${escapeHtml(t.publicSuggestionsEmpty || 'No public suggestions yet.')}</div>`;
    pubWrap.innerHTML = html;
  }
}

// small helper to avoid inserting raw user HTML
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function setupSuggestHandlers() {
  const publish = document.getElementById('suggest-publish');
  const closeX = document.getElementById('closeSuggestXBtn');
  const ta = document.getElementById('suggest-input');

  if (closeX) closeX.addEventListener('click', closeSuggest);

  if (publish && ta) {
    publish.addEventListener('click', async () => {
      const text = (ta.value || '').trim();
      if (!text) return;
      const obj = { text, at: Date.now() };
      const ok = await publishSuggestion(obj);
      if (ok) {
        ta.value = '';
        // try to refresh public suggestions immediately
        try {
          await ensureRoomInitialized();
          if (room && room.collection) {
            const list = room.collection('comment').getList() || [];
            publicSuggestionsCache = Array.isArray(list) ? list.slice() : publicSuggestionsCache;
          }
        } catch (e) { /* ignore refresh errors */ }

        renderSuggestions();
        const box = document.getElementById('error-box');
        if (box) { box.textContent = 'Published to network.'; box.hidden = false; setTimeout(() => { if (box) box.hidden = true; }, 2000); }
        else alert('Published.');
      } else {
        const box = document.getElementById('error-box');
        if (box) { box.textContent = 'Publish failed (network).'; box.hidden = false; setTimeout(() => { if (box) box.hidden = true; }, 2000); }
        else alert('Publish failed.');
      }
    });
  }
}

// ---------- Wiring ----------
function on(id, ev, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(ev, handler);
}

function wireEvents() {
  on('langBtn',             'click', openLanguageMenu);
  on('suggestBtn',          'click', openSuggest);
  on('changelogBtn',        'click', openChangelog);
  // AI button removed
  on('settingsBtn',         'click', openSettings);
  on('closeSettingsBtn',    'click', saveSettings); // Done = save + close
  on('closeSettingsXBtn',   'click', closeSettings); // X = close only
  on('settings-reset',      'click', () => {
    state.prefs = resetPrefs();
    applyAccent();
    openSettings();
  });

  // Click on the modal backdrop (outside the panel) closes it.
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSettings();
    });
  }

  // hook up accounts modal backdrop and handlers (plus local auth actions)
  // accounts modal removed

  // accounts UI removed

  // Local account actions (simple client-side storage; not secure, for convenience only)
  const signupBtn = document.getElementById('acct-signup');
  const loginBtn = document.getElementById('acct-login');
  const logoutBtn = document.getElementById('acct-logout');
  const unameEl = document.getElementById('acct-username');
  const passEl = document.getElementById('acct-password');
  const statusEl = document.getElementById('acct-status');

  async function handleSignup() {
    const u = (unameEl && unameEl.value || '').trim();
    const p = (passEl && passEl.value || '');
    if (!u || !p) {
      if (statusEl) statusEl.textContent = 'Enter username and password.';
      return;
    }
    try {
      // Check for existing username in network or local fallback
      const existing = await loadUsersNetwork();
      if (existing.find((x) => x.username === u)) {
        if (statusEl) statusEl.textContent = 'Username already exists.';
        return;
      }
      const created = await createUserNetwork(u, p);
      if (!created) {
        if (statusEl) statusEl.textContent = 'Failed to create account.';
        return;
      }
      setSession(u);
      if (statusEl) statusEl.textContent = `Signed up and signed in as ${u}.`;
      renderAccountsInfo();
    } catch (e) {
      console.warn('[ConsoleHUB] signup failed:', e);
      if (statusEl) statusEl.textContent = 'Signup failed.';
    }
  }

  async function handleLogin() {
    const u = (unameEl && unameEl.value || '').trim();
    const p = (passEl && passEl.value || '');
    if (!u || !p) {
      if (statusEl) statusEl.textContent = 'Enter username and password.';
      return;
    }
    try {
      // Try network first
      const users = await loadUsersNetwork();
      // Prefer an exact match including password
      let found = users.find((x) => x.username === u && x.password === p);

      // If network returns records that don't include passwords (or network unavailable),
      // also check the local fallback store to allow previously-created local accounts to log in.
      if (!found) {
        try {
          const raw = localStorage.getItem('retrohub.accounts') || '[]';
          const local = JSON.parse(raw);
          if (Array.isArray(local)) {
            found = local.find((x) => x.username === u && x.password === p) || null;
          }
        } catch (e) { /* ignore parse errors */ }
      }

      if (!found) {
        if (statusEl) statusEl.textContent = 'Invalid username or password.';
        return;
      }
      // Successful login: create session and update UI
      setSession(u);
      if (statusEl) statusEl.textContent = `Signed in as ${u}.`;
      renderAccountsInfo();
    } catch (e) {
      console.warn('[ConsoleHUB] login failed:', e);
      if (statusEl) statusEl.textContent = 'Login failed.';
    }
  }

  async function handleLogout() {
    clearSession();
    if (statusEl) statusEl.textContent = 'Signed out.';
    renderAccountsInfo();
  }

  if (signupBtn) signupBtn.addEventListener('click', handleSignup);
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // hook up suggest modal backdrop and handlers
  const sm = document.getElementById('suggestModal');
  if (sm) {
    sm.addEventListener('click', (e) => { if (e.target === sm) closeSuggest(); });
  }
  // setup handlers for suggest modal buttons (DOM elements are present in index.html)
  setupSuggestHandlers();

  // Changelog modal handlers
  const cm = document.getElementById('changelogModal');
  if (cm) {
    cm.addEventListener('click', (e) => { if (e.target === cm) closeChangelog(); });
  }
  const closeChangelogBtn = document.getElementById('closeChangelogBtn');
  const closeChangelogX = document.getElementById('closeChangelogXBtn');
  if (closeChangelogBtn) closeChangelogBtn.addEventListener('click', closeChangelog);
  if (closeChangelogX) closeChangelogX.addEventListener('click', closeChangelog);

  // AI Assistant modal handlers
  function openAssistant() { /* AI removed */ }
  function closeAssistant() {
    const m = document.getElementById('aiModal');
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  }

  const closeAiBtn = document.getElementById('closeAiBtn');
  const closeAiX = document.getElementById('closeAiXBtn');
  if (closeAiBtn) closeAiBtn.addEventListener('click', closeAssistant);
  if (closeAiX) closeAiX.addEventListener('click', closeAssistant);

  // Wire topbar AI button
  const aiBtn = document.getElementById('aiBtn');
  if (aiBtn) aiBtn.addEventListener('click', openAssistant);

  // AI-backed assistant using websim.chat.completions (ChatGPT-like UI)
  // Maintains a short conversation history per session to provide contextual replies.
  state.assistantHistory = state.assistantHistory || [];

  function renderAssistant() {
    // Ensure handlers and focus are initialized.
    try { setupAssistantHandlers(); } catch (e) { /* ignore */ }

    // Show a single default assistant welcome message once per session when the chat first opens.
    try {
      if (!state.assistantSeen) {
        const lang = state.prefs.lang || 'en';
        const t = LANGS[lang] || LANGS.en;
        const welcome = t.ai_welcome || (t.ai_assistant ? `${t.ai_assistant} here — how can I help?` : 'Hello — how can I help?');
        // store and display the assistant welcome
        state.assistantHistory = state.assistantHistory || [];
        state.assistantHistory.push({ role: 'assistant', content: welcome });
        // appendAssistantMessage is available in this scope
        appendAssistantMessage('assistant', welcome);
        state.assistantSeen = true;
      }
    } catch (e) { /* ignore welcome errors */ }

    const ta = document.getElementById('ai-input');
    if (ta) ta.focus();
  }

  function appendAssistantMessage(role, text) {
    // Messages are added into #ai-chat-window; newest messages shown at top visually by column-reverse
    const win = document.getElementById('ai-chat-window');
    if (!win) return;
    const outer = document.createElement('div');
    outer.style.display = 'flex';
    outer.style.flexDirection = 'column';
    outer.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.className = `ai-bubble ${role === 'user' ? 'user' : 'assistant'}`;

    // Render message content
    let rendered = escapeHtml(text).replace(/\n/g, '<br>');
    try {
      const lastUser = (state.assistantHistory || []).slice().reverse().find((m) => m.role === 'user');
      if (lastUser && typeof lastUser.content === 'string' && /\balgo\b/i.test(lastUser.content)) {
        rendered = rendered.replace(/(\balgo\b)/ig, '<strong>$1</strong>');
      }
    } catch (e) { /* ignore */ }

    bubble.innerHTML = rendered;

    const meta = document.createElement('div');
    meta.className = 'ai-meta';
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Use localized labels for "You" and "Assistant"
    const lang = state.prefs.lang || 'en';
    const t = LANGS[lang] || LANGS.en;
    const who = role === 'user' ? (t.ai_you || 'You') : (t.ai_assistant || 'Assistant');
    meta.textContent = `${who} · ${ts}`;

    outer.appendChild(bubble);
    outer.appendChild(meta);

    // Prepend to the window (column-reverse layout shows this as top)
    win.prepend(outer);

    // Keep scroll area tidy: limit children to 150 messages
    try {
      const nodes = Array.from(win.children);
      if (nodes.length > 150) {
        for (let i = 150; i < nodes.length; i++) win.removeChild(nodes[i]);
      }
    } catch (e) { /* ignore DOM pruning errors */ }
  }

  function setupAssistantHandlers() {
    const send = document.getElementById('ai-send');
    const clear = document.getElementById('ai-clear');
    const ta = document.getElementById('ai-input');

    if (clear) clear.addEventListener('click', () => {
      if (ta) ta.value = '';
      const out = document.getElementById('ai-output');
      if (out) out.innerHTML = '';
      state.assistantHistory = [];
    });

    if (send && ta) {
      send.addEventListener('click', async () => {
        const q = (ta.value || '').trim();
        if (!q) return;
        // record and display the user's question
        state.assistantHistory.push({ role: 'user', content: q });
        appendAssistantMessage('user', q);
        ta.value = '';

        const out = document.getElementById('ai-output');
        if (out) {
          const loading = document.createElement('div');
          loading.style.padding = '8px';
          loading.style.borderBottom = '1px dashed rgba(255,255,255,0.02)';
          loading.className = 'muted small';
          const lang = state.prefs.lang || 'en';
          const t = LANGS[lang] || LANGS.en;
          loading.textContent = t.ai_composing || 'Assistant is composing...';
          out.prepend(loading);
        }

        try {
          // Keep the history trimmed to last 10 messages for context
          const history = state.assistantHistory.slice(-10).map((m) => ({
            role: m.role === 'user' ? 'user' : 'system',
            content: m.content,
          }));

          // system prompt to guide assistant to behave like a helpful ChatGPT-style agent for this app
          const systemMessage = {
            role: 'system',
            content: 'You are a helpful assistant specialized in ConsoleHUB, a browser-based retro game console emulator (not an OS or hardware vendor). Always frame answers for users of a retro console emulator: reference consoles, ROMs, cores/cores options, launch steps, compatibility caveats, input mappings, and performance tips. Answer concisely, give actionable steps, avoid pretending to run games for the user, and mention relevant UI labels and where to click in the app when appropriate.',
          };

          // Build messages array
          const messages = [systemMessage, ...history.map((m) => ({ role: m.role, content: m.content }))];

          // Call websim chat completions API
          const conv = []; // conversation to send (limited)
          messages.forEach((m) => conv.push(m));

          // websim.chat.completions.create returns an object with .content (string)
          const completion = await websim.chat.completions.create({
            messages: conv,
          });

          let assistantText = completion && completion.content ? completion.content : 'No response';

          // Ensure assistant never shows literal ** markers: convert **bold** into plain bold for UI and strip markers for storage.
          // We first strip any literal '**' in the string to avoid the assistant "saying" the markers,
          // then convert any remaining bold markers for display (appendAssistantMessage will also convert, but keep this defensive).
          assistantText = String(assistantText).replace(/\*\*(.*?)\*\*/g, '$1');

          // store assistant reply (clean text) and update UI (appendAssistantMessage will escape and convert ** if present,
          // but we've already removed markers so we display clean text). If you want assistant replies to show bold spans
          // produce those without ** markers (e.g., the API can send HTML-like tokens but we keep display plain).
          state.assistantHistory.push({ role: 'assistant', content: assistantText });

          // remove the loading indicator
          const outNow = document.getElementById('ai-output');
          if (outNow && outNow.firstChild && outNow.firstChild.textContent === 'Assistant is composing...') {
            outNow.removeChild(outNow.firstChild);
          }
          appendAssistantMessage('assistant', assistantText);
        } catch (e) {
          const msg = 'Assistant failed to respond (network or API).';
          state.assistantHistory.push({ role: 'assistant', content: msg });
          // remove loading indicator
          const outNow = document.getElementById('ai-output');
          if (outNow && outNow.firstChild && outNow.firstChild.textContent === 'Assistant is composing...') {
            outNow.removeChild(outNow.firstChild);
          }
          appendAssistantMessage('assistant', msg);
          console.warn('[ConsoleHUB] assistant error:', e);
        }
      });
    }
  }
  // Initialize assistant handlers (idempotent)
  setupAssistantHandlers();

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isSettingsOpen()) { closeSettings(); return; }
    const app = document.getElementById('app');
    if (app && app.dataset.view === 'emulator') backToMenu();
  });

  // Upload zone
  const zone  = $('#upload-zone');
  const input = $('#rom-input');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  zone.tabIndex = 0;
  zone.setAttribute('role', 'button');

  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if (f) setRom(f);
  });

  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault(); zone.classList.add('drag');
    }),
  );
  ['dragleave', 'drop'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault(); zone.classList.remove('drag');
    }),
  );
  zone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) { showError('No file detected in the drop.'); return; }
    if (!state.systemId) { showError('Pick a system before dropping a ROM.'); return; }
    setRom(f);
  });

  $('#clear-rom').addEventListener('click', clearRom);
  $('#launch-btn').addEventListener('click', launchSelected);

  $('#clear-recent').addEventListener('click', () => {
    clearRecent();
    state.recent = [];
    renderRecent();
  });

  $('#back-btn').addEventListener('click', backToMenu);
  $('#fullscreen-btn').addEventListener('click', () => {
    if (!requestEmulatorFullscreen()) {
      showError('Fullscreen was blocked by the browser.');
    }
  });

  window.addEventListener('beforeunload', () => destroyEmulator($('#emu-frame-wrap')));
}

// ---------- Boot ----------
function boot() {
  try {
    // Defensively make sure the modal starts closed even if HTML/CSS drifts.
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    // Force menu mode at startup. Never auto-launch the emulator.
    showMenu();

    applyAccent();
    renderSidebar();
    renderRecent();
    wireEvents();
    // Apply language UI after wiring events so elements exist
    try { applyLanguage(); } catch (e) { /* ignore */ }

    // Update brand tag to show number of built-in ROMs (replaces "browser console")
    try {
      const brandEl = document.getElementById('brand-count');
      if (brandEl && Array.isArray(LIBRARY)) {
        const n = LIBRARY.length || 0;
        brandEl.textContent = `${n} ROMs`;
      }
    } catch (e) {
      /* ignore brand update errors */
    }

    // ensure suggest modal handlers are ready (in case wireEvents ran earlier)
    setupSuggestHandlers();
    // ensure assistant handlers are ready
    try { setupAssistantHandlers(); } catch (e) { /* ignore */ }

    // Show changelog on first load unless disabled by user preference.
    try {
      const hidden = localStorage.getItem('retrohub.changelog.hidden');
      if (!hidden) {
        // small delay so boot logs settle and modal focus works smoothly
        setTimeout(() => openChangelog(), 350);
      }
    } catch (e) { /* ignore storage errors */ }

    const preferred = state.prefs.lastSystem && getSystem(state.prefs.lastSystem)
      ? state.prefs.lastSystem
      : (getSystem('gba') ? 'gba' : SYSTEMS[0].id);
    selectSystem(preferred);

    console.info('[ConsoleHUB] booted menu mode');
    console.info('[ConsoleHUB] selected system:', preferred);
  } catch (err) {
    console.error('[ConsoleHUB] boot failed:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
