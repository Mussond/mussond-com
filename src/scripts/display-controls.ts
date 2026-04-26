// display-controls — shared theme/contrast control logic plus
// auto-wiring for the inline DisplaySettings panel (homepage),
// the ThemeDrawer dialog (every page), and the global Cmd/Ctrl+
// Shift+K keyboard shortcut.
//
// Side-effect import this from Layout.astro:
//   <script>import '../scripts/display-controls';</script>

type ThemeChoice = 'light' | 'dark' | 'system';
type ContrastChoice = 'low' | 'high' | 'decorative' | 'system';

const html = document.documentElement;
const instances: HTMLElement[] = [];
let systemListenersInitialised = false;

function getStoredTheme(): ThemeChoice {
  const stored = localStorage.getItem('theme');
  return (stored === 'light' || stored === 'dark') ? stored : 'system';
}

function getStoredContrast(): ContrastChoice {
  const stored = localStorage.getItem('contrast');
  return (stored === 'low' || stored === 'high' || stored === 'decorative') ? stored : 'system';
}

function getEffectiveTheme(): 'light' | 'dark' {
  return html.classList.contains('dark') ? 'dark' : 'light';
}

function getEffectiveContrast(): 'low' | 'high' | 'decorative' {
  const c = html.getAttribute('data-contrast');
  return (c === 'high' || c === 'decorative') ? c : 'low';
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

function syncInstance(root: HTMLElement) {
  const theme = getStoredTheme();
  const contrast = getStoredContrast();

  root.querySelectorAll<HTMLInputElement>('[data-control="theme"]').forEach((r) => {
    r.checked = r.value === theme;
  });
  root.querySelectorAll<HTMLInputElement>('[data-control="contrast"]').forEach((r) => {
    r.checked = r.value === contrast;
  });

  const themeLive = root.querySelector('[data-theme-live]');
  const contrastLive = root.querySelector('[data-contrast-live]');
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
}

function syncAll() {
  instances.forEach(syncInstance);

  const navButton = document.querySelector('[aria-controls="theme-drawer"]') as HTMLButtonElement | null;
  if (navButton) {
    navButton.setAttribute(
      'aria-label',
      `Theme and contrast settings, currently ${getEffectiveTheme()} and ${getEffectiveContrast()} contrast`
    );
  }
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
// Auto-wire on DOM ready — panel + drawer + shortcut
// ============================================

function wirePanel() {
  const panel = document.getElementById('display-settings');
  if (!panel) return;

  const showRow = document.getElementById('display-settings-show-row');
  const showButton = document.getElementById('display-settings-show') as HTMLButtonElement | null;
  const hideButton = document.getElementById('display-settings-hide') as HTMLButtonElement | null;

  const controls = panel.querySelector('.display-controls') as HTMLElement | null;
  if (controls) initDisplayControls(controls);

  hideButton?.addEventListener('click', () => {
    panel.hidden = true;
    if (showRow) showRow.hidden = false;
    showButton?.focus();
  });

  showButton?.addEventListener('click', () => {
    panel.hidden = false;
    if (showRow) showRow.hidden = true;
    const firstChip = panel.querySelector<HTMLInputElement>('[data-control="contrast"]:checked')
      ?? panel.querySelector<HTMLInputElement>('[data-control="contrast"]');
    firstChip?.focus();
  });
}

function wireDrawer() {
  const drawer = document.getElementById('theme-drawer') as HTMLDialogElement | null;
  const navButton = document.querySelector('[aria-controls="theme-drawer"]') as HTMLButtonElement | null;
  if (!drawer || !navButton) return;

  const closeButton = drawer.querySelector('[data-theme-drawer-close]') as HTMLButtonElement | null;
  const controls = drawer.querySelector('.display-controls') as HTMLElement | null;
  if (controls) initDisplayControls(controls);

  navButton.addEventListener('click', () => {
    drawer.showModal();
    const checkedTheme = drawer.querySelector<HTMLInputElement>('[data-control="theme"]:checked');
    checkedTheme?.focus();
  });

  closeButton?.addEventListener('click', () => drawer.close());

  // Backdrop click — only closes on clicks outside the dialog rect.
  // Bubbled clicks from children (incl. arrow-key radio synthetic clicks
  // with clientX/Y = 0) are filtered out.
  drawer.addEventListener('click', (event) => {
    if (event.target !== drawer) return;
    const rect = drawer.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) drawer.close();
  });

  // Focus trap — wrap Tab/Shift-Tab between close → checked theme → checked contrast
  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const checkedTheme =
      drawer.querySelector<HTMLInputElement>('[data-control="theme"]:checked') ??
      drawer.querySelector<HTMLInputElement>('[data-control="theme"]');
    const checkedContrast =
      drawer.querySelector<HTMLInputElement>('[data-control="contrast"]:checked') ??
      drawer.querySelector<HTMLInputElement>('[data-control="contrast"]');

    const stops = [closeButton, checkedTheme, checkedContrast].filter(Boolean) as HTMLElement[];
    if (stops.length === 0) return;

    const first = stops[0];
    const last = stops[stops.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function wireKeyboardShortcut() {
  document.addEventListener('keydown', (event) => {
    const isShortcut =
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'k';
    if (!isShortcut) return;
    event.preventDefault();

    const target = document.body.dataset.shortcutTarget;

    if (target === 'panel') {
      const panel = document.getElementById('display-settings') as HTMLElement | null;
      const showRow = document.getElementById('display-settings-show-row');
      const showButton = document.getElementById('display-settings-show') as HTMLButtonElement | null;
      if (!panel) return;

      if (panel.hidden) {
        panel.hidden = false;
        if (showRow) showRow.hidden = true;
        const firstChip = panel.querySelector<HTMLInputElement>('[data-control="contrast"]:checked')
          ?? panel.querySelector<HTMLInputElement>('[data-control="contrast"]');
        firstChip?.focus();
      } else {
        panel.hidden = true;
        if (showRow) showRow.hidden = false;
        showButton?.focus();
      }
      return;
    }

    const drawer = document.getElementById('theme-drawer') as HTMLDialogElement | null;
    if (!drawer) return;
    if (drawer.open) {
      drawer.close();
    } else {
      drawer.showModal();
      const checkedTheme = drawer.querySelector<HTMLInputElement>('[data-control="theme"]:checked');
      checkedTheme?.focus();
    }
  });
}

function autoWire() {
  wirePanel();
  wireDrawer();
  wireKeyboardShortcut();
  initSystemListeners();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoWire);
} else {
  autoWire();
}