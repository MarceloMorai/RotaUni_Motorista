import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { testDriver } from '@/core/data/test-driver';
import { validateRegistration, ValidationError } from '@/core/domain/auth/registration';
import type { VehicleInput } from '@/core/domain/vehicle/vehicle.types';
import { useAppState } from '@/core/state/app-provider';

import { AppButton } from '@/ui/components/app-button/app-button';
import { FormField } from '@/ui/components/form-field/form-field';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { emptyVehicleInput, VehicleFormFields } from '@/ui/components/vehicle-form-fields/vehicle-form-fields';

import { styles } from './cadastro.styles';

function getRegistrationErrorMessage(error: unknown) {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Error) {
    if (error.message === 'EMAIL_ALREADY_EXISTS') return 'Este email já está cadastrado.';
    return error.message || 'Não foi possível criar a conta.';
  }
  return 'Não foi possível criar a conta.';
}

function randomMercosurPlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  return `${pick(letters)}${pick(letters)}${pick(letters)}${pick(digits)}${pick(letters)}${pick(digits)}${pick(digits)}`;
}

export default function CadastroScreen() {
  const { register } = useAppState();
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [campus, setCampus] = useState('');
  const [course, setCourse] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [vehicle, setVehicle] = useState<VehicleInput>(emptyVehicleInput);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function fillWithTestData() {
    setName(testDriver.profile.name);
    setUniversity(testDriver.profile.university);
    setCampus(testDriver.profile.campus);
    setCourse(testDriver.profile.course ?? '');
    setEmail(`${testDriver.email.replace('@', `.${Date.now()}@`)}`);
    setPassword(testDriver.password);
    setPasswordConfirmation(testDriver.password);
    setVehicle({ ...testDriver.vehicle, plate: randomMercosurPlate() });
    setError('');
  }

  async function handleSubmit() {
    const profile = { name, university, campus, course };
    const validationError = validateRegistration({ profile, email, password, passwordConfirmation, vehicle });
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setError('');

    try {
      // Ao concluir, a conta já fica logada e o guard leva para a home.
      await register({ email, password }, profile, vehicle);
    } catch (registrationError) {
      setError(getRegistrationErrorMessage(registrationError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText style={styles.brand}>RotaUni Motorista</ThemedText>
        <ThemedText type="subtitle">Ofereça caronas</ThemedText>
        <ThemedText style={styles.description}>
          Crie seu perfil de motorista e leve outros universitários pelo seu caminho.
        </ThemedText>
      </View>

      {process.env.EXPO_PUBLIC_ENABLE_TEST_DATA !== 'false' ? (
        <AppButton compact variant="outline" label="Preencher com dados de teste" onPress={fillWithTestData} />
      ) : null}

      <View style={styles.form}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Seus dados</ThemedText>
          <FormField label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" autoCapitalize="words" />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
          />
          <FormField label="Curso" value={course} onChangeText={setCourse} placeholder="Seu curso" autoCapitalize="words" />
          <FormField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
          />
          <FormField
            label="Confirmar senha"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Repita sua senha"
            secureTextEntry
          />
          <FormField
            label="Faculdade"
            value={university}
            onChangeText={setUniversity}
            placeholder="Nome da faculdade"
            autoCapitalize="words"
          />
          <FormField
            label="Campus"
            value={campus}
            onChangeText={setCampus}
            placeholder="De onde suas caronas saem"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Seu veículo</ThemedText>
          <VehicleFormFields value={vehicle} onChange={setVehicle} />
        </View>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        <AppButton label="Criar conta" loadingLabel="Criando..." isLoading={isSubmitting} onPress={handleSubmit} />
        <Link href="/login" asChild>
          <Pressable style={styles.link}>
            <ThemedText type="linkPrimary">Já tenho uma conta</ThemedText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
