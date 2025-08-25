/**
 * Parser for MaterialKolor URL parameters
 */
export class ColorParser {
	/**
	 * Parse MaterialKolor URL and extract parameters
	 * @param {string} url - MaterialKolor URL
	 * @returns {Object} Parsed data object
	 */
	parseUrl(url) {
		try {
			const urlObj = new URL(url);
			const params = new URLSearchParams(urlObj.search);
			
			// Extract seed color
			const seedColor = params.get('color_seed') || params.get('primary') || '#6750A4';
			
			// Extract style/variant
			const style = params.get('style') || 'TONAL_SPOT';
			
			// Extract color specification
			const colorSpec = params.get('color_spec') || 'SPEC_2021';
			
			// Extract custom colors (future feature)
			const customColors = this.parseCustomColors(params);
			
			return {
				seedColor: this.validateHexColor(seedColor),
				style: style.toUpperCase(),
				colorSpec: colorSpec.toUpperCase(),
				customColors
			};
		} catch (error) {
			console.error('Error parsing URL:', error);
			// Return default values
			return {
				seedColor: '#6750A4',
				style: 'TONAL_SPOT',
				colorSpec: 'SPEC_2021',
				customColors: []
			};
		}
	}
	
	/**
	 * Parse custom colors from URL parameters
	 * @param {URLSearchParams} params - URL search parameters
	 * @returns {Object} Object with custom color role overrides
	 */
	parseCustomColors(params) {
		const customColors = {};
		
		// MaterialKolor custom color parameters
		const colorRoles = [
			'primary', 'secondary', 'tertiary', 'error', 
			'neutral', 'neutralvariant'
		];
		
		colorRoles.forEach(role => {
			const paramName = `color_${role}`;
			const colorValue = params.get(paramName);
			
			if (colorValue) {
				const normalizedRole = role === 'neutralvariant' ? 'neutralVariant' : role;
				customColors[normalizedRole] = this.validateHexColor(colorValue);
			}
		});
		
		return customColors;
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
}
