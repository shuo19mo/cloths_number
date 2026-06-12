import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomAction, BottomActionBar } from '../components/BottomActionBar';
import { EmptyState } from '../components/EmptyState';
import { MetricPanel } from '../components/MetricPanel';
import { StatusBadge } from '../components/StatusBadge';
import { getProduct, getPurchases, getRecentMovements, getSales, getSkus } from '../services/queries';
import { displayDate, money, percent } from '../services/format';
import type { Movement, Product, Sku } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

type DetailTab = 'PURCHASE' | 'SALE' | 'MOVEMENT';

export function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const productId = route.params.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [tab, setTab] = useState<DetailTab>('PURCHASE');

  useFocusEffect(useCallback(() => {
    setProduct(getProduct(productId));
    setSkus(getSkus(productId));
    setMovements(getRecentMovements(12, productId));
    setPurchases(getPurchases(productId));
    setSales(getSales(productId));
  }, [productId]));

  const grouped = useMemo(() => skus.reduce<Record<string, Sku[]>>((result, sku) => {
    result[sku.color] = [...(result[sku.color] ?? []), sku];
    return result;
  }, {}), [skus]);

  if (!product) return null;

  return (
    <View style={styles.root}>
      <ScrollView style={screenStyles.screen} contentContainerStyle={[screenStyles.content, { paddingBottom: 104 }]}>
        {product.mainImageUri ? <Image source={{ uri: product.mainImageUri }} style={styles.heroImage} resizeMode="cover" /> : <View style={styles.heroPlaceholder}><Ionicons name="shirt-outline" size={52} color={colors.primary} /><Text style={styles.placeholderText}>暂无商品图片</Text></View>}

        <View style={styles.identity}>
          <View style={{ flex: 1 }}><Text style={styles.name}>{product.name}</Text><Text style={styles.meta}>{product.code} · {product.categoryName}</Text></View>
          <StatusBadge status={product.status} />
        </View>
        <View style={styles.tags}><InfoTag icon="business-outline" text={product.brand || '未填写品牌'} /><InfoTag icon="car-outline" text={product.supplier || '未填写供应商'} /></View>

        <View style={[screenStyles.grid, styles.metricGrid]}>
          <MetricPanel label="当前库存" value={`${product.totalStock} 件`} icon="cube-outline" tone={product.status === 'OUT' ? 'danger' : product.status === 'LOW' ? 'warning' : 'default'} />
          <MetricPanel label="库存成本" value={money(product.stockCost)} icon="wallet-outline" />
          <MetricPanel label="预计销售" value={money(product.stockRetail)} icon="pricetag-outline" />
          <MetricPanel label="预计毛利" value={`${money(product.expectedProfit)} · ${percent(product.marginRate)}`} icon="trending-up-outline" tone="primary" />
        </View>

        <Text style={styles.sectionTitle}>颜色尺码库存</Text>
        <View style={styles.matrix}>
          {Object.entries(grouped).map(([color, rows], colorIndex) => <View key={color} style={[styles.colorGroup, colorIndex > 0 && styles.colorBorder]}><Text style={styles.colorLabel}>{color}</Text><View style={styles.sizeRail}>{rows.map((sku) => { const tone = sku.quantity === 0 ? colors.danger : sku.quantity <= product.minStock ? colors.warning : colors.text; const soft = sku.quantity === 0 ? colors.dangerSoft : sku.quantity <= product.minStock ? colors.warningSoft : colors.background; return <View key={sku.id} style={[styles.sizeCell, { backgroundColor: soft }]}><Text style={styles.sizeLabel}>{sku.size}</Text><Text style={[styles.sizeQuantity, { color: tone }]}>{sku.quantity}</Text></View>; })}</View></View>)}
        </View>

        <View style={styles.priceStrip}>
          <PriceItem label="默认进价" value={money(product.defaultCost)} />
          <PriceItem label="最近进价" value={money(product.lastPurchaseCost)} />
          <PriceItem label="平均进价" value={money(product.averageCost)} />
          <PriceItem label="默认售价" value={money(product.defaultPrice)} />
        </View>

        <Text style={styles.sectionTitle}>业务记录</Text>
        <View style={styles.tabs}>
          <TabButton label="进货" selected={tab === 'PURCHASE'} onPress={() => setTab('PURCHASE')} />
          <TabButton label="销售" selected={tab === 'SALE'} onPress={() => setTab('SALE')} />
          <TabButton label="库存流水" selected={tab === 'MOVEMENT'} onPress={() => setTab('MOVEMENT')} />
        </View>
        <View style={styles.records}>
          {tab === 'PURCHASE' && (purchases.length ? purchases.map((row) => <RecordRow key={row.id} icon="archive-outline" title={`进货 ${row.quantity} 件`} meta={`${displayDate(row.purchase_date)} · ${row.order_no}`} value={money(row.total_cost)} />) : <EmptyState title="暂无进货记录" />)}
          {tab === 'SALE' && (sales.length ? sales.map((row) => <RecordRow key={row.id} icon="bag-handle-outline" title={`销售 ${row.quantity} 件`} meta={`${displayDate(row.sale_date)} · ${row.order_no}`} value={`毛利 ${money(row.profit)}`} />) : <EmptyState title="暂无销售记录" />)}
          {tab === 'MOVEMENT' && (movements.length ? movements.map((item) => <RecordRow key={item.id} icon="swap-vertical-outline" title={`${item.action} · ${item.color}/${item.size}`} meta={`${displayDate(item.createdAt)} · ${item.operatorName}`} value={`${item.beforeQuantity} → ${item.afterQuantity}`} />) : <EmptyState title="暂无库存流水" />)}
        </View>
      </ScrollView>

      <BottomActionBar>
        <BottomAction label="进货" icon="archive-outline" onPress={() => navigation.navigate('Purchase', { productId })} primary />
        <BottomAction label="销售" icon="bag-handle-outline" onPress={() => navigation.navigate('Sale', { productId })} />
        <BottomAction label="盘点" icon="clipboard-outline" onPress={() => navigation.navigate('Stocktake', { productId })} />
        <BottomAction label="调整" icon="options-outline" onPress={() => navigation.navigate('Adjust', { skuId: skus[0]?.id })} />
      </BottomActionBar>
    </View>
  );
}

