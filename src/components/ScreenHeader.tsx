import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export function ScreenHeader({ title, subtitle, action, onAction, actionIcon = 'add' }: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.75} style={styles.action}>
          <Ionicons name={actionIcon} size={18} color="#fff" />
          <Text style={styles.actionText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.lg },
  copy: { flex: 1 },
  title: { color: colors.text, ...typography.pageTitle },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  action: { minHeight: 42, paddingHorizontal: 13, borderRadius: 6, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, ...typography.sectionTitle },
});
