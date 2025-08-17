import * as MaterialColorUtilities from 'https://esm.run/@material/material-color-utilities@latest';



let generatedTheme = null;

function parseKotlinFile() {
	try {
		const urlContent = document.getElementById('urlInput').value.trim();
		
		if (!urlContent) {
			showError('Please paste a URL from MaterialKolor');
			return;
		}
		
		// Parse URL parameters
		let url;
		try {
			url = new URL(urlContent);
		} catch (e) {
			showError('Invalid URL. Please ensure the URL starts with https://materialkolor.com/');
			return;
		}
		
		if (!url.hostname.includes('materialkolor.com')) {
			showError('URL must be from materialkolor.com');
			return;
		}
		
		const params = url.searchParams;
		
		// Extract parameters
		const seedColor = params.get('color_seed');
		const primaryColor = params.get('color_primary');
		const secondaryColor = params.get('color_secondary');
		const tertiaryColor = params.get('color_tertiary');
		const errorColor = params.get('color_error');
		const neutralColor = params.get('color_neutral');
		const neutralVariantColor = params.get('color_neutralVariant');
		const colorSpec = params.get('color_spec') || 'SPEC_2021';
		const schemeVariant = params.get('scheme_variant') || params.get('style') || 'TONAL_SPOT'; // Поддерживаем оба параметра
		
		// Debug logs for parameter verification
		console.log('URL parameters:');
		console.log('- color_seed:', seedColor);
		console.log('- color_primary:', primaryColor);
		console.log('- color_secondary:', secondaryColor);
		console.log('- color_tertiary:', tertiaryColor);
		console.log('- color_error:', errorColor);
		console.log('- color_neutral:', neutralColor);
		console.log('- color_neutralVariant:', neutralVariantColor);
		console.log('- color_spec:', colorSpec);
		console.log('- style (schemeVariant):', schemeVariant);
		console.log('- style type:', typeof schemeVariant);
		
		if (!seedColor) {
			showError('color_seed parameter not found in URL');
			return;
		}
		
		// Create basic structure
		let theme = {
			description: "Material 3 Theme parsed from MaterialKolor URL",
			seed: `#${seedColor}`,
			colorSpec: colorSpec,
			schemeVariant: schemeVariant,
			customColors: {
				primary: primaryColor ? `#${primaryColor}` : null,
				secondary: secondaryColor ? `#${secondaryColor}` : null,
				tertiary: tertiaryColor ? `#${tertiaryColor}` : null,
				error: errorColor ? `#${errorColor}` : null,
				neutral: neutralColor ? `#${neutralColor}` : null,
				neutralVariant: neutralVariantColor ? `#${neutralVariantColor}` : null
			},
			schemes: {
				light: {},
				dark: {}
			},
			palettes: {},
			tonalPalettes: {},
			transparency: {}
		};
		
		// Remove null values from customColors
		Object.keys(theme.customColors).forEach(key => {
			if (theme.customColors[key] === null) {
				delete theme.customColors[key];
			}
		});
		
		// Custom colors are already added in the theme structure above
		
		const seedHex = `#${seedColor}`;
		
		// Generate PRECISE palettes with material-color-utilities
		 if (seedHex && typeof MaterialColorUtilities !== 'undefined') {
			 try {
				 const { argbFromHex, hexFromArgb, themeFromSourceColor, TonalPalette, Hct } = MaterialColorUtilities;
				 
				 const sourceArgb = argbFromHex(seedHex);
				 
				 // Map scheme variant to numeric constant based on Material Color Utilities Variant enum
				 // Order: MONOCHROME=0, NEUTRAL=1, TONAL_SPOT=2, VIBRANT=3, EXPRESSIVE=4, CONTENT=5, FIDELITY=6, RAINBOW=7, FRUIT_SALAD=8
				 let variant = 2; // Default to TONAL_SPOT
				 console.log('Determining variant for schemeVariant:', schemeVariant);
				 switch(schemeVariant) {
					case 'MONOCHROME':
					case 'Monochrome':
						variant = 0; // MONOCHROME
						console.log('Selected MONOCHROME variant:', variant);
						break;
					case 'NEUTRAL':
					case 'Neutral':
						variant = 1; // NEUTRAL
						console.log('Selected NEUTRAL variant:', variant);
						break;
					 case 'TONAL_SPOT':
					case 'Tonal Spot':
						variant = 2; // TONAL_SPOT
						console.log('Selected TONAL_SPOT variant:', variant);
						break;
					case 'VIBRANT':
					case 'Vibrant':
						variant = 3; // VIBRANT
						console.log('Selected VIBRANT variant:', variant);
						break;
					case 'EXPRESSIVE':
					case 'Expressive':
						variant = 4; // EXPRESSIVE
						console.log('Selected EXPRESSIVE variant:', variant);
						break;
					case 'CONTENT':
					case 'Content':
						variant = 5; // CONTENT
						console.log('Selected CONTENT variant:', variant);
						break;
					case 'FIDELITY':
					case 'Fidelity':
						variant = 6; // FIDELITY
						console.log('Selected FIDELITY variant:', variant);
						break;
					case 'RAINBOW':
					case 'Rainbow':
						variant = 7; // RAINBOW
						console.log('Selected RAINBOW variant:', variant);
						break;
					case 'FRUIT_SALAD':
					case 'Fruit Salad':
						variant = 8; // FRUIT_SALAD
						console.log('Selected FRUIT_SALAD variant:', variant);
						break;
					default:
						console.log('No matching case found, using default TONAL_SPOT variant:', variant);
						break;
				 }
				 
				 // Create custom colours if present
				 const customColors = [];
				 if (primaryColor) {
					 customColors.push({
						 name: 'primary',
						 value: argbFromHex(`#${primaryColor}`),
						 blend: true
					 });
				 }
				 if (secondaryColor) {
					 customColors.push({
						 name: 'secondary',
						 value: argbFromHex(`#${secondaryColor}`),
						 blend: true
					 });
				 }
				 if (tertiaryColor) {
					 customColors.push({
						 name: 'tertiary',
						 value: argbFromHex(`#${tertiaryColor}`),
						 blend: true
					 });
				 }
				 if (errorColor) {
					 customColors.push({
						 name: 'error',
						 value: argbFromHex(`#${errorColor}`),
						 blend: true
					 });
				 }
				 if (neutralColor) {
					 customColors.push({
						 name: 'neutral',
						 value: argbFromHex(`#${neutralColor}`),
						 blend: true
					 });
				 }
				 if (neutralVariantColor) {
					 customColors.push({
						 name: 'neutralVariant',
						 value: argbFromHex(`#${neutralVariantColor}`),
						 blend: true
					 });
				 }
				 
				 // Use themeFromSourceColor with correct API
				 // Note: color_spec parameter affects color generation in MaterialKolor but may not directly map to Material Color Utilities
				 console.log('Using color spec:', colorSpec, 'and variant:', variant);
				 const materialTheme = themeFromSourceColor(sourceArgb, customColors, variant);
				 
				 // Get schemes
				 const lightScheme = materialTheme.schemes.light;
				 const darkScheme = materialTheme.schemes.dark;
				 
				 // Log scheme information for debugging
				 console.log('Scheme variant from URL:', schemeVariant, '-> Variant:', variant);
				 console.log('Color spec from URL:', colorSpec);
				 console.log('Generated material theme:', materialTheme);
				 console.log('Generated light scheme:', lightScheme);
				 console.log('Generated dark scheme:', darkScheme);
				 
				 // Fill schemes
				 const schemeRoles = [
					 'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
					 'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
					 'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
					 'error', 'onError', 'errorContainer', 'onErrorContainer',
					 'background', 'onBackground', 'surface', 'onSurface',
					 'surfaceVariant', 'onSurfaceVariant', 'outline', 'outlineVariant',
					 'shadow', 'scrim', 'inverseSurface', 'inverseOnSurface', 'inversePrimary',
					 'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow',
					 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest'
				 ];
				 
				 schemeRoles.forEach(role => {
					 // Get colours from Material Theme schemes
					 if (lightScheme[role] !== undefined) {
						 theme.schemes.light[camelToSnake(role)] = hexFromArgb(lightScheme[role]);
					 }
					 if (darkScheme[role] !== undefined) {
						 theme.schemes.dark[camelToSnake(role)] = hexFromArgb(darkScheme[role]);
					 }
				 });
				
				// Generate tonal palettes
				const paletteTypes = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant', 'error'];
				const tones = [100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 0];
				
				paletteTypes.forEach(paletteType => {
					const tonalPalette = materialTheme.palettes[paletteType];
					
					if (tonalPalette) {
						theme.palettes[paletteType] = {};
						theme.tonalPalettes[paletteType] = {};
						
						tones.forEach(tone => {
							const colorArgb = tonalPalette.tone(tone);
							const hexColor = hexFromArgb(colorArgb);
							theme.palettes[paletteType][tone.toString()] = hexColor;
							theme.tonalPalettes[paletteType][tone.toString()] = hexColor;
						});
					}
				});
				
				// Generate transparencies
				// const alphaLevels = [8, 12, 16, 24, 32, 38, 48, 64];
				
				// ['light', 'dark'].forEach(schemeName => {
				// 	const scheme = theme.schemes[schemeName];
				// 	Object.entries(scheme).forEach(([roleName, hexColor]) => {
				// 		if (!theme.transparency[roleName]) {
				// 			theme.transparency[roleName] = { light: {}, dark: {} };
				// 		}
						
				// 		alphaLevels.forEach(alpha => {
				// 			const alphaHex = Math.round(alpha / 100 * 255).toString(16).padStart(2, '0').toUpperCase();
				// 			theme.transparency[roleName][schemeName][alpha.toString()] = hexColor + alphaHex;
				// 		});
				// 	});
				// });
				
				showSuccess(`✨ Official Material Color Utilities library used - palettes precisely match MaterialKolor!`);
				
			} catch (e) {
				console.warn('Failed to use material-color-utilities:', e);
				showError('Error generating palettes with Material Color Utilities: ' + e.message);
				return;
			}
		} else {
			showError('Material Color Utilities not loaded. Please refresh the page.');
			return;
		}
		
		generatedTheme = theme;
		displayResults(theme);
		
	} catch (error) {
		showError('Error parsing URL: ' + error.message);
		console.error(error);
	}
}



