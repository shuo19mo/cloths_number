import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Field, GhostButton, PrimaryButton } from '../components/Form';
import { useApp } from '../state/AppContext';
import { createCategory, createProduct, generateProductCode } from '../services/inventory';
import { getCategories } from '../services/queries';
import type { Category } from '../models';
import { colors, radii } from '../theme';
import { screenStyles } from './shared';

export function ProductFormScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, refresh } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [name, setName] = useState('');
  const [colorText, setColorText] = useState('白色,黑色');
  const [sizes, setSizes] = useState('S,M,L');
  const [initialStock, setInitialStock] = useState('0');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [brand, setBrand] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');

  useFocusEffect(useCallback(() => {
    const rows = getCategories();
    setCategories(rows);
    setCategoryId((id) => id ?? rows[0]?.id ?? null);
  }, []));

  const codePreview = useMemo(() => categoryId ? generateProductCode(categoryId) : '请选择类别', [categoryId]);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };
  const addCategory = () => {
    try {
      const id = createCategory(newCategory);
      setCategories(getCategories());
      setCategoryId(id);
      setNewCategory('');
    } catch (error) {
      Alert.alert('无法新增类别', error instanceof Error ? error.message : '请检查输入');
    }
  };
  const submit = () => {
    if (!currentUser || !categoryId) return;
    if (!name.trim() || !cost || !price) return Alert.alert('请填写商品名称、进价和售价');
    try {
      const productId = createProduct({
        name: name.trim(), categoryId,
        colors: colorText.split(',').map((v) => v.trim()).filter(Boolean),
        sizes: sizes.split(',').map((v) => v.trim()).filter(Boolean),
        initialStock: Number(initialStock) || 0, defaultCost: Number(cost) || 0,
        defaultPrice: Number(price) || 0, minStock: Number(minStock) || 0,
        brand, supplier, note, imageUri,
      }, currentUser);
      refresh();
      navigation.replace('ProductDetail', { productId });
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查商品信息');
    }
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Card>
        <TouchableOpacity onPress={pickImage} style={{ height: 160, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160, borderRadius: radii.lg }} /> : <Text style={{ color: colors.primary, fontWeight: '900' }}>选择商品主图</Text>}
        </TouchableOpacity>
        <Text style={screenStyles.sectionTitle}>商品类别</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {categories.map((category) => <Chip key={category.id} label={category.name} selected={category.id === categoryId} onPress={() => setCategoryId(category.id)} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}><Field label="新增自定义类别" value={newCategory} onChangeText={setNewCategory} placeholder="例如：家居服" /></View>
          <View style={{ width: 90 }}><GhostButton title="添加" onPress={addCategory} /></View>
        </View>
        <Text style={[screenStyles.muted, { marginTop: 10 }]}>商品编号：{codePreview}</Text>
        <Field label="商品名称" value={name} onChangeText={setName} placeholder="例如：基础圆领 T 恤" />
        <Field label="颜色（逗号分隔）" value={colorText} onChangeText={setColorText} />
        <Field label="尺码（逗号分隔）" value={sizes} onChangeText={setSizes} />
        <Field label="每个 SKU 初始库存" keyboardType="number-pad" value={initialStock} onChangeText={setInitialStock} />
        <Field label="单件进价" keyboardType="decimal-pad" value={cost} onChangeText={setCost} />
        <Field label="单件售价" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        <Field label="最低库存提醒" keyboardType="number-pad" value={minStock} onChangeText={setMinStock} />
        <Field label="品牌（可选）" value={brand} onChangeText={setBrand} />
        <Field label="供应商（可选）" value={supplier} onChangeText={setSupplier} />
        <Field label="备注（可选）" value={note} onChangeText={setNote} />
        <PrimaryButton title="保存商品" onPress={submit} />
      </Card>
    </ScrollView>
  );
}
