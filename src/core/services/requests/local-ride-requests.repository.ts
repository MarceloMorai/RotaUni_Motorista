import type { RideRequest } from '@/core/domain/requests/ride-request.types';
import { asyncStorageAdapter } from '@/core/storage/async-storage.adapter';
import { StorageKeys } from '@/core/storage/storage.keys';

import type { RideRequestsRepository } from './ride-requests.repository';

export class LocalRideRequestsRepository implements RideRequestsRepository {
  private updateOperation: Promise<void> = Promise.resolve();
  async listByRide(rideId: string): Promise<RideRequest[]> {
    const requests = await this.getRequests();
    return requests
      .filter((request) => request.rideId === rideId)
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  async saveRequests(newRequests: RideRequest[]): Promise<void> {
    const requests = await this.getRequests();
    const existingIds = new Set(requests.map((request) => request.id));
    await asyncStorageAdapter.set(StorageKeys.rideRequests, [
      ...requests,
      ...newRequests.filter((request) => !existingIds.has(request.id)),
    ]);
  }

  async updateRequest(request: RideRequest): Promise<RideRequest> {
    // Serializa atualizações para que a finalização de vários passageiros não
    // faça chamadas concorrentes sobrescreverem umas às outras no storage.
    this.updateOperation = this.updateOperation.then(async () => {
      const requests = await this.getRequests();
      await asyncStorageAdapter.set(
        StorageKeys.rideRequests,
        requests.map((storedRequest) => (storedRequest.id === request.id ? request : storedRequest)),
      );
    });
    await this.updateOperation;
    return request;
  }

  clearAll(): Promise<void> {
    return this.updateOperation.then(() => asyncStorageAdapter.remove(StorageKeys.rideRequests));
  }

  private async getRequests(): Promise<RideRequest[]> {
    return (await asyncStorageAdapter.get<RideRequest[]>(StorageKeys.rideRequests)) ?? [];
  }
}

export const rideRequestsRepository: RideRequestsRepository = new LocalRideRequestsRepository();
