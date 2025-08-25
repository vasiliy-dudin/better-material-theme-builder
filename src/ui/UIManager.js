import { ColorPickerManager } from './ColorPickerManager.js';

/**
 * UI Manager for handling DOM interactions and user input
 */
export class UIManager {
	constructor() {
		// Store reference to original result for format changes
		this.originalResult = null;
		
		// Initialize color picker manager
		this.colorPickerManager = new ColorPickerManager();
		
		// Initialize UI elements
		this.initializeElements();
		this.bindEvents();
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
		
		
		// Result elements
		this.copyBtn = document.getElementById('copyBtn');
		this.downloadBtn = document.getElementById('downloadBtn');
		this.resultElement = document.getElementById('jsonOutput');
		
		// Drawer elements
		this.getJsonBtn = document.getElementById('getJsonBtn');
		this.jsonDrawer = document.getElementById('jsonDrawer');
		this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
		this.drawerBackdrop = document.getElementById('drawerBackdrop');
		
		// Track current selections
		this.currentStyle = 'TONAL_SPOT';
		this.currentSpec = 'SPEC_2025';
		
		// Format options
		this.namingFormatSelect = document.getElementById('namingFormat');
		this.collectionNameInput = document.getElementById('collectionName');
		this.stateLayersToggle = document.getElementById('stateLayersToggle');
		this.tonalPalettesToggle = document.getElementById('tonalPalettesToggle');
		this.w3cFormatToggle = document.getElementById('w3cFormatToggle');
		
		// Extended colors
		this.addColorBtn = document.getElementById('addColorBtn');
		this.extendedColorsContainer = document.getElementById('extendedColorsContainer');
	}

