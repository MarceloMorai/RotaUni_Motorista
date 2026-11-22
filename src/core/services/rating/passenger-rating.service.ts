import { apiClient } from '@/core/services/api/api-client';
import { getDataSource } from '@/core/state/data-source';
import { asyncStorageAdapter } from '@/core/storage/async-storage.adapter';
import { StorageKeys } from '@/core/storage/storage.keys';

export async function isPassengerRated(historyId: string) {
  const ratings = await asyncStorageAdapter.get<Record<string, number>>(StorageKeys.passengerRatings);
  return ratings?.[historyId] !== undefined;
}

export async function ratePassenger(historyId: string, score: number) {
  const result = getDataSource() === 'mock' ? { historyId, score } : await apiClient.post('/passenger-ratings', { historyId, score });
  const ratings = await asyncStorageAdapter.get<Record<string, number>>(StorageKeys.passengerRatings) ?? {};
  await asyncStorageAdapter.set(StorageKeys.passengerRatings, { ...ratings, [historyId]: score });
  return result;
}
