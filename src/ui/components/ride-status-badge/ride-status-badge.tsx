import type { RideStatus } from '@/core/domain/rides/ride.types';

import { ThemedText } from '@/ui/components/themed-text/themed-text';

import { statusStyles, styles } from './ride-status-badge.styles';

export const rideStatusLabel: Record<RideStatus, string> = {
  open: 'Agendada',
  in_progress: 'Em andamento',
  finished: 'Finalizada',
  scheduled: 'Agendada',
  'in-progress': 'Em andamento',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

export function RideStatusBadge({ status }: { status: RideStatus }) {
  return <ThemedText style={[styles.badge, statusStyles[status]]}>{rideStatusLabel[status]}</ThemedText>;
}
