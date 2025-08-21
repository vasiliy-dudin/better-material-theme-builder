import { ColorUtils } from './ColorUtils.js';

/**
 * Converter for W3C Design Tokens Community Group (W3C DTCG) format
 * Transforms the standard Material Colors JSON to W3C Design Tokens structure
 */
export class W3cDtcgConverter {
	/**
	 * Convert standard format to W3C DTCG format
	 * @param {Object} standardJson - Standard Material Colors JSON
	 * @returns {Object} W3C DTCG format JSON
	 */
	static convertToW3cDtcgFormat(standardJson) {
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
					values.Light = ColorUtils.convertToDesignTokenColor(lightColors[colorName]);
				}
				if (darkColors[colorName]) {
					values.Dark = ColorUtils.convertToDesignTokenColor(darkColors[colorName]);
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
					values.Light = ColorUtils.convertToDesignTokenColor(lightStateLayers[colorType][stateType]);
				}
				if (darkStateLayers[colorType]?.[stateType]) {
					values.Dark = ColorUtils.convertToDesignTokenColor(darkStateLayers[colorType][stateType]);
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
					const colorValue = ColorUtils.convertToDesignTokenColor(palette[tone]);
					
					designTokens["Semantic colors"]["Tonal Palettes"][variableName] = {
						"$type": "color",
						"$value": colorValue
					};
				});
			});
		}
		
		return designTokens;
	}
}
