import { useColorModeValue } from '@chakra-ui/react';

/**
 * Shared color scheme constants
 */
export const THEME_COLORS = {
  PRIMARY: 'purple',
  ACCENT: 'teal',
} as const;

/**
 * Custom hook for consistent app theme colors
 */
export const useAppTheme = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return {
    colors: {
      primary: THEME_COLORS.PRIMARY,
      accent: THEME_COLORS.ACCENT,
      cardBg,
      borderColor,
      bgColor,
      hoverBg,
    },
  };
};

/**
 * Position-based color schemes for player positions
 */
export const POSITION_COLORS = {
  QB: 'red',
  RB: 'green', 
  WR: 'blue',
  TE: 'purple',
  K: 'orange',
  DST: 'gray',
  FLEX: 'green', // RB/WR/TE eligible, use green
  SUPERFLEX: 'red', // QB eligible, use red  
  BENCH: 'gray',
} as const;

/**
 * Get color scheme for a player position
 */
export const getPositionColorScheme = (position: string): string => {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || POSITION_COLORS.DST;
};