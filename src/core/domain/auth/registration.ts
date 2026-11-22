import type { CreateUserInput } from '@/core/domain/user/user.types';
import { validateVehicleInput, type VehicleInput } from '@/core/domain/vehicle/vehicle.types';

import { isValidEmail, normalizeEmail } from './email';

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Erro de validação de dados. A mensagem já é escrita para ser exibida ao usuário.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export type RegistrationInput = {
  profile: CreateUserInput;
  email: string;
  password: string;
  // Só a tela tem a confirmação; quando informada, também é validada.
  passwordConfirmation?: string;
  vehicle: VehicleInput;
};

export function normalizeProfileInput(profile: CreateUserInput): CreateUserInput {
  return {
    name: profile.name.trim(),
    university: profile.university.trim(),
    campus: profile.campus.trim(), course: profile.course?.trim() || 'Não informado',
  };
}

// Retorna a mensagem de erro a exibir, ou null se o cadastro for válido.
export function validateRegistration({ profile, email, password, passwordConfirmation, vehicle }: RegistrationInput) {
  const { name, university, campus } = normalizeProfileInput(profile);
  const normalizedEmail = normalizeEmail(email);
  const missingConfirmation = passwordConfirmation !== undefined && !passwordConfirmation;

  if (!name || !university || !campus || !normalizedEmail || !password || missingConfirmation) {
    return 'Preencha todos os seus dados.';
  }
  if (!isValidEmail(normalizedEmail)) return 'Informe um email válido.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (passwordConfirmation !== undefined && password !== passwordConfirmation) {
    return 'As senhas não conferem.';
  }

  return validateVehicleInput(vehicle);
}
