import { StyleSheet } from 'react-native';

import { colors, radius, spacing, ui } from '@/ui/theme/theme';

export const styles = StyleSheet.create({
  card: { ...ui.card, gap: spacing.md, marginBottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  rating: {
    ...ui.badge,
    backgroundColor: colors.warningSoft,
    color: colors.star,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  status: { ...ui.badge, ...ui.badgeText, overflow: 'hidden', color: colors.textMuted, backgroundColor: colors.background },
  accepted: { color: colors.success, backgroundColor: colors.successSoft },
  confirmed: { color: colors.success, backgroundColor: colors.successSoft },
  completed: { color: colors.textMuted, backgroundColor: colors.background },
  cancelled: { color: colors.danger, backgroundColor: colors.dangerSoft },
  rejected: { color: colors.danger, backgroundColor: colors.dangerSoft },
  pending: { color: colors.star, backgroundColor: colors.warningSoft },
});
