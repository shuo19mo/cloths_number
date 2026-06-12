import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Field, PrimaryButton } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { getProducts, getSkus } from '../services/queries';
import { adjustStock } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku, StockAction } from '../models';
import { screenStyles } from './shared';

export function AdjustScreen() {
  const route = useRoute<any>();
  const { currentUser, refresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [selected, setSelected] = useState<number | null>(route.params?.skuId ?? null);
  const [target, setTarget] = useState('0');
  const [action, setAction] = useState<StockAction>('MANUAL');
  const [note, setNote] = useState('手动调整库存');

  const selectProduct = useCallback((next: Product, preferredSku?: number) => {
    const rows = getSkus(next.id); setProduct(next); setSkus(rows);
    const sku = rows.find((item) => item.id === preferredSku) ?? rows[0];
    setSelected(sku?.id ?? null); setTarget(String(sku?.quantity ?? 0));
  }, []);
  useFocusEffect(useCallback(() => {
    const rows = getProducts(); setProducts(rows);
    const allSkus = getSkus();
    const preferred = allSkus.find((sku) => sku.id === route.params?.skuId);
    const next = rows.find((item) => item.id === preferred?.productId) ?? rows[0];
    if (next) selectProduct(next, preferred?.id);
  }, [route.params?.skuId, selectProduct]));

  const chooseSku = (sku: Sku) => { setSelected(sku.id); setTarget(String(sku.quantity)); };
  const submit = () => {
    if (!currentUser || !selected) return;
    try {
      adjustStock(selected, action, Number(target), note, currentUser); refresh();
      Alert.alert('库存已调整', '已生成库存流水和操作日志。');
    } catch (error) { Alert.alert('调整失败', error instanceof Error ? error.message : '请检查库存'); }
  };
  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>库存调整</Text>
      <ProductPicker products={products} selectedId={product?.id ?? null} onSelect={(item) => selectProduct(item)} />
      <Card>
        <Text style={screenStyles.sectionTitle}>选择颜色/尺码</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {skus.map((sku) => <Chip key={sku.id} label={`${sku.color}/${sku.size} · ${sku.quantity}`} selected={selected === sku.id} onPress={() => chooseSku(sku)} />)}
        </ScrollView>
        <Text style={screenStyles.sectionTitle}>调整类型</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="手动调整" selected={action === 'MANUAL'} onPress={() => setAction('MANUAL')} />
          <Chip label="退货入库" selected={action === 'RETURN'} onPress={() => setAction('RETURN')} />
          <Chip label="损耗出库" selected={action === 'LOSS'} onPress={() => setAction('LOSS')} />
        </ScrollView>
        <Field label="调整后库存" keyboardType="number-pad" value={target} onChangeText={setTarget} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <PrimaryButton title="提交调整" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
