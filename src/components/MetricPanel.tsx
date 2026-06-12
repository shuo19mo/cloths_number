import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export function MetricPanel({ label, value, icon, tone = 'default' }: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'primary' | 'warning' | 'danger';
}) {
  const color = tone === 'primary' ? colors.primary : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={styles.panel}>
      <View style={styles.labelRow}>
        {icon ? <Ionicons name={icon} size={15} color={color} /> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { width: '48.5%', minHeight: 104, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: colors.muted, ...typography.label },
  value: { marginTop: 13, ...typography.metric },
});
