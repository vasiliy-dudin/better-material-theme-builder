import { ColorParser } from './core/ColorParser.js';
import { ColorGeneratorService } from './services/ColorGeneratorService.js';
import { UIManager } from './ui/UIManager.js';
import { FormatUtils } from './utils/FormatUtils.js';
import { W3cDtcgConverter } from './formatters/W3cDtcgConverter.js';

/**
 * Main application controller for Material Color Generator
 * Coordinates between UI, services, and formatters
 */
class MaterialColorApp {
	constructor() {
		// Initialize core services
		this.colorParser = new ColorParser();
		this.colorGenerator = new ColorGeneratorService();
		this.uiManager = new UIManager();
		this.formatUtils = new FormatUtils();

		// Bind UI callbacks
		this.bindUICallbacks();
	}

	/**
	 * Bind UI callbacks to application logic
	 */
	bindUICallbacks() {
		this.uiManager.setGenerateCallback(() => this.handleGenerate());
		this.uiManager.setFormatChangeCallback(() => this.updateResultFormat());
		this.uiManager.setExtendedColorsUpdateCallback(() => this.regenerateWithExtendedColors());
	}

	/**
	 * Handle generate button click
	 */
	async handleGenerate() {
		const url = this.uiManager.getUrlValue();
		if (!url) {
			return;
		}

		try {
			// Get extended colors from UI
			const extendedColors = this.uiManager.getExtendedColors();

			// Parse the URL
			const parsedData = this.colorParser.parseUrl(url);

			// Generate color scheme
			const result = await this.colorGenerator.generateColorScheme(parsedData, extendedColors);

			// Display the result
			this.uiManager.displayResult(result, true);
			
			// Apply format settings right after generating
			this.updateResultFormat();
		} catch (error) {
			console.error('Error generating colors:', error);
			// Could add user-facing error handling here
		}
	}

	/**
	 * Update result display with selected formatting options
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
			const w3cResult = W3cDtcgConverter.convertToW3cDtcgFormat(filteredResult);
			
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

		try {
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
		} catch (error) {
			console.error('Error regenerating colors:', error);
		}
	}
}

// Application initialization on DOM loading
document.addEventListener('DOMContentLoaded', () => {
	new MaterialColorApp();
});

// Export for potential module use
export default MaterialColorApp;
