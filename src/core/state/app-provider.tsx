import * as Crypto from 'expo-crypto';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { normalizeEmail } from '@/core/domain/auth/email';
import { normalizeProfileInput, validateRegistration, ValidationError } from '@/core/domain/auth/registration';
import type { CreateAccountInput, UserAccount } from '@/core/domain/auth/user-account.types';
import type { CreateUserInput, UserProfile } from '@/core/domain/user/user.types';
import {
  normalizePlate,
  validateVehicleInput,
  type Vehicle,
  type VehicleInput,
} from '@/core/domain/vehicle/vehicle.types';
import { sessionRepository, userAccountRepository, rideRequestsRepository, ridesRepository, userRepository, vehicleRepository } from '@/core/services/factories/repository-factory';
import { setActiveUserId } from '@/core/services/api/api-client';
import { getDataSource, getInitialDataSource, loadDataSource, persistDataSource, setDataSource as setRuntimeDataSource, type DataSource } from '@/core/state/data-source';

// O que as telas enxergam da conta: sem hash e salt da senha.
export type CurrentAccount = Pick<UserAccount, 'id' | 'email' | 'createdAt'>;

// 'missing-profile' = senha certa, mas a conta não tem perfil salvo (cadastro antigo incompleto).
export type LoginResult = 'success' | 'invalid-credentials' | 'missing-profile';

type AppState = {
  currentAccount: CurrentAccount | null;
  currentUser: UserProfile | null;
  currentVehicle: Vehicle | null;
  isHydrated: boolean;
  register: (account: CreateAccountInput, profile: CreateUserInput, vehicle: VehicleInput) => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  updateVehicle: (vehicle: VehicleInput) => Promise<void>;
  logout: () => Promise<void>;
  resetLocalData: () => Promise<void>;
  dataSource: DataSource;
  setDataSource: (source: DataSource) => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [currentAccount, setCurrentAccount] = useState<CurrentAccount | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataSource, setDataSourceState] = useState<DataSource>(getInitialDataSource);

  useEffect(() => {
    async function hydrate() {
      const source = await loadDataSource(); setDataSourceState(source);
      const session = await sessionRepository.getCurrentSession();
      if (!session) return;
      const account = await userAccountRepository.getById(session.accountId);
      setActiveUserId(session.accountId);
      const profile = account ? await userRepository.getByUserId(account.id) : null;

      if (!account || !profile) {
        // Sessão órfã (conta ou perfil não existem mais): descarta.
        await sessionRepository.clearSession();
        return;
      }

      const vehicle = await vehicleRepository.getByUserId(account.id);
      setCurrentAccount(toCurrentAccount(account));
      setCurrentUser(profile);
      setCurrentVehicle(vehicle);
    }

    hydrate()
      .catch(() => {})
      .finally(() => setIsHydrated(true));
  }, []);

  async function register(
    accountInput: CreateAccountInput,
    profileInput: CreateUserInput,
    vehicleInput: VehicleInput,
  ) {
    const validationError = validateRegistration({
      profile: profileInput,
      email: accountInput.email,
      password: accountInput.password,
      vehicle: vehicleInput,
    });
    if (validationError) throw new ValidationError(validationError);

    const account = await userAccountRepository.createAccount({
      email: normalizeEmail(accountInput.email),
      password: accountInput.password,
      ...profileInput,
    });
    setActiveUserId(account.id);
    const createdAt = new Date().toISOString();
    const profile: UserProfile = { ...normalizeProfileInput(profileInput), userId: account.id, createdAt, rating: null };
    const vehicle = buildVehicle(account.id, vehicleInput, createdAt);

    try {
      if (getDataSource() !== 'http') await userRepository.saveProfile(profile);
      await vehicleRepository.saveVehicle(vehicle);
      // Depois de criar a conta, o motorista já entra nela.
      await sessionRepository.saveSession({ accountId: account.id });
    } catch (saveError) {
      // Desfaz o cadastro pela metade, senão o email ficaria "já cadastrado" numa conta sem perfil.
      await rollbackRegistration(account.id);
      await sessionRepository.clearSession();
      throw saveError;
    }

    setCurrentAccount(toCurrentAccount(account));
    setCurrentUser(profile);
    setCurrentVehicle(vehicle);
  }

  async function login(email: string, password: string): Promise<LoginResult> {
    const account = await userAccountRepository.verifyCredentials(email, password);
    if (!account) return 'invalid-credentials';
    setActiveUserId(account.id);
    const profile = await userRepository.getByUserId(account.id);
    if (!profile) return 'missing-profile';
    const vehicle = await vehicleRepository.getByUserId(account.id);
    await sessionRepository.saveSession({ accountId: account.id });
    setCurrentAccount(toCurrentAccount(account));
    setCurrentUser(profile);
    setCurrentVehicle(vehicle);
    return 'success';
  }

  async function updateVehicle(vehicleInput: VehicleInput) {
    if (!currentAccount) return;

    const validationError = validateVehicleInput(vehicleInput);
    if (validationError) throw new ValidationError(validationError);

    const vehicle = {
      ...buildVehicle(currentAccount.id, vehicleInput, currentVehicle?.createdAt ?? new Date().toISOString()),
      id: currentVehicle?.id ?? Crypto.randomUUID(),
    };
    await vehicleRepository.saveVehicle(vehicle);
    setCurrentVehicle(vehicle);
  }

  async function logout() {
    await sessionRepository.clearSession();
    setActiveUserId(null);
    setCurrentAccount(null);
    setCurrentUser(null);
    setCurrentVehicle(null);
  }

  async function changeDataSource(source: DataSource) {
    await persistDataSource(source); setRuntimeDataSource(source); setDataSourceState(source);
    if (!currentAccount) { await sessionRepository.clearSession(); setActiveUserId(null); setCurrentUser(null); setCurrentVehicle(null); }
  }

  async function resetLocalData() {
    await Promise.all([
      sessionRepository.clearSession(),
      userAccountRepository.clearAll(),
      userRepository.clearAll(),
      vehicleRepository.clearAll(),
      ridesRepository.clearAll(),
      rideRequestsRepository.clearAll(),
    ]);
    setCurrentAccount(null);
    setCurrentUser(null);
    setCurrentVehicle(null);
  }

  return (
    <AppContext.Provider
      value={{
        currentAccount,
        currentUser,
        currentVehicle,
        isHydrated,
        register,
        login,
        updateVehicle,
        logout,
        resetLocalData,
        dataSource,
        setDataSource: changeDataSource,
      }}>
      {children}
    </AppContext.Provider>
  );
}

// Cada exclusão roda mesmo se outra falhar (allSettled): remove o máximo possível.
async function rollbackRegistration(accountId: string) {
  await Promise.allSettled([
    sessionRepository.clearSession(),
    vehicleRepository.deleteByUserId(accountId),
    userRepository.deleteProfile(accountId),
    userAccountRepository.deleteAccount?.(accountId) ?? Promise.resolve(),
  ]);
}

function toCurrentAccount({ id, email, createdAt }: UserAccount): CurrentAccount {
  return { id, email, createdAt };
}

function buildVehicle(userId: string, input: VehicleInput, createdAt: string): Vehicle {
  return {
    id: Crypto.randomUUID(),
    userId,
    model: input.model.trim(),
    color: input.color.trim(),
    plate: normalizePlate(input.plate),
    seats: input.seats,
    createdAt,
  };
}

export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }

  return context;
}
