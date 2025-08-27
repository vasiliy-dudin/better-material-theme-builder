/**
 * Data builder for constructing color scheme data from UI inputs
 * Replaces URL parsing with direct UI data collection
 */
export class DataBuilder {
	/**
	 * Build color scheme data from UI inputs
	 * @param {Object} uiData - UI input values
	 * @returns {Object} Data object compatible with ColorGeneratorService
	 */
	buildFromUI(uiData) {
		const {
			seedColor,
			style,
			colorSpec,
			customCoreColors = {}
		} = uiData;

		return {
			seedColor: this.validateHexColor(seedColor || '#6750A4'),
			style: (style || 'TONAL_SPOT').toUpperCase(),
			colorSpec: (colorSpec || 'SPEC_2021').toUpperCase(),
			customCoreColors: this.validateCustomColors(customCoreColors)
		};
	}

	/**
	 * Validate and normalize hex color
	 * @param {string} color - Color string to validate
	 * @returns {string} Valid hex color
	 */
	validateHexColor(color) {
		// Remove any whitespace
		color = color.trim();
		
		// Add # if missing
		if (!color.startsWith('#')) {
			color = '#' + color;
		}
		
		// Validate hex format
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
		if (!hexRegex.test(color)) {
			console.warn('Invalid hex color:', color, 'Using default');
			return '#6750A4';
		}

		// For 8-digit hex (ARGB format), convert to RGB by removing alpha channel
		if (color.length === 9) {
			// MaterialKolor uses ARGB format: #AARRGGBB
			// Extract RGB part (skip first 2 alpha digits)
			color = '#' + color.substring(3);
		}
		
		return color.toUpperCase();
	}

	/**
	 * Validate custom colors object
	 * @param {Object} customColors - Custom color role overrides
	 * @returns {Object} Validated custom colors
	 */
	validateCustomColors(customColors) {
		const validated = {};
		const validRoles = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];

		Object.keys(customColors).forEach(role => {
			if (validRoles.includes(role) && customColors[role]) {
				validated[role] = this.validateHexColor(customColors[role]);
			}
		});

		return validated;
	}

	/**
	 * Get available style options for UI
	 * @returns {Array} Array of style options
	 */
	static getStyleOptions() {
		return [
			{ value: 'TONAL_SPOT', label: 'Tonal Spot' },
			{ value: 'VIBRANT', label: 'Vibrant' },
			{ value: 'EXPRESSIVE', label: 'Expressive' },
			{ value: 'NEUTRAL', label: 'Neutral' },
			{ value: 'MONOCHROME', label: 'Monochrome' },
			{ value: 'FIDELITY', label: 'Fidelity' },
			{ value: 'CONTENT', label: 'Content' },
			{ value: 'RAINBOW', label: 'Rainbow' },
			{ value: 'FRUIT_SALAD', label: 'Fruit Salad' }
		];
	}

	/**
	 * Get available color specification options for UI
	 * @returns {Array} Array of color spec options
	 */
	static getSpecOptions() {
		return [
			{ value: 'SPEC_2021', label: 'Spec 2021' },
			{ value: 'SPEC_2025', label: 'Spec 2025' }
		];
	}
}
