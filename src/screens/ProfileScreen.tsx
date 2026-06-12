import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { getUsers, touchUser } from '../services/queries';
import { useApp } from '../state/AppContext';
import type { User } from '../models';
import { displayDate } from '../services/format';
import { colors } from '../theme';
import { screenStyles } from './shared';
import { ensureDemoData, resetDemoData } from '../db/database';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, setCurrentUser, refresh } = useApp();
  const [users, setUsers] = useState<User[]>([]);

  useFocusEffect(useCallback(() => setUsers(getUsers()), []));

  return (
    <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
      <Text style={screenStyles.title}>我的</Text>
      <Card>
        <Text style={screenStyles.sectionTitle}>当前用户</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{currentUser?.name}</Text>
        <Text style={screenStyles.muted}>{currentUser?.phone} · 最近操作 {currentUser ? displayDate(currentUser.lastActiveAt) : '-'}</Text>
      </Card>
      <Card>
        <Text style={screenStyles.sectionTitle}>切换本地 Profile</Text>
        {users.map((user) => (
          <TouchableOpacity key={user.id} onPress={() => { touchUser(user.id); setCurrentUser({ ...user, lastActiveAt: new Date().toISOString() }); }}>
            <View style={[screenStyles.row, { paddingVertical: 10 }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{user.name}</Text>
              <Text style={screenStyles.muted}>{user.phone}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>
      <Card>
        <TouchableOpacity onPress={() => navigation.navigate('Logs')}><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>操作日志</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { ensureDemoData(); refresh(); Alert.alert('完成', '缺少的 Demo 商品已补充。'); }}><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>补充 Demo 数据</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('清空并重建 Demo 数据？', '现有商品、库存、进货、销售和日志都会被清空。', [
          { text: '取消', style: 'cancel' },
          { text: '确认重建', style: 'destructive', onPress: () => { resetDemoData(); refresh(); Alert.alert('完成', 'Demo 数据已重新生成。'); } },
        ])}><Text style={{ color: colors.danger, fontWeight: '900', paddingVertical: 8 }}>清空并重建 Demo 数据</Text></TouchableOpacity>
        <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>数据导出（占位）</Text></TouchableOpacity>
        <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>本地备份恢复（占位）</Text></TouchableOpacity>
      </Card>
    </ScrollView>
  );
}
