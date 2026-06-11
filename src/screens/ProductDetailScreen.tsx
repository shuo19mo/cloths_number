import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { getProduct, getPurchases, getRecentMovements, getSales, getSkus } from '../services/queries';
import { displayDate, money, percent } from '../services/format';
import type { Movement, Product, Sku } from '../models';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';

export function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const productId = route.params.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      setProduct(getProduct(productId));
      setSkus(getSkus(productId));
      setMovements(getRecentMovements(10, productId));
      setPurchases(getPurchases(productId));
      setSales(getSales(productId));
    }, [productId]),
  );

  if (!product) return null;
  const latestCost = purchases[0]?.unit_cost ?? product.defaultCost;
  const avgCost =
    purchases.length > 0
      ? purchases.reduce((sum, row) => sum + row.unit_cost * row.quantity, 0) / purchases.reduce((sum, row) => sum + row.quantity, 0)
      : product.defaultCost;

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      {product.mainImageUri ? (
        <Image source={{ uri: product.mainImageUri }} style={{ width: '100%', height: 220, borderRadius: radii.lg, marginBottom: spacing.md }} />
      ) : (
        <View style={{ height: 180, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
          <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '900' }}>商品图片</Text>
        </View>
      )}
      <Card>
        <View style={screenStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>{product.name}</Text>
            <Text style={screenStyles.muted}>{product.code} · {product.category}</Text>
          </View>
          <StatusBadge status={product.status} />
        </View>
      </Card>
      <View style={screenStyles.grid}>
        <MetricCard label="当前总库存" value={`${product.totalStock} 件`} />
        <MetricCard label="库存成本" value={money(product.stockCost)} />
        <MetricCard label="售价总额" value={money(product.stockRetail)} />
        <MetricCard label="毛利率" value={percent(product.marginRate)} />
      </View>
      <Card>
        <Text style={screenStyles.sectionTitle}>颜色尺码库存</Text>
        {skus.map((sku) => (
          <View key={sku.id} style={[screenStyles.row, { paddingVertical: 8 }]}>
            <Text style={{ color: colors.text }}>{sku.color} / {sku.size}</Text>
            <Text style={{ color: sku.quantity === 0 ? colors.danger : colors.text, fontWeight: '900' }}>{sku.quantity} 件</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>进价历史</Text>
        <Text style={screenStyles.muted}>当前默认进价 {money(product.defaultCost)} · 最近一次 {money(latestCost)} · 平均 {money(avgCost)}</Text>
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>库存流水</Text>
        {movements.map((item) => (
          <Text key={item.id} style={{ color: colors.text, marginBottom: 8 }}>
            {displayDate(item.createdAt)} {item.action} {item.color}/{item.size}: {item.beforeQuantity} → {item.afterQuantity}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>销售记录</Text>
        {sales.length === 0 ? <Text style={screenStyles.muted}>暂无销售记录</Text> : null}
        {sales.map((row) => (
          <Text key={row.id} style={{ color: colors.text, marginBottom: 8 }}>{displayDate(row.sale_date)} 销售 {row.quantity} 件 · 毛利 {money(row.profit)}</Text>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Purchase')} style={actionStyle}><Text style={actionText}>进货</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Sale')} style={actionStyle}><Text style={actionText}>销售</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Adjust', { skuId: skus[0]?.id })} style={actionStyle}><Text style={actionText}>调整库存</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const actionStyle = { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14 };
const actionText = { color: '#fff', fontWeight: '900' as const };
