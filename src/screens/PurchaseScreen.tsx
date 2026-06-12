import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomActionBar, BottomSubmit } from '../components/BottomActionBar';
import { Field } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { QuantityStepper } from '../components/QuantityStepper';
import { getProducts, getSkus } from '../services/queries';
import { createPurchaseOrder } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku } from '../models';
import { colors, radii, spacing } from '../theme';
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
    const rows = getProducts(); setProducts(rows);
    const selected = rows.find((item) => item.id === route.params?.productId) ?? rows[0];
    if (selected) selectProduct(selected);
  }, [route.params?.productId, selectProduct]));

  const selectedCount = skus.filter((sku) => Number(quantities[sku.id]) > 0).length;
  const total = skus.reduce((sum, sku) => sum + (Number(quantities[sku.id]) || 0) * (Number(costs[sku.id]) || 0), 0) + (Number(shipping) || 0);
  const submit = () => {
    if (!currentUser || !product) return;
    try {
      const orderNo = createPurchaseOrder({ productId: product.id, items: skus.map((sku) => ({ skuId: sku.id, quantity: Number(quantities[sku.id]) || 0, unitCost: Number(costs[sku.id]) || 0 })), supplier, shippingFee: Number(shipping) || 0, note }, currentUser);
      refresh();
      Alert.alert('进货完成', `单据 ${orderNo} 已保存`, [{ text: '查看商品', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) }]);
    } catch (error) { Alert.alert('无法提交', error instanceof Error ? error.message : '请检查进货明细'); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={screenStyles.screen} contentContainerStyle={[screenStyles.content, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled">
        <StepHeader step="01" title="选择商品" subtitle="搜索并选择本次需要进货的商品" />
        <ProductPicker products={products} selectedId={product?.id ?? null} onSelect={selectProduct} />
        <StepHeader step="02" title="填写进货明细" subtitle="只需填写本批有进货的颜色和尺码" />
        <View style={styles.skuList}>{skus.map((sku) => <SkuPurchaseRow key={sku.id} sku={sku} quantity={quantities[sku.id] ?? '0'} cost={costs[sku.id] ?? ''} onQuantity={(value) => setQuantities((old) => ({ ...old, [sku.id]: value }))} onCost={(value) => setCosts((old) => ({ ...old, [sku.id]: value }))} />)}</View>
        <StepHeader step="03" title="批次信息" subtitle="供应商、运费和备注会保存在进货单中" />
        <View style={styles.formSection}><Field label="供应商" value={supplier} onChangeText={setSupplier} placeholder="可选" /><View style={styles.twoColumns}><View style={{ flex: 1 }}><Field label="运费" keyboardType="decimal-pad" value={shipping} onChangeText={setShipping} /></View><View style={{ flex: 1 }}><Field label="本批 SKU" value={`${selectedCount} 个`} editable={false} /></View></View><Field label="备注" value={note} onChangeText={setNote} /></View>
      </ScrollView>
      <BottomActionBar><BottomSubmit label="提交进货单" summary={`${selectedCount} 个 SKU · ¥${total.toFixed(2)}`} icon="archive-outline" onPress={submit} /></BottomActionBar>
    </KeyboardAvoidingView>
  );
}

function StepHeader({ step, title, subtitle }: { step: string; title: string; subtitle: string }) { return <View style={styles.stepHeader}><Text style={styles.step}>{step}</Text><View><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepSubtitle}>{subtitle}</Text></View></View>; }
function SkuPurchaseRow({ sku, quantity, cost, onQuantity, onCost }: { sku: Sku; quantity: string; cost: string; onQuantity: (value: string) => void; onCost: (value: string) => void }) { const active = Number(quantity) > 0; return <View style={[styles.skuRow, active && styles.skuActive]}><View style={styles.skuTop}><View><Text style={styles.skuName}>{sku.color} / {sku.size}</Text><Text style={styles.skuStock}>现有库存 {sku.quantity} 件</Text></View>{active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}</View><View style={styles.skuControls}><View><Text style={styles.controlLabel}>进货数量</Text><QuantityStepper value={quantity} onChange={onQuantity} /></View><View style={{ flex: 1 }}><Text style={styles.controlLabel}>本批进价</Text><View style={styles.moneyInput}><Text style={styles.currency}>¥</Text><TextInput value={cost} onChangeText={onCost} keyboardType="decimal-pad" style={styles.costInput} /></View></View></View></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12, marginTop: 3 },
  step: { width: 34, color: colors.primary, fontSize: 13, fontWeight: '800' },
  stepTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  stepSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  skuList: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.xl },
  skuRow: { backgroundColor: colors.card, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  skuActive: { backgroundColor: '#FBFDFC', borderLeftWidth: 3, borderLeftColor: colors.primary },
  skuTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skuName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  skuStock: { color: colors.muted, fontSize: 11, marginTop: 3 },
  skuControls: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 11 },
  controlLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 5 },
  moneyInput: { height: 42, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  currency: { color: colors.muted, fontWeight: '700' },
  costInput: { flex: 1, color: colors.text, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 0 },
  formSection: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  twoColumns: { flexDirection: 'row', gap: 10 },
});
