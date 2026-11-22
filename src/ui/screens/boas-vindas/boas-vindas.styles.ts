import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing, typography, ui } from '@/ui/theme/theme';

export const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.md },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  logo: { width: 64, height: 64 },
  brand: { color: colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  title: { textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  benefits: { gap: spacing.md },
  benefit: { ...ui.card, ...ui.row, gap: spacing.md, marginBottom: 0 },
  benefitIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: { fontSize: 24, lineHeight: 30 },
  benefitText: { flex: 1, gap: 2 },
  benefitTitle: { ...typography.subtitle, fontSize: 16, lineHeight: 22 },
  benefitDescription: { ...typography.caption },
  actions: { gap: spacing.md, alignItems: 'center' },
  sourceToggle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.background },
  sourceLabel: { color: colors.textMuted, fontSize: 12 },
});
