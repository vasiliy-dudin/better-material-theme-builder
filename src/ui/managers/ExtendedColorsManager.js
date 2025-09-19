import { validateHexColor, isValidHexColor } from '../../utils/validators.js';

/**
 * Manager for extended colors functionality
 */
export class ExtendedColorsManager {
	constructor(colorPickerManager) {
		this.colorPickerManager = colorPickerManager;
		this.initializeElements();
		this.bindEvents();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		this.addColorBtn = document.getElementById('addColorBtn');
		this.extendedColorsContainer = document.getElementById('extendedColorsContainer');
	}

	/**
	 * Bind events
	 */
	bindEvents() {
		// Add color button
		if (this.addColorBtn) {
			this.addColorBtn.addEventListener('click', () => {
				this.addExtendedColorInput();
			});
		}
	}

	/**
	 * Set callback for extended colors update
	 */
	setUpdateCallback(callback) {
		this.onUpdate = callback;
	}

	/**
	 * Add extended color input
	 */
	addExtendedColorInput() {
		if (!this.extendedColorsContainer) return;
		
		const colorId = Date.now().toString();
		const colorDiv = document.createElement('div');
		colorDiv.className = 'color-row extended-color-row';
		colorDiv.dataset.colorId = colorId;
		
		// Calculate next color number
		const existingColors = this.extendedColorsContainer.querySelectorAll('.extended-color-row').length;
		const colorNumber = existingColors + 1;
		
		colorDiv.innerHTML = `
			<div class="input-group">
				<div class="color-picker-container">
					<div class="color-preview" data-color-id="${colorId}"></div>
					<div class="color-dropdown" data-color-id="${colorId}">
						<color-picker color-space="oklch" no-preview no-sliders-labels></color-picker>
					</div>
				</div>
				<input type="text" class="form-control color-hex-input" placeholder="#6750A4" data-color-id="${colorId}">
				<input type="text" class="form-control color-name-input" placeholder="Color name" value="Custom color ${colorNumber}" data-color-id="${colorId}">
				<div class="form-check form-switch harmonize-container">
					<input class="form-check-input harmonize-checkbox" type="checkbox" id="harmonize_${colorId}" data-color-id="${colorId}" checked>
					<label class="form-check-label" for="harmonize_${colorId}" title="Harmonize color with primary color">
						Harmonize
					</label>
				</div>
				<button type="button" class="btn btn-outline-danger remove-color-btn" data-color-id="${colorId}">Remove</button>
			</div>
		`;

		this.extendedColorsContainer.appendChild(colorDiv);
		this.bindExtendedColorEvents(colorDiv, colorId);

		// Trigger JSON update when new extended color is added
		this.onUpdate?.();
	}

	/**
	 * Bind events for extended color inputs
	 */
	async bindExtendedColorEvents(colorDiv, colorId) {
		const nameInput = colorDiv.querySelector('.color-name-input');
		const hexInput = colorDiv.querySelector('.color-hex-input');
		const removeBtn = colorDiv.querySelector('.remove-color-btn');
		const harmonizeCheckbox = colorDiv.querySelector('.harmonize-checkbox');
		const colorPreview = colorDiv.querySelector('.color-preview');
		const colorDropdown = colorDiv.querySelector('.color-dropdown');
		const colorPicker = colorDiv.querySelector('color-picker');

		// Remove button
		removeBtn.addEventListener('click', () => {
			colorDiv.remove();
			this.onUpdate?.();
		});

		// Name, hex input and harmonize checkbox changes
		[nameInput, hexInput, harmonizeCheckbox].forEach(input => {
			input.addEventListener('input', () => {
				this.onUpdate?.();
			});
		});

		// Separate change event for checkbox (for better compatibility)
		harmonizeCheckbox.addEventListener('change', () => {
			this.onUpdate?.();
		});

		// Color picker setup
		if (colorPicker && colorPreview && this.colorPickerManager) {
			const config = {
				colorPicker,
				colorInput: hexInput,
				colorPreview,
				colorDropdown,
				initialColor: '#6750A4',
				onChange: () => {
					this.onUpdate?.();
				},
				logPrefix: 'Extended color picker'
			};
			
			await this.colorPickerManager.setupColorPicker(config);
		}
	}

	/**
	 * Get extended colors from UI
	 */
	getExtendedColors() {
		const colors = [];
		const colorRows = this.extendedColorsContainer?.querySelectorAll('.extended-color-row') || [];
		
		colorRows.forEach(row => {
			const nameInput = row.querySelector('.color-name-input');
			const hexInput = row.querySelector('.color-hex-input');
			const harmonizeCheckbox = row.querySelector('.harmonize-checkbox');
			
			const name = nameInput?.value?.trim();
			const color = hexInput?.value?.trim();
			const harmonize = harmonizeCheckbox?.checked ?? true; // Default to true
			
			if (name && color && isValidHexColor(color)) {
				colors.push({ name, color, harmonize });
			}
		});
		
		return colors;
	}

	/**
	 * Clear all extended colors
	 */
	clearExtendedColors() {
		if (this.extendedColorsContainer) {
			this.extendedColorsContainer.innerHTML = '';
		}
	}
}
