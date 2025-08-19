import {
	argbFromHex,
	hexFromArgb,
	themeFromSourceColor,
	Hct,
	DynamicScheme,
	Variant,
	SpecVersion,
	MaterialDynamicColors,
	TonalPalette
} from '@materialx/material-color-utilities';

/**
 * Main class for generating colour schemes
 */
class MaterialColorGenerator {
	constructor() {
		// Mapping of scheme names to numbers
		this.styleMapping = {
			'MONOCHROME': Variant.MONOCHROME,
			'NEUTRAL': Variant.NEUTRAL,
			'TONAL_SPOT': Variant.TONAL_SPOT,
			'VIBRANT': Variant.VIBRANT,
			'EXPRESSIVE': Variant.EXPRESSIVE,
			'FIDELITY': Variant.FIDELITY,
			'CONTENT': Variant.CONTENT,
			'RAINBOW': Variant.RAINBOW,
			'FRUIT_SALAD': Variant.FRUIT_SALAD
		};

		// Tonal values for palettes
		this.tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];

		// Colour roles
		this.colorRoles = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];

		this.initializeUI();
	}

	/**
	 * Initialise UI elements
	 */
	initializeUI() {
		// Get elements from the DOM
		this.urlInput = document.getElementById('urlInput');
		this.generateBtn = document.getElementById('generateBtn');
		this.downloadBtn = document.getElementById('downloadBtn');
		this.copyBtn = document.getElementById('copyBtn');
		this.clearBtn = document.getElementById('clearBtn');
		this.resultElement = document.getElementById('jsonOutput');

		// Bind events
		this.bindEvents();
	}

	/**
	 * Bind events to elements
	 */
	bindEvents() {
		if (this.generateBtn) {
			this.generateBtn.addEventListener('click', () => this.handleGenerate());
		}

		if (this.downloadBtn) {
			this.downloadBtn.addEventListener('click', () => this.handleDownload());
		}

		if (this.copyBtn) {
			this.copyBtn.addEventListener('click', () => this.handleCopy());
		}

		if (this.clearBtn) {
			this.clearBtn.addEventListener('click', () => this.handleClear());
		}

		// Support Enter key for generation
		if (this.urlInput) {
			this.urlInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					this.handleGenerate();
				}
			});

			// Enable generate button on input
			this.urlInput.addEventListener('input', () => {
				if (this.generateBtn) {
					this.generateBtn.disabled = !this.urlInput.value.trim();
				}
			});
		}
	}

	/**
	 * Parse URL from MaterialKolor.com
	 */
	parseUrl(urlString) {
		try {
			const url = new URL(urlString);
			const params = new URLSearchParams(url.search);

			// Extract main parameters
			const colorSeed = params.get('color_seed');
			const style = params.get('style') || 'TonalSpot';
			const colorSpec = params.get('color_spec') || 'SPEC_2021';

			// Check required parameter
			if (!colorSeed) {
				throw new Error('Parameter color_seed is missing from the URL');
			}

			// Extract custom colours (if any)
		const customColors = {};
		this.colorRoles.forEach(role => {
			const colorParam = params.get(`color_${role}`);
			if (colorParam) {
				customColors[role] = colorParam;
			}
		});

			// Convert hex colours (remove alpha channel if present)
			const processedColors = {};
			Object.keys(customColors).forEach(role => {
				let hexColor = customColors[role];
				// Remove # if present
				hexColor = hexColor.replace('#', '');
				// If 8 characters, remove first 2 (alpha)
				if (hexColor.length === 8) {
					hexColor = hexColor.substring(2);
				}
				// Add # at the start
				processedColors[role] = '#' + hexColor;
			});

			// Process seed colour
			let seedHex = colorSeed.replace('#', '');
			if (seedHex.length === 8) {
				seedHex = seedHex.substring(2);
			}

			return {
				seedColor: '#' + seedHex,
				style: style.toUpperCase(),
				colorSpec,
				customColors: processedColors,
				originalUrl: urlString
			};
		} catch (error) {
			throw new Error(`URL parsing error: ${error.message}`);
		}
	}

	/**
	 * Generate colour scheme
	 */
	async generateColorScheme(parsedData) {
		try {
			const { seedColor, style, colorSpec, customColors } = parsedData;

			// Convert seed colour to ARGB
			const seedArgb = argbFromHex(seedColor);

			// Determine specification
			const specVersion = colorSpec === 'SPEC_2025' ? SpecVersion.SPEC_2025 : SpecVersion.SPEC_2021;

			// Determine style/variant
		const variant = this.styleMapping.hasOwnProperty(style) ? this.styleMapping[style] : Variant.TONAL_SPOT;

			// Create base theme from seed colour
			const baseTheme = themeFromSourceColor(seedArgb, [], { specVersion });

			// Create schemes for light and dark themes with custom colours
			const schemeOptions = {
				sourceColorHct: Hct.fromInt(seedArgb),
				variant: variant,
				contrastLevel: 0.0,
				specVersion: specVersion
			};

			// Add custom colours if present
			if (customColors.primary) {
				schemeOptions.primaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.primary));
			}
			if (customColors.secondary) {
				schemeOptions.secondaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.secondary));
			}
			if (customColors.tertiary) {
				schemeOptions.tertiaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.tertiary));
			}
			if (customColors.neutral) {
				schemeOptions.neutralPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.neutral));
			}
			if (customColors.neutralVariant) {
				schemeOptions.neutralVariantPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.neutralVariant));
			}

			const lightScheme = DynamicScheme.from({
				...schemeOptions,
				isDark: false
			});

			const darkScheme = DynamicScheme.from({
				...schemeOptions,
				isDark: true
			});

			// Generate palettes
			const palettes = this.generatePalettes(seedArgb, customColors, variant, specVersion);

			// Extract colour roles for light and dark themes
			const lightColors = this.extractColorRoles(lightScheme);
			const darkColors = this.extractColorRoles(darkScheme);

			// Generate base role colours for palettes
			const roleColors = {
				primary: hexFromArgb(seedArgb),
				secondary: this.generateRoleColor(seedArgb, 'secondary', variant),
				tertiary: this.generateRoleColor(seedArgb, 'tertiary', variant),
				neutral: this.generateRoleColor(seedArgb, 'neutral', variant),
				neutralVariant: this.generateRoleColor(seedArgb, 'neutralVariant', variant),
				error: this.generateRoleColor(seedArgb, 'error', variant)
			};

			// Form result
			const result = {
				schemes: {
					light: lightColors,
					dark: darkColors
				},
				palettes: palettes
			};

			return result;
		} catch (error) {
			throw new Error(`Scheme generation error: ${error.message}`);
		}
	}

	/**
	 * Generate palettes for light and dark themes
	 */
	generatePalettes(seedArgb, customColors, variant, specVersion) {
		const palettes = {};
		const sourceColorHct = Hct.fromInt(seedArgb);

		// Create DynamicScheme with custom colors for palettes
		const schemeOptions = {
			sourceColorHct: sourceColorHct,
			variant: variant,
			isDark: false, // For palettes use light theme
			contrastLevel: 0.0,
			specVersion: specVersion
		};

		// Add custom colors for palettes if they exist
		if (customColors.primary) {
			schemeOptions.primaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.primary));
		}
		if (customColors.secondary) {
			schemeOptions.secondaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.secondary));
		}
		if (customColors.tertiary) {
			schemeOptions.tertiaryPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.tertiary));
		}
		if (customColors.neutral) {
			schemeOptions.neutralPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.neutral));
		}
		if (customColors.neutralVariant) {
			schemeOptions.neutralVariantPaletteKeyColor = Hct.fromInt(argbFromHex(customColors.neutralVariant));
		}

		// Create scheme
		const scheme = DynamicScheme.from(schemeOptions);

		// Extract palettes from scheme
		const paletteMapping = {
			'primary': scheme.primaryPalette,
			'secondary': scheme.secondaryPalette,
			'tertiary': scheme.tertiaryPalette,
			'neutral': scheme.neutralPalette,
			'neutralVariant': scheme.neutralVariantPalette,
			'error': scheme.errorPalette
		};

		// WORKAROUND: DynamicScheme ignores custom palette key colors in @materialx/material-color-utilities v0.4.5
		// Create custom TonalPalettes directly for custom colors
		// Note: Remove alpha channel from hex colors before processing
		if (customColors.primary) {
			const primaryHex = customColors.primary.length > 7 ? customColors.primary.slice(0, 7) : customColors.primary;
			paletteMapping['primary'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(primaryHex)));
		}
		if (customColors.secondary) {
			const secondaryHex = customColors.secondary.length > 7 ? customColors.secondary.slice(0, 7) : customColors.secondary;
			paletteMapping['secondary'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(secondaryHex)));
		}
		if (customColors.tertiary) {
			const tertiaryHex = customColors.tertiary.length > 7 ? customColors.tertiary.slice(0, 7) : customColors.tertiary;
			paletteMapping['tertiary'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(tertiaryHex)));
		}
		if (customColors.neutral) {
			const neutralHex = customColors.neutral.length > 7 ? customColors.neutral.slice(0, 7) : customColors.neutral;
			paletteMapping['neutral'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(neutralHex)));
		}
		if (customColors.neutralVariant) {
			const neutralVariantHex = customColors.neutralVariant.length > 7 ? customColors.neutralVariant.slice(0, 7) : customColors.neutralVariant;
			paletteMapping['neutralVariant'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(neutralVariantHex)));
		}
		if (customColors.error) {
			const errorHex = customColors.error.length > 7 ? customColors.error.slice(0, 7) : customColors.error;
			paletteMapping['error'] = TonalPalette.fromHct(Hct.fromInt(argbFromHex(errorHex)));
		}

		// Create palettes for each role
		this.colorRoles.forEach(role => {
			const tonalPalette = paletteMapping[role] || paletteMapping['primary'];

			// Generate tones
			const tones = {};
			this.tones.forEach(tone => {
				tones[tone.toString()] = hexFromArgb(tonalPalette.tone(tone));
			});

			palettes[role] = tones;
		});

		return palettes;
	}

	/**
	 * Generate role color for a specific role using DynamicScheme
	 */
	generateRoleColor(seedArgb, role, variant) {
		const sourceColorHct = Hct.fromInt(seedArgb);
		
		// Create scheme for generating role color
		const scheme = DynamicScheme.from({
			sourceColorHct: sourceColorHct,
			variant: variant,
			isDark: false,
			contrastLevel: 0.0
		});
		
		// Map roles to palette from scheme
		const paletteMapping = {
			'primary': scheme.primaryPalette,
			'secondary': scheme.secondaryPalette,
			'tertiary': scheme.tertiaryPalette,
			'neutral': scheme.neutralPalette,
			'neutralVariant': scheme.neutralVariantPalette,
			'error': scheme.errorPalette
		};
		
		const palette = paletteMapping[role] || paletteMapping['primary'];
		
		// Return main tone (usually 40 for bright theme)
		 return hexFromArgb(palette.tone(40));
	}

	/**
	 * Extract color roles from scheme
	 */
	extractColorRoles(scheme) {
		const colors = {};

		// Primary colors
		colors.primary = hexFromArgb(MaterialDynamicColors.primary.getArgb(scheme));
		colors.onPrimary = hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(scheme));
		colors.primaryContainer = hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(scheme));
		colors.onPrimaryContainer = hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(scheme));
		colors.primaryFixed = hexFromArgb(MaterialDynamicColors.primaryFixed.getArgb(scheme));
		colors.primaryFixedDim = hexFromArgb(MaterialDynamicColors.primaryFixedDim.getArgb(scheme));
		colors.onPrimaryFixed = hexFromArgb(MaterialDynamicColors.onPrimaryFixed.getArgb(scheme));
		colors.onPrimaryFixedVariant = hexFromArgb(MaterialDynamicColors.onPrimaryFixedVariant.getArgb(scheme));

		// Secondary colors
		colors.secondary = hexFromArgb(MaterialDynamicColors.secondary.getArgb(scheme));
		colors.onSecondary = hexFromArgb(MaterialDynamicColors.onSecondary.getArgb(scheme));
		colors.secondaryContainer = hexFromArgb(MaterialDynamicColors.secondaryContainer.getArgb(scheme));
		colors.onSecondaryContainer = hexFromArgb(MaterialDynamicColors.onSecondaryContainer.getArgb(scheme));
		colors.secondaryFixed = hexFromArgb(MaterialDynamicColors.secondaryFixed.getArgb(scheme));
		colors.secondaryFixedDim = hexFromArgb(MaterialDynamicColors.secondaryFixedDim.getArgb(scheme));
		colors.onSecondaryFixed = hexFromArgb(MaterialDynamicColors.onSecondaryFixed.getArgb(scheme));
		colors.onSecondaryFixedVariant = hexFromArgb(MaterialDynamicColors.onSecondaryFixedVariant.getArgb(scheme));

		// Tertiary colors
		colors.tertiary = hexFromArgb(MaterialDynamicColors.tertiary.getArgb(scheme));
		colors.onTertiary = hexFromArgb(MaterialDynamicColors.onTertiary.getArgb(scheme));
		colors.tertiaryContainer = hexFromArgb(MaterialDynamicColors.tertiaryContainer.getArgb(scheme));
		colors.onTertiaryContainer = hexFromArgb(MaterialDynamicColors.onTertiaryContainer.getArgb(scheme));
		colors.tertiaryFixed = hexFromArgb(MaterialDynamicColors.tertiaryFixed.getArgb(scheme));
		colors.tertiaryFixedDim = hexFromArgb(MaterialDynamicColors.tertiaryFixedDim.getArgb(scheme));
		colors.onTertiaryFixed = hexFromArgb(MaterialDynamicColors.onTertiaryFixed.getArgb(scheme));
		colors.onTertiaryFixedVariant = hexFromArgb(MaterialDynamicColors.onTertiaryFixedVariant.getArgb(scheme));

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
		colors.surfaceDim = hexFromArgb(MaterialDynamicColors.surfaceDim.getArgb(scheme));
		colors.surfaceBright = hexFromArgb(MaterialDynamicColors.surfaceBright.getArgb(scheme));
		colors.surfaceContainerLowest = hexFromArgb(MaterialDynamicColors.surfaceContainerLowest.getArgb(scheme));
		colors.surfaceContainerLow = hexFromArgb(MaterialDynamicColors.surfaceContainerLow.getArgb(scheme));
		colors.surfaceContainer = hexFromArgb(MaterialDynamicColors.surfaceContainer.getArgb(scheme));
		colors.surfaceContainerHigh = hexFromArgb(MaterialDynamicColors.surfaceContainerHigh.getArgb(scheme));
		colors.surfaceContainerHighest = hexFromArgb(MaterialDynamicColors.surfaceContainerHighest.getArgb(scheme));
		colors.surfaceTint = hexFromArgb(MaterialDynamicColors.surfaceTint.getArgb(scheme));



		// Outline colors
		colors.outline = hexFromArgb(MaterialDynamicColors.outline.getArgb(scheme));
		colors.outlineVariant = hexFromArgb(MaterialDynamicColors.outlineVariant.getArgb(scheme));

		// Inverse colors
		colors.inverseSurface = hexFromArgb(MaterialDynamicColors.inverseSurface.getArgb(scheme));
		colors.inverseOnSurface = hexFromArgb(MaterialDynamicColors.inverseOnSurface.getArgb(scheme));
		colors.inversePrimary = hexFromArgb(MaterialDynamicColors.inversePrimary.getArgb(scheme));

		// Utility colors
		colors.shadow = hexFromArgb(MaterialDynamicColors.shadow.getArgb(scheme));
		colors.scrim = hexFromArgb(MaterialDynamicColors.scrim.getArgb(scheme));

		return colors;
	}

	/**
	 * Handle generation
	 */
	async handleGenerate() {
		const url = this.urlInput?.value.trim();
		if (!url) {
			return;
		}

		// Parsing the URL
		const parsedData = this.parseUrl(url);

		// Generate a schema
		const result = await this.generateColorScheme(parsedData);

		// Display the result
		this.displayResult(result);

		// Activate buttons
		if (this.downloadBtn) this.downloadBtn.disabled = false;
		if (this.copyBtn) this.copyBtn.disabled = false;
	}

	/**
	 * Display result
	 */
	displayResult(result) {
		if (this.resultElement) {
			this.resultElement.innerHTML = `<pre><code>${JSON.stringify(result, null, 2)}</code></pre>`;
		}

		// Save for export
		this.generatedResult = result;
	}

	/**
	 * Handle download
	 */
	handleDownload() {
		if (!this.generatedResult) return;

		const jsonString = JSON.stringify(this.generatedResult, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `material-colors-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);
	}

	/**
	 * Handle copy
	 */
	async handleCopy() {
		if (!this.generatedResult) return;

		try {
			const jsonString = JSON.stringify(this.generatedResult, null, 2);
			await navigator.clipboard.writeText(jsonString);;
		} catch (error) {
		}
	}

	/**
	 * Handle clear
	 */
	handleClear() {
		if (this.urlInput) this.urlInput.value = '';
		if (this.resultElement) this.resultElement.innerHTML = '';
		if (this.downloadBtn) this.downloadBtn.disabled = true;
		if (this.copyBtn) this.copyBtn.disabled = true;
		if (this.generateBtn) this.generateBtn.disabled = true;
		this.generatedResult = null;
	}
}

// Application initialisation on DOM loading
document.addEventListener('DOMContentLoaded', () => {
	new MaterialColorGenerator();
});

// Exporting a class for use in other modules
export default MaterialColorGenerator;
