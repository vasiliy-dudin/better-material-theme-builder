# 04-mcu-best-practices: Tips, pitfalls, performance

## 1. Selecting a palette style

| Project type | Recommended style |
|--------------|------------------|
| Brand-led marketing site | **Vibrant** (max chroma) |
| Native app following spec | **TonalSpot** |
| Dashboard / data-dense UI | **Content** (higher contrast) |
| Greyscale wireframes | **Monochrome** |

Always lock `SpecVersion` to the latest available for accessibility gains.

---

## 2. Persisting themes

Store **seed** + **style** + **spec** instead of full palettes; you can always rebuild the Theme after an MCU upgrade.

```json
{
  "seed": "#6750A4",
  "style": "TONAL_SPOT",
  "spec": "SPEC_2025"
}
```

---

## 3. Performance checklist (web)

1. Bundle only one port (TypeScript) – avoid shipping Dart→JS builds.
2. Tree-shake: import from sub-path `@material/material-color-utilities/hex` if you need just conversions.
3. Off-main-thread: compute `themeFromSourceColor` in a Web Worker for live pickers.
4. Cache `ThemeJSON` keyed by `seed-style-spec` string.

---

## 4. Common mistakes

| Pitfall | Fix |
|---------|-----|
| Converting seed HEX → `Number("#ff6f00")` | Use `argbFromHex()`; JS `Number` cannot parse `#`. |
| Ignoring alpha | MCU strips alpha; you must handle opacities in CSS. |
| Using role token as CSS var name directly | Normalise to kebab case: `--md-sys-color-primary-container`. |

---

## 5. Harmonising external colors

Blend any arbitrary brand color into theme primary via `CustomColor.blend = true`.

```ts
import {blendARGB} from '@material/material-color-utilities';
const blended = blendARGB(brand, theme.palettes.primary.tone(40));
```

---

## 6. Debugging helpers

* `themeFromSourceColor(..., {debug: true})` prints internal hues/chromas (TS port ≥0.4.3).
* Toggle CSS var preview with `applyTheme(document, { dark: prefersDark() });`.

---

## 7. Migration guide 0.3 → 0.4

1. Rename `Variant` → `PaletteStyle`.
2. Replace `DynamicColors.*` static exports with `MaterialDynamicColors`.
3. Light/dark schemes now accessed via `theme.schemes.light` instead of `theme.light`.