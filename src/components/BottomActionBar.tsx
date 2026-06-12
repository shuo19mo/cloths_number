import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export function BottomActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{children}</View>;
}

export function BottomAction({ label, icon, onPress, primary }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={[styles.action, primary && styles.primary]}>
      <Ionicons name={icon} size={19} color={primary ? '#fff' : colors.text} />
      <Text style={[styles.label, primary && styles.primaryLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function BottomSubmit({ label, summary, icon = 'checkmark-circle-outline', onPress }: { label: string; summary?: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <View style={styles.submitWrap}>{summary ? <Text numberOfLines={1} style={styles.summary}>{summary}</Text> : null}<TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.submit}><Ionicons name={icon} size={19} color="#fff" /><Text style={styles.submitText}>{label}</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 68, paddingTop: 10, paddingHorizontal: spacing.md, flexDirection: 'row', gap: 8, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  action: { flex: 1, minHeight: 46, borderRadius: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { color: colors.text, fontWeight: '700', fontSize: 11 },
  primaryLabel: { color: '#fff' },
  submitWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summary: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 13 },
  submit: { minWidth: 150, height: 46, borderRadius: 6, paddingHorizontal: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
