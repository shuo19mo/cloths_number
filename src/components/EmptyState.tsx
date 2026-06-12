import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function EmptyState({ title, description, icon = 'cube-outline' }: { title: string; description?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.empty}><Ionicons name={icon} size={28} color={colors.subtle} /><Text style={styles.title}>{title}</Text>{description ? <Text style={styles.description}>{description}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: spacing.xl },
  title: { color: colors.text, fontWeight: '800', marginTop: 10 },
  description: { color: colors.muted, textAlign: 'center', marginTop: 5, lineHeight: 19 },
});
