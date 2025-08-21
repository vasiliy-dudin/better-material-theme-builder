/**
 * UI Manager for handling DOM interactions and user input
 */
export class UIManager {
	constructor() {
		// Store reference to original result for format changes
		this.originalResult = null;
		
		// Initialize UI elements
		this.initializeElements();
		this.bindEvents();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		this.urlInput = document.getElementById('urlInput');
		this.generateBtn = document.getElementById('generateBtn');
		this.copyBtn = document.getElementById('copyBtn');
		this.downloadBtn = document.getElementById('downloadBtn');
		this.clearBtn = document.getElementById('clearBtn');
		this.resultElement = document.getElementById('jsonOutput');
		this.namingFormatSelect = document.getElementById('namingFormat');
		this.stateLayersToggle = document.getElementById('stateLayersToggle');
		this.tonalPalettesToggle = document.getElementById('tonalPalettesToggle');
		this.w3cFormatToggle = document.getElementById('w3cFormatToggle');
		this.addColorBtn = document.getElementById('addColorBtn');
		this.extendedColorsContainer = document.getElementById('extendedColorsContainer');
	}

	/**
	 * Bind event listeners
	 */
	bindEvents() {
		// Generate button
		if (this.generateBtn) {
			this.generateBtn.addEventListener('click', () => {
				this.onGenerate?.();
			});
		}

		// Copy button
		if (this.copyBtn) {
			this.copyBtn.addEventListener('click', () => {
				this.copyToClipboard();
			});
		}

		// Download button
		if (this.downloadBtn) {
			this.downloadBtn.addEventListener('click', () => {
				this.downloadJSON();
			});
		}

		// Clear button
		if (this.clearBtn) {
			this.clearBtn.addEventListener('click', () => {
				this.clearInput();
			});
		}

		// URL input enter key
		if (this.urlInput) {
			this.urlInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					this.onGenerate?.();
				}
			});
		}

		// Format change events
		if (this.namingFormatSelect) {
			this.namingFormatSelect.addEventListener('change', () => {
				if (this.originalResult) {
					this.onFormatChange?.();
				}
			});
		}

		// Handle state layers toggle
		if (this.stateLayersToggle) {
			this.stateLayersToggle.addEventListener('change', () => {
				if (this.originalResult) {
					this.onFormatChange?.();
				}
			});
		}

		// Handle tonal palettes toggle
		if (this.tonalPalettesToggle) {
			this.tonalPalettesToggle.addEventListener('change', () => {
				if (this.originalResult) {
					this.onFormatChange?.();
				}
			});
		}

		// Handle W3C format toggle
		if (this.w3cFormatToggle) {
			this.w3cFormatToggle.addEventListener('change', () => {
				if (this.originalResult) {
					this.onFormatChange?.();
				}
			});
		}

		// Add color button
		if (this.addColorBtn) {
			this.addColorBtn.addEventListener('click', () => {
				this.addExtendedColorInput();
			});
		}
	}

	/**
	 * Set callback for generate action
	 */
	setGenerateCallback(callback) {
		this.onGenerate = callback;
	}

	/**
	 * Set callback for format change
	 */
	setFormatChangeCallback(callback) {
		this.onFormatChange = callback;
	}

	/**
	 * Set callback for extended colors update
	 */
	setExtendedColorsUpdateCallback(callback) {
		this.onExtendedColorsUpdate = callback;
	}

	/**
	 * Get URL input value
	 */
	getUrlValue() {
		return this.urlInput?.value?.trim() || '';
	}

	/**
	 * Get selected naming format
	 */
	getNamingFormat() {
		return this.namingFormatSelect?.value || 'camelCase';
	}

	/**
	 * Get state layers toggle state
	 */
	getStateLayersEnabled() {
		return this.stateLayersToggle?.checked ?? true;
	}

	/**
	 * Get tonal palettes toggle state
	 */
	getTonalPalettesEnabled() {
		return this.tonalPalettesToggle?.checked ?? true;
	}

	/**
	 * Get W3C format enabled state
	 */
	getW3cFormatEnabled() {
		return this.w3cFormatToggle?.checked ?? false;
	}

	/**
	 * Get original result object
	 */
	getOriginalResult() {
		return this.originalResult;
	}

	/**
	 * Display result in the output area
	 */
	displayResult(result, isOriginal = false) {
		if (isOriginal) {
			this.originalResult = result;
		}
		
		if (this.resultElement) {
			this.resultElement.textContent = JSON.stringify(result, null, 2);
		}
		
		this.enableButtons();
	}

	/**
	 * Enable copy and download buttons
	 */
	enableButtons() {
		if (this.copyBtn) this.copyBtn.disabled = false;
		if (this.downloadBtn) this.downloadBtn.disabled = false;
		
		// Enable result panel when there's content
		const resultPanel = document.getElementById('resultPanel');
		if (resultPanel) {
			resultPanel.classList.remove('panel-disabled');
		}
	}

	/**
	 * Copy JSON to clipboard
	 */
	async copyToClipboard() {
		if (!this.resultElement?.textContent) return;
		
		try {
			await navigator.clipboard.writeText(this.resultElement.textContent);
			
			// Visual feedback
			const originalText = this.copyBtn.textContent;
			this.copyBtn.textContent = 'Copied!';
			this.copyBtn.classList.add('btn-success');
			this.copyBtn.classList.remove('btn-secondary');
			
			setTimeout(() => {
				this.copyBtn.textContent = originalText;
				this.copyBtn.classList.remove('btn-success');
				this.copyBtn.classList.add('btn-secondary');
			}, 2000);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}

	/**
	 * Download JSON as file
	 */
	downloadJSON() {
		if (!this.resultElement?.textContent) return;
		
		const blob = new Blob([this.resultElement.textContent], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'material-colors.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	/**
	 * Clear input and results
	 */
	clearInput() {
		if (this.urlInput) this.urlInput.value = '';
		if (this.resultElement) this.resultElement.textContent = '';
		if (this.copyBtn) this.copyBtn.disabled = true;
		if (this.downloadBtn) this.downloadBtn.disabled = true;
		
		// Disable result panel when clearing
		const resultPanel = document.getElementById('resultPanel');
		if (resultPanel) {
			resultPanel.classList.add('panel-disabled');
		}
		
		this.originalResult = null;
		this.clearExtendedColors();
	}

	/**
	 * Add extended color input
	 */
	addExtendedColorInput() {
		if (!this.extendedColorsContainer) return;
		
		const colorId = Date.now().toString();
		const colorDiv = document.createElement('div');
		colorDiv.className = 'mb-2 extended-color-row';
		colorDiv.dataset.colorId = colorId;
		
		// Calculate next color number
		const existingColors = this.extendedColorsContainer.querySelectorAll('.extended-color-row').length;
		const colorNumber = existingColors + 1;
		
		colorDiv.innerHTML = `
			<div class="input-group">
				<div class="color-picker-container">
					<div class="color-preview" data-color-id="${colorId}"></div>
					<div class="color-dropdown" data-color-id="${colorId}">
						<color-picker no-color-space no-preview no-sliders-labels></color-picker>
					</div>
				</div>
				<input type="text" class="form-control color-hex-input" placeholder="#6750A4" data-color-id="${colorId}">
				<input type="text" class="form-control color-name-input" placeholder="Color name" value="Custom color ${colorNumber}" data-color-id="${colorId}">
				<button type="button" class="btn btn-outline-danger remove-color-btn" data-color-id="${colorId}">Remove</button>
			</div>
		`;
		
		this.extendedColorsContainer.appendChild(colorDiv);
		this.bindExtendedColorEvents(colorDiv, colorId);
	}

	/**
	 * Bind events for extended color inputs
	 */
	bindExtendedColorEvents(colorDiv, colorId) {
		const nameInput = colorDiv.querySelector('.color-name-input');
		const hexInput = colorDiv.querySelector('.color-hex-input');
		const removeBtn = colorDiv.querySelector('.remove-color-btn');
		const colorPreview = colorDiv.querySelector('.color-preview');
		const colorDropdown = colorDiv.querySelector('.color-dropdown');
		const colorPicker = colorDiv.querySelector('color-picker');

		// Remove button
		removeBtn.addEventListener('click', () => {
			colorDiv.remove();
			this.onExtendedColorsUpdate?.();
		});

		// Name and hex input changes
		[nameInput, hexInput].forEach(input => {
			input.addEventListener('input', () => {
				this.onExtendedColorsUpdate?.();
			});
		});

		// Color picker setup
		if (colorPicker && colorPreview) {
			// Set initial color
			colorPicker.color = '#6750A4';
			colorDiv.querySelector('.color-picker-container').style.setProperty('--preview-color', '#6750A4');
			hexInput.value = '#6750A4';

			// Color picker changes
			colorPicker.addEventListener('color-changed', (e) => {
				const color = e.detail.color.toString({ format: 'hex' });
				const container = colorDiv.querySelector('.color-picker-container');
				container.style.setProperty('--preview-color', color);
				hexInput.value = color;
				this.onExtendedColorsUpdate?.();
			});

			// Also listen for input and change events as backup
			['input', 'change'].forEach(eventType => {
				colorPicker.addEventListener(eventType, (e) => {
					try {
						const color = colorPicker.color ? colorPicker.color.toString({ format: 'hex' }) : colorPicker.value;
						if (color) {
							const container = colorDiv.querySelector('.color-picker-container');
							container.style.setProperty('--preview-color', color);
							hexInput.value = color;
							this.onExtendedColorsUpdate?.();
						}
					} catch (error) {
						console.log('Color picker event error:', error);
					}
				});
			});

			// Hex input changes
			hexInput.addEventListener('input', (e) => {
				const color = e.target.value;
				if (this.isValidHexColor(color)) {
					colorPicker.color = color;
					const container = colorDiv.querySelector('.color-picker-container');
					container.style.setProperty('--preview-color', color);
				}
			});

			// Color preview click to toggle dropdown
			colorPreview.addEventListener('click', () => {
				// Close other dropdowns first
				document.querySelectorAll('.color-dropdown').forEach(dropdown => {
					if (dropdown !== colorDropdown) {
						dropdown.classList.remove('show');
					}
				});
				
				colorDropdown.classList.toggle('show');
			});

			// Close dropdown when clicking outside
			document.addEventListener('click', (e) => {
				if (!colorDiv.contains(e.target)) {
					colorDropdown.classList.remove('show');
				}
			});
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
			
			const name = nameInput?.value?.trim();
			const color = hexInput?.value?.trim();
			
			if (name && color && this.isValidHexColor(color)) {
				colors.push({ name, color });
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

	/**
	 * Validate hex color format
	 */
	isValidHexColor(color) {
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		return hexRegex.test(color);
	}
}
