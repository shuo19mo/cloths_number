import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { getUsers, touchUser } from '../services/queries';
import { useApp } from '../state/AppContext';
import type { User } from '../models';
import { displayDate } from '../services/format';
import { colors } from '../theme';
import { screenStyles } from './shared';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, setCurrentUser } = useApp();
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
        <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>数据导出（占位）</Text></TouchableOpacity>
        <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '900', paddingVertical: 8 }}>本地备份恢复（占位）</Text></TouchableOpacity>
      </Card>
    </ScrollView>
  );
}
