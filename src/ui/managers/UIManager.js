import { ColorPickerManager } from '../components/ColorPickerManager.js';
import { DrawerManager } from './DrawerManager.js';
import { ExtendedColorsManager } from './ExtendedColorsManager.js';
import { CoreColorsManager } from './CoreColorsManager.js';
import { ExportManager } from './ExportManager.js';
import { DEFAULT_SEED_COLOR, DEFAULT_STYLE, DEFAULT_SPEC } from '../../constants/materialDesign.js';

/**
 * Main UI Manager that coordinates all UI components
 */
export class UIManager {
	constructor() {
		// Initialize color picker manager first
		this.colorPickerManager = new ColorPickerManager();
		
		// Initialize specialized managers
		this.drawerManager = new DrawerManager();
		this.extendedColorsManager = new ExtendedColorsManager(this.colorPickerManager);
		this.coreColorsManager = new CoreColorsManager(this.colorPickerManager);
		this.exportManager = new ExportManager();
		
		// Initialize UI elements
		this.initializeElements();
	}

	/**
	 * Initialize UI asynchronously - must be called after constructor
	 */
	async initialize() {
		await this.bindEvents();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		// Color configuration elements
		this.seedColorInput = document.getElementById('seedColorInput');
		this.seedColorPreview = document.getElementById('seedColorPreview');
		this.seedColorDropdown = document.getElementById('seedColorDropdown');
		this.styleChips = document.getElementById('styleChips');
		this.specChips = document.getElementById('specChips');
		
		// Track current selections
		this.currentStyle = DEFAULT_STYLE;
		this.currentSpec = DEFAULT_SPEC;
	}

	/**
	 * Bind event listeners
	 */
	async bindEvents() {
		// Wait for color-picker custom element to be defined
		await customElements.whenDefined('color-picker');
		
		// Setup managers with callbacks
		this.setupManagerCallbacks();
		
		// Seed color picker setup
		await this.bindSeedColorEvents();
		
		// Chip selectors
		this.bindChipEvents();
		
		// Initialize core colors UI
		await this.coreColorsManager.initialize();
	}

	/**
	 * Setup callbacks for all managers
	 */
	setupManagerCallbacks() {
		// Drawer manager callbacks
		this.drawerManager.setGenerateCallback(() => {
			this.onGenerate?.();
		});
		
		// Extended colors manager callbacks
		this.extendedColorsManager.setUpdateCallback(() => {
			this.onGenerate?.();
		});
		
		// Core colors manager callbacks
		this.coreColorsManager.setUpdateCallback(() => {
			this.onGenerate?.();
		});
		
		this.coreColorsManager.setPrimaryChangeCallback((primaryColor) => {
			this.handlePrimaryAsNewSeed(primaryColor);
		});
		
		// Export manager callbacks
		this.exportManager.setFormatChangeCallback(() => {
			this.onFormatChange?.();
		});
	}
	
	/**
	 * Set callback for generate action
	 */
	setGenerateCallback(callback) {
		this.onGenerate = callback;
	}
	
	/**
	 * Set callback for extended colors update
	 */
	setExtendedColorsUpdateCallback(callback) {
		this.extendedColorsManager.setUpdateCallback(callback);
	}
	
	/**
	 * Set callback for core colors update
	 */
	setCoreColorsUpdateCallback(callback) {
		this.coreColorsManager.setUpdateCallback(callback);
	}

	/**
	 * Set callback for format change
	 */
	setFormatChangeCallback(callback) {
		this.onFormatChange = callback;
	}

	/**
	 * Get seed color value
	 */
	getSeedColor() {
		return this.seedColorInput?.value?.trim() || DEFAULT_SEED_COLOR;
	}
	
	/**
	 * Get selected style value
	 */
	getStyle() {
		return this.currentStyle || DEFAULT_STYLE;
	}
	
	/**
	 * Get selected color specification
	 */
	getColorSpec() {
		return this.currentSpec || DEFAULT_SPEC;
	}
	
	/**
	 * Get all color configuration settings
	 */
	getColorSettings() {
		return {
			seedColor: this.getSeedColor(),
			style: this.getStyle(),
			colorSpec: this.getColorSpec(),
			customCoreColors: this.coreColorsManager.getCustomCoreColors()
		};
	}

	/**
	 * Get extended colors from UI
	 */
	getExtendedColors() {
		return this.extendedColorsManager.getExtendedColors();
	}

	/**
	 * Get selected naming format
	 */
	getNamingFormat() {
		return this.exportManager.getNamingFormat();
	}

	/**
	 * Get collection name input value
	 */
	getCollectionName() {
		return this.exportManager.getCollectionName();
	}

