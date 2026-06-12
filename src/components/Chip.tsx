import { Text, TouchableOpacity } from 'react-native';
import { colors, radii } from '../theme';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.sm, marginRight: 8,
        backgroundColor: selected ? colors.primary : colors.card,
        borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}
