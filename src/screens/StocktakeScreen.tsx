import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { getProducts, getSkus } from '../services/queries';
import { stocktakeProduct } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function StocktakeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentUser, refresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [note, setNote] = useState('日常盘点');

  const selectProduct = useCallback((next: Product) => {
    const rows = getSkus(next.id);
    setProduct(next); setSkus(rows);
    setValues(Object.fromEntries(rows.map((sku) => [sku.id, String(sku.quantity)])));
  }, []);
  useFocusEffect(useCallback(() => {
    const rows = getProducts(); setProducts(rows);
    const selected = rows.find((item) => item.id === route.params?.productId) ?? rows[0];
    if (selected) selectProduct(selected);
  }, [route.params?.productId, selectProduct]));

  const submit = () => {
    if (!currentUser || !product) return;
    try {
      const changed = stocktakeProduct(
        product.id,
        Object.fromEntries(skus.map((sku) => [sku.id, Number(values[sku.id])])),
        note,
        currentUser,
      );
      refresh();
      Alert.alert('盘点完成', changed ? `已修正 ${changed} 个 SKU` : '实际库存与系统库存一致', [
        { text: '查看商品', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) },
      ]);
    } catch (error) {
      Alert.alert('盘点失败', error instanceof Error ? error.message : '请检查实际库存');
    }
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>盘点库存</Text>
      <Text style={screenStyles.sectionTitle}>选择商品</Text>
      <ProductPicker products={products} selectedId={product?.id ?? null} onSelect={selectProduct} />
      {skus.map((sku) => {
        const actual = Number(values[sku.id] ?? sku.quantity);
        const difference = actual - sku.quantity;
        return (
          <Card key={sku.id}>
            <View style={screenStyles.row}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{sku.color} / {sku.size}</Text>
              <Text style={screenStyles.muted}>系统库存 {sku.quantity}</Text>
            </View>
            <Field label="实际库存" keyboardType="number-pad" value={values[sku.id]} onChangeText={(text) => setValues((old) => ({ ...old, [sku.id]: text }))} />
            <Text style={{ color: difference === 0 ? colors.success : colors.warning, fontWeight: '800', marginTop: 8 }}>差异：{difference > 0 ? '+' : ''}{difference}</Text>
          </Card>
        );
      })}
      <Card>
        <Field label="盘点备注" value={note} onChangeText={setNote} />
        <PrimaryButton title="提交盘点差异" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
