import { StyleSheet } from 'react-native';

import { colors, ui } from '@/ui/theme/theme';

export const styles = StyleSheet.create({
  badge: { ...ui.badge, ...ui.badgeText, overflow: 'hidden' },
});

// Uma cor por status: texto forte em cima do fundo clarinho da mesma cor.
export const statusStyles = StyleSheet.create({
  open: { color: colors.primary, backgroundColor: colors.primarySoft },
  in_progress: { color: colors.success, backgroundColor: colors.successSoft },
  finished: { color: colors.textMuted, backgroundColor: colors.background },
  scheduled: { color: colors.primary, backgroundColor: colors.primarySoft },
  'in-progress': { color: colors.success, backgroundColor: colors.successSoft },
  completed: { color: colors.textMuted, backgroundColor: colors.background },
  cancelled: { color: colors.danger, backgroundColor: colors.dangerSoft },
});
