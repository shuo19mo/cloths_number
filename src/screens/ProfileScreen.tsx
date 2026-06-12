import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUsers, touchUser } from '../services/queries';
import { useApp } from '../state/AppContext';
import type { User } from '../models';
import { displayDate } from '../services/format';
import { colors, radii, spacing } from '../theme';
import { screenStyles } from './shared';
import { ensureDemoData, resetDemoData } from '../db/database';

export function ProfileScreen() {
  const navigation = useNavigation<any>(); const { currentUser, setCurrentUser, refresh } = useApp(); const [users, setUsers] = useState<User[]>([]);
  useFocusEffect(useCallback(() => setUsers(getUsers()), []));
  const chooseUser = (user: User) => { touchUser(user.id); setCurrentUser({ ...user, lastActiveAt: new Date().toISOString() }); };
  return <ScrollView style={screenStyles.screen} contentContainerStyle={screenStyles.content}>
    <Text style={styles.title}>我的</Text><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{currentUser?.name?.slice(0, 1) ?? '店'}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{currentUser?.name}</Text><Text style={styles.phone}>{currentUser?.phone || '未填写联系方式'}</Text><Text style={styles.active}>最近操作 {currentUser ? displayDate(currentUser.lastActiveAt) : '-'}</Text></View></View>
    <Text style={styles.sectionTitle}>本地 Profile</Text><View style={styles.group}>{users.map((user) => <TouchableOpacity key={user.id} onPress={() => chooseUser(user)} style={styles.userRow}><View style={[styles.smallAvatar, currentUser?.id === user.id && styles.activeAvatar]}><Text style={[styles.smallAvatarText, currentUser?.id === user.id && { color: '#fff' }]}>{user.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{user.name}</Text><Text style={styles.rowSubtitle}>{user.phone}</Text></View>{currentUser?.id === user.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}</TouchableOpacity>)}</View>
    <Text style={styles.sectionTitle}>数据与记录</Text><View style={styles.group}><SettingRow icon="list-outline" label="操作日志" onPress={() => navigation.navigate('Logs')} /><SettingRow icon="download-outline" label="数据导出" value="即将支持" /><SettingRow icon="cloud-upload-outline" label="本地备份恢复" value="即将支持" /></View>
    <Text style={styles.sectionTitle}>Demo 工具</Text><View style={styles.group}><SettingRow icon="sparkles-outline" label="补充 Demo 数据" onPress={() => { ensureDemoData(); refresh(); Alert.alert('完成', '缺少的 Demo 商品已补充。'); }} /><SettingRow icon="refresh-outline" label="清空并重建 Demo 数据" danger onPress={() => Alert.alert('清空并重建 Demo 数据？', '现有商品、库存、进货、销售和日志都会被清空。', [{ text: '取消', style: 'cancel' }, { text: '确认重建', style: 'destructive', onPress: () => { resetDemoData(); refresh(); Alert.alert('完成', 'Demo 数据已重新生成。'); } }])} /></View>
    <Text style={styles.version}>本地单机版 · 数据仅保存在当前设备</Text>
  </ScrollView>;
}

function SettingRow({ icon, label, value, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; danger?: boolean }) { return <TouchableOpacity disabled={!onPress} onPress={onPress} style={styles.settingRow}><View style={[styles.settingIcon, danger && { backgroundColor: colors.dangerSoft }]}><Ionicons name={icon} size={19} color={danger ? colors.danger : colors.primary} /></View><Text style={[styles.rowTitle, { flex: 1 }, danger && { color: colors.danger }]}>{label}</Text>{value ? <Text style={styles.value}>{value}</Text> : <Ionicons name="chevron-forward" size={18} color={colors.subtle} />}</TouchableOpacity>; }
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: spacing.lg }, profile: { minHeight: 124, flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: colors.ink, borderRadius: radii.lg, padding: spacing.lg }, avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' }, name: { color: '#fff', fontSize: 22, fontWeight: '800' }, phone: { color: '#C4CCC8', fontSize: 12, marginTop: 4 }, active: { color: '#8F9A94', fontSize: 11, marginTop: 8 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.xl, marginBottom: 10 }, group: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, overflow: 'hidden' }, userRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border }, smallAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, activeAvatar: { backgroundColor: colors.primary }, smallAvatarText: { color: colors.primary, fontWeight: '800' }, rowTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, rowSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 }, settingRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border }, settingIcon: { width: 36, height: 36, borderRadius: 6, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, value: { color: colors.subtle, fontSize: 12 }, version: { color: colors.subtle, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
});
