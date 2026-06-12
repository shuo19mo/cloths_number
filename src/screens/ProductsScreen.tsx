import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { FilterSheet } from '../components/FilterSheet';
import { IconButton } from '../components/IconButton';
import { ProductRow } from '../components/ProductRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCategories, getProducts } from '../services/queries';
import type { Category, Product, ProductSort, StockStatus } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

const SORTS: Array<[ProductSort, string]> = [
  ['UPDATED', '最近修改'], ['STOCK_DESC', '库存从高到低'], ['STOCK_ASC', '库存从低到高'],
  ['PRICE_DESC', '售价从高到低'], ['COST_DESC', '进价从高到低'],
];

export function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<StockStatus | null>(null);
  const [sort, setSort] = useState<ProductSort>('UPDATED');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(() => {
    setCategories(getCategories());
    setProducts(getProducts({ search, categoryId, status, sort }));
    setAllProducts(getProducts());
  }, [search, categoryId, status, sort]);
  useFocusEffect(load);

  const totalStock = allProducts.reduce((sum, product) => sum + product.totalStock, 0);
  const activeFilters = Number(Boolean(status)) + Number(sort !== 'UPDATED');

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="商品" subtitle={`${allProducts.length} 款商品 · ${totalStock} 件库存`} action="新增" onAction={() => navigation.navigate('ProductForm')} />

      <View style={styles.summary}>
        <SummaryItem label="商品" value={`${allProducts.length}`} />
        <SummaryItem label="库存" value={`${totalStock}`} />
        <SummaryItem label="低库存" value={`${allProducts.filter((p) => p.status === 'LOW').length}`} tone={colors.warning} />
        <SummaryItem label="缺货" value={`${allProducts.filter((p) => p.status === 'OUT').length}`} tone={colors.danger} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}><Ionicons name="search" size={19} color={colors.subtle} /><TextInput value={search} onChangeText={setSearch} placeholder="名称、编号、颜色、尺码、供应商" placeholderTextColor={colors.subtle} style={styles.searchInput} /></View>
        <View><IconButton icon="options-outline" accessibilityLabel="筛选和排序" selected={activeFilters > 0} onPress={() => setFiltersOpen(true)} />{activeFilters > 0 ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilters}</Text></View> : null}</View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
        <Chip label="全部" selected={!categoryId} onPress={() => setCategoryId(null)} />
        {categories.map((category) => <Chip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />)}
      </ScrollView>

      <View style={styles.resultHeader}><Text style={styles.resultText}>{products.length} 款商品</Text><Text style={styles.sortText}>{SORTS.find(([value]) => value === sort)?.[1]}</Text></View>
      <View style={styles.list}>
        {products.length === 0 ? <EmptyState title="没有找到商品" description="试试更换关键词或清除筛选条件" icon="search-outline" /> : products.map((product) => <ProductRow key={product.id} product={product} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} />)}
      </View>

      <FilterSheet visible={filtersOpen} title="筛选与排序" onClose={() => setFiltersOpen(false)}>
        <Text style={styles.filterLabel}>库存状态</Text>
        <View style={styles.wrap}><Chip label="全部" selected={!status} onPress={() => setStatus(null)} /><Chip label="正常" selected={status === 'NORMAL'} onPress={() => setStatus('NORMAL')} /><Chip label="低库存" selected={status === 'LOW'} onPress={() => setStatus('LOW')} /><Chip label="缺货" selected={status === 'OUT'} onPress={() => setStatus('OUT')} /></View>
        <Text style={styles.filterLabel}>排序方式</Text>
        <View style={styles.sortList}>{SORTS.map(([value, label]) => <TouchableOpacity key={value} onPress={() => setSort(value)} style={styles.sortRow}><Ionicons name={sort === value ? 'radio-button-on' : 'radio-button-off'} size={20} color={sort === value ? colors.primary : colors.subtle} /><Text style={[styles.sortLabel, sort === value && { color: colors.primary, fontWeight: '800' }]}>{label}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity onPress={() => { setStatus(null); setSort('UPDATED'); setFiltersOpen(false); }} style={styles.clearButton}><Text style={styles.clearText}>清除筛选</Text></TouchableOpacity>
      </FilterSheet>
    </ScrollView>
  );
}

function SummaryItem({ label, value, tone = colors.text }: { label: string; value: string; tone?: string }) {
  return <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: tone }]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  summary: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, marginBottom: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  summaryValue: { fontSize: 18, lineHeight: 23, fontWeight: '800' },
  summaryLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  searchBox: { flex: 1, height: 42, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  filterCount: { position: 'absolute', right: -3, top: -4, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  filterCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  categoryRail: { paddingBottom: spacing.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 7 },
  resultText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  sortText: { color: colors.muted, fontSize: 12 },
  list: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: spacing.md, overflow: 'hidden' },
  filterLabel: { color: colors.text, fontWeight: '800', marginTop: 4, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: spacing.lg },
  sortList: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  sortRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  sortLabel: { color: colors.text, fontSize: 14 },
  clearButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  clearText: { color: colors.danger, fontWeight: '800' },
});
