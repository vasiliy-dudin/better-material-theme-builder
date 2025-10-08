import { CORE_COLOR_TYPES } from '../../constants/materialDesign.js';
import { validateHexColor, isValidHexColor } from '../../utils/validators.js';

/**
 * Manager for core colors functionality
 */
export class CoreColorsManager {
	constructor(colorPickerManager) {
		this.colorPickerManager = colorPickerManager;
		this.customCoreColors = {}; // Track custom core colors
		this.programmaticUpdate = false; // Flag to ignore programmatic updates
		this.initializeElements();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		this.coreColorsContainer = document.getElementById('coreColorsContainer');
	}

	/**
	 * Initialize core colors UI asynchronously
	 */
	async initialize() {
		if (!this.coreColorsContainer) return;
		
		// Initialize core colors sequentially to avoid race conditions
		for (const { key, label, defaultColor } of CORE_COLOR_TYPES) {
			await this.addCoreColorInput(key, label, defaultColor);
		}
	}

	/**
	 * Set callback for core colors update
	 */
	setUpdateCallback(callback) {
		this.onUpdate = callback;
	}

	/**
	 * Add core color input
	 */
	async addCoreColorInput(colorKey, colorLabel, defaultColor) {
		if (!this.coreColorsContainer) return;

		const colorDiv = document.createElement('div');
		colorDiv.className = 'color-row --core';
		colorDiv.dataset.coreColor = colorKey;

		colorDiv.innerHTML = `
			<div class="core-color-label">${colorLabel}</div>
			<div class="color-picker-container">
				<div class="color-preview" data-core-color="${colorKey}"></div>
				<div class="color-dropdown" data-core-color="${colorKey}">
					<color-picker color-space="oklch" no-preview no-sliders-labels></color-picker>
				</div>
			</div>
			<div class="core-color-input-group">				
				<input type="text" class="form-control core-color-hex-input" placeholder="${defaultColor}" data-core-color="${colorKey}">
				<button type="button" class="btn btn-link text-secondary fs-4 core-color-reset" data-core-color="${colorKey}" title="Reset to default">
					<i class="bi bi-arrow-clockwise"></i>
				</button>
			</div>
		`;

		this.coreColorsContainer.appendChild(colorDiv);
		await this.bindCoreColorEvents(colorDiv, colorKey, defaultColor);
	}

	/**
	 * Bind events for core color inputs
	 */
	async bindCoreColorEvents(colorDiv, colorKey, defaultColor) {
		const hexInput = colorDiv.querySelector('.core-color-hex-input');
		const resetBtn = colorDiv.querySelector('.core-color-reset');
		const colorPreview = colorDiv.querySelector('.color-preview');
		const colorDropdown = colorDiv.querySelector('.color-dropdown');
		const colorPicker = colorDiv.querySelector('color-picker');

		// Reset button
		resetBtn.addEventListener('click', () => {
			this.resetCoreColor(colorKey);
		});

		// Hex input changes
		hexInput.addEventListener('input', () => {
			// Ignore programmatic updates
			if (this.programmaticUpdate) return;
			
			const color = hexInput.value.trim();
			if (isValidHexColor(color)) {
				this.updateCustomCoreColor(colorKey, color);
			} else if (!color) {
				// Empty input resets to default
				this.resetCoreColor(colorKey);
			}
		});

		// Color picker setup
		if (colorPicker && colorPreview && this.colorPickerManager) {
			const config = {
				colorPicker,
				colorInput: hexInput,
				colorPreview,
				colorDropdown,
				initialColor: defaultColor,
				onChange: () => {
					// Ignore onChange during programmatic updates
					if (this.programmaticUpdate) return;
					
					const color = hexInput.value.trim();
					if (isValidHexColor(color)) {
						this.updateCustomCoreColor(colorKey, color);
					}
				},
				logPrefix: `Core color picker (${colorKey})`
			};
			
			await this.colorPickerManager.setupColorPicker(config);
		}

		// Set initial reset button state
		this.updateResetButtonState(colorKey);
	}

	/**
	 * Update custom core color
	 */
	updateCustomCoreColor(colorKey, color) {
		if (isValidHexColor(color)) {
			this.customCoreColors[colorKey] = color;
			
			// Special handling for primary color: it acts as new seed color
			if (colorKey === 'primary' && this.onPrimaryChange) {
				this.onPrimaryChange(color);
				return; // Don't call regular update, onPrimaryChange will do it
			}
		} else {
			delete this.customCoreColors[colorKey];
		}
		
		this.updateResetButtonState(colorKey);
		this.onUpdate?.();
	}

