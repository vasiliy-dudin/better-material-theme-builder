import { ColorParser } from './ColorParser.js';
import { ColorGenerator } from './ColorGenerator.js';
import { UIManager } from './UIManager.js';
import { FormatUtils } from './FormatUtils.js';

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
	 * Update result display with selected naming format, state layers toggle, and tonal palettes toggle
	 */
	updateResultFormat() {
		const originalResult = this.uiManager.getOriginalResult();
		if (!originalResult) return;
		
		const namingFormat = this.uiManager.getNamingFormat();
		const includeStateLayers = this.uiManager.getStateLayersEnabled();
		const includeTonalPalettes = this.uiManager.getTonalPalettesEnabled();
		
		const formattedResult = this.formatUtils.formatResult(
			originalResult,
			namingFormat,
			includeStateLayers,
			includeTonalPalettes
		);
		
		this.uiManager.displayResult(formattedResult);
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