function InfoTag({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.infoTag}><Ionicons name={icon} size={14} color={colors.muted} /><Text numberOfLines={1} style={styles.infoText}>{text}</Text></View>; }
function PriceItem({ label, value }: { label: string; value: string }) { return <View style={styles.priceItem}><Text style={styles.priceLabel}>{label}</Text><Text style={styles.priceValue}>{value}</Text></View>; }
function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <TouchableOpacity onPress={onPress} style={[styles.tab, selected && styles.tabSelected]}><Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text></TouchableOpacity>; }
function RecordRow({ icon, title, meta, value }: { icon: keyof typeof Ionicons.glyphMap; title: string; meta: string; value: string }) { return <View style={styles.recordRow}><View style={styles.recordIcon}><Ionicons name={icon} size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.recordTitle}>{title}</Text><Text style={styles.recordMeta}>{meta}</Text></View><Text style={styles.recordValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroImage: { width: '100%', height: 250, borderRadius: radii.lg, backgroundColor: colors.card },
  heroPlaceholder: { height: 210, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { color: colors.primary, fontWeight: '700' },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: spacing.lg },
  name: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: spacing.lg },
  infoTag: { maxWidth: '48%', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 6 },
  infoText: { color: colors.muted, fontSize: 12 },
  metricGrid: { rowGap: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  matrix: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  colorGroup: { paddingVertical: 14 },
  colorBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  colorLabel: { color: colors.text, fontWeight: '800', marginBottom: 9 },
  sizeRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeCell: { minWidth: 56, height: 50, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sizeLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  sizeQuantity: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  priceStrip: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, paddingVertical: 5 },
  priceItem: { width: '50%', paddingHorizontal: 14, paddingVertical: 10 },
  priceLabel: { color: colors.muted, fontSize: 11 },
  priceValue: { color: colors.text, fontWeight: '800', marginTop: 3 },
  tabs: { height: 44, flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 3 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  tabSelected: { backgroundColor: colors.primarySoft },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  tabTextSelected: { color: colors.primary, fontWeight: '800' },
  records: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, marginTop: 8, paddingHorizontal: spacing.md },
  recordRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  recordIcon: { width: 34, height: 34, borderRadius: 6, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  recordMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  recordValue: { color: colors.text, fontWeight: '800', fontSize: 12 },
});
