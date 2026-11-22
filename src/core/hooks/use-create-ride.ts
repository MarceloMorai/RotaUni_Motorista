import { useRef, useState } from 'react';

import type { CreateRideInput } from '@/core/domain/rides/ride.types';
import { createRide as createRideService } from '@/core/services/rides/ride-management.service';
import { useAppState } from '@/core/state/app-provider';

export function useCreateRide() {
  const { currentUser, currentVehicle } = useAppState();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  async function createRide(input: CreateRideInput) {
    if (!currentUser) {
      setError('Usuário não encontrado.');
      return null;
    }

    if (!currentVehicle) {
      setError('Cadastre um veículo antes de oferecer caronas.');
      return null;
    }

    // Trava síncrona contra duplo toque (o estado `isSaving` só muda no próximo render).
    if (isSavingRef.current) return null;
    isSavingRef.current = true;

    setIsSaving(true);
    setError(null);

    try {
      return await createRideService({
        // A nota do motorista virá das avaliações dos passageiros quando existir o backend.
        driver: { id: currentUser.userId, name: currentUser.name, rating: null },
        vehicle: currentVehicle,
        origin: currentUser.campus,
        input,
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar a carona.');
      return null;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return { createRide, isSaving, error, setError };
}
