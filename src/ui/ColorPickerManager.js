/**
 * Manager for color picker functionality
 * Handles all color picker setup, events, and UI updates
 */
export class ColorPickerManager {
	/**
	 * Setup a color picker with all necessary event bindings
	 * @param {Object} config - Color picker configuration
	 */
	setupColorPicker(config) {
		const {
			colorPicker,
			colorInput,
			colorPreview,
			colorDropdown,
			initialColor = '#6750A4',
			onChange = () => {},
			logPrefix = 'Color picker'
		} = config;
		
		// Set initial color
		this.setColorPickerColor(colorPicker, colorPreview, colorInput, initialColor);
		
		// Bind color picker events
		this.bindColorPickerEvents(colorPicker, colorPreview, colorInput, onChange, logPrefix);
		
		// Bind color input events
		this.bindColorInputEvents(colorInput, colorPicker, colorPreview, onChange);
		
		// Bind preview click and dropdown events
		this.bindColorPreviewEvents(colorPreview, colorDropdown);
	}
	
	/**
	 * Set color picker color and update UI elements
	 */
	setColorPickerColor(colorPicker, colorPreview, colorInput, color) {
		colorPicker.color = color;
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
				colorPicker.color = color;
				const container = colorPreview.parentElement;
				container.style.setProperty('--preview-color', color);
				onChange();
			}
		});
	}
	
	/**
	 * Bind color preview click and dropdown events
	 */
	bindColorPreviewEvents(colorPreview, colorDropdown) {
		// Color preview click to toggle dropdown
		colorPreview.addEventListener('click', () => {
			this.closeOtherColorDropdowns(colorDropdown);
			colorDropdown.classList.toggle('show');
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
