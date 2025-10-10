import { buildFromUI } from './utils/validators.js';
import { MaterialColorGenerator } from './utils/MaterialColorGenerator.js';
import { OKLCHPostProcessor } from './utils/OKLCHPostProcessor.js';
import { UIManager } from './ui/managers/UIManager.js';
import { URLManager } from './ui/managers/URLManager.js';
import { FormatUtils } from './utils/format.js';
import { W3cDtcgConverter } from './utils/W3cDtcgConverter.js';

// Import Material Color Utilities for core color defaults
import { argbFromHex, Hct, SpecVersion, Variant } from '@materialx/material-color-utilities';

/**
 * Main application controller for Material Color Generator
 * Coordinates between UI, services, and formatters
 */
class MaterialColorApp {
	constructor() {
		// Initialize services
		this.colorGenerator = new MaterialColorGenerator();
		this.formatUtils = new FormatUtils();
		this.w3cConverter = new W3cDtcgConverter();
		this.urlManager = new URLManager();
		
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
		this.uiManager.setCoreColorsUpdateCallback(() => this.regenerateWithExtendedColors());
		this.uiManager.setFormatChangeCallback(() => this.updateResultFormat());
		
		// Restore settings from URL if present
		this.restoreSettingsFromURL();
		
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
			const parsedData = buildFromUI(colorSettings);

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
			const parsedData = buildFromUI(colorSettings);

			// Update default core colors in UI when seed color or style changes
			this.updateDefaultCoreColors(parsedData);

			// Generate color scheme
			let result = await this.colorGenerator.generateColorScheme(parsedData, extendedColors);

			// Apply OKLCH post-processing if preserveHue is enabled
			if (colorSettings.preserveHue && result.tonalPalettes) {
				// Process ALL tonal palettes to preserve hue consistency
				// This includes:
				// - primary, secondary, tertiary (core chromatic colors)
				// - error (chromatic red color)
				// - neutral, neutralVariant (achromatic grays - will have minimal effect)
				// - extended colors (warning, success, etc.)
				const palettesToProcess = Object.keys(result.tonalPalettes);
				
				result = OKLCHPostProcessor.processColorScheme(result, {
					preserveHue: true,
					affectedPalettes: palettesToProcess
				});
			}

			// Save as new original result
			this.uiManager.displayResult(result, true);
			
			// Apply current format settings to preserve user's toggle states
			this.updateResultFormat();
			
			// Save current settings to URL
			this.saveSettingsToURL();
		} catch (error) {
			console.error('Error regenerating colors:', error);
		}
	}

	/**
	 * Update result format and save settings to URL
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
		
		// Save current settings to URL
		this.saveSettingsToURL();
	}

	/**
	 * Save current app settings to URL
	 */
	saveSettingsToURL() {
		this.urlManager.updateURL(this.uiManager.getCurrentAppSettings());
	}

	/**
	 * Restore app settings from URL parameters
	 */
	restoreSettingsFromURL() {
		if (this.urlManager.hasSettingsInURL()) {
			this.uiManager.setAppSettings(this.urlManager.getSettingsFromURL());
		}
	}
}

// Application initialization on DOM loading
document.addEventListener('DOMContentLoaded', () => {
	new MaterialColorApp();
});

// Export for potential module use
export default MaterialColorApp;
