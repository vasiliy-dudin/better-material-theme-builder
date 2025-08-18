# 02-mcu-api-reference: Public surface (TypeScript 0.4.x)

This sheet catalogs **all exported symbols** from `@material/material-color-utilities`.

## Entry point

```ts
import {
  // color spaces
  Hct, Hsluv,
  // utilities
  argbFromHex, hexFromArgb,
  // palette + theme
  TonalPalette, CorePalette, themeFromSourceColor, Theme,
  PaletteStyle, SpecVersion,
  // dynamic color
  SchemeLight, SchemeDark, MaterialDynamicColors,
} from '@material/material-color-utilities';
```

---

### Conversion utilities

| Function | Signature | Notes |
|----------|-----------|-------|
| `argbFromRgb(r,g,b)` | `(number, number, number) → ARGB_INT` | packs bytes |
| `hexFromArgb(argb)` | `(number) → string #RRGGBB` | strips alpha |
| `rgbaFromArgb(argb)` | `(number) → [r,g,b,a]` | a ∈ [0,1] |

`color_utils.ts` also exposes CAM16 ↔︎ XYZ helpers.

---

### HCT & friends

| Class | Key props | Mutability |
|-------|-----------|-----------|
| `Hct` | `.h`, `.c`, `.t`, `.toInt()` | mutable hue/chroma/tone |
| `Cam16` | `.j`, `.q`, `.h`, `.c` | internal | 
| `Cam16Ucs` | `.jstar`, `.astar`, `.bstar` | ΔE metric |

---

### Palette layer

| Symbol | Description |
|--------|-------------|
| `TonalPalette.fromInt(seed)` | Core constructor |
| `CorePalette.of(seed, isContent)` | 6-pack generator |
| `PaletteStyle` enum | 0–8 Mono → FruitSalad |
| `SpecVersion` enum | SPEC_2021, SPEC_2025 |

---

### Dynamic color layer

| Class | Purpose |
|-------|---------|
| `DynamicColor` | Lazy evaluator wrapper |
| `DynamicColorGetter` | `(Theme) → ARGB` typedef |
| `Scheme` | abstract container (holds Theme + isDark) |
| `SchemeLight` | concrete with isDark=false |
| `SchemeDark` | concrete with isDark=true |
| `MaterialDynamicColors` | static dict of 200+ role getters |

Example:

```ts
const theme = themeFromSourceColor(0xff6750a4);
const dc = MaterialDynamicColors.primary;
console.log(hexFromArgb(dc.get(theme.schemes.light))); // #6750A4
```

---

### Theme factory

`themeFromSourceColor(seedArgb, customColors = [], opts?: ThemeOptions): Theme`

`ThemeOptions` keys:

* `paletteStyle?: PaletteStyle` (default TonalSpot)
* `specVersion?: SpecVersion` (default 2021)

Returned **Theme**:

```ts
interface Theme {
  source: number; // seed argb
  palettes: Record<CoreKey, TonalPalette>;
  schemes: { light: SchemeLight; dark: SchemeDark };
  customColors: CustomColor[];
  paletteStyle: PaletteStyle;
  specVersion: SpecVersion;
}
```

---

### render/demos helpers

`applyTheme(document, { theme, dark })` injects 250 CSS vars `--md-sys-color-*`. Not included in Node builds.

---

### Deprecations

* `Variant` enum (Java) was renamed to `PaletteStyle` in TS port 0.3.
* `DynamicColors` (all roles in root namespace) now lives under `MaterialDynamicColors`.

---

For implementation notes go to **03-mcu-typescript-guide.md**.