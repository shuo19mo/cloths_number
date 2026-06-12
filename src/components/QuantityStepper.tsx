import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii } from '../theme';

export function QuantityStepper({ value, onChange, min = 0, max }: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}) {
  const numeric = Number(value) || 0;
  const set = (next: number) => onChange(String(Math.max(min, max == null ? next : Math.min(max, next))));
  return (
    <View style={styles.wrap}>
      <TouchableOpacity accessibilityLabel="减少数量" style={styles.control} onPress={() => set(numeric - 1)}><Ionicons name="remove" size={18} color={colors.text} /></TouchableOpacity>
      <TextInput value={value} onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" selectTextOnFocus style={styles.input} />
      <TouchableOpacity accessibilityLabel="增加数量" style={styles.control} onPress={() => set(numeric + 1)}><Ionicons name="add" size={18} color={colors.text} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 42, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  control: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  input: { width: 52, textAlign: 'center', color: colors.text, fontSize: 15, fontWeight: '800', paddingVertical: 0 },
});
