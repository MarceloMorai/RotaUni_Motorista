import { userAccountRepository as localAccounts } from '@/core/services/auth/user-account.repository';
import { sessionRepository as localSession } from '@/core/services/auth/local-session.repository';
import { userRepository as localUsers } from '@/core/services/user/user.repository';
import { vehicleRepository as localVehicles } from '@/core/services/vehicle/local-vehicle.repository';
import { ridesRepository as localRides } from '@/core/services/rides/local-rides.repository';
import { rideRequestsRepository as localRequests } from '@/core/services/requests/local-ride-requests.repository';
import { HttpUserAccountRepository, HttpSessionRepository, HttpUserRepository, HttpVehicleRepository, HttpRidesRepository, HttpRideRequestsRepository } from '@/core/services/api/http-repositories';
import { getDataSource } from '@/core/state/data-source';
import type { UserAccountRepository } from '@/core/services/auth/user-account.repository'; import type { UserRepository } from '@/core/services/user/user.repository'; import type { VehicleRepository } from '@/core/services/vehicle/vehicle.repository'; import type { RidesRepository } from '@/core/services/rides/rides.repository'; import type { RideRequestsRepository } from '@/core/services/requests/ride-requests.repository'; import type { SessionRepository } from '@/core/services/auth/session.repository';
const httpAccounts = new HttpUserAccountRepository(); const httpSession = new HttpSessionRepository(); const httpUsers = new HttpUserRepository(); const httpVehicles = new HttpVehicleRepository(); const httpRides = new HttpRidesRepository(); const httpRequests = new HttpRideRequestsRepository();

// Os repositórios locais são singletons exportados pelos módulos. Mantê-los aqui
// evita perder os dados em memória entre chamadas do proxy no modo mock.
const mockAccounts = localAccounts;
const mockSession = localSession;
const mockUsers = localUsers;
const mockVehicles = localVehicles;
const mockRides = localRides;
const mockRequests = localRequests;

function dynamic(http: any, mock: any): any {
  return new Proxy({}, {
    get: (_, key: PropertyKey) => (...args: any[]) => {
      const target = getDataSource() === 'http' ? http : mock;
      const method = target[key];
      return typeof method === 'function' ? method.apply(target, args) : method;
    },
  });
}
export const userAccountRepository = dynamic(httpAccounts, mockAccounts) as UserAccountRepository;
export const sessionRepository = dynamic(httpSession, mockSession) as SessionRepository;
export const userRepository = dynamic(httpUsers, mockUsers) as UserRepository;
export const vehicleRepository = dynamic(httpVehicles, mockVehicles) as VehicleRepository;
export const ridesRepository = dynamic(httpRides, mockRides) as RidesRepository;
export const rideRequestsRepository = dynamic(httpRequests, mockRequests) as RideRequestsRepository;
