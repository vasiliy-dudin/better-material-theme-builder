import {
	argbFromHex,
	hexFromArgb,
	themeFromSourceColor,
	Hct,
	DynamicScheme,
	Variant,
	SpecVersion,
	MaterialDynamicColors,
	TonalPalette,
	Blend
} from '@materialx/material-color-utilities';

import {
	STYLE_OPTIONS,
	STATE_LAYER_OPACITIES,
	TONAL_VALUES,
	VALID_COLOR_ROLES
} from '../constants/materialDesign.js';

/**
 * Generator for Material Design color schemes and palettes
 */
export class MaterialColorGenerator {
	constructor() {
		// Create mapping of scheme names to numbers from constants
		this.styleMapping = STYLE_OPTIONS.reduce((mapping, option) => {
			mapping[option.value] = Variant[option.value];
			return mapping;
		}, {});
	}

	/**
	 * Generate comprehensive color scheme
	 * @param {Object} parsedData - Parsed URL data
	 * @param {Array} extendedColors - Additional custom colors
	 * @returns {Object} Complete color scheme
	 */
	async generateColorScheme(parsedData, extendedColors = []) {
		try {
			const { seedColor, style, colorSpec, customCoreColors } = parsedData;

			// Convert seed colour to ARGB and HCT
			const seedArgb = argbFromHex(seedColor);
			const seedHct = Hct.fromInt(seedArgb);

			// Determine specification
			const specVersion = colorSpec === 'SPEC_2025' ? SpecVersion.SPEC_2025 : SpecVersion.SPEC_2021;

			// Create dynamic scheme variants with custom color overrides
			const variant = this.styleMapping[style] ?? Variant.TONAL_SPOT;
			const lightScheme = this.createCustomDynamicScheme(seedHct, variant, false, specVersion, customCoreColors);
			const darkScheme = this.createCustomDynamicScheme(seedHct, variant, true, specVersion, customCoreColors);

			// Generate color schemes
			const lightColors = this.generateSchemeColors(lightScheme);
			const darkColors = this.generateSchemeColors(darkScheme);

			// Generate state layers
			const lightStateLayers = this.generateStateLayers(lightColors);
			const darkStateLayers = this.generateStateLayers(darkColors);

			// Generate tonal palettes with custom core colors support
			const tonalPalettes = this.generateTonalPalettes(lightScheme, extendedColors, customCoreColors, seedArgb);

			// Process extended colors
			if (extendedColors && extendedColors.length > 0) {
				this.processExtendedColors(extendedColors, lightColors, darkColors, lightStateLayers, darkStateLayers, tonalPalettes, seedArgb, lightScheme, darkScheme);
			}

			return {
				schemes: {
					light: lightColors,
					dark: darkColors
				},
				stateLayers: {
					light: lightStateLayers,
					dark: darkStateLayers
				},
				tonalPalettes: tonalPalettes
			};

		} catch (error) {
			console.error('Error generating color scheme:', error);
			throw new Error('Failed to generate color scheme');
		}
	}

	/**
	 * Create DynamicScheme with custom color role overrides
	 * @param {Hct} sourceColorHct - Source color in HCT format
	 * @param {number} variant - Color variant 
	 * @param {boolean} isDark - Whether scheme is dark
	 * @param {number} specVersion - Specification version
	 * @param {Object} customColors - Custom color role overrides
	 * @returns {DynamicScheme} Dynamic scheme with custom overrides
	 */
	createCustomDynamicScheme(sourceColorHct, variant, isDark, specVersion, customColors = {}) {
		const schemeOptions = {
			sourceColorHct: sourceColorHct,
			variant: variant,
			isDark: isDark,
			contrastLevel: 0.0,
			specVersion: specVersion
		};

		// Add custom palettes if they exist
		if (customColors.primary) {
			const primaryHct = Hct.fromInt(argbFromHex(customColors.primary));
			schemeOptions.primaryPalette = TonalPalette.fromHueAndChroma(primaryHct.hue, primaryHct.chroma);
		}
		if (customColors.secondary) {
			const secondaryHct = Hct.fromInt(argbFromHex(customColors.secondary));
			schemeOptions.secondaryPalette = TonalPalette.fromHueAndChroma(secondaryHct.hue, secondaryHct.chroma);
		}
		if (customColors.tertiary) {
			const tertiaryHct = Hct.fromInt(argbFromHex(customColors.tertiary));
			schemeOptions.tertiaryPalette = TonalPalette.fromHueAndChroma(tertiaryHct.hue, tertiaryHct.chroma);
		}
		if (customColors.error) {
			const errorHct = Hct.fromInt(argbFromHex(customColors.error));
			schemeOptions.errorPalette = TonalPalette.fromHueAndChroma(errorHct.hue, errorHct.chroma);
		}
		if (customColors.neutral) {
			const neutralHct = Hct.fromInt(argbFromHex(customColors.neutral));
			schemeOptions.neutralPalette = TonalPalette.fromHueAndChroma(neutralHct.hue, neutralHct.chroma);
		}
		if (customColors.neutralVariant) {
			const neutralVariantHct = Hct.fromInt(argbFromHex(customColors.neutralVariant));
			schemeOptions.neutralVariantPalette = TonalPalette.fromHueAndChroma(neutralVariantHct.hue, neutralVariantHct.chroma);
		}
		
		// Use the new DynamicScheme.from() method instead of deprecated constructor
		return DynamicScheme.from(schemeOptions);
	}

