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
			const seedColor = params.get('primary') || '#6750A4';
			
			// Extract style/variant
			const style = params.get('style') || 'TONAL_SPOT';
			
			// Extract color specification
			const colorSpec = params.get('spec') || 'SPEC_2021';
			
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
	 * @returns {Array} Array of custom color objects
	 */
	parseCustomColors(params) {
		const customColors = [];
		// Future implementation for custom colors
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
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		if (!hexRegex.test(color)) {
			console.warn('Invalid hex color:', color, 'Using default');
			return '#6750A4';
		}
		
		// Convert 3-digit to 6-digit hex
		if (color.length === 4) {
			color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
		}
		
		return color.toUpperCase();
	}
}
