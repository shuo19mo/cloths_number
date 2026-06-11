import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { getSkus } from '../services/queries';
import { adjustStock } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Sku } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function StocktakeScreen() {
  const { currentUser, refresh } = useApp();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});

  useFocusEffect(useCallback(() => {
    const rows = getSkus();
    setSkus(rows);
    setValues(Object.fromEntries(rows.map((sku) => [sku.id, String(sku.quantity)])));
  }, []));

  const submit = () => {
    if (!currentUser) return;
    skus.forEach((sku) => {
      const actual = Number(values[sku.id]);
      if (Number.isFinite(actual) && actual !== sku.quantity) {
        adjustStock(sku.id, 'STOCKTAKE', actual, `盘点差异 ${actual - sku.quantity}`, currentUser);
      }
    });
    refresh();
    Alert.alert('盘点已提交', '差异 SKU 已生成盘点修正记录。');
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>盘点库存</Text>
      {skus.map((sku) => {
        const actual = Number(values[sku.id] ?? sku.quantity);
        return (
          <Card key={sku.id}>
            <View style={screenStyles.row}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{sku.color} / {sku.size}</Text>
              <Text style={screenStyles.muted}>系统 {sku.quantity}</Text>
            </View>
            <Field label="实际库存" keyboardType="number-pad" value={values[sku.id]} onChangeText={(text) => setValues((old) => ({ ...old, [sku.id]: text }))} />
            <Text style={{ color: actual - sku.quantity === 0 ? colors.success : colors.warning, fontWeight: '800', marginTop: 8 }}>
              差异数量：{actual - sku.quantity}
            </Text>
          </Card>
        );
      })}
      <PrimaryButton title="提交盘点" onPress={submit} />
    </ScrollView>
  );
}
