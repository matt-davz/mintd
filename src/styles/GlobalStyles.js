import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  /* ─────────────────────────────────────────
     RESET
  ───────────────────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ─────────────────────────────────────────
     DESIGN TOKENS
     Source of truth — all components pull from these
  ───────────────────────────────────────── */
  :root {
    /* --- Surface hierarchy (tonal stacking) --- */
    --color-background:               #131313;
    --color-surface-lowest:           #0e0e0e;
    --color-surface-low:              #1c1b1b;
    --color-surface:                  #201f1f;
    --color-surface-high:             #2a2a2a;
    --color-surface-highest:          #353534;
    --color-surface-bright:           #3a3939;
    --color-surface-variant:          #353534;
    --color-surface-dim:              #131313;

    /* --- Primary — Electric Blue --- */
    --color-primary:                  #adc6ff;
    --color-primary-container:        #4d8eff;
    --color-primary-fixed-dim:        #adc6ff;
    --color-primary-fixed:            #d8e2ff;
    --color-on-primary:               #002e6a;
    --color-on-primary-container:     #00285d;
    --color-on-primary-fixed:         #001a42;
    --color-inverse-primary:          #005ac2;

    /* --- Secondary — Muted Gold (grade badges) --- */
    --color-secondary:                #e8c357;
    --color-secondary-container:      #8f7100;
    --color-secondary-fixed:          #ffe08d;
    --color-secondary-fixed-dim:      #e8c357;
    --color-on-secondary:             #3d2f00;
    --color-on-secondary-container:   #fffbff;
    --color-on-secondary-fixed:       #241a00;

    /* --- Tertiary — verified/high-value accents --- */
    --color-tertiary:                 #cbbeff;
    --color-tertiary-container:       #957cff;
    --color-tertiary-fixed:           #e6deff;
    --color-tertiary-fixed-dim:       #cbbeff;
    --color-on-tertiary:              #320099;
    --color-on-tertiary-container:    #2b0087;
    --color-on-tertiary-fixed:        #1d0061;

    /* --- Error --- */
    --color-error:                    #ffb4ab;
    --color-error-container:          #93000a;
    --color-on-error:                 #690005;
    --color-on-error-container:       #ffdad6;

    /* --- Text --- */
    --color-on-background:            #e5e2e1;
    --color-on-surface:               #e5e2e1;
    --color-on-surface-variant:       #c2c6d6;
    --color-inverse-surface:          #e5e2e1;
    --color-inverse-on-surface:       #313030;

    /* --- Borders & outlines --- */
    --color-outline:                  #8c909f;
    --color-outline-variant:          #424754;

    /* --- Surface tint --- */
    --color-surface-tint:             #adc6ff;

    /* ─────────────────────────────────────────
       TYPOGRAPHY
    ───────────────────────────────────────── */
    --font-headline: 'Space Grotesk', sans-serif;
    --font-body:     'Inter', sans-serif;
    --font-mono:     'Berkeley Mono', monospace;

    /* ─────────────────────────────────────────
       ELEVATION / SHADOWS
       Ambient only — no heavy drop shadows
    ───────────────────────────────────────── */
    --shadow-ambient: 0 0 40px 0 rgba(173, 198, 255, 0.06);
    --shadow-float:   0 0 32px 0 rgba(173, 198, 255, 0.06);

    /* ─────────────────────────────────────────
       BORDER RADIUS
    ───────────────────────────────────────── */
    --radius-sm:   0.125rem;   /* structural elements max */
    --radius-md:   0.375rem;   /* inputs, buttons */
    --radius-lg:   0.5rem;     /* cards, modals */
    --radius-full: 9999px;     /* pills / chips */

    /* ─────────────────────────────────────────
       TRANSITIONS
    ───────────────────────────────────────── */
    --transition-base: 200ms ease-out;

    /* ─────────────────────────────────────────
       SPACING SCALE  (base unit: 0.25rem)
    ───────────────────────────────────────── */
    --space-1:  0.25rem;
    --space-2:  0.5rem;
    --space-3:  0.75rem;
    --space-4:  1rem;
    --space-5:  1.25rem;
    --space-6:  1.5rem;
    --space-8:  2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    --space-16: 4rem;
    --space-20: 5rem;
    --space-24: 6rem;
  }

  /* ─────────────────────────────────────────
     BASE
  ───────────────────────────────────────── */
  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-on-background);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
  }

  img {
    display: block;
    max-width: 100%;
  }

  /* ─────────────────────────────────────────
     MATERIAL SYMBOLS — thin stroke
  ───────────────────────────────────────── */
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
    user-select: none;
  }

  /* ─────────────────────────────────────────
     SELECTION
  ───────────────────────────────────────── */
  ::selection {
    background-color: var(--color-primary-container);
    color: var(--color-on-primary-container);
  }
`

export default GlobalStyles
