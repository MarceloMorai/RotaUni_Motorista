import type { CreateUserInput } from '@/core/domain/user/user.types';
import type { VehicleInput } from '@/core/domain/vehicle/vehicle.types';

// Dados fictícios para testar o app em desenvolvimento. O botão que usa estes dados só aparece
// com __DEV__, mas o arquivo ainda vai junto no bundle: nunca coloque dados reais aqui.
export const testDriver = {
  email: 'motorista.novo@rotauni.com.br',
  password: 'teste1234',
  profile: {
    name: 'Rafael Albuquerque',
    university: 'Estácio',
    campus: 'Parangaba',
    course: 'Engenharia de Software',
  } satisfies CreateUserInput,
  vehicle: {
    model: 'Honda Civic',
    color: 'Prata',
    plate: 'XYZ9K88', // não colide com os veículos seed da API
    seats: 4,
  } satisfies VehicleInput,
};
