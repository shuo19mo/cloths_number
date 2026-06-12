import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomActionBar, BottomSubmit } from '../components/BottomActionBar';
import { Field } from '../components/Form';
import { ProductPicker } from '../components/ProductPicker';
import { QuantityStepper } from '../components/QuantityStepper';
import { getProducts, getSkus } from '../services/queries';
import { stocktakeProduct } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Product, Sku } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

export function StocktakeScreen() {
  const route = useRoute<any>(); const navigation = useNavigation<any>(); const { currentUser, refresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]); const [product, setProduct] = useState<Product | null>(null); const [skus, setSkus] = useState<Sku[]>([]); const [values, setValues] = useState<Record<number, string>>({}); const [note, setNote] = useState('日常盘点');
  const selectProduct = useCallback((next: Product) => { const rows = getSkus(next.id); setProduct(next); setSkus(rows); setValues(Object.fromEntries(rows.map((sku) => [sku.id, String(sku.quantity)]))); }, []);
  useFocusEffect(useCallback(() => { const rows = getProducts(); setProducts(rows); const selected = rows.find((item) => item.id === route.params?.productId) ?? rows[0]; if (selected) selectProduct(selected); }, [route.params?.productId, selectProduct]));
  const changedCount = skus.filter((sku) => Number(values[sku.id] ?? sku.quantity) !== sku.quantity).length;
  const submit = () => { if (!currentUser || !product) return; try { const changed = stocktakeProduct(product.id, Object.fromEntries(skus.map((sku) => [sku.id, Number(values[sku.id])])), note, currentUser); refresh(); Alert.alert('盘点完成', changed ? `已修正 ${changed} 个 SKU` : '实际库存与系统库存一致', [{ text: '查看商品', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) }]); } catch (error) { Alert.alert('盘点失败', error instanceof Error ? error.message : '请检查实际库存'); } };
  return <View style={styles.root}><ScrollView style={screenStyles.screen} contentContainerStyle={[screenStyles.content, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled"><Text style={styles.introTitle}>选择盘点商品</Text><Text style={styles.intro}>录入实际数量，系统只会修正存在差异的 SKU。</Text><ProductPicker products={products} selectedId={product?.id ?? null} onSelect={selectProduct} /><View style={styles.header}><Text style={styles.headerText}>颜色 / 尺码</Text><Text style={styles.headerText}>系统</Text><Text style={styles.headerText}>实际</Text><Text style={styles.headerText}>差异</Text></View><View style={styles.list}>{skus.map((sku) => { const actual = Number(values[sku.id] ?? sku.quantity); const diff = actual - sku.quantity; return <View key={sku.id} style={[styles.row, diff !== 0 && styles.changed]}><Text style={styles.sku}>{sku.color}{'\n'}<Text style={styles.size}>{sku.size}</Text></Text><Text style={styles.system}>{sku.quantity}</Text><QuantityStepper value={values[sku.id]} onChange={(value) => setValues((old) => ({ ...old, [sku.id]: value }))} /><Text style={[styles.diff, { color: diff === 0 ? colors.muted : diff > 0 ? colors.success : colors.danger }]}>{diff > 0 ? '+' : ''}{diff}</Text></View>; })}</View><View style={styles.note}><Field label="盘点备注" value={note} onChangeText={setNote} /></View></ScrollView><BottomActionBar><BottomSubmit label="提交盘点" summary={changedCount ? `${changedCount} 个 SKU 有差异` : '库存无差异'} icon="clipboard-outline" onPress={submit} /></BottomActionBar></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, introTitle: { color: colors.text, fontSize: 20, fontWeight: '800' }, intro: { color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: spacing.lg }, header: { height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, backgroundColor: colors.background }, headerText: { width: '23%', color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' }, list: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.card }, row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, changed: { backgroundColor: colors.warningSoft }, sku: { width: '23%', color: colors.text, fontWeight: '800', fontSize: 13 }, size: { color: colors.muted, fontSize: 11 }, system: { width: '15%', textAlign: 'center', color: colors.text, fontWeight: '800' }, diff: { width: '14%', textAlign: 'right', fontWeight: '800' }, note: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.lg },
});
