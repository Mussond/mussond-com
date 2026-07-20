// display-controls — shared theme/contrast/flourish control logic plus
// auto-wiring for the footer DisplayControls instance and the global
// Option/Alt+T keyboard shortcut (moves focus to it).
//
// Side-effect import this from Layout.astro:
//   <script>import '../scripts/display-controls';</script>

type ThemeChoice = 'light' | 'dark' | 'system';
type ContrastChoice = 'low' | 'high' | 'system';
type FlourishChoice = 'full' | 'reduced' | 'raw';

const html = document.documentElement;
const instances: HTMLElement[] = [];
let systemListenersInitialised = false;

function getStoredTheme(): ThemeChoice {
  const stored = localStorage.getItem('theme');
  return (stored === 'light' || stored === 'dark') ? stored : 'system';
}

function getStoredContrast(): ContrastChoice {
  const stored = localStorage.getItem('contrast');
  return (stored === 'low' || stored === 'high') ? stored : 'system';
}

// Flourish has no "system" radio choice (only full/reduced/raw). With
// nothing stored yet, the initial default follows prefers-reduced-motion
// so users who've already asked for less motion land on the quiet option.
function resolveDefaultFlourish(): FlourishChoice {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
}

function getStoredFlourish(): FlourishChoice {
  const stored = localStorage.getItem('flourish');
  return (stored === 'full' || stored === 'reduced' || stored === 'raw')
    ? stored
    : resolveDefaultFlourish();
}

function getEffectiveTheme(): 'light' | 'dark' {
  return html.classList.contains('dark') ? 'dark' : 'light';
}

function getEffectiveContrast(): 'low' | 'high' {
  return html.getAttribute('data-contrast') === 'high' ? 'high' : 'low';
}

function resolveSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveSystemContrast(): 'low' | 'high' {
  return window.matchMedia('(prefers-contrast: more)').matches ? 'high' : 'low';
}

function applyTheme(value: ThemeChoice) {
  if (value === 'system') {
    localStorage.removeItem('theme');
    html.className = resolveSystemTheme();
  } else {
    localStorage.setItem('theme', value);
    html.className = value;
  }
}

function applyContrast(value: ContrastChoice) {
  if (value === 'system') {
    localStorage.removeItem('contrast');
    html.setAttribute('data-contrast', resolveSystemContrast());
  } else {
    localStorage.setItem('contrast', value);
    html.setAttribute('data-contrast', value);
  }
}

function applyFlourish(value: FlourishChoice) {
  localStorage.setItem('flourish', value);
  html.setAttribute('data-flourish', value);
}

function syncInstance(root: HTMLElement) {
  const theme = getStoredTheme();
  const contrast = getStoredContrast();
  const flourish = getStoredFlourish();

  root.querySelectorAll<HTMLInputElement>('[data-control="theme"]').forEach((r) => {
    r.checked = r.value === theme;
  });
  root.querySelectorAll<HTMLInputElement>('[data-control="contrast"]').forEach((r) => {
    r.checked = r.value === contrast;
  });
  root.querySelectorAll<HTMLInputElement>('[data-control="flourish"]').forEach((r) => {
    r.checked = r.value === flourish;
  });

  const themeLive = root.querySelector('[data-theme-live]');
  const contrastLive = root.querySelector('[data-contrast-live]');
  const flourishLive = root.querySelector('[data-flourish-live]');
  if (themeLive) {
    themeLive.textContent = theme === 'system'
      ? `system (${getEffectiveTheme()})`
      : theme;
  }
  if (contrastLive) {
    contrastLive.textContent = contrast === 'system'
      ? `system (${getEffectiveContrast()})`
      : contrast;
  }
  if (flourishLive) {
    flourishLive.textContent = flourish;
  }
}

function syncAll() {
  instances.forEach(syncInstance);
}

function initDisplayControls(root: HTMLElement) {
  instances.push(root);

  root.querySelectorAll<HTMLInputElement>('[data-control="theme"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      applyTheme(radio.value as ThemeChoice);
      syncAll();
    });
  });

  root.querySelectorAll<HTMLInputElement>('[data-control="contrast"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      applyContrast(radio.value as ContrastChoice);
      syncAll();
    });
  });

  root.querySelectorAll<HTMLInputElement>('[data-control="flourish"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      applyFlourish(radio.value as FlourishChoice);
      syncAll();
    });
  });

  syncInstance(root);
}

function initSystemListeners() {
  if (systemListenersInitialised) return;
  systemListenersInitialised = true;

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() !== 'system') return;
    html.className = resolveSystemTheme();
    syncAll();
  });

  window.matchMedia('(prefers-contrast: more)').addEventListener('change', () => {
    if (getStoredContrast() !== 'system') return;
    html.setAttribute('data-contrast', resolveSystemContrast());
    syncAll();
  });

  syncAll();
}

// ============================================
// Auto-wire on DOM ready — footer instance + shortcut
// ============================================

function getFooterControls(): HTMLElement | null {
  return document.querySelector('.site-footer .display-controls');
}

function wireFooter() {
  const footer = getFooterControls();
  if (footer) initDisplayControls(footer);
}

function wireKeyboardShortcut() {
  document.addEventListener('keydown', (event) => {
    // Bail out when the user is typing in a form field, so Option-key
    // characters (†, ™, etc.) can still be entered. Radios, checkboxes,
    // and buttons are <input> too but don't accept text — let the
    // shortcut through when one of those has focus.
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    const isTypingInput =
      tag === 'INPUT' &&
      !/^(radio|checkbox|button|submit|reset|range|color|file|hidden|image)$/i.test(
        (target as HTMLInputElement).type,
      );
    if (isTypingInput || tag === 'TEXTAREA' || target?.isContentEditable) return;

    // Match Option+T / Alt+T. event.code is the primary check — on macOS
    // with a US layout, Option+T produces † for event.key.
    const isShortcut =
      event.altKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      (event.code === 'KeyT' || event.key === 't' || event.key === 'T');
    if (!isShortcut) return;
    event.preventDefault();

    const footer = getFooterControls();
    if (!footer) return;

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    footer.scrollIntoView({ block: 'center', behavior });

    const checkedTheme = footer.querySelector<HTMLInputElement>('[data-control="theme"]:checked');
    checkedTheme?.focus();
  });
}

function autoWire() {
  wireFooter();
  wireKeyboardShortcut();
  initSystemListeners();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoWire);
} else {
  autoWire();
}
