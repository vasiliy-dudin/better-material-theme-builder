import { DEFAULT_SEED_COLOR, DEFAULT_STYLE, DEFAULT_SPEC } from '../../constants/materialDesign.js';

/**
 * Simple URL parameters manager
 */
export class URLManager {
	constructor() {
		this.debounceTimeout = null;
		this.lastUrl = '';
	}

	getSettingsFromURL() {
		const params = new URLSearchParams(window.location.search);
		
		const settings = {
			seedColor: params.get('seed'),
			style: params.get('style'),
			colorSpec: params.get('spec'),
			customCoreColors: this.parseCore(params.get('core')),
			extendedColors: this.parseExtended(params.get('extended')),
			exportSettings: {
				namingFormat: params.get('format') || 'kebab-case',
				collectionName: params.get('collection') || 'Semantic colors',
				stateLayersEnabled: params.get('stateLayers') !== '0',
				tonalPalettesEnabled: params.get('tonalPalettes') !== '0',
				w3cFormatEnabled: params.get('w3c') === '1'
			}
		};
		
		console.log('URL settings restored:', settings);
		return settings;
	}

	updateURL(settings) {
		clearTimeout(this.debounceTimeout);
		this.debounceTimeout = setTimeout(() => {
			const params = new URLSearchParams();
			
			// Basic settings (only if different from defaults)
			if (settings.seedColor && settings.seedColor !== DEFAULT_SEED_COLOR) params.set('seed', settings.seedColor);
			if (settings.style && settings.style !== DEFAULT_STYLE) params.set('style', settings.style);
			if (settings.colorSpec && settings.colorSpec !== DEFAULT_SPEC) params.set('spec', settings.colorSpec);
			
			// Core colors
			if (settings.customCoreColors && Object.keys(settings.customCoreColors).length > 0) {
				const core = Object.entries(settings.customCoreColors).map(([k, v]) => `${k}:${v}`).join(',');
				params.set('core', core);
			}
			
			// Extended colors
			if (settings.extendedColors?.length > 0) {
				const extended = settings.extendedColors.map(c => `${encodeURIComponent(c.name)}:${c.color}:${c.harmonize ? '1' : '0'}`).join(',');
				params.set('extended', extended);
			}
			
			// Export settings (always)
			const exp = settings.exportSettings;
			params.set('format', exp.namingFormat);
			params.set('collection', exp.collectionName);
			params.set('stateLayers', exp.stateLayersEnabled ? '1' : '0');
			params.set('tonalPalettes', exp.tonalPalettesEnabled ? '1' : '0');  
			params.set('w3c', exp.w3cFormatEnabled ? '1' : '0');
			
			const newUrl = `?${params}`;
			
			// Only update if URL actually changed
			if (newUrl !== this.lastUrl) {
				window.history.replaceState({}, '', newUrl);
				this.lastUrl = newUrl;
			}
		}, 1000); // Увеличили debounce до 1 секунды
	}

	parseCore(param) {
		if (!param) return null;
		const result = {};
		param.split(',').forEach(pair => {
			const [key, value] = pair.split(':');
			if (key && value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
				result[key] = value;
			}
		});
		return Object.keys(result).length > 0 ? result : null;
	}

	parseExtended(param) {
		if (!param) return [];
		return param.split(',').map(pair => {
			// Split only on the last 2 colons to handle encoded names properly
			const parts = pair.split(':');
			if (parts.length < 3) return null;
			
			const harmonize = parts.pop(); // Last part
			const value = parts.pop(); // Second to last part  
			const name = parts.join(':'); // Everything else joined back
			
			return name && value && /^#[0-9A-Fa-f]{6}$/.test(value) 
				? { name: decodeURIComponent(name), color: value, harmonize: harmonize === '1' }
				: null;
		}).filter(Boolean);
	}

	hasSettingsInURL() {
		return window.location.search.length > 0;
	}
}
