import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Product } from '../models';
import { colors, radii, spacing } from '../theme';

export function ProductPicker({ products, selectedId, onSelect }: {
  products: Product[]; selectedId: number | null; onSelect: (product: Product) => void;
}) {
  const [search, setSearch] = useState('');
  const visible = useMemo(() => products.filter((product) => `${product.name} ${product.code} ${product.categoryName}`.toLowerCase().includes(search.trim().toLowerCase())), [products, search]);
  return (
    <View style={styles.wrap}>
      <View style={styles.search}><Ionicons name="search" size={18} color={colors.subtle} /><TextInput value={search} onChangeText={setSearch} placeholder="搜索商品" placeholderTextColor={colors.subtle} style={styles.input} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg }}>
        {visible.map((product) => {
          const selected = selectedId === product.id;
          return (
            <TouchableOpacity key={product.id} onPress={() => onSelect(product)} activeOpacity={0.76} style={[styles.item, selected && styles.selected]}>
              {product.mainImageUri ? <Image source={{ uri: product.mainImageUri }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="shirt-outline" size={19} color={selected ? '#fff' : colors.primary} /></View>}
              <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.name, selected && styles.selectedText]}>{product.name}</Text><Text numberOfLines={1} style={[styles.meta, selected && styles.selectedMeta]}>{product.categoryName} · {product.totalStock} 件</Text></View>
              {selected ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  search: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginBottom: 10 },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  item: { width: 210, minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, marginRight: 9, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  image: { width: 45, height: 48, borderRadius: 6 },
  placeholder: { width: 45, height: 48, borderRadius: 6, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '800', fontSize: 13 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  selectedText: { color: '#fff' },
  selectedMeta: { color: '#DCE9E3' },
});
