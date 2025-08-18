# 03-mcu-typescript-guide: Internals & extension points

This file walks through the TypeScript source to help you debug and customise MCU.

## Package entry graph

```
typescript/
├─ index.ts               # re-exports everything
├─ dynamic_color/
│   ├─ theme.ts           # Theme & themeFromSourceColor
│   ├─ scheme_light.ts
│   ├─ scheme_dark.ts
│   └─ material_dynamic_colors.ts
├─ palettes/
│   ├─ tonal_palette.ts
│   ├─ core_palette.ts
│   └─ palette_style.ts
├─ hct/
│   ├─ cam16.ts
│   ├─ cam16ucs.ts
│   ├─ cam16_to_xyz.ts
│   └─ hct.ts
└─ utils/
    ├─ math_utils.ts
    └─ color_utils.ts
```

---

## themeFromSourceColor flow

1. **Seed intake** – expects ARGB `number`.
2. **PaletteStyle selection** – pick variant & spec from opts.
3. **CorePalette.of(seed)** – six TonalPalettes.
4. **Theme.build()** – stores metadata.
5. **SchemeLight/SchemeDark** – lazily evaluate roles when accessed.

Internal caching ensures each `TonalPalette.tone(x)` call is memoised.

---

## Overriding palettes

You can feed *customColors*:

```ts
interface CustomColor {
  name: string;       // snake_case
  value: number;      // ARGB seed
  blend: boolean;     // if true, harmonise with theme primary
}

const theme = themeFromSourceColor(seed, [
  { name: 'danger', value: 0xffb00020, blend: false },
]);
```

MCU appends two TonalPalettes per custom color: one for `danger` and one neutral variant.

---

## Extending PaletteStyle

To prototype a new style in your fork:

1. Add an enum value in `palette_style.ts`.
2. Update the `switch` in `CorePalette.contentOf(seed, style)`.
3. Rebuild ports in `rust/`, `dart/`, … to maintain parity.

---

## Numerical stability & precision

* CAM16 ↔ XYZ conversions use **double-precision** (`number`).
* All roundings happen at the final `toInt()` stage to avoid drift.
* The `MathUtils.clampDouble` helper prevents NaNs on extreme chroma inputs.

---

## Testing strategy

* `tests/` holds ~450 golden cases per port.
* The CI matrix executes cross-language round-tripping to ensure numeric parity within ±0.5 L*.

Run locally:

```bash
pnpm test # jest
```

---

### Troubleshooting checklist

| Symptom | Likely cause |
|---------|--------------|
| Mutating `Hct` doesn’t update color | Forgetting `.toInt()` conversion |
| Mismatched light/dark output vs Android | Using wrong `SpecVersion` |
| High GC pressure | Reusing `Hct` instances inside loops |

---

Next: **04-mcu-best-practices.md**.