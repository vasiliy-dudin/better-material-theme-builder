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
	// Map color roles to their source palettes
	static PALETTE_MAPPING = {
		'surface': 'neutral',
		'surfaceDim': 'neutral',
		'surfaceBright': 'neutral',
		'surfaceContainerLowest': 'neutral',
		'surfaceContainerLow': 'neutral',
		'surfaceContainer': 'neutral',
		'surfaceContainerHigh': 'neutral',
		'surfaceContainerHighest': 'neutral',
		'outline': 'neutralVariant',
		'outlineVariant': 'neutralVariant',
		'inverseSurface': 'neutral',
		'inverseOnSurface': 'neutral',
		'inversePrimary': 'primary',
		'scrim': null,
		'shadow': null
	};

	/**
	 * Process a complete color scheme to preserve hue in tonal palettes
	 * 
	 * @param {Object} colorScheme - Complete color scheme from MaterialColorGenerator
	 * @param {Object} options - Processing options
	 * @param {boolean} options.preserveHue - Whether to preserve hue (default: true)
	 * @param {Array<string>} options.affectedPalettes - Which palettes to process (default: ['primary', 'secondary', 'tertiary'])
	 * @param {boolean} options.neutralHueFromPrimary - Use primary hue for neutral/neutralVariant (default: false)
	 * @returns {Object} Processed color scheme with preserved hues
	 */
	static processColorScheme(colorScheme, options = {}) {
		const {
			preserveHue = true,
			affectedPalettes = ['primary', 'secondary', 'tertiary'],
			neutralHueFromPrimary = false
		} = options;

		if (!preserveHue || !colorScheme || !colorScheme.tonalPalettes) {
			return colorScheme;
		}

		console.log('[OKLCH] Available palettes:', Object.keys(colorScheme.tonalPalettes));
		console.log('[OKLCH] Processing palettes:', affectedPalettes);
		if (neutralHueFromPrimary) {
			console.log('[OKLCH] Using primary hue for neutral/neutralVariant');
		}

		// Deep clone the scheme to avoid mutations
		const processedScheme = JSON.parse(JSON.stringify(colorScheme));
		
		// Keep original palettes for tone matching
		const originalPalettes = { ...colorScheme.tonalPalettes };
		
		// Get source colors for hue reference
		const sourceColors = colorScheme.sourceColors || {};

		// Process each affected palette
		for (const paletteName of affectedPalettes) {
			if (processedScheme.tonalPalettes[paletteName]) {
				// Use primary color as hue source for neutral/neutralVariant if option is enabled
				let sourceColor = sourceColors[paletteName];
				if (neutralHueFromPrimary && (paletteName === 'neutral' || paletteName === 'neutralVariant')) {
					sourceColor = sourceColors['primary'] || sourceColor;
					console.log(`[OKLCH] ${paletteName}: using primary hue from ${sourceColor}`);
				}
				
				processedScheme.tonalPalettes[paletteName] = this.processPalette(
					processedScheme.tonalPalettes[paletteName],
					paletteName,
					sourceColor
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

		// Remove sourceColors from result - it's internal metadata, not for display
		delete processedScheme.sourceColors;

		return processedScheme;
	}

	/**
	 * Process a single tonal palette to preserve hue
	 * 
	 * Strategy:
	 * 1. Extract reference hue from source color (the color that created this palette)
	 * 2. For each tone, convert to OKLCH
	 * 3. Replace hue with reference hue
	 * 4. Ensure color stays in sRGB gamut by clamping chroma if needed
	 * 
	 * @param {Object} palette - Tonal palette object with tone values (e.g., {0: '#000', 10: '#1a1a1a', ...})
	 * @param {string} paletteName - Name of the palette (for logging)
	 * @param {string|null} sourceColor - Source color hex that created this palette
	 * @returns {Object} Processed palette with preserved hue
	 */
	static processPalette(palette, paletteName, sourceColor = null) {
		// Convert reference color to OKLCH to extract hue
		const toOklch = converter('oklch');
		
		let referenceHue = null;
		let hueSource = null;
		
		// If source color is provided, use its hue (most reliable)
		if (sourceColor) {
			const sourceOklch = toOklch(sourceColor);
			if (sourceOklch && sourceOklch.h !== undefined && !isNaN(sourceOklch.h)) {
				referenceHue = sourceOklch.h;
				hueSource = `source color ${sourceColor}`;
			}
		}
		
		// Fallback: extract hue from palette tones (for backward compatibility)
		if (referenceHue === null) {
			let maxChroma = -1;
			let referenceToneName = null;
			
			// Try tones in order of preference: 50 (middle), 40, 60, 30, 70, etc.
			const tonePreference = [50, 40, 60, 30, 70, 20, 80, 10, 90];
			
			for (const tone of tonePreference) {
				const toneKey = String(tone);
				if (!palette[toneKey]) continue;
				
				const oklch = toOklch(palette[toneKey]);
				if (!oklch || oklch.h === undefined || isNaN(oklch.h)) continue;
				
				// Use the first tone with reasonable chroma, or track the highest chroma
				if (oklch.c > 0.02) {
					// Found a tone with sufficient chroma
					referenceHue = oklch.h;
					referenceToneName = toneKey;
					hueSource = `tone ${toneKey} (chroma: ${oklch.c.toFixed(3)})`;
					break;
				} else if (oklch.c > maxChroma) {
					// Track the tone with highest chroma as fallback
					maxChroma = oklch.c;
					referenceHue = oklch.h;
					referenceToneName = toneKey;
					hueSource = `tone ${referenceToneName} (low chroma: ${maxChroma.toFixed(3)})`;
				}
			}
		}
		
		if (referenceHue === null) {
			console.warn(`[OKLCH] ${paletteName}: could not extract valid hue`);
			return palette;
		}
		
		console.log(`[OKLCH] ${paletteName}: using hue ${referenceHue.toFixed(1)}° from ${hueSource}`);

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

			// Process even low-chroma colors (neutral/neutralVariant) to fix hue
			// Material Design's HCT can introduce unwanted hue shifts even in near-achromatic colors

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
			const originalHue = oklchColor.h ?? 0;
			const actualHue = result.color.h ?? 0;
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

			// Convert back to HEX
			processedPalette[tone] = formatHex(result.color).toLowerCase();
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

		// Try with reduced chroma at exact hue as fallback
		const clampedAtExactHue = clampChroma(testColor, 'oklch');
		let bestColor = clampedAtExactHue || originalColor;
		let bestHueDeviation = clampedAtExactHue ? 0 : Math.abs((originalColor.h ?? 0) - referenceHue);

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
	 * Extract palette name from color role
	 * Handles both camelCase and space-separated formats
	 * 
	 * @param {string} colorRole - Color role name (e.g., "primary", "onPrimary", "on primary container")
	 * @returns {string} Palette name
	 */
	static extractPaletteName(colorRole) {
		let paletteName = colorRole;
		
		// Remove "on " prefix (space-separated format)
		if (paletteName.startsWith('on ')) {
			paletteName = paletteName.substring(3);
		}
		// Remove "on" prefix (camelCase format)
		else if (paletteName.match(/^on[A-Z]/)) {
			paletteName = paletteName.substring(2);
		}
		
		// Remove " container" suffix (space-separated format)
		if (paletteName.endsWith(' container')) {
			paletteName = paletteName.slice(0, -10);
		}
		// Remove "Container" suffix (camelCase format)
		else if (paletteName.endsWith('Container')) {
			paletteName = paletteName.slice(0, -9);
		}
		
		// Lowercase first letter to match palette names
		return paletteName.charAt(0).toLowerCase() + paletteName.slice(1);
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
			
			// Extract palette name from color role
			const paletteName = this.extractPaletteName(colorRole);
			
			// Map to actual palette (surface colors map to neutral/neutralVariant)
			const mappedPaletteName = this.PALETTE_MAPPING[paletteName] || paletteName;
			
			// Skip colors that don't use palettes (scrim, shadow - always black)
			if (mappedPaletteName === null) {
				skippedCount++;
				const reason = 'not palette-based';
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
				continue;
			}
			
			// Skip if we don't have palettes for this role
			if (!originalPalettes[mappedPaletteName] || !processedPalettes[mappedPaletteName]) {
				skippedCount++;
				const reason = `no palette: ${mappedPaletteName}`;
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
				console.log(`[OKLCH] SKIP ${colorRole}: palette="${paletteName}" → "${mappedPaletteName}" not found`);
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
			
			for (const [tone, hexColor] of Object.entries(originalPalettes[mappedPaletteName])) {
				const toneOklch = toOklch(hexColor);
				if (!toneOklch) continue;
				
				const difference = Math.abs(toneOklch.l - originalLightness);
				if (difference < minDifference) {
					minDifference = difference;
					closestTone = tone;
				}
			}
			
			// Update with the color from the PROCESSED palette at the matched tone
			if (closestTone !== null && processedPalettes[mappedPaletteName][closestTone]) {
				// Get the processed color (with corrected hue)
				const processedHex = processedPalettes[mappedPaletteName][closestTone];
				const processedOklch = toOklch(processedHex);
				
				// Preserve original lightness and chroma - only take the corrected hue
				// This prevents colors from becoming too desaturated or changing brightness
				let newHex = processedHex; // fallback
				
				if (processedOklch && originalOklch) {
					let finalColor = {
						mode: 'oklch',
						l: originalOklch.l,  // Keep original lightness
						c: originalOklch.c,  // Keep original chroma
						h: processedOklch.h  // Use corrected hue from processed palette
					};
					
					// Ensure the color is in sRGB gamut
					if (!inGamut('rgb')(finalColor)) {
						finalColor = clampChroma(finalColor, 'oklch');
					}
					
					newHex = formatHex(finalColor).toLowerCase();
				}
				
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
						`(palette: ${paletteName}→${mappedPaletteName}, tone: ${closestTone}, changed: ${changed})`
					);
				}
				
				regenerated[colorRole] = newHex;
			} else {
				skippedCount++;
				const reason = closestTone === null ? 'no matching tone' : 'tone not in processed palette';
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
				console.log(`[OKLCH] SKIP ${colorRole}: ${reason} (palette: ${mappedPaletteName}, tone: ${closestTone})`);
			}
		}

		console.log(`[OKLCH] ${isDark ? 'Dark' : 'Light'} scheme: ${updatedCount} updated, ${skippedCount} skipped`);
		if (Object.keys(skippedReasons).length > 0) {
			console.log(`[OKLCH] Skip reasons:`, skippedReasons);
		}

		return regenerated;
	}
}
