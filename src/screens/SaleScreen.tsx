import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { getDashboardStats, getSkus } from '../services/queries';
import { sellStock } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Sku } from '../models';
import { money } from '../services/format';
import { screenStyles } from './shared';
import { SkuPicker } from './PurchaseScreen';

export function SaleScreen() {
  const { currentUser, refresh } = useApp();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('129');
  const [discount, setDiscount] = useState('0');
  const [received, setReceived] = useState('129');
  const [note, setNote] = useState('销售出库');
  const stats = useMemo(() => getDashboardStats(), [skus]);

  useFocusEffect(useCallback(() => {
    const rows = getSkus();
    setSkus(rows);
    setSelected((value) => value ?? rows[0]?.id ?? null);
  }, []));

  const submit = () => {
    if (!currentUser || !selected) return;
    const ok = sellStock(selected, Number(quantity), Number(price), Number(discount), Number(received), note, currentUser);
    if (ok) {
      refresh();
      Alert.alert('销售完成', '销售记录、库存流水和操作日志已生成。');
    }
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>销售出库</Text>
      <Card>
        <Text style={screenStyles.sectionTitle}>销售概览</Text>
        <Text style={screenStyles.muted}>今日销售额 {money(stats.todaySales)} · 今日成本 {money(stats.todayCost)} · 今日毛利 {money(stats.todayProfit)}</Text>
        <Text style={screenStyles.muted}>本周销售额 {money(stats.weekSales)} · 本月毛利 {money(stats.monthProfit)}</Text>
      </Card>
      <SkuPicker skus={skus} selected={selected} onSelect={setSelected} />
      <Card>
        <Field label="销售数量" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />
        <Field label="单件售价" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        <Field label="折扣" keyboardType="decimal-pad" value={discount} onChangeText={setDiscount} />
        <Field label="实收金额" keyboardType="decimal-pad" value={received} onChangeText={setReceived} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <PrimaryButton title="提交销售" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
