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

		// Tonal values for tonal palettes
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
		this.namingFormatSelect = document.getElementById('namingFormat');
		this.stateLayersToggle = document.getElementById('stateLayersToggle');
		this.tonalPalettesToggle = document.getElementById('tonalPalettesToggle');
		this.addColorBtn = document.getElementById('addColorBtn');
		this.extendedColorsContainer = document.getElementById('extendedColorsContainer');
		
		// Store original result for format conversion
		this.originalResult = null;
		
		// Extended colors array
		this.extendedColors = [];
		this.extendedColorCounter = 0;

		// Bind events
		this.bindEvents();
		
		// Initialize panel state
		this.updatePanelState();
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

		// Handle naming format change
		if (this.namingFormatSelect) {
			this.namingFormatSelect.addEventListener('change', () => {
				if (this.originalResult) {
					this.updateResultFormat();
				}
			});
		}

		// Handle state layers toggle
		if (this.stateLayersToggle) {
			this.stateLayersToggle.addEventListener('change', () => {
				if (this.originalResult) {
					this.updateResultFormat();
				}
			});
		}

		// Handle tonal palettes toggle
		if (this.tonalPalettesToggle) {
			this.tonalPalettesToggle.addEventListener('change', () => {
				if (this.originalResult) {
					this.updateResultFormat();
				}
			});
		}

		// Handle add color button
		if (this.addColorBtn) {
			this.addColorBtn.addEventListener('click', () => this.addExtendedColor());
		}
	}

	/**
	 * Add a new extended color input
	 */
	addExtendedColor() {
		// Calculate the next color number based on existing colors
		const existingColors = this.extendedColorsContainer.querySelectorAll('input[type="color"]');
		const nextColorNumber = existingColors.length + 1;
		this.extendedColorCounter = Math.max(this.extendedColorCounter, nextColorNumber);
		const colorId = `extendedColor${this.extendedColorCounter}`;
		const colorName = `Custom color ${nextColorNumber}`;
		
		const colorDiv = document.createElement('div');
		colorDiv.className = 'input-group mb-2';
		colorDiv.id = `${colorId}Container`;
		
		colorDiv.innerHTML = `
			<input type="color" class="form-control form-control-color" id="${colorId}" value="#ff5722" style="max-width: 80px;">
			<input type="text" class="form-control" placeholder="HEX code" id="${colorId}Hex" value="#ff5722" maxlength="7" style="max-width: 120px;">
			<input type="text" class="form-control" placeholder="Color name" id="${colorId}Name" value="${colorName}">
			<button class="btn btn-outline-danger" type="button" data-color-id="${colorId}">
				×
			</button>
		`;
		
		this.extendedColorsContainer.appendChild(colorDiv);
		
		// Add event listeners for real-time updates
		const colorInput = document.getElementById(colorId);
		const hexInput = document.getElementById(`${colorId}Hex`);
		const nameInput = document.getElementById(`${colorId}Name`);
		const removeBtn = colorDiv.querySelector('button[data-color-id]');
		
		// Sync color picker with hex input
		colorInput.addEventListener('input', () => {
			hexInput.value = colorInput.value;
			this.regenerateWithExtendedColors();
		});
		
		// Sync hex input with color picker
		hexInput.addEventListener('input', () => {
			if (this.isValidHex(hexInput.value)) {
				colorInput.value = hexInput.value;
				this.regenerateWithExtendedColors();
			}
		});
		
		nameInput.addEventListener('input', () => this.regenerateWithExtendedColors());
		removeBtn.addEventListener('click', () => this.removeExtendedColor(colorId));
		
		// Update extended colors array and result
		this.regenerateWithExtendedColors();
	}

	/**
	 * Remove an extended color input
	 * @param {string} colorId - ID of the color to remove
	 */
	removeExtendedColor(colorId) {
		const container = document.getElementById(`${colorId}Container`);
		if (container) {
			container.remove();
			this.regenerateWithExtendedColors();
		}
	}

	/**
	 * Update extended colors array
	 */
	updateExtendedColors() {
		this.extendedColors = [];
		
		const colorInputs = this.extendedColorsContainer.querySelectorAll('input[type="color"]');
		colorInputs.forEach(input => {
			const hexInput = document.getElementById(`${input.id}Hex`);
			const nameInput = document.getElementById(`${input.id}Name`);
			if (nameInput && hexInput) {
				const colorName = nameInput.value.trim() || nameInput.placeholder || 'Custom color';
				const colorValue = hexInput.value.trim() || input.value;
				this.extendedColors.push({
					name: colorName,
					color: colorValue
				});
			}
		});
	}

	/**
	 * Update panel state based on JSON result availability
	 */
	updatePanelState() {
		const hasResult = this.originalResult !== null;
		
		// Get the entire right panel
		const rightPanel = document.querySelector('.col-lg-6:last-child .card-body');
		const downloadBtn = this.downloadBtn;
		const copyBtn = this.copyBtn;
		
		if (!hasResult) {
			// Add disabled class to right panel
			if (rightPanel) {
				rightPanel.classList.add('panel-disabled');
			}
			
			// Disable buttons
			if (downloadBtn) downloadBtn.disabled = true;
			if (copyBtn) copyBtn.disabled = true;
		} else {
			// Remove disabled class from right panel
			if (rightPanel) {
				rightPanel.classList.remove('panel-disabled');
			}
			
			// Enable buttons when result is available
			if (downloadBtn) downloadBtn.disabled = false;
			if (copyBtn) copyBtn.disabled = false;
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

			// Generate State Layers for light and dark themes
			const lightStateLayers = this.generateStateLayers(lightColors);
			const darkStateLayers = this.generateStateLayers(darkColors);

			// Generate base role colours for tonal palettes
			const roleColors = {
				primary: hexFromArgb(seedArgb),
				secondary: this.generateRoleColor(seedArgb, 'secondary', variant),
				tertiary: this.generateRoleColor(seedArgb, 'tertiary', variant),
				neutral: this.generateRoleColor(seedArgb, 'neutral', variant),
				neutralVariant: this.generateRoleColor(seedArgb, 'neutralVariant', variant),
				error: this.generateRoleColor(seedArgb, 'error', variant)
			};

			// Add extended colors to palettes and schemes if any
			if (this.extendedColors && this.extendedColors.length > 0) {
				this.extendedColors.forEach((colorData) => {
					// Use sanitized color name to preserve hyphens, formatting will be applied later in transformKeys
					const colorName = this.sanitizeColorName(colorData.name);
					const extendedArgb = argbFromHex(colorData.color);
					const extendedHct = Hct.fromInt(extendedArgb);
					
					// Create tonal palette for the extended color
					const tonalPalette = TonalPalette.fromHct(extendedHct);
					
					// Add tonal palette to palettes (same format as default palettes)
					const tones = {};
					this.tones.forEach(tone => {
						tones[tone.toString()] = hexFromArgb(tonalPalette.tone(tone));
					});
					palettes[colorName] = tones;
					
					// Add color roles to schemes (same format as default roles)
					// Light theme roles
					lightColors[colorName] = hexFromArgb(tonalPalette.tone(40));
					lightColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`] = hexFromArgb(tonalPalette.tone(100));
					lightColors[`${colorName}Container`] = hexFromArgb(tonalPalette.tone(90));
					lightColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}Container`] = hexFromArgb(tonalPalette.tone(10));
					lightColors[`${colorName}Fixed`] = hexFromArgb(tonalPalette.tone(90));
					lightColors[`${colorName}FixedDim`] = hexFromArgb(tonalPalette.tone(80));
					lightColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}Fixed`] = hexFromArgb(tonalPalette.tone(10));
					lightColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}FixedVariant`] = hexFromArgb(tonalPalette.tone(30));
					
					// Dark theme roles
					darkColors[colorName] = hexFromArgb(tonalPalette.tone(80));
					darkColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`] = hexFromArgb(tonalPalette.tone(20));
					darkColors[`${colorName}Container`] = hexFromArgb(tonalPalette.tone(30));
					darkColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}Container`] = hexFromArgb(tonalPalette.tone(90));
					darkColors[`${colorName}Fixed`] = hexFromArgb(tonalPalette.tone(90));
					darkColors[`${colorName}FixedDim`] = hexFromArgb(tonalPalette.tone(80));
					darkColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}Fixed`] = hexFromArgb(tonalPalette.tone(10));
					darkColors[`on${colorName.charAt(0).toUpperCase() + colorName.slice(1)}FixedVariant`] = hexFromArgb(tonalPalette.tone(30));
				});
			}

			// Form result
			const result = {
				schemes: {
					light: lightColors,
					dark: darkColors
				},
				stateLayers: {
					light: lightStateLayers,
					dark: darkStateLayers
				},
				palettes: palettes
			};

			return result;
		} catch (error) {
			throw new Error(`Scheme generation error: ${error.message}`);
		}
	}

	/**
	 * Generate tonal palettes for light and dark themes
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
	 * Generate State Layers with opacity values for interactive states
	 * @param {Object} colors - Base color roles
	 * @returns {Object} State layers with opacity values
	 */
	generateStateLayers(colors) {
		const stateLayers = {};
		
		// State layer opacity values according to Material Design 3
		const opacities = {
			hover: 0.08,
			focus: 0.12,
			pressed: 0.12,
			dragged: 0.16,
			disabled: 0.38
		};
		
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
	 * Validate hex color code
	 * @param {string} hex - Hex color string
	 * @returns {boolean} True if valid hex color
	 */
	isValidHex(hex) {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
	}

	/**
	 * Convert camelCase to kebab-case
	 * @param {string} str - String in camelCase
	 * @returns {string} String in kebab-case
	 */
	camelToKebab(str) {
		// If string contains spaces, convert them to hyphens
		if (str.includes(' ')) {
			return str.toLowerCase().replace(/\s+/g, '-');
		}
		// If string already contains hyphens, keep them; otherwise convert camelCase
		if (str.includes('-')) {
			return str.toLowerCase();
		}
		return str.replace(/([A-Z])/g, '-$1').toLowerCase();
	}

	/**
	 * Convert camelCase to Title Case
	 * @param {string} str - String in camelCase, with hyphens, or with spaces
	 * @returns {string} String in Title Case
	 */
	camelToTitle(str) {
		// If string contains spaces, capitalize each word
		if (str.includes(' ')) {
			return str.split(' ').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			).join(' ');
		}
		// If string contains hyphens, convert them to spaces and capitalize
		if (str.includes('-')) {
			return str.split('-').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			).join(' ');
		}
		// Handle camelCase
		return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
	 * Transform object keys based on naming format
	 * @param {Object} obj - Object to transform
	 * @param {string} format - Naming format (camelCase, kebab-case, Title Case)
	 * @returns {Object} Transformed object
	 */
	transformKeys(obj, format) {
		if (typeof obj !== 'object' || obj === null) {
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.transformKeys(item, format));
		}

		const transformed = {};
		for (const [key, value] of Object.entries(obj)) {
			let newKey = key;
			
			if (format === 'kebab-case') {
				newKey = this.camelToKebab(key);
			} else if (format === 'Title Case') {
				newKey = this.camelToTitle(key);
			} else if (format === 'camelCase' && (key.includes('-') || key.includes(' '))) {
				// Convert hyphenated or spaced keys to camelCase
				newKey = this.toCamelCase(key);
			}
			// camelCase is default, no transformation needed for already camelCase keys
			
			transformed[newKey] = this.transformKeys(value, format);
		}
		return transformed;
	}

	/**
	 * Update result display with selected naming format, state layers toggle, and tonal palettes toggle
	 */
	updateResultFormat() {
		if (!this.originalResult || !this.namingFormatSelect) return;
		
		let resultToTransform = { ...this.originalResult };
		
		// Handle state layers toggle
		if (this.stateLayersToggle && !this.stateLayersToggle.checked) {
			// Remove state layers from result
			delete resultToTransform.stateLayers;
		}
		
		// Handle tonal palettes toggle
		if (this.tonalPalettesToggle && !this.tonalPalettesToggle.checked) {
			// Remove tonal palettes from result
			delete resultToTransform.palettes;
		}
		
		const selectedFormat = this.namingFormatSelect.value;
		const transformedResult = this.transformKeys(resultToTransform, selectedFormat);
		
		this.displayResult(transformedResult);
	}

	/**
	 * Handle generation
	 */
	async handleGenerate() {
		const url = this.urlInput?.value.trim();
		if (!url) {
			return;
		}

		// Update extended colors array
		this.updateExtendedColors();

		// Parsing the URL
		const parsedData = this.parseUrl(url);

		// Generate a schema
		const result = await this.generateColorScheme(parsedData);

		// Display the result
		this.displayResult(result, true);

		// Update panel state after generation
		this.updatePanelState();
	}

	/**
	 * Regenerate color scheme with current extended colors
	 */
	async regenerateWithExtendedColors() {
		if (!this.originalResult) {
			return;
		}

		const url = this.urlInput?.value.trim();
		if (!url) {
			return;
		}

		// Update extended colors array
		this.updateExtendedColors();

		// Parsing the URL
		const parsedData = this.parseUrl(url);

		// Generate a schema
		const result = await this.generateColorScheme(parsedData);

		// Display the result
		this.displayResult(result, true);
	}

	/**
	 * Display result
	 * @param {Object} result - Result to display
	 * @param {boolean} isNewResult - Whether this is a new result (not a format transformation)
	 */
	displayResult(result, isNewResult = false) {
		// If this is a new result, save as original and apply current format
		if (isNewResult) {
			this.originalResult = result;
			// Apply current naming format transformation
			this.updateResultFormat();
			return; // updateResultFormat will call displayResult again with transformed result
		}
		
		if (this.resultElement) {
			this.resultElement.innerHTML = `<pre><code>${JSON.stringify(result, null, 2)}</code></pre>`;
		}

		// Save for export (always use the currently displayed result)
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
		if (this.generateBtn) this.generateBtn.disabled = true;
		this.generatedResult = null;
		this.originalResult = null;
		
		// Update panel state after clearing
		this.updatePanelState();
	}
}

// Application initialisation on DOM loading
document.addEventListener('DOMContentLoaded', () => {
	new MaterialColorGenerator();
});

// Exporting a class for use in other modules
export default MaterialColorGenerator;
