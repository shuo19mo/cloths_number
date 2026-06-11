import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { getSkus } from '../services/queries';
import { adjustStock } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Sku, StockAction } from '../models';
import { screenStyles } from './shared';
import { SkuPicker } from './PurchaseScreen';

export function AdjustScreen() {
  const route = useRoute<any>();
  const { currentUser, refresh } = useApp();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [selected, setSelected] = useState<number | null>(route.params?.skuId ?? null);
  const [target, setTarget] = useState('10');
  const [action, setAction] = useState<StockAction>('MANUAL');
  const [note, setNote] = useState('手动调整库存');

  useFocusEffect(useCallback(() => {
    const rows = getSkus();
    setSkus(rows);
    setSelected((value) => value ?? rows[0]?.id ?? null);
  }, []));

  const submit = () => {
    if (!currentUser || !selected) return;
    adjustStock(selected, action, Number(target), note, currentUser);
    refresh();
    Alert.alert('库存已调整', '已生成库存流水和操作日志。');
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>库存调整</Text>
      <SkuPicker skus={skus} selected={selected} onSelect={setSelected} />
      <Card>
        <Field label="调整类型（MANUAL/RETURN/LOSS）" value={action} onChangeText={(text) => setAction((text || 'MANUAL') as StockAction)} />
        <Field label="调整后库存" keyboardType="number-pad" value={target} onChangeText={setTarget} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <PrimaryButton title="提交调整" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
