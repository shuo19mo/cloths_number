import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'primary' | 'warning' | 'danger' }) {
  const valueColor = tone === 'primary' ? colors.primary : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    ...typography.metric,
  },
});
