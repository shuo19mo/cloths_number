import { Platform } from 'react-native';

export const colors = {
  background: '#F6F7F6',
  card: '#FFFFFF',
  primary: '#1F5A45',
  primaryPressed: '#174735',
  primarySoft: '#EAF3EF',
  text: '#171A18',
  muted: '#69716D',
  subtle: '#919995',
  border: '#E4E8E5',
  borderStrong: '#D5DBD7',
  success: '#238457',
  successSoft: '#E8F5EE',
  warning: '#C97819',
  warningSoft: '#FFF2DF',
  danger: '#C53B35',
  dangerSoft: '#FCEAE8',
  slate: '#3F4743',
  ink: '#101311',
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 8,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
};

export const typography = {
  pageTitle: { fontSize: 27, lineHeight: 34, fontWeight: '800' as const },
  sectionTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
  metric: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const },
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#17201B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  android: {
    elevation: 1,
  },
  default: {},
});