	/**
	 * Generate scheme colors for light/dark mode
	 * @param {DynamicScheme} scheme - Dynamic scheme instance
	 * @returns {Object} Color scheme object
	 */
	generateSchemeColors(scheme) {
		const colors = {};
		
		// Primary colors
		colors.primary = hexFromArgb(MaterialDynamicColors.primary.getArgb(scheme));
		colors.onPrimary = hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(scheme));
		colors.primaryContainer = hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(scheme));
		colors.onPrimaryContainer = hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(scheme));

		// Secondary colors
		colors.secondary = hexFromArgb(MaterialDynamicColors.secondary.getArgb(scheme));
		colors.onSecondary = hexFromArgb(MaterialDynamicColors.onSecondary.getArgb(scheme));
		colors.secondaryContainer = hexFromArgb(MaterialDynamicColors.secondaryContainer.getArgb(scheme));
		colors.onSecondaryContainer = hexFromArgb(MaterialDynamicColors.onSecondaryContainer.getArgb(scheme));

		// Tertiary colors
		colors.tertiary = hexFromArgb(MaterialDynamicColors.tertiary.getArgb(scheme));
		colors.onTertiary = hexFromArgb(MaterialDynamicColors.onTertiary.getArgb(scheme));
		colors.tertiaryContainer = hexFromArgb(MaterialDynamicColors.tertiaryContainer.getArgb(scheme));
		colors.onTertiaryContainer = hexFromArgb(MaterialDynamicColors.onTertiaryContainer.getArgb(scheme));

		// Error colors
		colors.error = hexFromArgb(MaterialDynamicColors.error.getArgb(scheme));
		colors.onError = hexFromArgb(MaterialDynamicColors.onError.getArgb(scheme));
		colors.errorContainer = hexFromArgb(MaterialDynamicColors.errorContainer.getArgb(scheme));
		colors.onErrorContainer = hexFromArgb(MaterialDynamicColors.onErrorContainer.getArgb(scheme));

		// Surface colors
		colors.surface = hexFromArgb(MaterialDynamicColors.surface.getArgb(scheme));
		colors.onSurface = hexFromArgb(MaterialDynamicColors.onSurface.getArgb(scheme));
		colors.surfaceVariant = hexFromArgb(MaterialDynamicColors.surfaceVariant.getArgb(scheme));
		colors.onSurfaceVariant = hexFromArgb(MaterialDynamicColors.onSurfaceVariant.getArgb(scheme));

		// Additional surface colors
		colors.surfaceDim = hexFromArgb(MaterialDynamicColors.surfaceDim.getArgb(scheme));
		colors.surfaceBright = hexFromArgb(MaterialDynamicColors.surfaceBright.getArgb(scheme));
		colors.surfaceContainerLowest = hexFromArgb(MaterialDynamicColors.surfaceContainerLowest.getArgb(scheme));
		colors.surfaceContainerLow = hexFromArgb(MaterialDynamicColors.surfaceContainerLow.getArgb(scheme));
		colors.surfaceContainer = hexFromArgb(MaterialDynamicColors.surfaceContainer.getArgb(scheme));
		colors.surfaceContainerHigh = hexFromArgb(MaterialDynamicColors.surfaceContainerHigh.getArgb(scheme));
		colors.surfaceContainerHighest = hexFromArgb(MaterialDynamicColors.surfaceContainerHighest.getArgb(scheme));

		// Outline colors
		colors.outline = hexFromArgb(MaterialDynamicColors.outline.getArgb(scheme));
		colors.outlineVariant = hexFromArgb(MaterialDynamicColors.outlineVariant.getArgb(scheme));

		// Fixed colors
		colors.primaryFixed = hexFromArgb(MaterialDynamicColors.primaryFixed.getArgb(scheme));
		colors.primaryFixedDim = hexFromArgb(MaterialDynamicColors.primaryFixedDim.getArgb(scheme));
		colors.onPrimaryFixed = hexFromArgb(MaterialDynamicColors.onPrimaryFixed.getArgb(scheme));
		colors.onPrimaryFixedVariant = hexFromArgb(MaterialDynamicColors.onPrimaryFixedVariant.getArgb(scheme));

		colors.secondaryFixed = hexFromArgb(MaterialDynamicColors.secondaryFixed.getArgb(scheme));
		colors.secondaryFixedDim = hexFromArgb(MaterialDynamicColors.secondaryFixedDim.getArgb(scheme));
		colors.onSecondaryFixed = hexFromArgb(MaterialDynamicColors.onSecondaryFixed.getArgb(scheme));
		colors.onSecondaryFixedVariant = hexFromArgb(MaterialDynamicColors.onSecondaryFixedVariant.getArgb(scheme));

		colors.tertiaryFixed = hexFromArgb(MaterialDynamicColors.tertiaryFixed.getArgb(scheme));
		colors.tertiaryFixedDim = hexFromArgb(MaterialDynamicColors.tertiaryFixedDim.getArgb(scheme));
		colors.onTertiaryFixed = hexFromArgb(MaterialDynamicColors.onTertiaryFixed.getArgb(scheme));
		colors.onTertiaryFixedVariant = hexFromArgb(MaterialDynamicColors.onTertiaryFixedVariant.getArgb(scheme));

		// Background and scrim
		colors.background = hexFromArgb(MaterialDynamicColors.background.getArgb(scheme));
		colors.onBackground = hexFromArgb(MaterialDynamicColors.onBackground.getArgb(scheme));
		colors.scrim = hexFromArgb(MaterialDynamicColors.scrim.getArgb(scheme));
		colors.shadow = hexFromArgb(MaterialDynamicColors.shadow.getArgb(scheme));

		// Inverse colors
		colors.inverseSurface = hexFromArgb(MaterialDynamicColors.inverseSurface.getArgb(scheme));
		colors.inverseOnSurface = hexFromArgb(MaterialDynamicColors.inverseOnSurface.getArgb(scheme));
		colors.inversePrimary = hexFromArgb(MaterialDynamicColors.inversePrimary.getArgb(scheme));

		return colors;
	}

	/**
	 * Generate state layers with opacity values
	 * @param {Object} colors - Base colors object
	 * @returns {Object} State layers with opacity values
	 */
	generateStateLayers(colors) {
		const stateLayers = {};
		
		// Use state layer opacity values from constants
		const opacities = STATE_LAYER_OPACITIES;
		
		// Primary state layers
		stateLayers.primary = {
			hover: this.addOpacityToHex(colors.primary, opacities.hover),
			focus: this.addOpacityToHex(colors.primary, opacities.focus),
			pressed: this.addOpacityToHex(colors.primary, opacities.pressed),
			dragged: this.addOpacityToHex(colors.primary, opacities.dragged),
			disabled: this.addOpacityToHex(colors.primary, opacities.disabled)
		};
		
		// Secondary state layers
		stateLayers.secondary = {
			hover: this.addOpacityToHex(colors.secondary, opacities.hover),
			focus: this.addOpacityToHex(colors.secondary, opacities.focus),
			pressed: this.addOpacityToHex(colors.secondary, opacities.pressed),
			dragged: this.addOpacityToHex(colors.secondary, opacities.dragged),
			disabled: this.addOpacityToHex(colors.secondary, opacities.disabled)
		};
		
		// Tertiary state layers
		stateLayers.tertiary = {
			hover: this.addOpacityToHex(colors.tertiary, opacities.hover),
			focus: this.addOpacityToHex(colors.tertiary, opacities.focus),
			pressed: this.addOpacityToHex(colors.tertiary, opacities.pressed),
			dragged: this.addOpacityToHex(colors.tertiary, opacities.dragged),
			disabled: this.addOpacityToHex(colors.tertiary, opacities.disabled)
		};
		
		// Error state layers
		stateLayers.error = {
			hover: this.addOpacityToHex(colors.error, opacities.hover),
			focus: this.addOpacityToHex(colors.error, opacities.focus),
			pressed: this.addOpacityToHex(colors.error, opacities.pressed),
			dragged: this.addOpacityToHex(colors.error, opacities.dragged),
			disabled: this.addOpacityToHex(colors.error, opacities.disabled)
		};
		
		// Surface state layers (using onSurface color)
		stateLayers.surface = {
			hover: this.addOpacityToHex(colors.onSurface, opacities.hover),
			focus: this.addOpacityToHex(colors.onSurface, opacities.focus),
			pressed: this.addOpacityToHex(colors.onSurface, opacities.pressed),
			dragged: this.addOpacityToHex(colors.onSurface, opacities.dragged),
			disabled: this.addOpacityToHex(colors.onSurface, opacities.disabled)
		};
		
		return stateLayers;
	}

	/**
	 * Generate tonal palettes for all color roles using actual scheme palettes
	 * @param {DynamicScheme} lightScheme - Light scheme instance for palette extraction
	 * @param {Array} extendedColors - Extended color definitions
	 * @param {Object} customCoreColors - Custom core color overrides
	 * @param {number} seedColorArgb - Seed color in ARGB format for harmonization
	 * @returns {Object} Tonal palettes object
	 */
	generateTonalPalettes(lightScheme, extendedColors = [], customCoreColors = {}, seedColorArgb) {
		const palettes = {};
		
		// Extract palettes from the actual scheme (variant-aware)
		const schemePalettes = {
			primary: lightScheme.primaryPalette,
			secondary: lightScheme.secondaryPalette,
			tertiary: lightScheme.tertiaryPalette,
			error: lightScheme.errorPalette,
			neutral: lightScheme.neutralPalette,
			neutralVariant: lightScheme.neutralVariantPalette
		};
		
		// Generate palettes for each color role using scheme palettes
		VALID_COLOR_ROLES.forEach(role => {
			let palette;
			
			// Use custom color if provided, otherwise use scheme palette
			if (customCoreColors[role]) {
				const customArgb = argbFromHex(customCoreColors[role]);
				const customHct = Hct.fromInt(customArgb);
				palette = TonalPalette.fromHueAndChroma(customHct.hue, customHct.chroma);
			} else {
				palette = schemePalettes[role];
			}
			
			if (palette) {
				palettes[role] = {};
				TONAL_VALUES.forEach(tone => {
					palettes[role][tone] = hexFromArgb(palette.tone(tone));
				});
			}
		});
		
		// Add extended color palettes
		extendedColors.forEach(extendedColor => {
			if (extendedColor.color && extendedColor.name) {
				try {
					const colorName = this.sanitizeColorName(extendedColor.name);
					let colorArgb = argbFromHex(extendedColor.color);
					
					// Apply harmonization if enabled
					if (extendedColor.harmonize !== false && seedColorArgb) { // Default to true if not specified
						colorArgb = Blend.harmonize(colorArgb, seedColorArgb);
					}
					
					const colorHct = Hct.fromInt(colorArgb);
					const palette = TonalPalette.fromHueAndChroma(colorHct.hue, colorHct.chroma);
					
					palettes[colorName] = {};
					TONAL_VALUES.forEach(tone => {
						palettes[colorName][tone] = hexFromArgb(palette.tone(tone));
					});
				} catch (error) {
					console.warn('Error generating palette for extended color:', extendedColor, error);
				}
			}
		});
		
		return palettes;
	}

	/**
	 * Process extended colors using themeFromSourceColor API from material-color-utilities
	 * @param {Array} extendedColors - Extended color definitions  
	 * @param {Object} lightColors - Light scheme colors
	 * @param {Object} darkColors - Dark scheme colors
	 * @param {Object} lightStateLayers - Light state layers
	 * @param {Object} darkStateLayers - Dark state layers
	 * @param {Object} tonalPalettes - Tonal palettes
	 * @param {number} seedColorArgb - Seed color in ARGB format for harmonization
	 * @param {DynamicScheme} lightScheme - Light dynamic scheme (unused now)
	 * @param {DynamicScheme} darkScheme - Dark dynamic scheme (unused now)
	 */
	processExtendedColors(extendedColors, lightColors, darkColors, lightStateLayers, darkStateLayers, tonalPalettes, seedColorArgb, _lightScheme, _darkScheme) {
		if (extendedColors.length === 0) return;
		
		// Prepare custom colors for themeFromSourceColor API
		const customColors = extendedColors.map(extendedColor => ({
			name: this.sanitizeColorName(extendedColor.name),
			value: argbFromHex(extendedColor.color),
			blend: extendedColor.harmonize !== false // Default to true if not specified
		}));
		
		// Generate theme with extended colors using the official API
		const theme = themeFromSourceColor(seedColorArgb, customColors);
		
		// Extract extended colors from the generated theme
		extendedColors.forEach(extendedColor => {
			if (extendedColor.color && extendedColor.name) {
				try {
					const colorName = this.sanitizeColorName(extendedColor.name);
					
					// Find the custom color in the array by index
					const customColorIndex = customColors.findIndex(c => c.name === colorName);
					
					if (theme.customColors && theme.customColors[customColorIndex]) {
						const customColor = theme.customColors[customColorIndex];
						
						// Extract colors - library handles all contrast calculations automatically
						// Light theme colors
						lightColors[colorName] = hexFromArgb(customColor.light.color);
						lightColors[`on ${colorName}`] = hexFromArgb(customColor.light.onColor);
						lightColors[`${colorName} container`] = hexFromArgb(customColor.light.colorContainer);
						lightColors[`on ${colorName} container`] = hexFromArgb(customColor.light.onColorContainer);
						
						// Dark theme colors  
						darkColors[colorName] = hexFromArgb(customColor.dark.color);
						darkColors[`on ${colorName}`] = hexFromArgb(customColor.dark.onColor);
						darkColors[`${colorName} container`] = hexFromArgb(customColor.dark.colorContainer);
						darkColors[`on ${colorName} container`] = hexFromArgb(customColor.dark.onColorContainer);
						
						// Add state layers
						const opacities = STATE_LAYER_OPACITIES;
						
						lightStateLayers[colorName] = {
							hover: this.addOpacityToHex(lightColors[colorName], opacities.hover),
							focus: this.addOpacityToHex(lightColors[colorName], opacities.focus),
							pressed: this.addOpacityToHex(lightColors[colorName], opacities.pressed),
							dragged: this.addOpacityToHex(lightColors[colorName], opacities.dragged),
							disabled: this.addOpacityToHex(lightColors[colorName], opacities.disabled)
						};
						
						darkStateLayers[colorName] = {
							hover: this.addOpacityToHex(darkColors[colorName], opacities.hover),
							focus: this.addOpacityToHex(darkColors[colorName], opacities.focus),
							pressed: this.addOpacityToHex(darkColors[colorName], opacities.pressed),
							dragged: this.addOpacityToHex(darkColors[colorName], opacities.dragged),
							disabled: this.addOpacityToHex(darkColors[colorName], opacities.disabled)
						};
					}
					
				} catch (error) {
					console.warn('Error processing extended color:', extendedColor, error);
				}
			}
		});
	}

	/**
	 * Add opacity to hex color
	 * @param {string} hexColor - Hex color string
	 * @param {number} opacity - Opacity value (0-1)
	 * @returns {string} Hex color with alpha channel
	 */
	addOpacityToHex(hexColor, opacity) {
		// Convert opacity to hex (0-255)
		const alpha = Math.round(opacity * 255);
		const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();
		
		// Return hex color with alpha channel
		return hexColor + alphaHex;
	}


	/**
	 * Sanitize color name for use as object key while preserving spaces and hyphens
	 */
	sanitizeColorName(str) {
		return str
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\-_ ]/g, '') // Keep alphanumeric, hyphens, underscores, and spaces
			.replace(/^[^a-zA-Z]+/, '') // Remove leading non-letters
			.trim(); // Remove leading/trailing spaces
	}

	/**
	 * Convert string to camelCase
	 */
	toCamelCase(str) {
		return str
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
			.replace(/^[^a-zA-Z]+/, '');
	}

	/**
	 * Get default core colors for current scheme
	 * @param {Hct} seedHct - Seed color in HCT format
	 * @param {number} variant - Color variant
	 * @param {number} specVersion - Specification version
	 * @returns {Object} Default core colors
	 */
	getDefaultCoreColors(seedHct, variant, specVersion) {
		const lightScheme = this.createCustomDynamicScheme(seedHct, variant, false, specVersion);
		
		return {
			primary: hexFromArgb(MaterialDynamicColors.primary.getArgb(lightScheme)),
			secondary: hexFromArgb(MaterialDynamicColors.secondary.getArgb(lightScheme)),
			tertiary: hexFromArgb(MaterialDynamicColors.tertiary.getArgb(lightScheme)),
			error: hexFromArgb(MaterialDynamicColors.error.getArgb(lightScheme)),
			neutral: hexFromArgb(lightScheme.neutralPalette.tone(50)),
			neutralVariant: hexFromArgb(lightScheme.neutralVariantPalette.tone(50))
		};
	}
}
