/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#252432',
    background: '#FAF9FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F3EEFF',
    textSecondary: '#777684',
  },
  dark: {
    text: '#F8F6FF',
    background: '#171522',
    backgroundElement: '#211F2D',
    backgroundSelected: '#302B45',
    textSecondary: '#B2AEC2',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Palette = {
  primary: '#7664DF',
  primaryDark: '#5E4DCA',
  secondary: '#C4B5FD',
  lavender: '#F3EEFF',
  background: '#FAF9FF',
  surface: '#FFFFFF',
  border: '#ECEBF2',
  text: '#252432',
  muted: '#777684',
  success: '#65B891',
  warning: '#F3B96B',
  error: '#E98291',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
