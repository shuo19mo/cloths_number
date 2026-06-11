import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { getProducts } from '../services/queries';
import { money } from '../services/format';
import type { Product } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

export function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(() => setProducts(getProducts(search)), [search]);
  useFocusEffect(load);

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <View style={screenStyles.row}>
        <Text style={screenStyles.title}>商品</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>新增</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setProducts(getProducts(text));
        }}
        placeholder="搜索名称、编号、颜色、尺码、分类、供应商"
        style={{ backgroundColor: '#fff', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: spacing.md }}
      />
      {products.map((product) => (
        <TouchableOpacity key={product.id} activeOpacity={0.86} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {product.mainImageUri ? (
                <Image source={{ uri: product.mainImageUri }} style={{ width: 82, height: 82, borderRadius: radii.md }} />
              ) : (
                <View style={{ width: 82, height: 82, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: '900' }}>衣</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={screenStyles.row}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, flex: 1 }}>{product.name}</Text>
                  <StatusBadge status={product.status} />
                </View>
                <Text style={screenStyles.muted}>{product.code}</Text>
                <Text style={{ marginTop: 8, color: colors.text }}>库存 {product.totalStock} · 进价 {money(product.defaultCost)} · 售价 {money(product.defaultPrice)}</Text>
                <Text style={screenStyles.muted}>成本 {money(product.stockCost)} · 预计售价 {money(product.stockRetail)}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
