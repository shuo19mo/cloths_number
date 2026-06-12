import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const screenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 96,
  },
  title: {
    color: colors.text,
    ...typography.pageTitle,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.sectionTitle,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  muted: {
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
