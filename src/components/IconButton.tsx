import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

export function IconButton({ icon, onPress, selected, accessibilityLabel, style }: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  selected?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.72}
      onPress={onPress}
      style={[styles.button, selected && styles.selected, style]}
    >
      <Ionicons name={icon} size={21} color={selected ? '#fff' : colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
