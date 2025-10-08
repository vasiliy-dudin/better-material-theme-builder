/**
 * Manager for color picker functionality
 * Handles all color picker setup, events, and UI updates
 */
export class ColorPickerManager {
	constructor() {
		// Import Color from color-picker's context
		this.Color = window.Color || globalThis.Color;
	}
	/**
	 * Setup a color picker with all necessary event bindings
	 * @param {Object} config - Color picker configuration
	 */
	async setupColorPicker(config) {
		const {
			colorPicker,
			colorInput,
			colorPreview,
			colorDropdown,
			initialColor = '#6750A4',
			onChange = () => {},
			logPrefix = 'Color picker'
		} = config;
		
		// Wait for color-picker custom element to be defined
		await this.waitForCustomElement(colorPicker, logPrefix);
		
		// Set initial color
		this.setColorPickerColor(colorPicker, colorPreview, colorInput, initialColor);
		
		// Bind color picker events
		this.bindColorPickerEvents(colorPicker, colorPreview, colorInput, onChange, logPrefix);
		
		// Bind color input events
		this.bindColorInputEvents(colorInput, colorPicker, colorPreview, onChange);
		
		// Bind preview click and dropdown events (pass picker and input for sync on open)
		this.bindColorPreviewEvents(colorPreview, colorDropdown, colorPicker, colorInput);
	}

	/**
	 * Wait for custom element to be defined and fully upgraded
	 * @param {HTMLElement} colorPicker - Color picker element
	 * @param {string} logPrefix - Log prefix for debugging
	 */
	async waitForCustomElement(colorPicker, logPrefix) {
		try {
			// Wait for color-picker custom element to be defined
			await customElements.whenDefined('color-picker');
			
			// Ensure the element is fully upgraded
			if (colorPicker && typeof colorPicker.upgradeProperty === 'function') {
				colorPicker.upgradeProperty('colorSpace');
				colorPicker.upgradeProperty('space');
			}
			
		} catch (error) {
			console.warn(`${logPrefix} - Error waiting for custom element:`, error);
		}
	}
	
	/**
	 * Set color picker color and update UI elements
	 */
	setColorPickerColor(colorPicker, colorPreview, colorInput, color) {
		// Try to update picker, but silently ignore errors
		// Some colors from certain schemes can cause internal picker errors
		try {
			// Create Color object if we have the Color class
			if (this.Color) {
				colorPicker.color = new this.Color(color);
			} else {
				// Fallback: try to set as string
				colorPicker.setAttribute('color', color);
			}
		} catch (error) {
			// Silently ignore - picker will work when user interacts with it
		}
		
		const container = colorPreview.parentElement;
		container.style.setProperty('--preview-color', color);
		if (colorInput) {
			colorInput.value = color;
		}
	}
	
	/**
	 * Bind color picker change events
	 */
	bindColorPickerEvents(colorPicker, colorPreview, colorInput, onChange, logPrefix) {
		// Primary color-changed event
		colorPicker.addEventListener('color-changed', (e) => {
			const color = e.detail.color.toString({ format: 'hex' });
			this.updateColorUI(colorPreview, colorInput, color);
			onChange();
		});

		// Backup input and change events
		['input', 'change'].forEach(eventType => {
			colorPicker.addEventListener(eventType, (e) => {
				try {
					const color = colorPicker.color ? colorPicker.color.toString({ format: 'hex' }) : colorPicker.value;
					if (color) {
						this.updateColorUI(colorPreview, colorInput, color);
						onChange();
					}
				} catch (error) {
					console.log(`${logPrefix} event error:`, error);
				}
			});
		});
	}
	
	/**
	 * Bind color input field events
	 */
	bindColorInputEvents(colorInput, colorPicker, colorPreview, onChange) {
		if (!colorInput) return;
		
		colorInput.addEventListener('input', (e) => {
			const color = e.target.value;
			if (this.isValidHexColor(color)) {
				// Try to update color picker, but don't throw errors if it fails
				// Some color values from certain schemes (like Rainbow) can cause picker errors
				try {
					// Create Color object if we have the Color class
					if (this.Color) {
						colorPicker.color = new this.Color(color);
					} else {
						// Fallback: try to set as string
						colorPicker.setAttribute('color', color);
					}
				} catch (error) {
					// Silently ignore picker update errors
					// Preview and input will still work correctly
					// Picker will sync when user interacts with it directly
				}
				
				const container = colorPreview.parentElement;
				container.style.setProperty('--preview-color', color);
				onChange();
			}
		});
	}
	
	/**
	 * Bind color preview click and dropdown events
	 */
	bindColorPreviewEvents(colorPreview, colorDropdown, colorPicker = null, colorInput = null) {
		// Color preview click to toggle dropdown
		colorPreview.addEventListener('click', () => {
			this.closeOtherColorDropdowns(colorDropdown);
			const isOpening = !colorDropdown.classList.contains('show');
			colorDropdown.classList.toggle('show');
			
			// When opening dropdown, sync picker with current input value
			if (isOpening && colorPicker && colorInput) {
				const currentColor = colorInput.value;
				if (this.isValidHexColor(currentColor)) {
					try {
						// Set HEX string directly (NOT Color object)
						// This matches Seed Color and Extended Colors pattern
						colorPicker.color = currentColor;
					} catch (error) {
						// Silently ignore - picker might not support this color
					}
				}
			}
		});
		
		// Close dropdown when clicking outside
		const closeHandler = (e) => {
			if (!colorPreview.parentElement.contains(e.target)) {
				colorDropdown.classList.remove('show');
			}
		};
		
		document.addEventListener('click', closeHandler);
	}
	
	/**
	 * Update color UI elements
	 */
	updateColorUI(colorPreview, colorInput, color) {
		const container = colorPreview.parentElement;
		container.style.setProperty('--preview-color', color);
		if (colorInput) {
			colorInput.value = color;
		}
	}
	
	/**
	 * Close all other color dropdowns except the specified one
	 */
	closeOtherColorDropdowns(exceptDropdown) {
		document.querySelectorAll('.color-dropdown').forEach(dropdown => {
			if (dropdown !== exceptDropdown) {
				dropdown.classList.remove('show');
			}
		});
	}

	/**
	 * Validate hex color format
	 */
	isValidHexColor(color) {
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		return hexRegex.test(color);
	}
}
