/**
 * Validation utilities for color inputs and UI data
 */

/**
 * Validate and normalize hex color
 * @param {string} color - Color string to validate
 * @param {string} defaultColor - Default color to return if invalid
 * @returns {string} Valid hex color
 */
export function validateHexColor(color, defaultColor = '#6750A4') {
	// Handle null/undefined/empty
	if (!color || typeof color !== 'string') {
		return defaultColor;
	}
	
	// Remove any whitespace
	color = color.trim();
	
	// Handle empty string after trim
	if (!color) {
		return defaultColor;
	}
	
	// Add # if missing
	if (!color.startsWith('#')) {
		color = '#' + color;
	}
	
	// Validate hex format (3 or 6 characters)
	const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
	if (!hexRegex.test(color)) {
		console.warn('Invalid hex color:', color, 'Using default');
		return defaultColor;
	}
	
	return color;
}

/**
 * Validate custom colors object
 * @param {Object} customColors - Custom color role overrides
 * @returns {Object} Validated custom colors
 */
export function validateCustomColors(customColors) {
	if (!customColors || typeof customColors !== 'object') {
		return {};
	}
	
	const validated = {};
	const validRoles = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];

	Object.keys(customColors).forEach(role => {
		if (validRoles.includes(role) && customColors[role]) {
			const originalColor = customColors[role];
			const validatedColor = validateHexColor(originalColor);
			// Only include if the color was actually valid (not fallen back to default)
			if (validatedColor !== '#6750A4' || originalColor === '#6750A4' || originalColor === '6750A4') {
				validated[role] = validatedColor;
			}
		}
	});

	return validated;
}

/**
 * Build color scheme data from UI inputs
 * @param {Object} uiData - UI input values
 * @returns {Object} Data object compatible with ColorGeneratorService
 */
export function buildFromUI(uiData) {
	if (!uiData || typeof uiData !== 'object') {
		uiData = {};
	}

	const {
		seedColor,
		style,
		colorSpec,
		customCoreColors = {}
	} = uiData;

	return {
		seedColor: validateHexColor(seedColor || '#6750A4'),
		style: (style || 'TONAL_SPOT').toUpperCase(),
		colorSpec: (colorSpec || 'SPEC_2021').toUpperCase(),
		customCoreColors: validateCustomColors(customCoreColors)
	};
}

// Alias for backward compatibility
export const buildColorSchemeData = buildFromUI;

/**
 * Validate hex color format (simple check)
 * @param {string} color - Color to validate
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color) {
	const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
	return hexRegex.test(color);
}
