import { ActivityIndicator, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.subtle} style={[styles.input, error ? styles.inputError : null]} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, disabled, loading }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; loading?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.85} disabled={disabled || loading} style={[styles.button, (disabled || loading) && styles.disabled]} onPress={onPress}>
      {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name={icon ?? 'checkmark'} size={18} color="#fff" /><Text style={styles.buttonText}>{title}</Text></>}
    </TouchableOpacity>
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.ghost} onPress={onPress}>
      <Text style={styles.ghostText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13,
  },
  field: {
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    minHeight: 46,
    paddingVertical: 11,
    color: colors.text,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  hint: { color: colors.muted, fontSize: 12, marginTop: 5 },
  error: { color: colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
  ghost: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ghostText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
