import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { getSkus } from '../services/queries';
import { purchaseStock } from '../services/inventory';
import { useApp } from '../state/AppContext';
import type { Sku } from '../models';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function PurchaseScreen() {
  const { currentUser, refresh } = useApp();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('3');
  const [cost, setCost] = useState('60');
  const [supplier, setSupplier] = useState('本地供应商');
  const [shipping, setShipping] = useState('0');
  const [note, setNote] = useState('进货入库');

  useFocusEffect(useCallback(() => {
    const rows = getSkus();
    setSkus(rows);
    setSelected((value) => value ?? rows[0]?.id ?? null);
  }, []));

  const submit = () => {
    if (!currentUser || !selected) return;
    purchaseStock(selected, Number(quantity), Number(cost), supplier, Number(shipping), note, currentUser);
    refresh();
    Alert.alert('已入库', '进货记录、库存流水和操作日志已生成。');
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>进货入库</Text>
      <SkuPicker skus={skus} selected={selected} onSelect={setSelected} />
      <Card>
        <Field label="进货数量" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />
        <Field label="单件进价" keyboardType="decimal-pad" value={cost} onChangeText={setCost} />
        <Field label="供应商" value={supplier} onChangeText={setSupplier} />
        <Field label="运费" keyboardType="decimal-pad" value={shipping} onChangeText={setShipping} />
        <Field label="备注" value={note} onChangeText={setNote} />
        <PrimaryButton title="提交进货" onPress={submit} />
      </Card>
    </ScrollView>
  );
}

export function SkuPicker({ skus, selected, onSelect }: { skus: Sku[]; selected: number | null; onSelect: (id: number) => void }) {
  return (
    <Card>
      <Text style={screenStyles.sectionTitle}>选择颜色/尺码</Text>
      {skus.map((sku) => (
        <TouchableOpacity key={sku.id} onPress={() => onSelect(sku.id)}>
          <View style={[screenStyles.row, { paddingVertical: 9 }]}>
            <Text style={{ color: selected === sku.id ? colors.primary : colors.text, fontWeight: selected === sku.id ? '900' : '500' }}>
              SKU #{sku.id} · {sku.color}/{sku.size}
            </Text>
            <Text style={screenStyles.muted}>{sku.quantity} 件</Text>
          </View>
        </TouchableOpacity>
      ))}
    </Card>
  );
}
