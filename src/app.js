import { ColorParser } from './ColorParser.js';
import { ColorGenerator } from './ColorGenerator.js';
import { UIManager } from './UIManager.js';
import { FormatUtils } from './FormatUtils.js';
import { FigmaFormatConverter } from './FigmaFormatConverter.js';

/**
 * Main class for generating colour schemes
 */
class MaterialColorGenerator {
	constructor() {
		// Initialize modules
		this.colorParser = new ColorParser();
		this.colorGenerator = new ColorGenerator();
		this.uiManager = new UIManager();
		this.formatUtils = new FormatUtils();

		// Bind UI callbacks
		this.bindUICallbacks();
	}

	/**
	 * Bind UI callbacks to modules
	 */
	bindUICallbacks() {
		// Set callbacks for UI manager
		this.uiManager.setGenerateCallback(() => this.handleGenerate());
		this.uiManager.setFormatChangeCallback(() => this.updateResultFormat());
		this.uiManager.setExtendedColorsUpdateCallback(() => this.regenerateWithExtendedColors());
	}




	/**
	 * Update result display with selected naming format, state layers toggle, tonal palettes toggle, and W3C format toggle
	 */
	updateResultFormat() {
		const originalResult = this.uiManager.getOriginalResult();
		if (!originalResult) return;
		
		const namingFormat = this.uiManager.getNamingFormat();
		const includeStateLayers = this.uiManager.getStateLayersEnabled();
		const includeTonalPalettes = this.uiManager.getTonalPalettesEnabled();
		const useW3cFormat = this.uiManager.getW3cFormatEnabled();
		
		let formattedResult;
		
		if (useW3cFormat) {
			// For W3C format: apply filters first, then convert to W3C, then apply naming format
			const filteredResult = this.formatUtils.applyFormatOptions(
				originalResult,
				includeStateLayers,
				includeTonalPalettes
			);
			
			// Convert to W3C Design Tokens format
			const w3cResult = FigmaFormatConverter.convertToFigmaFormat(filteredResult);
			
			// Apply naming format to W3C structure, preserving top-level collection name
			formattedResult = this.transformW3cKeysExceptTopLevel(w3cResult, namingFormat);
		} else {
			// Standard format: apply all formatting together
			formattedResult = this.formatUtils.formatResult(
				originalResult,
				namingFormat,
				includeStateLayers,
				includeTonalPalettes
			);
		}
		
		this.uiManager.displayResult(formattedResult);
	}

	/**
	 * Transform W3C Design Tokens keys except the top-level collection name
	 * @param {Object} w3cResult - W3C Design Tokens object
	 * @param {string} namingFormat - Naming format to apply
	 * @returns {Object} Transformed object with preserved collection name
	 */
	transformW3cKeysExceptTopLevel(w3cResult, namingFormat) {
		const result = {};
		
		// Preserve top-level collection names, but transform their contents
		Object.keys(w3cResult).forEach(topLevelKey => {
			result[topLevelKey] = this.formatUtils.transformKeys(w3cResult[topLevelKey], namingFormat);
		});
		
		return result;
	}

	/**
	 * Handle generation
	 */
	async handleGenerate() {
		const url = this.uiManager.getUrlValue();
		if (!url) {
			return;
		}

		// Get extended colors from UI
		const extendedColors = this.uiManager.getExtendedColors();

		// Parse the URL
		const parsedData = this.colorParser.parseUrl(url);

		// Generate color scheme
		const result = await this.colorGenerator.generateColorScheme(parsedData, extendedColors);

		// Display the result
		this.uiManager.displayResult(result, true);
	}

	/**
	 * Regenerate color scheme with current extended colors
	 */
	async regenerateWithExtendedColors() {
		if (!this.uiManager.getOriginalResult()) {
			return;
		}

		const url = this.uiManager.getUrlValue();
		if (!url) {
			return;
		}

		// Get extended colors from UI
		const extendedColors = this.uiManager.getExtendedColors();

		// Parse the URL
		const parsedData = this.colorParser.parseUrl(url);

		// Generate color scheme
		const result = await this.colorGenerator.generateColorScheme(parsedData, extendedColors);

		// Save as new original result
		this.uiManager.displayResult(result, true);
		
		// Apply current format settings to preserve user's toggle states
		this.updateResultFormat();
	}

}

// Application initialisation on DOM loading
document.addEventListener('DOMContentLoaded', () => {
	new MaterialColorGenerator();
});

// Exporting a class for use in other modules
export default MaterialColorGenerator;
