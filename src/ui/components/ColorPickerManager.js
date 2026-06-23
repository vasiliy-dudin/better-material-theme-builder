import 'color-elements/color-picker';
import Color from 'colorjs.io';

// Statically import the widget's CSS instead of relying on its internal
// `import(url, { with: { type: "css" } })` calls, which 404 against the
// build's hashed asset paths at runtime and fall back to an unreliable path.
// This list mirrors color-picker's own transitive imports inside the package
// (color-picker -> channel-slider, color-swatch, space-picker;
// channel-slider -> color-slider; color-swatch -> gamut-badge) - recheck
// against node_modules/color-elements/src/color-picker/color-picker.js if
// upgrading color-elements and a sub-widget's styling goes missing.
import 'color-elements/color-picker.css';
import 'color-elements/channel-slider.css';
import 'color-elements/color-swatch.css';
import 'color-elements/space-picker.css';
import 'color-elements/gamut-badge.css';
import 'color-elements/color-slider.css';

/**
 * Manager for color picker functionality
 * Handles all color picker setup, events, and UI updates
 */
export class ColorPickerManager {
	constructor() {
		this.Color = Color;
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
		
		// Bind preview click and dropdown events
		this.bindColorPreviewEvents(colorPreview, colorDropdown);
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
		try {
			colorPicker.color = new this.Color(color);
		} catch (_error) {
			// Fallback: set as attribute if the value can't be parsed into a Color
			colorPicker.setAttribute('color', color);
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
			colorPicker.addEventListener(eventType, (_e) => {
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
				try {
					colorPicker.color = new this.Color(color);
				} catch (_error) {
					// Fallback: set as attribute if the value can't be parsed into a Color
					colorPicker.setAttribute('color', color);
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
