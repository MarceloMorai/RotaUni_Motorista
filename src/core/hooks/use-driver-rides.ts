import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Ride } from '@/core/domain/rides/ride.types';
import { ridesRepository } from '@/core/services/factories/repository-factory';
import { useAppState } from '@/core/state/app-provider';
import { getDataSource } from '@/core/state/data-source';

/**
 * Caronas do motorista logado. Recarrega sempre que a tela ganha foco,
 * para refletir o que mudou nas telas de criação e de detalhes.
 */
export function useDriverRides() {
  const { currentUser } = useAppState();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (!currentUser) {
        Promise.resolve().then(() => {
          if (!isMounted) return;
          setRides([]);
          setIsLoading(false);
        });
        return () => {
          isMounted = false;
        };
      }

      const load = (background = false) => ridesRepository
        .listByDriver(currentUser.userId)
        .then((loadedRides) => {
          if (!isMounted) return;
          setRides(loadedRides);
          setError(null);
        })
        .catch(() => {
          if (isMounted) setError('Não foi possível carregar suas caronas.');
        })
        .finally(() => {
          if (isMounted && !background) setIsLoading(false);
        });

      void load();
      const polling = getDataSource() === 'http' ? setInterval(() => { void load(true); }, 3000) : undefined;

      return () => {
        isMounted = false;
        if (polling !== undefined) clearInterval(polling);
      };
    }, [currentUser]),
  );

  return { rides, isLoading, error };
}
