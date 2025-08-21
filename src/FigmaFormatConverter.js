/**
 * Converter for W3C Design Tokens format (Figma Variable Importer/Exporter)
 * Transforms the standard Material Colors JSON to W3C Design Tokens structure
 */
export class FigmaFormatConverter {
	/**
	 * Convert standard format to W3C Design Tokens format
	 * @param {Object} standardJson - Standard Material Colors JSON
	 * @returns {Object} W3C Design Tokens format JSON
	 */
	static convertToFigmaFormat(standardJson) {
		if (!standardJson || typeof standardJson !== 'object') {
			return { error: 'Invalid JSON structure' };
		}

		const designTokens = {
			"Semantic colors": {}
		};
		
		// Convert schemes
		if (standardJson.schemes) {
			designTokens["Semantic colors"]["Schemes"] = {};
			const lightColors = standardJson.schemes.light || {};
			const darkColors = standardJson.schemes.dark || {};
			
			// Get all unique color names (already formatted by FormatUtils)
			const allColorNames = new Set([...Object.keys(lightColors), ...Object.keys(darkColors)]);
			
			allColorNames.forEach(colorName => {
				const values = {};
				
				if (lightColors[colorName]) {
					values.Light = this.convertToDesignTokenColor(lightColors[colorName]);
				}
				if (darkColors[colorName]) {
					values.Dark = this.convertToDesignTokenColor(darkColors[colorName]);
				}
				
				designTokens["Semantic colors"]["Schemes"][colorName] = {
					"$type": "color",
					"$value": values
				};
			});
		}
		
		// Convert state layers
		if (standardJson.stateLayers) {
			designTokens["Semantic colors"]["State Layers"] = {};
			const lightStateLayers = standardJson.stateLayers.light || {};
			const darkStateLayers = standardJson.stateLayers.dark || {};
			
			// Collect all state layer variable names
			const allStateLayerVars = new Set();
			
			Object.keys(lightStateLayers).forEach(colorType => {
				Object.keys(lightStateLayers[colorType]).forEach(stateType => {
					allStateLayerVars.add(`${colorType} ${stateType}`);
				});
			});
			
			Object.keys(darkStateLayers).forEach(colorType => {
				Object.keys(darkStateLayers[colorType]).forEach(stateType => {
					allStateLayerVars.add(`${colorType} ${stateType}`);
				});
			});
			
			allStateLayerVars.forEach(variableName => {
				const values = {};
				const [colorType, stateType] = variableName.split(' ', 2);
				
				if (lightStateLayers[colorType]?.[stateType]) {
					values.Light = this.convertToDesignTokenColor(lightStateLayers[colorType][stateType]);
				}
				if (darkStateLayers[colorType]?.[stateType]) {
					values.Dark = this.convertToDesignTokenColor(darkStateLayers[colorType][stateType]);
				}
				
				designTokens["Semantic colors"]["State Layers"][variableName] = {
					"$type": "color",
					"$value": values
				};
			});
		}
		
		// Convert tonal palettes (placed at the end)
		if (standardJson.tonalPalettes) {
			designTokens["Semantic colors"]["Tonal Palettes"] = {};
			Object.keys(standardJson.tonalPalettes).forEach(paletteName => {
				const palette = standardJson.tonalPalettes[paletteName];
				Object.keys(palette).forEach(tone => {
					const variableName = `${paletteName} ${tone}`;
					const colorValue = this.convertToDesignTokenColor(palette[tone]);
					
					designTokens["Semantic colors"]["Tonal Palettes"][variableName] = {
						"$type": "color",
						"$value": colorValue
					};
				});
			});
		}
		
		return designTokens;
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
		
		// If color already has transparency indicator (like #000000de), convert to rgba
		if (color.length === 9 && color.startsWith('#')) {
			return this.hexToRgba(color);
		}
		
		// Regular hex colors stay as hex
		return color;
	}

	/**
	 * Convert 8-digit hex to rgba format
	 * @param {string} hex - 8-digit hex color (#RRGGBBAA)
	 * @returns {string} rgba color format
	 */
	static hexToRgba(hex) {
		if (!hex || hex.length !== 9 || !hex.startsWith('#')) {
			return hex;
		}
		
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		const a = parseInt(hex.slice(7, 9), 16) / 255;
		
		// Round alpha to 2 decimal places
		const alpha = Math.round(a * 100) / 100;
		
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	/**
	 * Check if current format should be Figma format
	 * @param {Object} uiManager - UI Manager instance
	 * @returns {boolean} True if Figma format is enabled
	 */
	static shouldUseFigmaFormat(uiManager) {
		return uiManager?.getFigmaFormatEnabled?.() ?? false;
	}

	/**
	 * Convert standard JSON to appropriate format based on UI settings
	 * @param {Object} standardJson - Standard Material Colors JSON
	 * @param {Object} uiManager - UI Manager instance
	 * @returns {Object} Formatted JSON
	 */
	static convertToAppropriateFormat(standardJson, uiManager) {
		if (this.shouldUseFigmaFormat(uiManager)) {
			return this.convertToFigmaFormat(standardJson);
		}
		
		return standardJson;
	}
}
