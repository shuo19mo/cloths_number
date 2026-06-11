import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { Card } from '../components/Card';
import { getOperationLogs } from '../services/queries';
import type { OperationLog } from '../models';
import { displayDate } from '../services/format';
import { colors, radii } from '../theme';
import { screenStyles } from './shared';

export function LogsScreen() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [filter, setFilter] = useState('');
  useFocusEffect(useCallback(() => setLogs(getOperationLogs()), []));
  const visible = logs.filter((log) => `${log.operatorName} ${log.action} ${log.productName ?? ''} ${log.productCode ?? ''}`.includes(filter));

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <TextInput value={filter} onChangeText={setFilter} placeholder="按用户、商品、操作类型筛选" style={{ backgroundColor: '#fff', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 12 }} />
      {visible.map((log) => (
        <Card key={log.id}>
          <Text style={{ color: colors.text, fontWeight: '900' }}>{log.action}</Text>
          <Text style={screenStyles.muted}>{displayDate(log.createdAt)} · {log.operatorName}</Text>
          <Text style={{ color: colors.text, marginTop: 8 }}>{log.productName} {log.productCode}</Text>
          <Text style={screenStyles.muted}>前：{log.beforeValue || '-'} / 后：{log.afterValue || '-'}</Text>
          {log.note ? <Text style={screenStyles.muted}>备注：{log.note}</Text> : null}
        </Card>
      ))}
    </ScrollView>
  );
}
