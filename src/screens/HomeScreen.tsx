import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { MetricPanel } from '../components/MetricPanel';
import { SectionHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { screenStyles } from './shared';
import { getDashboardStats, getProducts, getRecentMovements } from '../services/queries';
import { money, displayDate } from '../services/format';
import type { DashboardStats, Movement, Product } from '../models';
import { useApp } from '../state/AppContext';
import { colors, radii, spacing } from '../theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStats(getDashboardStats());
      setAlerts(getProducts().filter((p) => p.status === 'LOW' || p.status === 'OUT').slice(0, 5));
      setMovements(getRecentMovements(5));
    }, []),
  );

  if (!stats) return null;

  const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  const actions = [
    { label: '新增商品', icon: 'add-circle-outline' as const, tone: colors.primary, soft: colors.primarySoft, onPress: () => navigation.navigate('ProductForm') },
    { label: '进货入库', icon: 'archive-outline' as const, tone: colors.success, soft: colors.successSoft, onPress: () => navigation.navigate('Purchase') },
    { label: '销售出库', icon: 'bag-handle-outline' as const, tone: colors.warning, soft: colors.warningSoft, onPress: () => navigation.navigate('Sale') },
    { label: '盘点库存', icon: 'clipboard-outline' as const, tone: colors.slate, soft: colors.background, onPress: () => navigation.navigate('Stocktake') },
  ];

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>{dateLabel}</Text><Text style={styles.greeting}>{currentUser?.name ? `${currentUser.name}，你好` : '库存总览'}</Text><Text style={styles.subtitle}>今天也把库存打理得清清楚楚</Text></View>
        <View style={styles.avatar}>{currentUser?.avatarUri ? <Image source={{ uri: currentUser.avatarUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{currentUser?.name?.slice(0, 1) ?? '店'}</Text>}</View>
      </View>
      <View style={[screenStyles.grid, styles.metricGrid]}>
        <MetricPanel label="总库存" value={`${stats.totalStock} 件`} icon="cube-outline" />
        <MetricPanel label="库存成本" value={money(stats.stockCost)} icon="wallet-outline" />
        <MetricPanel label="预计销售" value={money(stats.stockRetail)} icon="pricetag-outline" />
        <MetricPanel label="预计毛利" value={money(stats.expectedProfit)} icon="trending-up-outline" tone="primary" />
      </View>

      <SectionHeader title="快捷操作" />
      <View style={styles.quickGrid}>{actions.map((action) => <TouchableOpacity key={action.label} onPress={action.onPress} activeOpacity={0.75} style={styles.quickAction}><View style={[styles.quickIcon, { backgroundColor: action.soft }]}><Ionicons name={action.icon} size={23} color={action.tone} /></View><Text style={styles.quickLabel}>{action.label}</Text></TouchableOpacity>)}</View>

      <SectionHeader title="库存预警" action={<TouchableOpacity onPress={() => navigation.navigate('Products')}><Text style={styles.link}>查看全部</Text></TouchableOpacity>} />
      <Card>
        <Text style={styles.alertIntro}>以下商品库存不足，需要补货。</Text>
        {alerts.length === 0 ? <Text style={screenStyles.muted}>库存状态良好</Text> : null}
        {alerts.map((product) => (
          <TouchableOpacity key={product.id} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} style={styles.alertRow}>
            <View style={styles.alertImage}>{product.mainImageUri ? <Image source={{ uri: product.mainImageUri }} style={styles.alertImage} /> : <Ionicons name="shirt-outline" size={20} color={colors.primary} />}</View>
            <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.alertName}>{product.name}</Text><Text style={styles.alertMeta}>{product.categoryName} · 剩余 {product.totalStock} 件</Text></View>
            <StatusBadge status={product.status} />
          </TouchableOpacity>
        ))}
      </Card>

      <SectionHeader title="最近操作" />
      <View style={styles.timeline}>
        {movements.map((item) => (
          <View key={item.id} style={styles.timelineRow}><View style={styles.timelineRail}><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View><View style={{ flex: 1, paddingBottom: 17 }}><Text style={styles.timelineText}><Text style={{ fontWeight: '800' }}>{item.operatorName}</Text> {item.productName} {item.color}/{item.size} <Text style={{ color: item.quantityChange > 0 ? colors.success : colors.danger, fontWeight: '800' }}>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange}</Text></Text><Text style={styles.timelineTime}>{displayDate(item.createdAt)}</Text></View></View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: spacing.xl },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  greeting: { color: colors.text, fontSize: 28, lineHeight: 35, fontWeight: '800', marginTop: 3 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 48, height: 48 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  metricGrid: { rowGap: 10 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  quickAction: { width: '23%', alignItems: 'center', gap: 7 },
  quickIcon: { width: 52, height: 52, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  alertIntro: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  alertRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  alertImage: { width: 40, height: 44, borderRadius: 6, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  alertName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  alertMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  timeline: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineRail: { width: 12, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
  timelineLine: { width: 1, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  timelineText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  timelineTime: { color: colors.subtle, fontSize: 11, marginTop: 4 },
});
