import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Product } from '../models';
import { colors, radii, spacing } from '../theme';

export function ProductPicker({ products, selectedId, onSelect }: {
  products: Product[]; selectedId: number | null; onSelect: (product: Product) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
      {products.map((product) => {
        const selected = selectedId === product.id;
        return (
          <TouchableOpacity
            key={product.id}
            onPress={() => onSelect(product)}
            style={{
              width: 170, padding: 12, marginRight: 10, borderRadius: radii.md,
              backgroundColor: selected ? colors.primary : colors.card,
              borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Text numberOfLines={1} style={{ color: selected ? '#fff' : colors.text, fontWeight: '900' }}>{product.name}</Text>
            <Text style={{ color: selected ? '#DCE8F7' : colors.muted, marginTop: 4 }}>{product.categoryName} · {product.totalStock} 件</Text>
            <View style={{ marginTop: 6 }}><Text style={{ color: selected ? '#fff' : colors.primary, fontSize: 12 }}>{product.code}</Text></View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
