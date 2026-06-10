// Emulator launcher. Mounts EmulatorJS inside an isolated <iframe srcdoc>
// so its many window globals and DOM mutations cannot leak into the main app.
//
// blob: object URLs created in the parent are same-origin with the srcdoc
// iframe and are passed through directly as EJS_gameUrl.

let currentObjectUrl = null;
let currentIframe = null;

function escapeForScript(str) {
  // Keep blob URLs and core names safe inside an inline <script> string.
  return String(str).replace(/[\\'"<>&]/g, (c) => {
    switch (c) {
      case '\\': return '\\\\';
      case "'":  return "\\'";
      case '"':  return '\\"';
      case '<':  return '\\u003c';
      case '>':  return '\\u003e';
      case '&':  return '\\u0026';
      default:   return c;
    }
  });
}

function buildSrcdoc({ core, gameUrl, gameName, dataPath, volume, startOnLoaded, debug, accent }) {
  const cfg = {
    core: escapeForScript(core),
    gameUrl: escapeForScript(gameUrl),
    gameName: escapeForScript(gameName || ''),
    dataPath: escapeForScript(dataPath),
    accent: escapeForScript(accent || '#ff3b6b'),
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ConsoleHUB — Player</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; color: #eee;
               font-family: system-ui, sans-serif; overflow: hidden; }
  #game { position: absolute; inset: 0; }
  .ejs-fatal { position: absolute; inset: 0; display: grid; place-items: center;
               padding: 24px; text-align: center; font-size: 14px; color: #ff8aa3; }
  /* defensive: hide tiny known credit nodes that may appear bottom-right */
  .consolehub-hide-credit { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
</style>
</head>
<body>
<div id="game"></div>
<script>
  window.EJS_player        = '#game';
  window.EJS_core          = '${cfg.core}';
  window.EJS_gameUrl       = '${cfg.gameUrl}';
  window.EJS_gameName      = '${cfg.gameName}';
  window.EJS_pathtodata    = '${cfg.dataPath}';
  window.EJS_startOnLoaded = ${startOnLoaded ? 'true' : 'false'};
  window.EJS_volume        = ${Number.isFinite(volume) ? volume : 0.5};
  window.EJS_color         = '${cfg.accent}';
  window.EJS_DEBUG_XX      = ${debug ? 'true' : 'false'};

  window.addEventListener('error', function (e) {
    var host = document.getElementById('game');
    if (!host) return;
    var div = document.createElement('div');
    div.className = 'ejs-fatal';
    div.textContent = 'Emulator failed to load: ' + (e.message || 'unknown error');
    host.appendChild(div);
  });

  // Aggressively remove "websim" / credit overlays (text, images, or background-images)
  // that some cores inject. Uses a MutationObserver plus periodic sweep to catch late
  // injections (including ones that appear only in fullscreen).
  (function removeCredits() {
    const matcher = /websim|web sim/i;
    const HIDE_CLASS = 'consolehub-hide-credit';

    function hideElement(el) {
      try {
        if (!el || !(el instanceof Element)) return;
        // If element or its text matches
        const text = (el.textContent || '').trim();
        if (text && matcher.test(text)) {
          el.classList.add(HIDE_CLASS);
          // remove if clearly positioned as a small bottom-right overlay
          const cs = window.getComputedStyle(el);
          if (cs && (cs.position === 'fixed' || cs.position === 'absolute') &&
              (cs.bottom !== 'auto' || cs.right !== 'auto')) {
            el.remove();
            return;
          }
        }
        // If element has an IMG child that looks like a credit/logo
        const imgs = Array.from(el.querySelectorAll ? el.querySelectorAll('img') : []);
        for (const img of imgs) {
          try {
            const alt = (img.alt || '') + ' ' + (img.title || '');
            if (matcher.test(alt) || (img.src && /websim/i.test(img.src))) {
              img.classList.add(HIDE_CLASS);
              img.remove();
            }
          } catch (e) { /* ignore */ }
        }
        // If element uses a background-image with "websim" in URL
        const bg = window.getComputedStyle(el).backgroundImage || '';
        if (bg && /websim/i.test(bg)) {
          el.classList.add(HIDE_CLASS);
          el.remove();
          return;
        }
        // Hide tiny fixed-position bottom-right nodes heuristically
        const cs2 = window.getComputedStyle(el);
        if (cs2 && (cs2.position === 'fixed' || cs2.position === 'absolute') &&
            (cs2.bottom !== 'auto' && cs2.right !== 'auto')) {
          const r = el.getBoundingClientRect();
          if (r.width <= 320 && r.height <= 180) {
            el.classList.add(HIDE_CLASS);
          }
        }
      } catch (e) { /* ignore DOM access errors */ }
    }

    // Initial sweep
    Array.from(document.querySelectorAll('body *')).forEach(hideElement);

    // Periodic sweep for anything missed (longer duration to catch fullscreen-injected nodes)
    let sweeps = 0;
    const sweepId = setInterval(() => {
      sweeps += 1;
      Array.from(document.querySelectorAll('body *')).forEach(hideElement);
      if (sweeps > 60) clearInterval(sweepId); // stop after ~6s
    }, 100);

    // Observe mutations and hide new nodes immediately
    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        for (const node of rec.addedNodes) {
          if (node instanceof Element) hideElement(node);
          if (node instanceof Element) {
            Array.from(node.querySelectorAll ? node.querySelectorAll('*') : []).forEach(hideElement);
          }
        }
      }
    });
    try {
      mo.observe(document.body, { childList: true, subtree: true, attributes: true });
      // Also stop observer after a while to avoid overhead
      setTimeout(() => mo.disconnect(), 10000);
    } catch (e) {
      // If observing is not allowed, keep periodic sweep as fallback
    }
  }());
