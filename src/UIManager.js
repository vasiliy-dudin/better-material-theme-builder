/**
 * Module for managing UI elements and events
 */
export class UIManager {
	constructor() {
		this.extendedColors = [];
		this.extendedColorCounter = 0;
		this.originalResult = null;
		this.generatedResult = null;
		
		this.initializeElements();
		this.bindEvents();
		this.updatePanelState();
		this.initializeDropdownHandlers();
	}

	/**
	 * Initialize UI elements
	 */
	initializeElements() {
		// Get elements from the DOM
		this.urlInput = document.getElementById('urlInput');
		this.generateBtn = document.getElementById('generateBtn');
		this.downloadBtn = document.getElementById('downloadBtn');
		this.copyBtn = document.getElementById('copyBtn');
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
	 * Bind events to elements
	 */
	bindEvents() {
		if (this.generateBtn) {
			this.generateBtn.addEventListener('click', () => this.onGenerate?.());
		}

		if (this.downloadBtn) {
			this.downloadBtn.addEventListener('click', () => this.handleDownload());
		}

		if (this.copyBtn) {
			this.copyBtn.addEventListener('click', () => this.handleCopy());
		}

		if (this.clearBtn) {
			this.clearBtn.addEventListener('click', () => this.handleClear());
		}

		// Support Enter key for generation
		if (this.urlInput) {
			this.urlInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					this.onGenerate?.();
				}
			});

