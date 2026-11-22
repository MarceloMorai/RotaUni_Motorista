import { useRef, useState } from 'react';

import type { Ride } from '@/core/domain/rides/ride.types';
import {
  acceptRequest,
  cancelRide,
  finalizeRide,
  rejectRequest,
  startRide,
} from '@/core/services/rides/ride-management.service';
import { useAppState } from '@/core/state/app-provider';

export type RideAction = 'accept' | 'reject' | 'start' | 'finalize' | 'cancel';

const fallbackMessages: Record<RideAction, string> = {
  accept: 'Não foi possível aceitar o passageiro.',
  reject: 'Não foi possível recusar o passageiro.',
  start: 'Não foi possível iniciar a carona.',
  finalize: 'Não foi possível finalizar a carona.',
  cancel: 'Não foi possível cancelar a carona.',
};

/**
 * Ações do motorista sobre uma carona. Só uma ação roda por vez (proteção contra duplo toque).
 */
export function useRideActions(rideId: string | undefined) {
  const { currentUser } = useAppState();
  const [pendingAction, setPendingAction] = useState<RideAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Trava síncrona: o estado só atualiza no próximo render, então dois toques
  // no mesmo instante passariam pela checagem de `pendingAction`.
  const isRunningRef = useRef(false);

  async function run(action: RideAction, operation: (driverId: string, id: string) => Promise<Ride>) {
    if (!currentUser || !rideId) {
      setError('Carona não encontrada.');
      return null;
    }

    if (isRunningRef.current) return null;
    isRunningRef.current = true;

    setPendingAction(action);
    setError(null);

    try {
      return await operation(currentUser.userId, rideId);
    } catch (actionError) {
      console.error(`[RotaUni Motorista] ação ${action} falhou`, actionError);
      setError(actionError instanceof Error ? actionError.message : fallbackMessages[action]);
      return null;
    } finally {
      isRunningRef.current = false;
      setPendingAction(null);
    }
  }

  return {
    pendingAction,
    error,
    acceptRequest: (requestId: string) =>
      run('accept', (driverId, id) => acceptRequest(driverId, id, requestId)),
    rejectRequest: (requestId: string) =>
      run('reject', (driverId, id) => rejectRequest(driverId, id, requestId)),
    startRide: () => run('start', startRide),
    finalizeRide: () => run('finalize', finalizeRide),
    cancelRide: () => run('cancel', cancelRide),
  };
}
