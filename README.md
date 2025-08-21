# MaterialKolor to json

![MaterialKolor-to-json screenshot](img.webp)

https://vasiliy-dudin.github.io/MaterialKolor-to-json/

A tool for generating comprehensive Material Design 3 colour schemes from MaterialKolor.com URLs. Exports colour tokens in JSON format for seamless integration with design systems.

## What it does

- **🎯 MaterialKolor to JSON conversion** - Simply paste a MaterialKolor.com URL to instantly convert any palette to structured JSON format
- **🚀 Latest Google colour algorithm** - Uses the most current Material Design 3 colour generation library, while Material Theme Builder still relies on outdated algorithms
- **📝 Flexible naming conventions** - Export with camelCase, kebab-case, or Title Case naming to match your coding standards
- **🎨 Custom brand colours** - Add your own colours like warning, success, or brand-specific colours
- **📊 Complete palette generation** - Creates full tonal palettes (0-100 tones) and interaction states (hover, focus, pressed) with proper opacity values

## For designers and frontend developers

- For designers: import tokens into Figma Variables via the "Luckino – Variables Import/Export JSON & CSS" plugin, or import this output JSON into Tokens Studio.
- For developers: use the output JSON with Style Dictionary, or add it directly to your project configuration, as in Vuetify.

## Output format

### W3C Design Tokens (W3C DTCG)

```json
{
  "Semantic colors": {
    "Schemes": {
      "primary": {
        "$type": "color",
        "$value": {
          "Light": "#006a6c",
          "Dark": "#52f2f5"
        }
      }
    }
  }
}
```

### Simple JSON

```json
{
  "schemes": {
    "light": {
      "primary": "#006a6c",
      "onPrimary": "#e0ffff",
      "primaryContainer": "#52f2f5",
      "onPrimaryContainer": "#005859",
      "primaryFixed": "#52f2f5"
    },
    "dark": {...}
  }
}
```
