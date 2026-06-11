import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import type { StockStatus } from '../models';

const STATUS = {
  NORMAL: ['正常', colors.success, colors.successSoft],
  LOW: ['低库存', colors.warning, colors.warningSoft],
  OUT: ['缺货', colors.danger, colors.dangerSoft],
  SLOW: ['滞销', colors.slate, colors.primarySoft],
} as const;

export function StatusBadge({ status }: { status: StockStatus }) {
  const [label, color, backgroundColor] = STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
