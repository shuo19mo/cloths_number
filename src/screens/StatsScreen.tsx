import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { getDashboardStats, getProducts } from '../services/queries';
import { money } from '../services/format';
import type { DashboardStats, Product } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function StatsScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(useCallback(() => {
    setStats(getDashboardStats());
    setProducts(getProducts());
  }, []));

  if (!stats) return null;
  const hot = [...products].sort((a, b) => b.totalStock - a.totalStock).slice(0, 5);

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>统计看板</Text>
      <View style={screenStyles.grid}>
        <MetricCard label="总商品数量" value={`${stats.totalProducts}`} />
        <MetricCard label="总库存数量" value={`${stats.totalStock}`} />
        <MetricCard label="总库存成本" value={money(stats.stockCost)} />
        <MetricCard label="预计总毛利" value={money(stats.expectedProfit)} />
        <MetricCard label="今日销售额" value={money(stats.todaySales)} />
        <MetricCard label="本月毛利" value={money(stats.monthProfit)} />
      </View>
      <Card>
        <Text style={screenStyles.sectionTitle}>最近 7 天销售趋势</Text>
        <Text style={screenStyles.muted}>Demo 用本地销售记录汇总，后续可替换为折线图。</Text>
        <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900', marginTop: 8 }}>{money(stats.weekSales)}</Text>
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>商品分类库存占比</Text>
        {Object.entries(products.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + p.totalStock }), {})).map(([category, count]) => (
          <Text key={category} style={{ color: colors.text, marginBottom: 8 }}>{category} · {count} 件</Text>
        ))}
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>热销/高库存排行</Text>
        {hot.map((p) => <Text key={p.id} style={{ color: colors.text, marginBottom: 8 }}>{p.name} · {p.totalStock} 件</Text>)}
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>低库存商品</Text>
        {products.filter((p) => p.status !== 'NORMAL').map((p) => <Text key={p.id} style={{ color: p.status === 'OUT' ? colors.danger : colors.warning, marginBottom: 8 }}>{p.name} · {p.totalStock} 件</Text>)}
      </Card>
    </ScrollView>
  );
}
