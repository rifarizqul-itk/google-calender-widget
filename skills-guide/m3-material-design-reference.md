# Material Design 3 (M3 / Material You) — Web Implementation Reference

> **Sumber Resmi**: https://m3.material.io/  
> **Versi**: Material Design 3 (aka "Material You")  
> **Dokumen ini melengkapi skill `design-it/material-design` yang berbasis M2.**

---

## Perbedaan Utama M2 vs M3

| Aspek | Material Design 2 (M2) | Material Design 3 (M3) |
|---|---|---|
| **Sistem Warna** | Static color palette | Dynamic Color (Material You) — warna adaptatif dari wallpaper user |
| **Elevation** | Drop shadows | Tonal surface color (surface + primary tint) |
| **Shapes** | 4px corner radius | Shape scale: None → Extra Large (28px+), lebih rounded |
| **Typography** | 13 type styles (H1–Caption) | 15 styles: Display, Headline, Title, Body, Label |
| **Komponen** | Flat buttons, chips | Filled, Tonal, Outlined, Text button variants |
| **State** | Opacity overlay | State Layer (semi-transparent overlay dengan warna token) |

---

## 1. Token System (3 Level)

M3 menggunakan hierarki 3 level token:

```
Reference Tokens  →  System Tokens  →  Component Tokens
(nilai mentah)        (semantik)         (per komponen)

md.ref.palette.primary40  →  md.sys.color.primary  →  md.comp.button.container.color
```

---

## 2. Color System (Dynamic Color)

### Semantic Color Roles (Light Theme)
```css
:root {
  /* Primary */
  --md-sys-color-primary:            #6750A4;
  --md-sys-color-on-primary:         #FFFFFF;
  --md-sys-color-primary-container:  #EADDFF;
  --md-sys-color-on-primary-container: #21005D;

  /* Secondary */
  --md-sys-color-secondary:           #625B71;
  --md-sys-color-on-secondary:        #FFFFFF;
  --md-sys-color-secondary-container: #E8DEF8;
  --md-sys-color-on-secondary-container: #1D192B;

  /* Tertiary */
  --md-sys-color-tertiary:            #7D5260;
  --md-sys-color-on-tertiary:         #FFFFFF;
  --md-sys-color-tertiary-container:  #FFD8E4;
  --md-sys-color-on-tertiary-container: #31111D;

  /* Error */
  --md-sys-color-error:               #B3261E;
  --md-sys-color-on-error:            #FFFFFF;
  --md-sys-color-error-container:     #F9DEDC;
  --md-sys-color-on-error-container:  #410E0B;

  /* Surface */
  --md-sys-color-surface:             #FFFBFE;
  --md-sys-color-on-surface:          #1C1B1F;
  --md-sys-color-surface-variant:     #E7E0EC;
  --md-sys-color-on-surface-variant:  #49454F;

  /* Surface Tones (M3 replaces M2 elevation shadows) */
  --md-sys-color-surface-container-lowest:  #FFFFFF;
  --md-sys-color-surface-container-low:     #F7F2FA;
  --md-sys-color-surface-container:         #F3EDF7;
  --md-sys-color-surface-container-high:    #ECE6F0;
  --md-sys-color-surface-container-highest: #E6E0E9;

  /* Outline */
  --md-sys-color-outline:             #79747E;
  --md-sys-color-outline-variant:     #CAC4D0;

  /* Background */
  --md-sys-color-background:          #FFFBFE;
  --md-sys-color-on-background:       #1C1B1F;

  /* Inverse */
  --md-sys-color-inverse-surface:     #313033;
  --md-sys-color-inverse-on-surface:  #F4EFF4;
  --md-sys-color-inverse-primary:     #D0BCFF;
}
```

### Dark Theme
```css
@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary:            #D0BCFF;
    --md-sys-color-on-primary:         #381E72;
    --md-sys-color-primary-container:  #4F378B;
    --md-sys-color-on-primary-container: #EADDFF;
    --md-sys-color-surface:            #1C1B1F;
    --md-sys-color-on-surface:         #E6E1E5;
    --md-sys-color-surface-container:  #211F26;
    --md-sys-color-surface-container-high: #2B2930;
    --md-sys-color-outline:            #938F99;
    --md-sys-color-background:         #1C1B1F;
    --md-sys-color-on-background:      #E6E1E5;
  }
}
```

