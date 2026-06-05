export const THEME_PRESETS = {
  aurora: {
	label: 'Aurora',
	description: 'Cyan / violet glass with soft magenta highlights',
	background:
	  'radial-gradient(circle at top left, rgba(0,240,255,0.09), transparent 32%), radial-gradient(circle at 82% 18%, rgba(123,45,255,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(255,0,160,0.08), transparent 28%), linear-gradient(180deg, #050816 0%, #070b16 100%)',
  },
  midnight: {
	label: 'Midnight',
	description: 'Cool blue-black workspace with restrained contrast',
	background:
	  'radial-gradient(circle at 20% 15%, rgba(51,102,255,0.08), transparent 30%), radial-gradient(circle at 75% 15%, rgba(0,240,255,0.06), transparent 26%), linear-gradient(180deg, #040712 0%, #070c18 100%)',
  },
  graphite: {
	label: 'Graphite',
	description: 'Minimal dark surface with neutral technical feel',
	background:
	  'radial-gradient(circle at 15% 12%, rgba(255,255,255,0.05), transparent 30%), radial-gradient(circle at 85% 8%, rgba(255,255,255,0.03), transparent 24%), linear-gradient(180deg, #090b12 0%, #0d1117 100%)',
  },
  sage: {
	label: 'Sage',
	description: 'Soft green-blue ambience for longer sessions',
	background:
	  'radial-gradient(circle at 20% 12%, rgba(43,201,155,0.08), transparent 30%), radial-gradient(circle at 82% 14%, rgba(52,152,219,0.08), transparent 26%), linear-gradient(180deg, #07110f 0%, #0a1513 100%)',
  },
}

export const THEME_ORDER = ['aurora', 'midnight', 'graphite', 'sage']

export const getThemePreset = (theme) => THEME_PRESETS[theme] || THEME_PRESETS.aurora

