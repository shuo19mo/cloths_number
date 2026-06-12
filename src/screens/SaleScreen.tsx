import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { getProducts, getSkus } from '../services/queries';
import { createSaleOrder } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function SaleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentUser, refresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [discount, setDiscount] = useState('0');
  const [received, setReceived] = useState('');
  const [note, setNote] = useState('销售出库');

  const selectProduct = useCallback((next: Product) => {
    const rows = getSkus(next.id);
    setProduct(next); setSkus(rows);
    setQuantities(Object.fromEntries(rows.map((sku) => [sku.id, '0'])));
    setPrices(Object.fromEntries(rows.map((sku) => [sku.id, String(next.defaultPrice)])));
    setReceived(''); setDiscount('0');
  }, []);
  useFocusEffect(useCallback(() => {
    const rows = getProducts(); setProducts(rows);
    const selected = rows.find((item) => item.id === route.params?.productId) ?? rows[0];
    if (selected) selectProduct(selected);
  }, [route.params?.productId, selectProduct]));

  const gross = skus.reduce((sum, sku) => sum + (Number(quantities[sku.id]) || 0) * (Number(prices[sku.id]) || 0), 0);
  const suggestedReceived = Math.max(0, gross - (Number(discount) || 0));
  const submit = () => {
    if (!currentUser || !product) return;
    try {
      const orderNo = createSaleOrder({
        productId: product.id,
        items: skus.map((sku) => ({ skuId: sku.id, quantity: Number(quantities[sku.id]) || 0, unitPrice: Number(prices[sku.id]) || 0 })),
        discount: Number(discount) || 0, receivedAmount: received ? Number(received) : suggestedReceived, note,
      }, currentUser);
      refresh();
      Alert.alert('销售完成', `单据 ${orderNo} 已保存`, [{ text: '查看商品', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) }]);
    } catch (error) {
      Alert.alert('无法提交', error instanceof Error ? error.message : '请检查销售明细');
    }
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>销售出库</Text>
      <Text style={screenStyles.sectionTitle}>1. 选择商品</Text>
      <ProductPicker products={products} selectedId={product?.id ?? null} onSelect={selectProduct} />
      <Text style={screenStyles.sectionTitle}>2. 填写销售明细</Text>
      {skus.map((sku) => (
        <Card key={sku.id}>
          <View style={screenStyles.row}>
            <Text style={{ color: colors.text, fontWeight: '900' }}>{sku.color} / {sku.size}</Text>
            <Text style={{ color: sku.quantity === 0 ? colors.danger : colors.muted }}>可售 {sku.quantity} 件</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="销售数量" keyboardType="number-pad" value={quantities[sku.id] ?? '0'} onChangeText={(text) => setQuantities((old) => ({ ...old, [sku.id]: text }))} /></View>
            <View style={{ flex: 1 }}><Field label="单件售价" keyboardType="decimal-pad" value={prices[sku.id] ?? ''} onChangeText={(text) => setPrices((old) => ({ ...old, [sku.id]: text }))} /></View>
          </View>
        </Card>
      ))}
      <Card>
        <Text style={screenStyles.sectionTitle}>3. 收款信息</Text>
        <Field label="整单优惠" keyboardType="decimal-pad" value={discount} onChangeText={setDiscount} />
        <Field label={`实收金额（建议 ¥${suggestedReceived.toFixed(2)}）`} keyboardType="decimal-pad" value={received} onChangeText={setReceived} placeholder={suggestedReceived.toFixed(2)} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <Text style={{ color: colors.primary, fontWeight: '900', marginTop: 14 }}>商品金额 ¥{gross.toFixed(2)} · 应收 ¥{suggestedReceived.toFixed(2)}</Text>
        <PrimaryButton title="提交整张销售单" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
