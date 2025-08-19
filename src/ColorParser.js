/**
 * Module for parsing URLs and validating color data
 */
export class ColorParser {
	constructor() {
		// Color roles for validation
		this.colorRoles = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];
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
	 * Validate hex color code
	 * @param {string} hex - Hex color string
	 * @returns {boolean} True if valid hex color
	 */
	isValidHex(hex) {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
	}
}
