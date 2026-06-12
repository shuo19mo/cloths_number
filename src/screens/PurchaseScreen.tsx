import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { getProducts, getSkus } from '../services/queries';
import { createPurchaseOrder } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function PurchaseScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentUser, refresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [supplier, setSupplier] = useState('');
  const [shipping, setShipping] = useState('0');
  const [note, setNote] = useState('进货入库');

  const selectProduct = useCallback((next: Product) => {
    const rows = getSkus(next.id);
    setProduct(next); setSkus(rows); setSupplier(next.supplier ?? '');
    setQuantities(Object.fromEntries(rows.map((sku) => [sku.id, '0'])));
    setCosts(Object.fromEntries(rows.map((sku) => [sku.id, String(next.lastPurchaseCost || next.defaultCost)])));
  }, []);

  useFocusEffect(useCallback(() => {
    const rows = getProducts();
    setProducts(rows);
    const selected = rows.find((item) => item.id === route.params?.productId) ?? rows[0];
    if (selected) selectProduct(selected);
  }, [route.params?.productId, selectProduct]));

  const submit = () => {
    if (!currentUser || !product) return;
    try {
      const orderNo = createPurchaseOrder({
        productId: product.id,
        items: skus.map((sku) => ({ skuId: sku.id, quantity: Number(quantities[sku.id]) || 0, unitCost: Number(costs[sku.id]) || 0 })),
        supplier, shippingFee: Number(shipping) || 0, note,
      }, currentUser);
      refresh();
      Alert.alert('进货完成', `单据 ${orderNo} 已保存`, [{ text: '查看商品', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) }]);
    } catch (error) {
      Alert.alert('无法提交', error instanceof Error ? error.message : '请检查进货明细');
    }
  };

  const selectedCount = skus.filter((sku) => Number(quantities[sku.id]) > 0).length;
  const total = skus.reduce((sum, sku) => sum + (Number(quantities[sku.id]) || 0) * (Number(costs[sku.id]) || 0), 0) + (Number(shipping) || 0);
  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>进货入库</Text>
      <Text style={screenStyles.sectionTitle}>1. 选择商品</Text>
      <ProductPicker products={products} selectedId={product?.id ?? null} onSelect={selectProduct} />
      <Text style={screenStyles.sectionTitle}>2. 填写颜色/尺码明细</Text>
      {skus.map((sku) => (
        <Card key={sku.id}>
          <View style={screenStyles.row}>
            <Text style={{ color: colors.text, fontWeight: '900' }}>{sku.color} / {sku.size}</Text>
            <Text style={screenStyles.muted}>现有 {sku.quantity} 件</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="进货数量" keyboardType="number-pad" value={quantities[sku.id] ?? '0'} onChangeText={(text) => setQuantities((old) => ({ ...old, [sku.id]: text }))} /></View>
            <View style={{ flex: 1 }}><Field label="本批进价" keyboardType="decimal-pad" value={costs[sku.id] ?? ''} onChangeText={(text) => setCosts((old) => ({ ...old, [sku.id]: text }))} /></View>
          </View>
        </Card>
      ))}
      <Card>
        <Text style={screenStyles.sectionTitle}>3. 批次信息</Text>
        <Field label="供应商" value={supplier} onChangeText={setSupplier} />
        <Field label="运费" keyboardType="decimal-pad" value={shipping} onChangeText={setShipping} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <Text style={{ color: colors.primary, fontWeight: '900', marginTop: 14 }}>已选 {selectedCount} 个 SKU · 预计总成本 ¥{total.toFixed(2)}</Text>
        <PrimaryButton title="提交整张进货单" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
