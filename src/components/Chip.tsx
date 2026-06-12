import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radii } from '../theme';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        ...styles.chip,
        backgroundColor: selected ? colors.primarySoft : colors.card,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: selected ? colors.primary : colors.muted, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: radii.sm,
    marginRight: 8,
    borderWidth: 1,
  },
});