	/**
	 * Bind event listeners
	 */
	bindEvents() {

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


		// Seed color picker setup
		this.bindSeedColorEvents();
		
		// Chip selectors
		this.bindChipEvents();

		// Drawer controls
		this.bindDrawerEvents();

		// Format change events - now triggers instant updates
		if (this.namingFormatSelect) {
			this.namingFormatSelect.addEventListener('change', () => {
				this.onFormatChange?.();
			});
		}

		// Collection name change - now triggers instant updates
		if (this.collectionNameInput) {
			this.collectionNameInput.addEventListener('input', () => {
				this.onFormatChange?.();
			});
		}

		// Handle state layers toggle - now triggers instant updates
		if (this.stateLayersToggle) {
			this.stateLayersToggle.addEventListener('change', () => {
				this.onFormatChange?.();
			});
		}

		// Handle tonal palettes toggle - now triggers instant updates
		if (this.tonalPalettesToggle) {
			this.tonalPalettesToggle.addEventListener('change', () => {
				this.onFormatChange?.();
			});
		}

		// Handle W3C format toggle
		if (this.w3cFormatToggle) {
			// Initial state setup for collection name field visibility
			this.toggleCollectionNameVisibility(this.w3cFormatToggle.checked);
			
			this.w3cFormatToggle.addEventListener('change', (e) => {
				// Update visibility of collection name field
				this.toggleCollectionNameVisibility(e.target.checked);
				
				this.onFormatChange?.();
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
	 * Get seed color value
	 */
	getSeedColor() {
		return this.seedColorInput?.value?.trim() || '#6750A4';
	}
	
	/**
	 * Get selected style value
	 */
	getStyle() {
		return this.currentStyle || 'TONAL_SPOT';
	}
	
	/**
	 * Get selected color specification
	 */
	getColorSpec() {
		return this.currentSpec || 'SPEC_2025';
	}
	
	/**
	 * Get all color configuration settings
	 */
	getColorSettings() {
		return {
			seedColor: this.getSeedColor(),
			style: this.getStyle(),
			colorSpec: this.getColorSpec(),
			customColors: {} // Will be populated with role-specific colors later
		};
	}

	/**
	 * Get selected naming format
	 */
	getNamingFormat() {
		return this.namingFormatSelect?.value || 'kebab-case';
	}

	/**
	 * Get collection name input value
	 */
	getCollectionName() {
		const val = this.collectionNameInput?.value?.trim();
		return val || 'Semantic colors';
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
	 * Enable copy and download buttons (no longer needed for panel control)
	 */
	enableButtons() {
		// Buttons are always enabled now
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
	 * Clear input and results (method kept for compatibility, but not used)
	 */
	clearInput() {
		// Reset color configuration to defaults
		if (this.seedColorInput) this.seedColorInput.value = '#6750A4';
		this.currentStyle = 'TONAL_SPOT';
		this.currentSpec = 'SPEC_2021';
		
		// Update chip selections
		this.updateChipSelection('styleChips', 'TONAL_SPOT');
		this.updateChipSelection('specChips', 'SPEC_2021');
		
		// Update seed color preview
		if (this.seedColorPreview) {
			const container = this.seedColorPreview.parentElement;
			container.style.setProperty('--preview-color', '#6750A4');
		}
		
		// Clear results
		if (this.resultElement) this.resultElement.textContent = '';
		
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
			const config = {
				colorPicker,
				colorInput: hexInput,
				colorPreview,
				colorDropdown,
				initialColor: '#6750A4',
				onChange: () => {
					this.onExtendedColorsUpdate?.();
				},
				logPrefix: 'Extended color picker'
			};
			
			this.colorPickerManager.setupColorPicker(config);
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
		return this.colorPickerManager.isValidHexColor(color);
	}
	
	/**
	 * Toggle visibility of the collection name input based on W3C format state
	 * @param {boolean} show - Whether to show the collection name input
	 */
	toggleCollectionNameVisibility(show) {
		const collectionNameGroup = document.getElementById('collectionNameGroup');
		if (collectionNameGroup) {
			if (show) {
				collectionNameGroup.classList.remove('d-none');
			} else {
				collectionNameGroup.classList.add('d-none');
			}
		}
	}
	
	/**
	 * Bind seed color picker events
	 */
	bindSeedColorEvents() {
		if (!this.seedColorInput || !this.seedColorPreview || !this.seedColorDropdown) return;
		
		const colorPicker = this.seedColorDropdown.querySelector('color-picker');
		if (!colorPicker) return;
		
		const config = {
			colorPicker,
			colorInput: this.seedColorInput,
			colorPreview: this.seedColorPreview,
			colorDropdown: this.seedColorDropdown,
			initialColor: '#6750A4',
			onChange: () => {
				this.onGenerate?.();
			},
			logPrefix: 'Seed color picker'
		};
		
		this.colorPickerManager.setupColorPicker(config);
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
	
	/**
	 * Bind drawer events
	 */
	bindDrawerEvents() {
		// Get JSON button - opens drawer
		if (this.getJsonBtn) {
			this.getJsonBtn.addEventListener('click', () => {
				this.openDrawer();
			});
		}
		
		// Close drawer button
		if (this.closeDrawerBtn) {
			this.closeDrawerBtn.addEventListener('click', () => {
				this.closeDrawer();
			});
		}
		
		// Backdrop functionality removed - drawer no longer modal
		
		// Escape key to close
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.jsonDrawer?.classList.contains('open')) {
				this.closeDrawer();
			}
		});
	}
	
	/**
	 * Open the JSON drawer
	 */
	openDrawer() {
		// Generate JSON if not already done
		if (!this.originalResult) {
			this.onGenerate?.();
		}
		
		if (this.jsonDrawer) {
			this.jsonDrawer.classList.add('open');
		}
		// No backdrop or body scroll blocking - drawer is not modal
	}
	
	/**
	 * Close the JSON drawer
	 */
	closeDrawer() {
		if (this.jsonDrawer) {
			this.jsonDrawer.classList.remove('open');
		}
		// No backdrop or body scroll restoration needed
	}
}
