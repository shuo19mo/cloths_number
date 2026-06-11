import { Platform } from 'react-native';

export const colors = {
  background: '#F7F9FC',
  card: '#FFFFFF',
  primary: '#12325A',
  primarySoft: '#EAF1FA',
  text: '#172033',
  muted: '#667085',
  border: '#E7ECF3',
  success: '#1F8A4C',
  successSoft: '#E8F6EE',
  warning: '#F59E0B',
  warningSoft: '#FFF7E6',
  danger: '#D92D20',
  dangerSoft: '#FDECEC',
  slate: '#2F3A4C',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  android: {
    elevation: 2,
  },
  default: {},
});
