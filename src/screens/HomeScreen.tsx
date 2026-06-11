import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { screenStyles } from './shared';
import { getDashboardStats, getProducts, getRecentMovements } from '../services/queries';
import { money, displayDate } from '../services/format';
import type { DashboardStats, Movement, Product } from '../models';
import { colors } from '../theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();
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

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>库存总览</Text>
      <View style={screenStyles.grid}>
        <MetricCard label="总库存数量" value={`${stats.totalStock} 件`} />
        <MetricCard label="库存成本总价值" value={money(stats.stockCost)} />
        <MetricCard label="库存售价总金额" value={money(stats.stockRetail)} />
        <MetricCard label="预计总毛利" value={money(stats.expectedProfit)} />
      </View>

      <Card>
        <Text style={screenStyles.sectionTitle}>快捷操作</Text>
        {[
          ['新增商品', () => navigation.navigate('ProductForm')],
          ['进货入库', () => navigation.navigate('Purchase')],
          ['销售出库', () => navigation.navigate('Sale')],
          ['盘点库存', () => navigation.navigate('Stocktake')],
        ].map(([label, onPress]) => (
          <TouchableOpacity key={label as string} onPress={onPress as () => void} style={{ paddingVertical: 10 }}>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>{label as string}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <Text style={screenStyles.sectionTitle}>以下商品库存不足，需要补货。</Text>
        {alerts.length === 0 ? <Text style={screenStyles.muted}>暂无低库存或缺货商品</Text> : null}
        {alerts.map((product) => (
          <TouchableOpacity key={product.id} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
            <Text style={{ color: product.status === 'OUT' ? colors.danger : colors.warning, fontWeight: '800', paddingVertical: 6 }}>
              {product.name} · {product.totalStock} 件
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <Text style={screenStyles.sectionTitle}>最近修改</Text>
        {movements.map((item) => (
          <Text key={item.id} style={{ color: colors.text, marginBottom: 8 }}>
            {displayDate(item.createdAt)} {item.operatorName} {item.productName} {item.color}/{item.size} {item.quantityChange > 0 ? '+' : ''}
            {item.quantityChange}
          </Text>
        ))}
      </Card>
    </ScrollView>
  );
}
