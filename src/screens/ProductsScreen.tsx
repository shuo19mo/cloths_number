import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { getCategories, getProducts } from '../services/queries';
import { money } from '../services/format';
import type { Category, Product, ProductSort, StockStatus } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

const SORTS: Array<[ProductSort, string]> = [
  ['UPDATED', '最近修改'], ['STOCK_DESC', '库存高'], ['STOCK_ASC', '库存低'],
  ['PRICE_DESC', '售价高'], ['COST_DESC', '进价高'],
];

export function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<StockStatus | null>(null);
  const [sort, setSort] = useState<ProductSort>('UPDATED');
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(() => {
    setCategories(getCategories());
    setProducts(getProducts({ search, categoryId, status, sort }));
  }, [search, categoryId, status, sort]);
  useFocusEffect(load);

  const allProducts = getProducts();
  const totalStock = allProducts.reduce((sum, product) => sum + product.totalStock, 0);

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <View style={screenStyles.row}>
        <Text style={screenStyles.title}>商品总览</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}><Text style={{ color: colors.primary, fontWeight: '900' }}>＋ 新增</Text></TouchableOpacity>
      </View>
      <View style={screenStyles.grid}>
        <MetricCard label="商品数量" value={`${allProducts.length} 款`} />
        <MetricCard label="总库存" value={`${totalStock} 件`} />
        <MetricCard label="低库存" value={`${allProducts.filter((p) => p.status === 'LOW').length} 款`} />
        <MetricCard label="缺货" value={`${allProducts.filter((p) => p.status === 'OUT').length} 款`} />
      </View>
      <TextInput
        value={search}
        onChangeText={(text) => { setSearch(text); setProducts(getProducts({ search: text, categoryId, status, sort })); }}
        placeholder="搜索名称、编号、颜色、尺码、类别、供应商"
        style={{ backgroundColor: '#fff', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: spacing.md }}
      />
      <Text style={screenStyles.sectionTitle}>类别</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label="全部" selected={!categoryId} onPress={() => setCategoryId(null)} />
        {categories.map((category) => <Chip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />)}
      </ScrollView>
      <Text style={screenStyles.sectionTitle}>库存状态</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label="全部" selected={!status} onPress={() => setStatus(null)} />
        <Chip label="正常" selected={status === 'NORMAL'} onPress={() => setStatus('NORMAL')} />
        <Chip label="低库存" selected={status === 'LOW'} onPress={() => setStatus('LOW')} />
        <Chip label="缺货" selected={status === 'OUT'} onPress={() => setStatus('OUT')} />
      </ScrollView>
      <Text style={screenStyles.sectionTitle}>排序</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {SORTS.map(([value, label]) => <Chip key={value} label={label} selected={sort === value} onPress={() => setSort(value)} />)}
      </ScrollView>
      <Text style={[screenStyles.muted, { marginBottom: 10 }]}>找到 {products.length} 款商品</Text>
      {products.map((product) => (
        <TouchableOpacity key={product.id} activeOpacity={0.86} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {product.mainImageUri ? <Image source={{ uri: product.mainImageUri }} style={{ width: 82, height: 82, borderRadius: radii.md }} /> : (
                <View style={{ width: 82, height: 82, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: '900' }}>{product.categoryName.slice(0, 1)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={screenStyles.row}><Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, flex: 1 }}>{product.name}</Text><StatusBadge status={product.status} /></View>
                <Text style={screenStyles.muted}>{product.categoryName} · {product.code}</Text>
                <Text style={{ marginTop: 8, color: colors.text }}>库存 {product.totalStock} · 均价 {money(product.averageCost)} · 售价 {money(product.defaultPrice)}</Text>
                <Text style={screenStyles.muted}>库存成本 {money(product.stockCost)} · 预计售价 {money(product.stockRetail)}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