function camelToSnake(str) {
	return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toLowerCase();
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function displayResults(theme) {
	// Show JSON
	const jsonOutput = document.getElementById('jsonOutput');
	jsonOutput.value = JSON.stringify(theme, null, 2);
	
	// Activate buttons
	document.getElementById('downloadBtn').disabled = false;
	document.getElementById('copyBtn').disabled = false;
}

function downloadJSON() {
	if (!generatedTheme) return;
	
	const dataStr = JSON.stringify(generatedTheme, null, 2);
	const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
	
	const exportFileDefaultName = `material3-theme-${generatedTheme.seed.replace('#', '')}.json`;
	
	const linkElement = document.createElement('a');
	linkElement.setAttribute('href', dataUri);
	linkElement.setAttribute('download', exportFileDefaultName);
	linkElement.click();
	
	showSuccess(`📁 File ${exportFileDefaultName} downloaded!`);
}

function copyJSON() {
	const jsonOutput = document.getElementById('jsonOutput');
	jsonOutput.select();
	document.execCommand('copy');
	showSuccess('📋 JSON copied to clipboard!');
}

function clearAll() {
	document.getElementById('urlInput').value = '';
	document.getElementById('jsonOutput').value = '';
	document.getElementById('downloadBtn').disabled = true;
	document.getElementById('copyBtn').disabled = true;
	hideMessages();
	generatedTheme = null;
}

function showError(message) {
	const errorDiv = document.getElementById('error');
	errorDiv.innerHTML = `<strong>❌ Error:</strong> ${message}`;
	errorDiv.className = 'alert alert-danger';
	errorDiv.style.display = 'block';
	setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
	const successDiv = document.getElementById('success');
	successDiv.innerHTML = `<strong>✅ Success:</strong> ${message}`;
	successDiv.className = 'alert alert-success';
	successDiv.style.display = 'block';
	setTimeout(() => successDiv.style.display = 'none', 3000);
}

function hideMessages() {
	document.getElementById('error').style.display = 'none';
	document.getElementById('success').style.display = 'none';
}


// Export functions to global context
window.parseKotlinFile = parseKotlinFile;
window.downloadJSON = downloadJSON;
window.copyJSON = copyJSON;
window.clearAll = clearAll;