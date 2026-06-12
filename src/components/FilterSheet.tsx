import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

export function FilterSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><View style={styles.handle} /><Text style={styles.title}>{title}</Text>{children}</Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,19,17,0.32)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, padding: spacing.lg, paddingBottom: 30, maxHeight: '78%' },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
});
