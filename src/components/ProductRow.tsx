import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Product } from '../models';
import { money } from '../services/format';
import { colors, radii, spacing } from '../theme';
import { StatusBadge } from './StatusBadge';

export function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.row}>
      {product.mainImageUri ? <Image source={{ uri: product.mainImageUri }} style={styles.image} /> : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>{product.categoryName.slice(0, 1)}</Text></View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}><Text numberOfLines={1} style={styles.name}>{product.name}</Text><StatusBadge status={product.status} /></View>
        <Text numberOfLines={1} style={styles.meta}>{product.categoryName} · {product.code}</Text>
        <View style={styles.stockRow}>
          <Text style={styles.stock}>库存 {product.totalStock}</Text>
          <Text style={styles.price}>{money(product.defaultPrice)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.secondary}>成本 {money(product.stockCost)} · 预计销售 {money(product.stockRetail)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  image: { width: 82, height: 90, borderRadius: radii.lg, backgroundColor: colors.background },
  placeholder: { width: 82, height: 90, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 },
  stock: { color: colors.text, fontWeight: '700', fontSize: 13 },
  price: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  secondary: { color: colors.subtle, fontSize: 11, marginTop: 4 },
});
