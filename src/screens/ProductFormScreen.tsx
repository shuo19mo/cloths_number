import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomActionBar, BottomSubmit } from '../components/BottomActionBar';
import { Chip } from '../components/Chip';
import { Field, GhostButton, PrimaryButton } from '../components/Form';
import { useApp } from '../state/AppContext';
import { createCategory, createProduct, generateProductCode } from '../services/inventory';
import { getCategories } from '../services/queries';
import type { Category } from '../models';
import { colors, radii, spacing } from '../theme';
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
    <View style={styles.root}>
      <ScrollView style={screenStyles.screen} contentContainerStyle={[screenStyles.content, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <><View style={styles.camera}><Ionicons name="camera-outline" size={25} color={colors.primary} /></View><Text style={styles.imageTitle}>添加商品主图</Text><Text style={styles.imageHint}>清晰图片更方便日常查找商品</Text></>}
        </TouchableOpacity>
        <SectionTitle title="基本信息" subtitle="选择类别后会自动生成商品编号" />
        <View style={styles.section}>
        <Text style={styles.fieldLabel}>商品类别</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {categories.map((category) => <Chip key={category.id} label={category.name} selected={category.id === categoryId} onPress={() => setCategoryId(category.id)} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}><Field label="新增自定义类别" value={newCategory} onChangeText={setNewCategory} placeholder="例如：家居服" /></View>
          <View style={{ width: 90 }}><GhostButton title="添加" onPress={addCategory} /></View>
        </View>
        <View style={styles.code}><Text style={styles.codeLabel}>商品编号</Text><Text style={styles.codeValue}>{codePreview}</Text></View>
        <Field label="商品名称" value={name} onChangeText={setName} placeholder="例如：基础圆领 T 恤" />
        </View>
        <SectionTitle title="颜色与尺码" subtitle="系统会为每个颜色和尺码组合建立独立库存" />
        <View style={styles.section}>
        <Field label="颜色（逗号分隔）" value={colorText} onChangeText={setColorText} />
        <Field label="尺码（逗号分隔）" value={sizes} onChangeText={setSizes} />
        <Field label="每个 SKU 初始库存" keyboardType="number-pad" value={initialStock} onChangeText={setInitialStock} />
        </View>
        <SectionTitle title="价格与提醒" subtitle="库存价值和预计毛利会根据价格自动计算" />
        <View style={styles.section}>
        <View style={styles.twoColumns}><View style={{ flex: 1 }}>
        <Field label="单件进价" keyboardType="decimal-pad" value={cost} onChangeText={setCost} />
        </View><View style={{ flex: 1 }}>
        <Field label="单件售价" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        </View></View>
        <Field label="最低库存提醒" keyboardType="number-pad" value={minStock} onChangeText={setMinStock} />
        </View>
        <SectionTitle title="其他信息" subtitle="品牌、供应商和备注均为可选" />
        <View style={styles.section}>
        <Field label="品牌（可选）" value={brand} onChangeText={setBrand} />
        <Field label="供应商（可选）" value={supplier} onChangeText={setSupplier} />
        <Field label="备注（可选）" value={note} onChangeText={setNote} />
        </View>
      </ScrollView>
      <BottomActionBar><BottomSubmit label="保存商品" summary={name.trim() || '填写商品资料'} icon="checkmark-circle-outline" onPress={submit} /></BottomActionBar>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  imagePicker: { height: 190, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, camera: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, imageTitle: { color: colors.text, fontWeight: '800', marginTop: 10 }, imageHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sectionHeader: { marginTop: 3, marginBottom: 10 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' }, sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  section: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl }, fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  code: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: radii.sm, paddingHorizontal: 12, marginTop: 12 }, codeLabel: { color: colors.muted, fontSize: 12 }, codeValue: { color: colors.primary, fontWeight: '800', fontSize: 13 }, twoColumns: { flexDirection: 'row', gap: 10 },
});
