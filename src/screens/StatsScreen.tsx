import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MetricPanel } from '../components/MetricPanel';
import { ScreenHeader, SectionHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { getDashboardStats, getProducts } from '../services/queries';
import { money } from '../services/format';
import type { DashboardStats, Product } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

export function StatsScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null); const [products, setProducts] = useState<Product[]>([]);
  useFocusEffect(useCallback(() => { setStats(getDashboardStats()); setProducts(getProducts()); }, []));
  if (!stats) return null;
  const categoryData = Object.entries(products.reduce<Record<string, number>>((acc, product) => ({ ...acc, [product.categoryName]: (acc[product.categoryName] ?? 0) + product.totalStock }), {})).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryData.map(([, value]) => value));
  const inventoryRank = [...products].sort((a, b) => b.totalStock - a.totalStock).slice(0, 5);
  const alerts = products.filter((product) => product.status !== 'NORMAL');
  return <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
    <ScreenHeader title="经营统计" subtitle="库存与销售数据实时汇总" />
    <View style={[screenStyles.grid, styles.metricGrid]}><MetricPanel label="今日销售" value={money(stats.todaySales)} icon="today-outline" tone="primary" /><MetricPanel label="本月销售" value={money(stats.monthSales)} icon="calendar-outline" /><MetricPanel label="库存成本" value={money(stats.stockCost)} icon="wallet-outline" /><MetricPanel label="本月毛利" value={money(stats.monthProfit)} icon="trending-up-outline" tone="primary" /></View>
    <SectionHeader title="最近 7 天" /><View style={styles.salesPanel}><View><Text style={styles.panelLabel}>销售额</Text><Text style={styles.bigValue}>{money(stats.weekSales)}</Text></View><View style={styles.salesIcon}><Ionicons name="analytics-outline" size={26} color={colors.primary} /></View><View style={styles.salesFooter}><Stat label="今日成本" value={money(stats.todayCost)} /><Stat label="今日毛利" value={money(stats.todayProfit)} /><Stat label="总库存" value={`${stats.totalStock} 件`} /></View></View>
    <SectionHeader title="分类库存占比" /><View style={styles.panel}>{categoryData.map(([category, count], index) => <View key={category} style={styles.barRow}><View style={styles.barHeader}><Text style={styles.barLabel}>{category}</Text><Text style={styles.barValue}>{count} 件</Text></View><View style={styles.track}><View style={[styles.bar, { width: `${(count / maxCategory) * 100}%`, backgroundColor: index === 0 ? colors.primary : index === 1 ? colors.warning : colors.slate }]} /></View></View>)}</View>
    <SectionHeader title="库存排行" /><View style={styles.panel}>{inventoryRank.map((product, index) => <View key={product.id} style={styles.rankRow}><Text style={[styles.rank, index < 3 && { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text><View style={{ flex: 1 }}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.categoryName} · {product.code}</Text></View><Text style={styles.stock}>{product.totalStock} 件</Text></View>)}</View>
    <SectionHeader title="库存预警" /><View style={styles.panel}>{alerts.length === 0 ? <Text style={styles.empty}>暂无库存预警</Text> : alerts.map((product) => <View key={product.id} style={styles.alertRow}><View style={{ flex: 1 }}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.categoryName} · 剩余 {product.totalStock} 件</Text></View><StatusBadge status={product.status} /></View>)}</View>
  </ScrollView>;
}

function Stat({ label, value }: { label: string; value: string }) { return <View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>; }
const styles = StyleSheet.create({
  metricGrid: { rowGap: 10 }, salesPanel: { minHeight: 170, backgroundColor: colors.ink, borderRadius: radii.lg, padding: spacing.lg }, panelLabel: { color: '#AEB7B2', fontSize: 12 }, bigValue: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 5 }, salesIcon: { position: 'absolute', right: 18, top: 18, width: 48, height: 48, borderRadius: 8, backgroundColor: '#DCEAE3', alignItems: 'center', justifyContent: 'center' }, salesFooter: { marginTop: 28, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#303632', flexDirection: 'row', justifyContent: 'space-between' }, statLabel: { color: '#98A39D', fontSize: 10 }, statValue: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 4 },
  panel: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }, barRow: { marginBottom: 14 }, barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, barLabel: { color: colors.text, fontWeight: '700', fontSize: 13 }, barValue: { color: colors.muted, fontSize: 12 }, track: { height: 7, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }, bar: { height: 7, borderRadius: 4 },
  rankRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, rank: { width: 24, color: colors.subtle, fontWeight: '800' }, productName: { color: colors.text, fontSize: 13, fontWeight: '800' }, productMeta: { color: colors.muted, fontSize: 11, marginTop: 3 }, stock: { color: colors.text, fontWeight: '800' }, alertRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }, empty: { color: colors.muted, textAlign: 'center', paddingVertical: 20 },
});
