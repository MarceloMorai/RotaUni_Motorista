import * as Crypto from 'expo-crypto';

import type { CreateAccountInput, UserAccount } from '@/core/domain/auth/user-account.types';
import { asyncStorageAdapter } from '@/core/storage/async-storage.adapter';
import { StorageKeys } from '@/core/storage/storage.keys';

import {
  createPasswordMaterial,
  normalizeEmail,
  verifyPassword,
} from './password.service';

export interface UserAccountRepository {
  createAccount(input: CreateAccountInput): Promise<UserAccount>;
  findByEmail(email: string): Promise<UserAccount | null>;
  getById(id: string): Promise<UserAccount | null>;
  verifyCredentials(email: string, password: string): Promise<UserAccount | null>;
  emailExists(email: string): Promise<boolean>;
  deleteAccount?(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export class LocalUserAccountRepository implements UserAccountRepository {
  async createAccount(input: CreateAccountInput) {
    const email = normalizeEmail(input.email);
    const accounts = await this.getAccounts();

    if (accounts.some((account) => account.email === email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const account: UserAccount = {
      id: Crypto.randomUUID(),
      email,
      ...(await createPasswordMaterial(input.password)),
      createdAt: new Date().toISOString(),
    };

    await asyncStorageAdapter.set(StorageKeys.accounts, [...accounts, account]);
    return account;
  }

  async findByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const accounts = await this.getAccounts();
    return accounts.find((account) => account.email === normalizedEmail) ?? null;
  }

  async getById(id: string) {
    const accounts = await this.getAccounts();
    return accounts.find((account) => account.id === id) ?? null;
  }

  async verifyCredentials(email: string, password: string) {
    const account = await this.findByEmail(email);
    if (!account) return null;

    const isValid = await verifyPassword(
      password,
      account.passwordSalt,
      account.passwordHash,
      account.passwordIterations,
    );
    return isValid ? account : null;
  }

  async emailExists(email: string) {
    return (await this.findByEmail(email)) !== null;
  }

  async deleteAccount(id: string) {
    const accounts = await this.getAccounts();
    await asyncStorageAdapter.set(
      StorageKeys.accounts,
      accounts.filter((account) => account.id !== id),
    );
  }

  async clearAll() {
    await asyncStorageAdapter.remove(StorageKeys.accounts);
  }

  private async getAccounts() {
    return (await asyncStorageAdapter.get<UserAccount[]>(StorageKeys.accounts)) ?? [];
  }
}

export const userAccountRepository: UserAccountRepository = new LocalUserAccountRepository();