	/**
	 * Set callback for primary color changes (acts as new seed)
	 */
	setPrimaryChangeCallback(callback) {
		this.onPrimaryChange = callback;
	}

	/**
	 * Reset core color to default
	 */
	resetCoreColor(colorKey) {
		// Remove from custom colors
		delete this.customCoreColors[colorKey];
		
		// Clear the input
		const hexInput = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"].core-color-hex-input`);
		if (hexInput) {
			hexInput.value = '';
		}
		
		// Update color picker and preview
		const colorPicker = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"] color-picker`);
		const colorPreview = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"].color-preview`);
		
		if (colorPicker && colorPreview) {
			// Get default color for this type
			const defaultColor = CORE_COLOR_TYPES.find(t => t.key === colorKey)?.defaultColor || '#6750A4';
			
			// Update preview
			const container = colorPreview.parentElement;
			container.style.setProperty('--preview-color', defaultColor);
			
			// Update color picker
			if (colorPicker.color) {
				colorPicker.color = defaultColor;
			}
		}
		
		this.updateResetButtonState(colorKey);
		this.onUpdate?.();
	}

	/**
	 * Update reset button state
	 */
	updateResetButtonState(colorKey) {
		const resetBtn = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"].core-color-reset`);
		if (resetBtn) {
			const hasCustomColor = colorKey in this.customCoreColors;
			resetBtn.disabled = !hasCustomColor;
		}
	}

	/**
	 * Get custom core colors
	 */
	getCustomCoreColors() {
		return { ...this.customCoreColors };
	}

	/**
	 * Update default core colors (called when seed color or style changes)
	 */
	updateDefaultCoreColors(defaultColors) {
		if (!this.coreColorsContainer || !defaultColors) return;

		// Set flag to prevent input events from marking colors as customized
		this.programmaticUpdate = true;
		
		try {
			Object.entries(defaultColors).forEach(([colorKey, color]) => {
				// Validate color value
				if (!color || !isValidHexColor(color)) {
					console.warn(`Invalid color for ${colorKey}:`, color);
					return;
				}
				
				// Only update if not customized
				if (!(colorKey in this.customCoreColors)) {
					const colorPreview = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"].color-preview`);
					const hexInput = this.coreColorsContainer.querySelector(`[data-core-color="${colorKey}"].core-color-hex-input`);
					
					// Update preview
					if (colorPreview) {
						const container = colorPreview.parentElement;
						container.style.setProperty('--preview-color', color);
					}
					
					// Update HEX input
					if (hexInput) {
						hexInput.value = color;
					}
					
					// DON'T update picker programmatically - causes errors with Rainbow scheme
					// Picker will sync when user opens dropdown (ColorPickerManager handles this)
				}
			});
		} finally {
			// Always reset flag
			this.programmaticUpdate = false;
		}
	}

	/**
	 * Clear other custom core colors (used when primary changes)
	 */
	clearOtherCustomCoreColors() {
		const otherCoreColors = ['secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];
		otherCoreColors.forEach(colorKey => {
			if (colorKey in this.customCoreColors) {
				delete this.customCoreColors[colorKey];
				this.updateResetButtonState(colorKey);
			}
		});
	}

	/**
	 * Set custom core colors from configuration
	 */
	setCustomCoreColors(customCoreColors) {
		if (!customCoreColors) return;
		
		this.customCoreColors = {};
		
		Object.entries(customCoreColors).forEach(([key, value]) => {
			if (isValidHexColor(value)) {
				this.customCoreColors[key] = value;
				
				// Update UI directly
				const preview = this.coreColorsContainer?.querySelector(`[data-core-color="${key}"].color-preview`);
				const input = this.coreColorsContainer?.querySelector(`[data-core-color="${key}"].core-color-hex-input`);
				const picker = this.coreColorsContainer?.querySelector(`[data-core-color="${key}"] color-picker`);
				
				if (preview) preview.parentElement.style.setProperty('--preview-color', value);
				if (input) input.value = value;
				if (picker) picker.color = value;
				
				this.updateResetButtonState(key);
			}
		});
	}
}
