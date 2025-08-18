# 01-mcu-concepts: Color science essentials

This guide distills the **concepts/** docs in MCU.

## Table of contents

1. HCT color space
2. Tonal palettes
3. Core palette & palette generation
4. Dynamic color (role mapping)
5. Spec versions & contrast mapping

---

## 1. HCT color space

*HCT (Hue-Chroma-Tone)* combines **CIECAM16** hue/chroma and **LA** lightness.

| Component | Range | Meaning |
|-----------|-------|---------|
| hue (h) | 0-360° | Position around the color wheel |
| chroma (C) | 0-200 | Perceived saturation |
| tone (T) | 0-100 | Perceived lightness |

Functions (TypeScript):

```ts
const hct = Hct.fromInt(0xff6750a4);
hct.h; // 27.6°
hct.c; // 48.1
hct.t; // 53.0

hct.t = 20; // darken while preserving hue/chroma
const argb = hct.toInt();
```

### Why HCT?

1. Tone isolates contrast; you can compute valid on-color pairs by picking tone deltas.
2. Adjustments produce perceptually uniform results across hues.

---

## 2. Tonal palettes

A **TonalPalette** is a *function* mapping any tone 0-100 → ARGB, backed by a seed hue/chroma. MCU precomputes 13 canonical tones (0,10,…,100) and interpolates others lazily.

Creation shortcuts:

```ts
TonalPalette.fromInt(seedArgb);
TonalPalette.fromHct(hue, chroma);
```

Access:

```ts
palette.tone(40); // Middle surface tone
```

---

## 3. Core palette & palette generation

`CorePalette.of(seedArgb, /* isContent */ false)` returns *six* tonal palettes:

* primary, secondary, tertiary
* neutral, neutralVariant
* error (fixed hue ≈ 25°, chroma 84)

*PaletteStyle* then remixes hues & chromas:

| Style | Notable behaviour |
|-------|------------------|
| Monochrome | All palettes neutralised |
| TonalSpot | Default M3 behaviour |
| Vibrant | Raises chroma +10-20 |
| Expressive | Shifts secondary +60°, tertiary +120° |
| Fidelity | Locks every palette to explicit override hue |

Algorithm located in `typescript/palettes/core_palette.ts`.

---

## 4. Dynamic color & roles

`MaterialDynamicColors` maps palette tones to **color roles** (`primaryContainer`, `onError`, etc.) depending on scheme (light/dark) and spec version.

Key class: `Scheme` (abstract) with two concrete subclasses `SchemeLight` and `SchemeDark`.

```ts
const scheme = isDark ? new SchemeDark(theme) : new SchemeLight(theme);
console.log(scheme.primary); // ARGB number
```

Contrast is enforced by **Albers** formulas and content-aware tone selection.

---

## 5. Spec versions

`SpecVersion.SPEC_2025` raises minimum contrast for on-roles and updates error palettes.

```ts
themeFromSourceColor(seedArgb, [], { specVersion: SpecVersion.SPEC_2025 });
```

When not supplied, the engine defaults to **SPEC_2021** for backward compatibility.
