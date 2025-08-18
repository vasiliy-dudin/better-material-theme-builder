# Material Color Utilities — Overview

This document introduces **material-color-utilities (MCU)**, Google’s reference implementation of Material Design 3 color science. It summarises the package’s purpose, supported languages, and high-level architecture.

| Section | What you’ll learn |
|---------|-------------------|
| Mission | Why the library exists and when to rely on it |
| Language ports | TypeScript, Java, Dart, Rust, Kotlin, Python |
| Core layers | Color models → Palettes → Schemes → Theme → Render helpers |
| CLI & playground | Tools shipped with the repository |
| Versioning | Relationship to Material spec releases (SPEC_2021, SPEC_2025) |

---

## 1. Mission statement

Material Design 3 promotes _dynamic color_: one seed hue generates complete light & dark themes that respect accessibility and brand intent. MCU is the open-source engine that powers Android 12+ and Material Theme Builder.

### Key goals

1. **Cross-language parity** – identical algorithms across ports.
2. **Specification fidelity** – each tag aligns with the public spec revision.
3. **Deterministic output** – same inputs → same ARGB outputs across OS, web, and design tools.

---

## 2. Supported language ports

| Port | Path | Package name |
|------|------|--------------|
| TypeScript | `typescript/` | `@material/material-color-utilities` |
| Dart | `dart/` | `material_color_utilities` |
| Java | `java/` | part of AndroidX `core-ktx` |
| Rust | `rust/` | `material-color-utilities` |
| Kotlin/Multiplatform | `kotlin/` | drafts, experimental |
| Python | `python/` | `material-color-utilities` on PyPI |

All ports share an identical public API to ease cross-platform adoption.

---

## 3. High-level architecture

```text
Seed color (hex/ARGB)
   ↓ HCT conversion (hue, chroma, tone)
   ↓ Core palette generation (primary, secondary, …)
   ↓ Variant selection via PaletteStyle (TonalSpot, Vibrant …)
   ↓ Light & Dark Scheme (role tokens)
   ↓ Theme object (schemes + palettes + metadata)
   ↓ Renderer applies CSS custom properties / Android tokens
```

---

## 4. Repository structure (simplified)

```
material-color-utilities/
├─ concepts/         # Spec narrative docs
├─ dev_guide/        # Contribution & style guides
├─ typescript/       # Primary reference source
│   ├─ dynamic_color/
│   ├─ hct/
│   ├─ palettes/
│   └─ utils/
└─ … other language ports
```

---

## 5. CLI and playground

The TypeScript package bundles a tiny CLI:

```bash
npx @material/material-color-utilities --seed FF6750A4 --style TONAL_SPOT
```

It prints JSON containing `schemes` and `palettes`, mirroring `themeFromSourceColor` output.

A Storybook-based playground lives in `dev_guide/playground/` to experiment with seeds and styles.

---

## 6. Semantic versioning & spec tags

MCU follows **semver** and tracks spec additions via enums:

* `SpecVersion.SPEC_2021` – original M3 release
* `SpecVersion.SPEC_2025` – June 2025 contrast updates

Breaking algorithm changes bump the MAJOR digit across all language ports to stay in lock-step.

---

Continue with **01-mcu-concepts.md** to dive into color theory terms.