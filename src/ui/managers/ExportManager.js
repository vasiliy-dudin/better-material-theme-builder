/**
 * Manager for export functionality (copy/download JSON)
 */
export class ExportManager {
	constructor() {
		this.originalResult = null;
		this.initializeElements();
		this.bindEvents();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		this.copyBtn = document.getElementById('copyBtn');
		this.downloadBtn = document.getElementById('downloadBtn');
		this.resultElement = document.getElementById('jsonOutput');
		
		// Format options
		this.namingFormatSelect = document.getElementById('namingFormat');
		this.collectionNameInput = document.getElementById('collectionName');
		this.stateLayersToggle = document.getElementById('stateLayersToggle');
		this.tonalPalettesToggle = document.getElementById('tonalPalettesToggle');
		this.w3cFormatToggle = document.getElementById('w3cFormatToggle');
	}

	/**
	 * Bind events
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
	}

	/**
	 * Set callback for format change
	 */
	setFormatChangeCallback(callback) {
		this.onFormatChange = callback;
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
	 * Set export settings from configuration
	 */
	setExportSettings(settings) {
		if (!settings) return;

		if (settings.namingFormat) this.namingFormatSelect.value = settings.namingFormat;
		if (settings.collectionName) this.collectionNameInput.value = settings.collectionName;
		if (typeof settings.stateLayersEnabled === 'boolean') this.stateLayersToggle.checked = settings.stateLayersEnabled;
		if (typeof settings.tonalPalettesEnabled === 'boolean') this.tonalPalettesToggle.checked = settings.tonalPalettesEnabled;
		if (typeof settings.w3cFormatEnabled === 'boolean') {
			this.w3cFormatToggle.checked = settings.w3cFormatEnabled;
			this.toggleCollectionNameVisibility(settings.w3cFormatEnabled);
		}
	}
}
