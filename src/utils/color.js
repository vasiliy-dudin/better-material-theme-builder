/**
 * Utilities for color conversion and manipulation
 */
export class ColorUtils {
	/**
	 * Convert 8-digit hex to rgba format
	 * @param {string} hex - 8-digit hex color (#RRGGBBAA)
	 * @returns {string} rgba color format
	 */
	static hexToRgba(hex) {
		if (!hex || hex.length !== 9 || !hex.startsWith('#')) {
			return hex;
		}
		
		const r = parseInt(hex.substring(1, 3), 16);
		const g = parseInt(hex.substring(3, 5), 16);
		const b = parseInt(hex.substring(5, 7), 16);
		const a = parseInt(hex.substring(7, 9), 16) / 255;
		
		// Round alpha to 2 decimal places
		const alpha = Math.round(a * 100) / 100;
		
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	/**
	 * Convert transparent colors to rgba format recursively
	 * @param {*} obj - Object to process
	 * @returns {*} Object with transparent colors converted to rgba
	 */
	static convertTransparentColors(obj) {
		if (typeof obj !== 'object' || obj === null) {
			// Check if it's a string that looks like an 8-digit hex color
			if (typeof obj === 'string' && obj.length === 9 && obj.startsWith('#')) {
				return this.hexToRgba(obj);
			}
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.convertTransparentColors(item));
		}

		const converted = {};
		for (const [key, value] of Object.entries(obj)) {
			converted[key] = this.convertTransparentColors(value);
		}
		return converted;
	}

	/**
	 * Convert color to appropriate format for design tokens
	 * @param {string} color - Color value (hex or rgba)
	 * @returns {string} Formatted color value
	 */
	static convertToDesignTokenColor(color) {
		if (!color || typeof color !== 'string') {
			return '#000000';
		}
		
		// If color has transparency (8-digit hex), convert to rgba
		if (color.length === 9 && color.startsWith('#')) {
			return this.hexToRgba(color);
		}
		
		// Return color as-is for 6-digit hex or already formatted colors
		return color;
	}
}
