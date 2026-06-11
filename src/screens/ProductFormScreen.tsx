import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { Field, PrimaryButton } from '../components/Form';
import { useApp } from '../state/AppContext';
import { createProduct, generateProductCode } from '../services/inventory';
import { colors as themeColors, radii } from '../theme';
import { screenStyles } from './shared';

export function ProductFormScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, refresh } = useApp();
  const [imageUri, setImageUri] = useState('');
  const [name, setName] = useState('新款针织上衣');
  const [category, setCategory] = useState('TOP');
  const [colorText, setColorText] = useState('白色,黑色');
  const [sizes, setSizes] = useState('S,M,L');
  const [initialStock, setInitialStock] = useState('5');
  const [cost, setCost] = useState('58');
  const [price, setPrice] = useState('169');
  const [minStock, setMinStock] = useState('5');
  const [brand, setBrand] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const codePreview = useMemo(() => generateProductCode(category), [category]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = () => {
    if (!currentUser) return;
    if (!name.trim()) {
      Alert.alert('请填写商品名称');
      return;
    }
    createProduct(
      {
        name: name.trim(),
        category: category.trim() || 'ITEM',
        colors: colorText.split(',').map((v) => v.trim()).filter(Boolean),
        sizes: sizes.split(',').map((v) => v.trim()).filter(Boolean),
        initialStock: Number(initialStock) || 0,
        defaultCost: Number(cost) || 0,
        defaultPrice: Number(price) || 0,
        minStock: Number(minStock) || 0,
        brand,
        supplier,
        note,
        imageUri,
      },
      currentUser,
    );
    refresh();
    navigation.goBack();
  };

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Card>
        <TouchableOpacity onPress={pickImage} style={{ height: 160, borderRadius: radii.lg, backgroundColor: themeColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160, borderRadius: radii.lg }} /> : <Text style={{ color: themeColors.primary, fontWeight: '900' }}>选择商品主图</Text>}
        </TouchableOpacity>
        <Text style={screenStyles.muted}>编号预览：{codePreview}</Text>
        <Field label="商品名称" value={name} onChangeText={setName} />
        <Field label="分类缩写" value={category} onChangeText={setCategory} />
        <Field label="颜色（逗号分隔）" value={colorText} onChangeText={setColorText} />
        <Field label="尺码（逗号分隔）" value={sizes} onChangeText={setSizes} />
        <Field label="初始库存" keyboardType="number-pad" value={initialStock} onChangeText={setInitialStock} />
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
