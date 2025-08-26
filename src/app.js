import { DataBuilder } from './core/DataBuilder.js';
import { ColorGeneratorService } from './services/ColorGeneratorService.js';
import { UIManager } from './ui/UIManager.js';
import { FormatUtils } from './utils/FormatUtils.js';
import { W3cDtcgConverter } from './formatters/W3cDtcgConverter.js';

// Import Material Color Utilities for core color defaults
import { argbFromHex, Hct, SpecVersion, Variant } from '@materialx/material-color-utilities';

/**
 * Main application controller for Material Color Generator
 * Coordinates between UI, services, and formatters
 */
class MaterialColorApp {
	constructor() {
		// Initialize services
		this.colorGenerator = new ColorGeneratorService();
		this.formatUtils = new FormatUtils();
		this.dataBuilder = new DataBuilder();
		this.w3cConverter = new W3cDtcgConverter();
		
		// Initialize UI Manager
		this.uiManager = new UIManager();

		// Initialize asynchronously
		this.initialize();
	}

	/**
	 * Async initialization after constructor
	 */
	async initialize() {
		// Initialize UI Manager asynchronously 
		await this.uiManager.initialize();

		// Set up callbacks
		this.uiManager.setGenerateCallback(() => this.regenerateWithExtendedColors());
		this.uiManager.setExtendedColorsUpdateCallback(() => this.regenerateWithExtendedColors());
		this.uiManager.setFormatChangeCallback(() => this.updateResultFormat());
		
		// Initial generation
		this.regenerateWithExtendedColors();
	}

	/**
	 * Handle generate button click
	 */
	async handleGenerate() {
		try {
			// Get color configuration from UI
			const colorSettings = this.uiManager.getColorSettings();
			const extendedColors = this.uiManager.getExtendedColors();

			// Build data from UI inputs
			const parsedData = this.dataBuilder.buildFromUI(colorSettings);

			// Update default core colors in UI when seed color or style changes
			this.updateDefaultCoreColors(parsedData);

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
		if (!originalResult) {
			// If no result exists yet, generate one first
			this.handleGenerate();
			return;
		}
		
		const namingFormat = this.uiManager.getNamingFormat();
		const collectionName = this.uiManager.getCollectionName();
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
			
			// Convert to W3C Design Tokens format with dynamic collection name
			const w3cResult = W3cDtcgConverter.convertToW3cDtcgFormat(filteredResult, collectionName);
			
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
	 * Update default core colors in UI
	 */
	updateDefaultCoreColors(parsedData) {
		try {
			const { seedColor, style, colorSpec } = parsedData;
			
			// Use imported Material Color Utilities classes

			// Convert seed color to HCT
			const seedArgb = argbFromHex(seedColor);
			const seedHct = Hct.fromInt(seedArgb);
			
			// Get variant and spec
			const variant = this.colorGenerator.styleMapping[style] || Variant.TONAL_SPOT;
			const specVersion = colorSpec === 'SPEC_2025' ? SpecVersion.SPEC_2025 : SpecVersion.SPEC_2021;
			
			// Get default colors for current scheme
			const defaultColors = this.colorGenerator.getDefaultCoreColors(seedHct, variant, specVersion);
			
			// Update UI with default colors
			this.uiManager.updateDefaultCoreColors(defaultColors);
		} catch (error) {
			console.warn('Could not update default core colors:', error);
		}
	}

	/**
	 * Regenerate color scheme with current extended colors
	 */
	async regenerateWithExtendedColors() {
		// Always regenerate, don't check for existing result

		try {
			// Get color configuration from UI
			const colorSettings = this.uiManager.getColorSettings();
			const extendedColors = this.uiManager.getExtendedColors();

			// Build data from UI inputs
			const parsedData = this.dataBuilder.buildFromUI(colorSettings);

			// Update default core colors in UI when seed color or style changes
			this.updateDefaultCoreColors(parsedData);

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
