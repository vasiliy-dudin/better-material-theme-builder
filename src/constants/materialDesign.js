/**
 * Material Design configuration constants
 */

export const STYLE_OPTIONS = [
	{ value: 'TONAL_SPOT', label: 'Tonal Spot' },
	{ value: 'VIBRANT', label: 'Vibrant' },
	{ value: 'EXPRESSIVE', label: 'Expressive' },
	{ value: 'NEUTRAL', label: 'Neutral' },
	{ value: 'MONOCHROME', label: 'Monochrome' },
	{ value: 'FIDELITY', label: 'Fidelity' },
	{ value: 'CONTENT', label: 'Content' },
	{ value: 'RAINBOW', label: 'Rainbow' },
	{ value: 'FRUIT_SALAD', label: 'Fruit Salad' }
];

export const SPEC_OPTIONS = [
	{ value: 'SPEC_2021', label: 'Spec 2021' },
	{ value: 'SPEC_2025', label: 'Spec 2025' }
];

export const CORE_COLOR_TYPES = [
	{ key: 'primary', label: 'Primary', defaultColor: '#6750A4' },
	{ key: 'secondary', label: 'Secondary', defaultColor: '#625B71' },
	{ key: 'tertiary', label: 'Tertiary', defaultColor: '#7D5260' },
	{ key: 'error', label: 'Error', defaultColor: '#BA1A1A' },
	{ key: 'neutral', label: 'Neutral', defaultColor: '#67616F' },
	{ key: 'neutralVariant', label: 'Neutral Variant', defaultColor: '#68616A' }
];

export const DEFAULT_SEED_COLOR = '#6750A4';
export const DEFAULT_STYLE = 'TONAL_SPOT';
export const DEFAULT_SPEC = 'SPEC_2025';
export const DEFAULT_PRESERVE_HUE = false;

export const STATE_LAYER_OPACITIES = {
	hover: 0.08,
	focus: 0.12,
	pressed: 0.12,
	dragged: 0.16,
	disabled: 0.12
};

export const TONAL_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];

export const VALID_COLOR_ROLES = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];