			// Enable generate button on input
			this.urlInput.addEventListener('input', () => {
				if (this.generateBtn) {
					this.generateBtn.disabled = !this.urlInput.value.trim();
				}
			});
		}

		// Handle naming format change
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

		// Handle add color button
		if (this.addColorBtn) {
			this.addColorBtn.addEventListener('click', () => this.addExtendedColor());
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
	 * Add a new extended color input
	 */
	addExtendedColor() {
		// Calculate the next color number based on existing colors
		const existingColors = this.extendedColorsContainer.querySelectorAll('color-picker');
		const nextColorNumber = existingColors.length + 1;
		this.extendedColorCounter = Math.max(this.extendedColorCounter, nextColorNumber);
		const colorId = `extendedColor${this.extendedColorCounter}`;
		const colorName = `Custom color ${nextColorNumber}`;
		
		const colorDiv = document.createElement('div');
		colorDiv.className = 'input-group mb-2';
		colorDiv.id = `${colorId}Container`;
		
		colorDiv.innerHTML = `
			<div class="color-preview-container" style="position: relative;">
				<div class="color-preview" id="${colorId}Preview" style="width: 40px; height: 38px; background-color: #ff5722; border: 1px solid #dee2e6; border-radius: 8px 0 0 8px; cursor: pointer;"></div>
				<div class="color-picker-dropdown" id="${colorId}Dropdown" style="position: absolute; top: 100%; left: 0; z-index: 1000; background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1); display: none;">
					<color-picker space="oklch" color="oklch(60% 30% 20)" id="${colorId}" style="width: 500px;"></color-picker>
				</div>
			</div>
			<input type="text" class="form-control" placeholder="HEX code" id="${colorId}Hex" value="#ff5722" maxlength="7" style="max-width: 120px;">
			<input type="text" class="form-control" placeholder="Color name" id="${colorId}Name" value="${colorName}">
			<button class="btn btn-outline-danger" type="button" data-color-id="${colorId}">
				×
			</button>
		`;
		
		this.extendedColorsContainer.appendChild(colorDiv);
		
		// Add event listeners for real-time updates
		const colorInput = document.getElementById(colorId);
		const colorPreview = document.getElementById(`${colorId}Preview`);
		const colorDropdown = document.getElementById(`${colorId}Dropdown`);
		const hexInput = document.getElementById(`${colorId}Hex`);
		const nameInput = document.getElementById(`${colorId}Name`);
		const removeBtn = colorDiv.querySelector('button[data-color-id]');
		
		// Toggle dropdown on preview click
		colorPreview.addEventListener('click', (e) => {
			e.stopPropagation();
			const isVisible = colorDropdown.style.display === 'block';
			// Hide all other dropdowns
			document.querySelectorAll('.color-picker-dropdown').forEach(dropdown => {
				dropdown.style.display = 'none';
			});
			// Toggle current dropdown
			colorDropdown.style.display = isVisible ? 'none' : 'block';
		});

		// Sync color picker with hex input and preview
		colorInput.addEventListener('colorchange', () => {
			const hexColor = colorInput.color.to('srgb').toString({format: 'hex'});
			hexInput.value = hexColor;
			colorPreview.style.backgroundColor = hexColor;
			this.regenerateWithExtendedColors();
		});
		
		// Sync hex input with color picker and preview
		hexInput.addEventListener('input', () => {
			if (this.isValidHex(hexInput.value)) {
				colorInput.setAttribute('color', `oklch(from ${hexInput.value} l c h)`);
				colorPreview.style.backgroundColor = hexInput.value;
				this.regenerateWithExtendedColors();
			}
		});
		
		nameInput.addEventListener('input', () => this.regenerateWithExtendedColors());
		removeBtn.addEventListener('click', () => this.removeExtendedColor(colorId));
		
		// Update extended colors array and result
		this.regenerateWithExtendedColors();
	}

	/**
	 * Initialize global dropdown handlers
	 */
	initializeDropdownHandlers() {
		// Close dropdowns when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.color-preview-container')) {
				document.querySelectorAll('.color-picker-dropdown').forEach(dropdown => {
					dropdown.style.display = 'none';
				});
			}
		});
	}

	/**
	 * Remove an extended color input
	 * @param {string} colorId - ID of the color to remove
	 */
	removeExtendedColor(colorId) {
		const container = document.getElementById(`${colorId}Container`);
		if (container) {
			container.remove();
			this.regenerateWithExtendedColors();
		}
	}

	/**
	 * Update extended colors array
	 */
	updateExtendedColors() {
		this.extendedColors = [];
		
		const colorInputs = this.extendedColorsContainer.querySelectorAll('color-picker');
		colorInputs.forEach(input => {
			const hexInput = document.getElementById(`${input.id}Hex`);
			const nameInput = document.getElementById(`${input.id}Name`);
			if (nameInput && hexInput) {
				const colorName = nameInput.value.trim() || nameInput.placeholder || 'Custom color';
				const colorValue = hexInput.value.trim() || input.color?.to('srgb').toString({format: 'hex'}) || '#ff5722';
				this.extendedColors.push({
					name: colorName,
					color: colorValue
				});
			}
		});
	}

	/**
	 * Regenerate with extended colors
	 */
	regenerateWithExtendedColors() {
		this.updateExtendedColors();
		this.onExtendedColorsUpdate?.();
	}

	/**
	 * Update panel state based on JSON result availability
	 */
	updatePanelState() {
		const hasResult = this.originalResult !== null;
		
		// Get the entire right panel
		const rightPanel = document.querySelector('.col-lg-6:last-child .card-body');
		const downloadBtn = this.downloadBtn;
		const copyBtn = this.copyBtn;
		
		if (!hasResult) {
			// Add disabled class to right panel
			if (rightPanel) {
				rightPanel.classList.add('panel-disabled');
			}
			
			// Disable buttons
			if (downloadBtn) downloadBtn.disabled = true;
			if (copyBtn) copyBtn.disabled = true;
		} else {
			// Remove disabled class from right panel
			if (rightPanel) {
				rightPanel.classList.remove('panel-disabled');
			}
			
			// Enable buttons when result is available
			if (downloadBtn) downloadBtn.disabled = false;
			if (copyBtn) copyBtn.disabled = false;
		}
	}

	/**
	 * Display result
	 * @param {Object} result - Result to display
	 * @param {boolean} isNewResult - Whether this is a new result (not a format transformation)
	 */
	displayResult(result, isNewResult = false) {
		// If this is a new result, save as original
		if (isNewResult) {
			this.originalResult = result;
		}
		
		if (this.resultElement) {
			this.resultElement.innerHTML = `<pre><code>${JSON.stringify(result, null, 2)}</code></pre>`;
		}

		// Save for export (always use the currently displayed result)
		this.generatedResult = result;
		
		// Update panel state after displaying result
		this.updatePanelState();
	}

	/**
	 * Handle download
	 */
	handleDownload() {
		if (!this.generatedResult) return;

		const jsonString = JSON.stringify(this.generatedResult, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `material-colors-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);
	}

	/**
	 * Handle copy
	 */
	async handleCopy() {
		if (!this.generatedResult) return;

		try {
			const jsonString = JSON.stringify(this.generatedResult, null, 2);
			await navigator.clipboard.writeText(jsonString);;
		} catch (error) {
		}
	}

	/**
	 * Handle clear
	 */
	handleClear() {
		if (this.urlInput) this.urlInput.value = '';
		if (this.resultElement) this.resultElement.innerHTML = '';
		if (this.generateBtn) this.generateBtn.disabled = true;
		this.generatedResult = null;
		this.originalResult = null;
		
		// Clear extended colors
		if (this.extendedColorsContainer) {
			this.extendedColorsContainer.innerHTML = '';
		}
		this.extendedColors = [];
		this.extendedColorCounter = 0;
		
		// Update panel state after clearing
		this.updatePanelState();
	}

	/**
	 * Get URL input value
	 */
	getUrlValue() {
		return this.urlInput?.value.trim() || '';
	}

	/**
	 * Get naming format
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
	 * Get extended colors
	 */
	getExtendedColors() {
		return this.extendedColors;
	}

	/**
	 * Get original result
	 */
	getOriginalResult() {
		return this.originalResult;
	}

	/**
	 * Validate hex color code
	 * @param {string} hex - Hex color string
	 * @returns {boolean} True if valid hex color
	 */
	isValidHex(hex) {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
	}
}
