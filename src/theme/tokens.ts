/**
 * Design tokens. The app uses one deliberate, dark, cinematic palette so imagery
 * and text always read well together.
 */
export const colors = {
  ink: '#070B09', // deepest background
  night: '#0B120F', // card base the imagery fades into
  forest: '#13201A', // raised surfaces
  moss: '#1C2C24', // borders / pressed surfaces
  sage: '#A8C3A0', // accent: hashtags, focus
  sageDeep: '#7FA27A',
  gold: '#E3CFA4', // scripture accent
  cream: '#F4EFE6', // primary text
  creamMuted: 'rgba(244, 239, 230, 0.78)',
  creamFaint: 'rgba(244, 239, 230, 0.55)',
  hairline: 'rgba(244, 239, 230, 0.16)',
  glass: 'rgba(11, 18, 15, 0.55)',
  danger: '#E7A08F',
} as const;

export const fonts = {
  // Playfair Display: editorial display serif with a conventional upright "f".
  question: 'PlayfairDisplay_600SemiBold',
  display: 'PlayfairDisplay_500Medium',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  scripture: 'CormorantGaramond_500Medium_Italic',
  scriptureRegular: 'CormorantGaramond_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 24,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Phone viewport used for the centered frame on desktop. */
export const phoneFrame = {
  width: 430,
  maxHeight: 932,
  breakpoint: 768, // below this we go fully immersive
  sidePanels: 1180, // at or above this we show side navigation + context panels
} as const;
