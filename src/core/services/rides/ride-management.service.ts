import * as Crypto from 'expo-crypto';

import type { RideRequest } from '@/core/domain/requests/ride-request.types';
import {
  getRemainingSeats,
  isActiveRide,
  isValidDepartureTime,
  isValidPrice,
  MAX_DESTINATION_LENGTH,
  MAX_RIDE_PRICE,
  type CreateRideInput,
  type Driver,
  type Ride,
} from '@/core/domain/rides/ride.types';
import type { Vehicle } from '@/core/domain/vehicle/vehicle.types';
import { rideRequestsRepository, ridesRepository } from '@/core/services/factories/repository-factory';
import { createSimulatedRequests } from '@/core/services/requests/simulated-requests.service';
import { getDataSource } from '@/core/state/data-source';


/**
 * Erro de regra de negócio. A mensagem já é escrita para ser exibida ao motorista.
 */
export class RideRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RideRuleError';
  }
}

type CreateRideParams = {
  driver: Driver;
  vehicle: Vehicle;
  origin: string;
  input: CreateRideInput;
};

export async function createRide({ driver, vehicle, origin, input }: CreateRideParams) {
  const destination = input.destination.trim();

  if (!destination) throw new RideRuleError('Informe o destino.');
  if (destination.length > MAX_DESTINATION_LENGTH) {
    throw new RideRuleError(`O destino deve ter no máximo ${MAX_DESTINATION_LENGTH} caracteres.`);
  }
  if (!isValidDepartureTime(input.departureTime)) {
    throw new RideRuleError('Informe o horário de saída no formato HH:MM.');
  }
  if (
    !Number.isInteger(input.totalCapacity) ||
    input.totalCapacity < 1 ||
    input.totalCapacity > vehicle.seats
  ) {
    throw new RideRuleError(`O número de vagas deve ficar entre 1 e ${vehicle.seats}.`);
  }
  if (!isValidPrice(input.price)) {
    throw new RideRuleError(
      `O valor deve ser maior que zero, no máximo R$ ${MAX_RIDE_PRICE} e com até 2 casas decimais.`,
    );
  }

  const driverRides = await ridesRepository.listByDriver(driver.id);
  const hasConflict = driverRides.some(
    (ride) => isActiveRide(ride) && ride.departureTime === input.departureTime,
  );

  if (hasConflict) {
    throw new RideRuleError('Você já tem uma carona ativa com esse horário de saída.');
  }

  const ride: Ride = {
    id: Crypto.randomUUID(),
    driver,
    vehicle: vehicle.model,
    vehicleColor: vehicle.color,
    departureTime: input.departureTime,
    destination,
    totalCapacity: input.totalCapacity,
    confirmedPassengers: 0,
    passengerNames: [],
    price: input.price,
    origin,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  const savedRide = await ridesRepository.createRide(ride);

  if (savedRide.id === ride.id) {
    await rideRequestsRepository.saveRequests(createSimulatedRequests(savedRide));
  }

  return savedRide;
}

export async function acceptRequest(driverId: string, rideId: string, requestId: string) {
  const ride = await getOwnedRide(driverId, rideId);
  const request = await getPendingRequest(rideId, requestId);

  if (ride.status !== 'scheduled' && ride.status !== 'open') {
    throw new RideRuleError('Só é possível aceitar passageiros antes de iniciar a carona.');
  }
  if (getRemainingSeats(ride) === 0) {
    throw new RideRuleError('A carona já está lotada.');
  }

  await rideRequestsRepository.updateRequest({
    ...request,
    status: 'accepted',
    respondedAt: new Date().toISOString(),
  });

  return ridesRepository.updateRide({
    ...ride,
    confirmedPassengers: ride.confirmedPassengers + 1,
    passengerNames: [...ride.passengerNames, request.passenger.name],
  });
}

export async function rejectRequest(driverId: string, rideId: string, requestId: string) {
  const ride = await getOwnedRide(driverId, rideId);
  const request = await getPendingRequest(rideId, requestId);

  if (ride.status !== 'scheduled' && ride.status !== 'open') {
    throw new RideRuleError('Só é possível recusar passageiros antes de iniciar a carona.');
  }

  await rideRequestsRepository.updateRequest({
    ...request,
    status: 'rejected',
    respondedAt: new Date().toISOString(),
  });

  return ride;
}

export async function startRide(driverId: string, rideId: string) {
  console.info(`[RotaUni Motorista] startRide iniciado rideId=${rideId} driverId=${driverId}`);
  const ride = await getOwnedRide(driverId, rideId);
  console.info(`[RotaUni Motorista] carona carregada status=${ride.status} passageiros=${ride.confirmedPassengers}`);

  if (ride.status !== 'scheduled' && ride.status !== 'open') {
    throw new RideRuleError('Esta carona não pode ser iniciada.');
  }
  if (ride.confirmedPassengers === 0) {
    throw new RideRuleError('Aceite pelo menos um passageiro antes de iniciar a carona.');
  }

  const driverRides = await ridesRepository.listByDriver(driverId);

  if (driverRides.some((driverRide) => driverRide.status === 'in-progress' || driverRide.status === 'in_progress')) {
    throw new RideRuleError('Você já tem uma carona em andamento. Finalize-a primeiro.');
  }

  await rejectPendingRequests(rideId);
  console.info(`[RotaUni Motorista] enviando atualização de início rideId=${rideId}`);

  return ridesRepository.updateRide({
    ...ride,
    status: 'in-progress',
    startedAt: new Date().toISOString(),
  });
}

export async function finalizeRide(driverId: string, rideId: string) {
  const ride = await getOwnedRide(driverId, rideId);

  if (ride.status !== 'in-progress' && ride.status !== 'in_progress') {
    throw new RideRuleError('Só é possível finalizar uma carona em andamento.');
  }

  const finalizedRide = await ridesRepository.updateRide({
    ...ride,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  if (getDataSource() === 'mock') {
    const requests = await rideRequestsRepository.listByRide(rideId);
    await Promise.all(requests.filter((request) => request.status === 'accepted').map((request) =>
      rideRequestsRepository.updateRequest({
        ...request,
        status: 'completed',
        historyId: Crypto.randomUUID(),
      }),
    ));
  }

  return finalizedRide;
}

export async function cancelRide(driverId: string, rideId: string) {
  const ride = await getOwnedRide(driverId, rideId);

  if (ride.status !== 'scheduled' && ride.status !== 'open') {
    throw new RideRuleError('Só é possível cancelar uma carona que ainda não começou.');
  }

  await rejectPendingRequests(rideId);

  return ridesRepository.updateRide({
    ...ride,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
}

async function getOwnedRide(driverId: string, rideId: string) {
  const ride = await ridesRepository.getRideById(rideId);

  if (!ride || ride.driver.id !== driverId) {
    throw new RideRuleError('Carona não encontrada.');
  }

  return ride;
}

async function getPendingRequest(rideId: string, requestId: string): Promise<RideRequest> {
  const requests = await rideRequestsRepository.listByRide(rideId);
  const request = requests.find((storedRequest) => storedRequest.id === requestId);

  if (!request) throw new RideRuleError('Solicitação não encontrada.');
  if (request.status !== 'pending') throw new RideRuleError('Esta solicitação já foi respondida.');

  return request;
}

async function rejectPendingRequests(rideId: string) {
  const requests = await rideRequestsRepository.listByRide(rideId);
  const respondedAt = new Date().toISOString();

  for (const request of requests) {
    if (request.status === 'pending') {
      await rideRequestsRepository.updateRequest({ ...request, status: 'rejected', respondedAt });
    }
  }
}
