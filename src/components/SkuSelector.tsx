import { ScrollView } from 'react-native';
import type { Sku } from '../models';
import { Chip } from './Chip';

export function SkuSelector({ skus, selectedId, onSelect }: { skus: Sku[]; selectedId: number | null; onSelect: (sku: Sku) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{skus.map((sku) => <Chip key={sku.id} label={`${sku.color}/${sku.size} · ${sku.quantity}`} selected={selectedId === sku.id} onPress={() => onSelect(sku)} />)}</ScrollView>;
}
