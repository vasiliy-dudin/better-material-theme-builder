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

		console.log('[OKLCH] Available palettes:', Object.keys(colorScheme.tonalPalettes));
		console.log('[OKLCH] Processing palettes:', affectedPalettes);

		// Deep clone the scheme to avoid mutations
		const processedScheme = JSON.parse(JSON.stringify(colorScheme));
		
		// Keep original palettes for tone matching
		const originalPalettes = { ...colorScheme.tonalPalettes };

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
		// Pass both original and processed palettes for accurate tone matching
		if (processedScheme.schemes) {
			processedScheme.schemes.light = this.regenerateSchemeColors(
				processedScheme.schemes.light,
				originalPalettes,
				processedScheme.tonalPalettes,
				false
			);
			processedScheme.schemes.dark = this.regenerateSchemeColors(
				processedScheme.schemes.dark,
				originalPalettes,
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

		// Process each tone with flexible hue preservation
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

			// Adaptive hue deviation based on tone
			// Middle tones (40-60) are most visible, so use stricter hue preservation
			const toneNum = parseInt(tone);
			const maxHueDeviation = (toneNum >= 40 && toneNum <= 60) ? 5 : 8;

			// Try to find the best color with flexible hue
			const result = this.findBestGamutColor(
				oklchColor,
				referenceHue,
				maxHueDeviation
			);

			// Log detailed information
			const originalHue = oklchColor.h;
			const actualHue = result.color.h;
			const hueDeviation = Math.abs(actualHue - referenceHue);
			const chromaLoss = ((oklchColor.c - result.color.c) / oklchColor.c * 100);
			
			console.log(
				`[OKLCH] ${paletteName}[${tone}]: ` +
				`orig_hue=${originalHue.toFixed(1)}° → ` +
				`target=${referenceHue.toFixed(1)}° → ` +
				`actual=${actualHue.toFixed(1)}° ` +
				`(deviation ${hueDeviation >= 0.1 ? '+' : ''}${hueDeviation.toFixed(1)}°, ` +
				`chroma ${chromaLoss >= 0 ? '-' : '+'}${Math.abs(chromaLoss).toFixed(1)}%)`
			);

			// Convert back to HEX (uppercase to match Material Color Utilities format)
			processedPalette[tone] = formatHex(result.color).toUpperCase();
		}

		return processedPalette;
	}

	/**
	 * Find the best in-gamut color with flexible hue preservation
	 * 
	 * Strategy:
	 * 1. Try exact reference hue with original chroma
	 * 2. If out of gamut, try hue variations (±1°, ±2°, ... ±maxDeviation)
	 * 3. For each hue, try to preserve maximum chroma
	 * 4. Select the color closest to reference hue that fits in gamut
	 * 
	 * @param {Object} originalColor - Original OKLCH color
	 * @param {number} referenceHue - Target hue to preserve
	 * @param {number} maxHueDeviation - Maximum allowed hue deviation in degrees
	 * @returns {Object} { color: OKLCH color object, hueDeviation: number }
	 */
	static findBestGamutColor(originalColor, referenceHue, maxHueDeviation) {
		// Try exact reference hue first
		let testColor = {
			mode: 'oklch',
			l: originalColor.l,
			c: originalColor.c,
			h: referenceHue
		};

		// If exact hue works, return it
		if (inGamut('rgb')(testColor)) {
			return { color: testColor, hueDeviation: 0 };
		}

		// Try with reduced chroma at exact hue
		let clampedAtExactHue = clampChroma(testColor, 'oklch');
		let bestColor;
		let bestHueDeviation;
		
		if (clampedAtExactHue) {
			// Store as fallback
			bestColor = clampedAtExactHue;
			bestHueDeviation = 0;
		} else {
			// Shouldn't happen, but just in case
			bestColor = originalColor;
			bestHueDeviation = Math.abs(originalColor.h - referenceHue);
		}

		// Try hue variations to find better chroma preservation
		for (let deviation = 1; deviation <= maxHueDeviation; deviation++) {
			for (let sign of [-1, 1]) {
				const testHue = referenceHue + (deviation * sign);
				
				testColor = {
					mode: 'oklch',
					l: originalColor.l,
					c: originalColor.c,
					h: testHue
				};

				// Check if this hue allows full chroma
				if (inGamut('rgb')(testColor)) {
					// Found a better option with full chroma!
					return { color: testColor, hueDeviation: deviation };
				}

				// Try with clamped chroma at this hue
				const clamped = clampChroma(testColor, 'oklch');
				if (clamped && clamped.c > bestColor.c) {
					// This hue allows more chroma than our current best
					bestColor = clamped;
					bestHueDeviation = deviation;
				}
			}
		}

		return { color: bestColor, hueDeviation: bestHueDeviation };
	}

	/**
	 * Regenerate scheme colors from updated tonal palettes
	 * Instead of using hardcoded tone mappings, we extract tones from the original colors
	 * by finding which tone in the original palette matches each color role best,
	 * then use that tone to get the color from the processed palette.
	 * This preserves the variant-specific tone mappings (e.g., MONOCHROME uses different tones)
	 * 
	 * @param {Object} scheme - Original scheme colors
	 * @param {Object} originalPalettes - Original tonal palettes (before processing)
	 * @param {Object} processedPalettes - Processed tonal palettes (after OKLCH hue fix)
	 * @param {boolean} isDark - Whether this is dark mode (unused but kept for API compatibility)
	 * @returns {Object} Regenerated scheme colors
	 */
	static regenerateSchemeColors(scheme, originalPalettes, processedPalettes, isDark) {
		if (!scheme || !originalPalettes || !processedPalettes) {
			return scheme;
		}

		const regenerated = { ...scheme };
		const toOklch = converter('oklch');
		let updatedCount = 0;
		let skippedCount = 0;
		const skippedReasons = {};

		console.log(`[OKLCH] Regenerating ${isDark ? 'dark' : 'light'} scheme colors...`);

		// For each color role in the scheme, find its tone and update from processed palette
		for (const [colorRole, originalHex] of Object.entries(scheme)) {
			// Skip *Fixed and *FixedDim colors - they use special Material Design blending logic
			if (colorRole.toLowerCase().includes('fixed')) {
				continue;
			}
			
			// Determine which palette this color role belongs to
			// Color roles can be in different formats:
			// - camelCase: "primary", "onPrimary", "primaryContainer", "onPrimaryContainer"
			// - space-separated: "primary", "on primary", "primary container", "on primary container"
			let paletteName = colorRole;
			
			// Remove "on " prefix (space-separated format)
			if (paletteName.startsWith('on ')) {
				paletteName = paletteName.substring(3); // "on primary" → "primary"
			}
			// Remove "on" prefix (camelCase format)
			else if (paletteName.match(/^on[A-Z]/)) {
				paletteName = paletteName.substring(2); // "onPrimary" → "Primary"
			}
			
			// Remove " container" suffix (space-separated format) - MUST be before Container
			if (paletteName.endsWith(' container')) {
				paletteName = paletteName.slice(0, -10); // Remove " container"
			}
			// Remove "Container" suffix (camelCase format)
			else if (paletteName.endsWith('Container')) {
				paletteName = paletteName.slice(0, -9); // Remove "Container"
			}
			
			// Lowercase first letter to match palette names
			paletteName = paletteName.charAt(0).toLowerCase() + paletteName.slice(1);
			
			// Skip if we don't have palettes for this role
			if (!originalPalettes[paletteName] || !processedPalettes[paletteName]) {
				skippedCount++;
				const reason = `no palette: ${paletteName}`;
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
				console.log(`[OKLCH] SKIP ${colorRole}: palette="${paletteName}" not found`);
				continue;
			}
			
			// Find the closest tone in the ORIGINAL palette that matches this color
			// We use OKLCH lightness for comparison as it's perceptually uniform
			const originalOklch = toOklch(originalHex);
			if (!originalOklch) continue;
			
			const originalLightness = originalOklch.l;
			
			// Find the tone value that best matches this lightness
			// by comparing against the ORIGINAL palette's tone values
			let closestTone = null;
			let minDifference = Infinity;
			
			for (const [tone, hexColor] of Object.entries(originalPalettes[paletteName])) {
				const toneOklch = toOklch(hexColor);
				if (!toneOklch) continue;
				
				const difference = Math.abs(toneOklch.l - originalLightness);
				if (difference < minDifference) {
					minDifference = difference;
					closestTone = tone;
				}
			}
			
			// Update with the color from the PROCESSED palette at the matched tone
			if (closestTone !== null && processedPalettes[paletteName][closestTone]) {
				const newHex = processedPalettes[paletteName][closestTone];
				const changed = newHex !== originalHex;
				
				if (changed) {
					updatedCount++;
				}
				
				// Log detailed information for sample colors
				const shouldLog = 
					colorRole.includes('primary') || 
					colorRole.includes('secondary') || 
					colorRole.includes('warning') ||
					colorRole.includes('neutral');
				
				if (shouldLog) {
					console.log(
						`[OKLCH] ${colorRole}: ${originalHex} → ${newHex} ` +
						`(palette: ${paletteName}, tone: ${closestTone}, changed: ${changed})`
					);
				}
				
				regenerated[colorRole] = newHex;
			} else {
				skippedCount++;
				const reason = closestTone === null ? 'no matching tone' : 'tone not in processed palette';
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
				console.log(`[OKLCH] SKIP ${colorRole}: ${reason}`);
			}
		}

		console.log(`[OKLCH] ${isDark ? 'Dark' : 'Light'} scheme: ${updatedCount} updated, ${skippedCount} skipped`);
		if (Object.keys(skippedReasons).length > 0) {
			console.log(`[OKLCH] Skip reasons:`, skippedReasons);
		}

		return regenerated;
	}
}
