import { useColorScheme } from 'react-native';
import { useThemeColors } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors(isDark);

  return {
    isDark,
    colors,
    colorScheme,
  };
}
