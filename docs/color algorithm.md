# Colour Generation Algorithms in Material Color Utilities
These algorithms are used in the Material Color Utilities library.

## Core Colour and Tonal Palette Generation Algorithm

### Basic Principle:
1. **Source Colour (seed)** → converted to **HCT** (Hue, Chroma, Tone)
2. Extract **hue** and **chroma** from HCT
3. Generate **6 Core Colours** with different parameters
4. Each Core Colour becomes the basis for a **TonalPalette** (13 tones from 0 to 100)

### Exact algorithms from CorePalette (deprecated class, but shows the principle):

```typescript
// Standard mode (not Content)
const hct = Hct.fromInt(seedArgb);
const hue = hct.hue;
const chroma = hct.chroma;

// Core Colour Generation:
primary = TonalPalette.fromHueAndChroma(hue, Math.max(48, chroma));        // a1
secondary = TonalPalette.fromHueAndChroma(hue, 16);                        // a2  
tertiary = TonalPalette.fromHueAndChroma(hue + 60, 24);                    // a3
neutral = TonalPalette.fromHueAndChroma(hue, 4);                           // n1
neutralVariant = TonalPalette.fromHueAndChroma(hue, 8);                    // n2
error = TonalPalette.fromHueAndChroma(25, 84);                             // fixed
```

## Influence of Custom Core Colours and Schemes

### If you override a code colour. For example, secondary:

1. **Custom secondary Core Colour** is used **directly** as the basis for TonalPalette
2. **Selected scheme DOES NOT affect** the custom secondary
3. **Only non-custom** Core Colours are generated according to the scheme

**Code from CorePalette.createPaletteFromColors :**

```typescript
if (colors.secondary) {
  const p = new CorePalette(colors.secondary, content);
  palette.a2 = p.a1;  // Uses primary palette from secondary colour
}
```

## Modern approach via DynamicScheme:

The new API uses **`DynamicScheme.from()`** with parameters:

```typescript
const scheme = DynamicScheme.from({
  sourceColorHct: Hct.fromInt(seedArgb),
  variant: Variant.EXPRESSIVE,  // Only affects auto-generated colours
  secondaryPaletteKeyColor: customSecondaryHct,  // Overrides secondary
  isDark: false
});
```

# Key Conclusions

1. **CorePalette** is deprecated, use **DynamicScheme**
2. **Custom colours** always take precedence over the scheme
3. **Schemes only affect** auto-generated Core Colours
4. **TonalPalette** generates 13 tones independently of the scheme
5. **MaterialKolor.com may show inaccurate results** – trust MCU code