	/**
	 * Get state layers toggle state
	 */
	getStateLayersEnabled() {
		return this.exportManager.getStateLayersEnabled();
	}

	/**
	 * Get tonal palettes toggle state
	 */
	getTonalPalettesEnabled() {
		return this.exportManager.getTonalPalettesEnabled();
	}

	/**
	 * Get W3C format enabled state
	 */
	getW3cFormatEnabled() {
		return this.exportManager.getW3cFormatEnabled();
	}

	/**
	 * Get original result object
	 */
	getOriginalResult() {
		return this.exportManager.getOriginalResult();
	}

	/**
	 * Display result in the output area
	 */
	displayResult(result, isOriginal = false) {
		this.exportManager.displayResult(result, isOriginal);
	}

	/**
	 * Clear input and results (method kept for compatibility, but not used)
	 */
	clearInput() {
		// Reset color configuration to defaults
		if (this.seedColorInput) this.seedColorInput.value = DEFAULT_SEED_COLOR;
		this.currentStyle = DEFAULT_STYLE;
		this.currentSpec = DEFAULT_SPEC;
		
		// Update chip selections
		this.updateChipSelection('styleChips', DEFAULT_STYLE);
		this.updateChipSelection('specChips', DEFAULT_SPEC);
		
		// Update seed color preview
		if (this.seedColorPreview) {
			const container = this.seedColorPreview.parentElement;
			container.style.setProperty('--preview-color', DEFAULT_SEED_COLOR);
		}
		
		this.extendedColorsManager.clearExtendedColors();
	}

	/**
	 * Handle primary color change as new seed color
	 * This regenerates other core colors based on the new primary
	 */
	handlePrimaryAsNewSeed(primaryColor) {
		// Update seed color input and preview
		if (this.seedColorInput) {
			this.seedColorInput.value = primaryColor;
		}
		
		if (this.seedColorPreview) {
			const container = this.seedColorPreview.parentElement;
			container.style.setProperty('--preview-color', primaryColor);
		}
		
		// Update seed color picker
		const seedColorPicker = this.seedColorDropdown?.querySelector('color-picker');
		if (seedColorPicker && seedColorPicker.color) {
			seedColorPicker.color = primaryColor;
		}
		
		// Clear other custom core colors so they regenerate from new seed
		this.coreColorsManager.clearOtherCustomCoreColors();
		
		// Trigger regeneration
		this.onGenerate?.();
	}

	/**
	 * Update default core colors (called when seed color or style changes)
	 */
	updateDefaultCoreColors(defaultColors) {
		this.coreColorsManager.updateDefaultCoreColors(defaultColors);
	}

	/**
	 * Bind seed color picker events
	 */
	async bindSeedColorEvents() {
		if (!this.seedColorInput || !this.seedColorPreview || !this.seedColorDropdown) return;
		
		const colorPicker = this.seedColorDropdown.querySelector('color-picker');
		if (!colorPicker) return;
		
		const config = {
			colorPicker,
			colorInput: this.seedColorInput,
			colorPreview: this.seedColorPreview,
			colorDropdown: this.seedColorDropdown,
			initialColor: DEFAULT_SEED_COLOR,
			onChange: () => {
				this.onGenerate?.();
			},
			logPrefix: 'Seed color picker'
		};
		
		await this.colorPickerManager.setupColorPicker(config);
	}
	
	/**
	 * Bind chip events for style and spec selection
	 */
	bindChipEvents() {
		// Style chips
		if (this.styleChips) {
			this.styleChips.addEventListener('click', (e) => {
				if (e.target.classList.contains('chip')) {
					const value = e.target.getAttribute('data-value');
					if (value) {
						this.currentStyle = value;
						this.updateChipSelection('styleChips', value);
						this.onGenerate?.();
					}
				}
			});
		}
		
		// Spec chips
		if (this.specChips) {
			this.specChips.addEventListener('click', (e) => {
				if (e.target.classList.contains('chip')) {
					const value = e.target.getAttribute('data-value');
					if (value) {
						this.currentSpec = value;
						this.updateChipSelection('specChips', value);
						this.onGenerate?.();
					}
				}
			});
		}
	}
	
	/**
	 * Update chip selection state
	 */
	updateChipSelection(containerId, activeValue) {
		const container = document.getElementById(containerId);
		if (!container) return;
		
		const chips = container.querySelectorAll('.chip');
		chips.forEach(chip => {
			if (chip.getAttribute('data-value') === activeValue) {
				chip.classList.add('active');
			} else {
				chip.classList.remove('active');
			}
		});
	}
}
