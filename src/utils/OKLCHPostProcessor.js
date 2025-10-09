import { formatHex, converter, inGamut, clampChroma } from 'culori';

/**
 * OKLCH Post-Processor for preserving hue in tonal palettes
 * 
 * Solves the "hue shifting" problem where Material Design's HCT color space
 * causes hue to shift when generating different tones. By converting to OKLCH
 * and fixing the hue value, we ensure consistent hue across all lightness levels.
 * 
 * Uses culori library for all OKLCH operations.
 */
export class OKLCHPostProcessor {
	/**
	 * Process a complete color scheme to preserve hue in tonal palettes
	 * 
	 * @param {Object} colorScheme - Complete color scheme from MaterialColorGenerator
	 * @param {Object} options - Processing options
	 * @param {boolean} options.preserveHue - Whether to preserve hue (default: true)
	 * @param {Array<string>} options.affectedPalettes - Which palettes to process (default: ['primary', 'secondary', 'tertiary'])
	 * @returns {Object} Processed color scheme with preserved hues
	 */
	static processColorScheme(colorScheme, options = {}) {
		const {
			preserveHue = true,
			affectedPalettes = ['primary', 'secondary', 'tertiary']
		} = options;

		if (!preserveHue || !colorScheme || !colorScheme.tonalPalettes) {
			return colorScheme;
		}

		// Deep clone the scheme to avoid mutations
		const processedScheme = JSON.parse(JSON.stringify(colorScheme));

		// Process each affected palette
		for (const paletteName of affectedPalettes) {
			if (processedScheme.tonalPalettes[paletteName]) {
				processedScheme.tonalPalettes[paletteName] = this.processPalette(
					processedScheme.tonalPalettes[paletteName],
					paletteName
				);
			}
		}

		// Regenerate scheme colors from updated palettes
		if (processedScheme.schemes) {
			processedScheme.schemes.light = this.regenerateSchemeColors(
				processedScheme.schemes.light,
				processedScheme.tonalPalettes,
				false
			);
			processedScheme.schemes.dark = this.regenerateSchemeColors(
				processedScheme.schemes.dark,
				processedScheme.tonalPalettes,
				true
			);
		}

		return processedScheme;
	}

	/**
	 * Process a single tonal palette to preserve hue
	 * 
	 * Strategy:
	 * 1. Extract reference hue from middle tone (50)
	 * 2. For each tone, convert to OKLCH
	 * 3. Replace hue with reference hue
	 * 4. Ensure color stays in sRGB gamut by clamping chroma if needed
	 * 
	 * @param {Object} palette - Tonal palette object with tone values (e.g., {0: '#000', 10: '#1a1a1a', ...})
	 * @param {string} paletteName - Name of the palette (for logging)
	 * @returns {Object} Processed palette with preserved hue
	 */
	static processPalette(palette, paletteName) {
		// Get reference hue from tone 50 (mid-tone, most representative)
		const referenceTone = palette['50'];
		if (!referenceTone) {
			console.warn(`No tone 50 found in ${paletteName} palette`);
			return palette;
		}

		// Convert reference color to OKLCH to extract hue
		const toOklch = converter('oklch');
		const referenceOklch = toOklch(referenceTone);
		
		if (!referenceOklch || referenceOklch.h === undefined || isNaN(referenceOklch.h)) {
			console.warn(`Could not extract hue from ${paletteName} reference tone (achromatic color)`);
			return palette;
		}

		const referenceHue = referenceOklch.h;

		// Process each tone with fixed hue
		const processedPalette = {};
		
		for (const [tone, hexColor] of Object.entries(palette)) {
			// Convert current color to OKLCH
			const oklchColor = toOklch(hexColor);
			
			if (!oklchColor) {
				// If conversion fails, keep original
				processedPalette[tone] = hexColor;
				continue;
			}

			// Skip achromatic colors (chroma too low, hue is meaningless)
			if (oklchColor.c < 0.001) {
				processedPalette[tone] = hexColor;
				continue;
			}

			// Create new color with same lightness and chroma, but reference hue
			const fixedHueColor = {
				mode: 'oklch',
				l: oklchColor.l,
				c: oklchColor.c,
				h: referenceHue
			};

			// Ensure color is in sRGB gamut
			// If it's out of gamut, clamp chroma to bring it back
			let finalColor = fixedHueColor;
			
			if (!inGamut('rgb')(fixedHueColor)) {
				finalColor = clampChroma(fixedHueColor, 'oklch');
				
				// Verify clampChroma succeeded
				if (!finalColor) {
					processedPalette[tone] = hexColor;
					continue;
				}
			}

			// Convert back to HEX (uppercase to match Material Color Utilities format)
			processedPalette[tone] = formatHex(finalColor).toUpperCase();
		}

		return processedPalette;
	}

	/**
	 * Regenerate scheme colors from updated tonal palettes
	 * Instead of using hardcoded tone mappings, we extract tones from the original colors
	 * by finding which tone in the palette matches each color role best.
	 * This preserves the variant-specific tone mappings (e.g., MONOCHROME uses different tones)
	 * 
	 * @param {Object} scheme - Original scheme colors
	 * @param {Object} tonalPalettes - Updated tonal palettes
	 * @param {boolean} isDark - Whether this is dark mode (unused but kept for API compatibility)
	 * @returns {Object} Regenerated scheme colors
	 */
	static regenerateSchemeColors(scheme, tonalPalettes, isDark) {
		if (!scheme || !tonalPalettes) {
			return scheme;
		}

		const regenerated = { ...scheme };
		const toOklch = converter('oklch');

		// For each color role in the scheme, find its tone and update from processed palette
		for (const [colorRole, originalHex] of Object.entries(scheme)) {
			// Determine which palette this color role belongs to
			const paletteName = colorRole.split(' ')[0];
			
			// Skip if we don't have a processed palette for this role
			if (!tonalPalettes[paletteName]) continue;
			
			// Find the closest tone in the ORIGINAL palette that matches this color
			// We use OKLCH lightness for comparison as it's perceptually uniform
			const originalOklch = toOklch(originalHex);
			if (!originalOklch) continue;
			
			const originalLightness = originalOklch.l;
			
			// Find the tone value that best matches this lightness
			// by comparing against the processed palette's tone values
			let closestTone = null;
			let minDifference = Infinity;
			
			for (const [tone, hexColor] of Object.entries(tonalPalettes[paletteName])) {
				const toneOklch = toOklch(hexColor);
				if (!toneOklch) continue;
				
				const difference = Math.abs(toneOklch.l - originalLightness);
				if (difference < minDifference) {
					minDifference = difference;
					closestTone = tone;
				}
			}
			
			// Update with the color from the processed palette at the matched tone
			if (closestTone !== null && tonalPalettes[paletteName][closestTone]) {
				regenerated[colorRole] = tonalPalettes[paletteName][closestTone];
			}
		}

		return regenerated;
	}
}
