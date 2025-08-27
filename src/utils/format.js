import { ColorUtils } from './color.js';

/**
 * Module for key transformation and result formatting
 */
export class FormatUtils {
	/**
	 * Convert camelCase to kebab-case
	 * @param {string} str - String in camelCase
	 * @returns {string} String in kebab-case
	 */
	camelToKebab(str) {
		// If string contains spaces, convert them to hyphens
		if (str.includes(' ')) {
			return str.toLowerCase().replace(/\s+/g, '-');
		}
		// If string already contains hyphens, keep them; otherwise convert camelCase
		if (str.includes('-')) {
			return str.toLowerCase();
		}
		// Handle camelCase with improved regex for numbers
		return str
			// Add hyphen before uppercase letters that follow lowercase letters or numbers
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			// Add hyphen before numbers that follow letters
			.replace(/([a-zA-Z])([0-9])/g, '$1-$2')
			// Add hyphen before letters that follow numbers
			.replace(/([0-9])([a-zA-Z])/g, '$1-$2')
			.toLowerCase();
	}

	/**
	 * Convert camelCase to Title Case
	 * @param {string} str - String in camelCase, with hyphens, or with spaces
	 * @returns {string} String in Title Case
	 */
	camelToTitle(str) {
		// If string contains spaces, capitalize each word
		if (str.includes(' ')) {
			return str.split(' ').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			).join(' ');
		}
		// If string contains hyphens, convert them to spaces and capitalize
		if (str.includes('-')) {
			return str.split('-').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			).join(' ');
		}
		// Handle camelCase - improved regex to handle numbers properly
		return str
			// Add space before uppercase letters that follow lowercase letters or numbers
			.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
			// Add space before numbers that follow letters
			.replace(/([a-zA-Z])([0-9])/g, '$1 $2')
			// Add space before letters that follow numbers
			.replace(/([0-9])([a-zA-Z])/g, '$1 $2')
			// Capitalize first letter
			.replace(/^./, str => str.toUpperCase());
	}

	/**
	 * Convert string to camelCase
	 */
	toCamelCase(str) {
		return str
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
			.replace(/^[^a-zA-Z]+/, '');
	}

	/**
	 * Transform object keys based on naming format
	 * @param {Object} obj - Object to transform
	 * @param {string} format - Naming format (camelCase, kebab-case, Title Case)
	 * @returns {Object} Transformed object
	 */
	transformKeys(obj, format) {
		if (typeof obj !== 'object' || obj === null) {
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.transformKeys(item, format));
		}

		const transformed = {};
		for (const [key, value] of Object.entries(obj)) {
			let newKey = key;
			
			if (format === 'kebab-case') {
				newKey = this.camelToKebab(key);
			} else if (format === 'Title Case') {
				newKey = this.camelToTitle(key);
			} else if (format === 'camelCase' && (key.includes('-') || key.includes(' '))) {
				// Convert hyphenated or spaced keys to camelCase
				newKey = this.toCamelCase(key);
			}
			// camelCase is default, no transformation needed for already camelCase keys
			
			transformed[newKey] = this.transformKeys(value, format);
		}
		return transformed;
	}

	/**
	 * Apply format options to result (state layers and tonal palettes toggles)
	 * @param {Object} result - Original result object
	 * @param {boolean} includeStateLayers - Include state layers
	 * @param {boolean} includeTonalPalettes - Include tonal palettes
	 * @returns {Object} Filtered result
	 */
	applyFormatOptions(result, includeStateLayers = true, includeTonalPalettes = true) {
		let resultToTransform = { ...result };
		
		// Handle state layers toggle
		if (!includeStateLayers) {
			// Remove state layers from result
			delete resultToTransform.stateLayers;
		}
		
		// Handle tonal palettes toggle
		if (!includeTonalPalettes) {
			// Remove tonal palettes from result
			delete resultToTransform.tonalPalettes;
		}
		
		return resultToTransform;
	}

	/**
	 * Format result with specified naming format and options
	 * @param {Object} result - Original result object
	 * @param {string} namingFormat - Naming format (camelCase, kebab-case, Title Case)
	 * @param {boolean} includeStateLayers - Include state layers
	 * @param {boolean} includeTonalPalettes - Include tonal palettes
	 * @returns {Object} Formatted result
	 */
	formatResult(result, namingFormat = 'camelCase', includeStateLayers = true, includeTonalPalettes = true) {
		// Apply format options first
		const filteredResult = this.applyFormatOptions(result, includeStateLayers, includeTonalPalettes);
		
		// Convert transparent colors to rgba format
		const rgbaResult = ColorUtils.convertTransparentColors(filteredResult);
		
		// Transform keys based on naming format
		return this.transformKeys(rgbaResult, namingFormat);
	}
}
