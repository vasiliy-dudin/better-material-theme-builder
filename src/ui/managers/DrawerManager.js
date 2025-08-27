/**
 * Manager for JSON drawer functionality
 */
export class DrawerManager {
	constructor() {
		this.initializeElements();
		this.bindEvents();
	}

	/**
	 * Initialize DOM element references
	 */
	initializeElements() {
		this.getJsonBtn = document.getElementById('getJsonBtn');
		this.jsonDrawer = document.getElementById('jsonDrawer');
		this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
		this.drawerBackdrop = document.getElementById('drawerBackdrop');
	}

	/**
	 * Bind drawer events
	 */
	bindEvents() {
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
		
		// Escape key to close
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.jsonDrawer?.classList.contains('open')) {
				this.closeDrawer();
			}
		});
	}

	/**
	 * Set callback for generate action when drawer opens
	 */
	setGenerateCallback(callback) {
		this.onGenerate = callback;
	}

	/**
	 * Open the JSON drawer
	 */
	openDrawer() {
		// Generate JSON if not already done
		if (this.onGenerate) {
			this.onGenerate();
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