</script>
<script src="${cfg.dataPath}loader.js"></script>
</body>
</html>`;
}

export function launchEmulator(container, opts) {
  if (!container) throw new Error('Emulator container element is required.');

  destroyEmulator(container);

  // Accept an uploaded Blob (file picker / drag-drop) OR a direct URL
  // (a built-in library file living alongside the project).
  let resolvedGameUrl;
  if (opts.gameFile instanceof Blob) {
    currentObjectUrl = URL.createObjectURL(opts.gameFile);
    resolvedGameUrl = currentObjectUrl;
  } else if (typeof opts.gameUrl === 'string' && opts.gameUrl.length) {
    resolvedGameUrl = opts.gameUrl;
  } else {
    throw new Error('A ROM file or URL is required to launch.');
  }

  const iframe = document.createElement('iframe');
  iframe.className = 'emu-iframe';
  iframe.title = `${opts.systemName} — ${opts.gameName}`;
  iframe.allow = 'gamepad; fullscreen; autoplay; clipboard-write';
  iframe.allowFullscreen = true;
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.srcdoc = buildSrcdoc({
    core: opts.core,
    gameUrl: resolvedGameUrl,
    gameName: opts.gameName,
    dataPath: opts.dataPath,
    volume: opts.volume,
    startOnLoaded: opts.startOnLoaded,
    debug: opts.debug,
    accent: opts.accent,
  });

  container.appendChild(iframe);
  currentIframe = iframe;
  return iframe;
}

export function destroyEmulator(container) {
  if (currentIframe && currentIframe.parentNode) {
    currentIframe.parentNode.removeChild(currentIframe);
  }
  currentIframe = null;
  if (container) {
    while (container.firstChild) container.removeChild(container.firstChild);
  }
  if (currentObjectUrl) {
    try { URL.revokeObjectURL(currentObjectUrl); } catch { /* ignore */ }
    currentObjectUrl = null;
  }
}

export function requestEmulatorFullscreen() {
  const target = currentIframe;
  if (!target) return false;
  const fn = target.requestFullscreen
          || target.webkitRequestFullscreen
          || target.msRequestFullscreen;
  if (!fn) return false;
  try { fn.call(target); return true; } catch { return false; }
}