---

## 3. Typography Scale

M3 menggunakan **15 type styles**:

```css
/* Google Font — Roboto Flex (variable font, recommended for M3) */
@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..900&display=swap');

:root {
  /* Display Large */
  --md-sys-typescale-display-large-size:    57px;
  --md-sys-typescale-display-large-line:    64px;
  --md-sys-typescale-display-large-tracking: -0.25px;

  /* Display Medium */
  --md-sys-typescale-display-medium-size:   45px;
  --md-sys-typescale-display-medium-line:   52px;

  /* Display Small */
  --md-sys-typescale-display-small-size:    36px;
  --md-sys-typescale-display-small-line:    44px;

  /* Headline Large */
  --md-sys-typescale-headline-large-size:   32px;
  --md-sys-typescale-headline-large-line:   40px;

  /* Headline Medium */
  --md-sys-typescale-headline-medium-size:  28px;
  --md-sys-typescale-headline-medium-line:  36px;

  /* Headline Small */
  --md-sys-typescale-headline-small-size:   24px;
  --md-sys-typescale-headline-small-line:   32px;

  /* Title Large */
  --md-sys-typescale-title-large-size:      22px;
  --md-sys-typescale-title-large-line:      28px;
  --md-sys-typescale-title-large-weight:    400;

  /* Title Medium */
  --md-sys-typescale-title-medium-size:     16px;
  --md-sys-typescale-title-medium-line:     24px;
  --md-sys-typescale-title-medium-weight:   500;
  --md-sys-typescale-title-medium-tracking: 0.15px;

  /* Title Small */
  --md-sys-typescale-title-small-size:      14px;
  --md-sys-typescale-title-small-line:      20px;
  --md-sys-typescale-title-small-weight:    500;
  --md-sys-typescale-title-small-tracking:  0.1px;

  /* Body Large */
  --md-sys-typescale-body-large-size:       16px;
  --md-sys-typescale-body-large-line:       24px;
  --md-sys-typescale-body-large-tracking:   0.5px;

  /* Body Medium */
  --md-sys-typescale-body-medium-size:      14px;
  --md-sys-typescale-body-medium-line:      20px;
  --md-sys-typescale-body-medium-tracking:  0.25px;

  /* Body Small */
  --md-sys-typescale-body-small-size:       12px;
  --md-sys-typescale-body-small-line:       16px;
  --md-sys-typescale-body-small-tracking:   0.4px;

  /* Label Large */
  --md-sys-typescale-label-large-size:      14px;
  --md-sys-typescale-label-large-weight:    500;
  --md-sys-typescale-label-large-tracking:  0.1px;

  /* Label Medium */
  --md-sys-typescale-label-medium-size:     12px;
  --md-sys-typescale-label-medium-weight:   500;
  --md-sys-typescale-label-medium-tracking: 0.5px;

  /* Label Small */
  --md-sys-typescale-label-small-size:      11px;
  --md-sys-typescale-label-small-weight:    500;
  --md-sys-typescale-label-small-tracking:  0.5px;
}
```

---

## 4. Shape Scale

```css
:root {
  --md-sys-shape-corner-none:        0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small:       8px;
  --md-sys-shape-corner-medium:      12px;
  --md-sys-shape-corner-large:       16px;
  --md-sys-shape-corner-extra-large: 28px;
  --md-sys-shape-corner-full:        9999px;
}

/* Panduan pemakaian per komponen: */
/* Cards       → corner-medium (12px)      */
/* Buttons     → corner-full (pill)         */
/* Dialogs     → corner-extra-large (28px)  */
/* FAB         → corner-large (16px)        */
/* Chips       → corner-small (8px)         */
/* Menus       → corner-extra-small (4px)   */
/* Snackbar    → corner-extra-small (4px)   */
```

---

## 5. Elevation (M3 — Tonal, Bukan Shadow)

**M3 menggantikan drop shadow dengan tonal surface color.**

```css
/* M3 Elevation via surface-container tokens — TIDAK pakai drop shadow */
.elevation-0 { background: var(--md-sys-color-surface); }
.elevation-1 { background: var(--md-sys-color-surface-container-low); }
.elevation-2 { background: var(--md-sys-color-surface-container); }
.elevation-3 { background: var(--md-sys-color-surface-container-high); }
.elevation-4 { background: var(--md-sys-color-surface-container-highest); }

/* Drop shadow HANYA untuk floating components (FAB, Dialog, Menu): */
.m3-shadow-1 {
  box-shadow: 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15);
}
.m3-shadow-2 {
  box-shadow: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15);
}
.m3-shadow-3 {
  box-shadow: 0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3);
}
```

---

## 6. State Layers

M3 menggunakan **State Layer** — overlay warna transparan untuk feedback interaksi:

```css
/* State layer opacity values (M3 spec): */
/* Hover:    8%  */
/* Pressed:  12% */
/* Focused:  12% */
/* Dragged:  16% */

.m3-interactive {
  position: relative;
  overflow: hidden;
}

.m3-interactive::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor; /* warna state layer = on-color token */
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1);
  pointer-events: none;
}

.m3-interactive:hover::before   { opacity: 0.08; }
.m3-interactive:focus::before   { opacity: 0.12; }
.m3-interactive:active::before  { opacity: 0.12; }
```

---

## 7. Motion (Easing Curves M3)

```css
:root {
  /* Standard — perpindahan elemen dalam layar */
  --md-sys-motion-easing-standard:             cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-standard-decelerate:  cubic-bezier(0, 0, 0, 1);
  --md-sys-motion-easing-standard-accelerate:  cubic-bezier(0.3, 0, 1, 1);

  /* Emphasized — elemen masuk/keluar layar */
  --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1.0);
  --md-sys-motion-easing-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);

  /* Duration tokens */
  --md-sys-motion-duration-short1:  50ms;
  --md-sys-motion-duration-short2:  100ms;
  --md-sys-motion-duration-short3:  150ms;
  --md-sys-motion-duration-short4:  200ms;
  --md-sys-motion-duration-medium1: 250ms;
  --md-sys-motion-duration-medium2: 300ms;
  --md-sys-motion-duration-medium3: 350ms;
  --md-sys-motion-duration-medium4: 400ms;
  --md-sys-motion-duration-long1:   450ms;
  --md-sys-motion-duration-long2:   500ms;
}
```

---

## 8. Komponen — Quick Reference CSS

### Card (Filled)
```css
.m3-card {
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
  /* Tidak ada shadow — elevation via tonal color */
}
```

### Card (Outlined)
```css
.m3-card-outlined {
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
}
```

### Button — Filled (Primary Action)
```css
.m3-btn-filled {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
```

### Button — Tonal (Secondary Action, M3-specific)
```css
.m3-btn-tonal {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
}
```

### Chip (Assist / Filter)
```css
.m3-chip {
  background: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface-variant);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  height: 32px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

---

## 9. Referensi Berguna

| Resource | URL |
|---|---|
| Panduan resmi M3 | https://m3.material.io/ |
| Color System | https://m3.material.io/styles/color/system/overview |
| Typography System | https://m3.material.io/styles/typography/overview |
| Elevation System | https://m3.material.io/styles/elevation/overview |
| Motion System | https://m3.material.io/styles/motion/overview |
| Material Web Components (official) | https://github.com/material-components/material-web |
| Material Theme Builder | https://m3.material.io/theme-builder |

---

## Cara Gunakan Bersama Skill

```
Use @design-it/material-design for the implementation approach, but follow 
the M3 spec in `skills-guide/m3-material-design-reference.md` for all 
token names, color roles, shape values, typography scale, and elevation 
behavior. Priority: M3 spec > skill defaults whenever they conflict.
```
