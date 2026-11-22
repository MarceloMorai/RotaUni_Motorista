/**
 * Os campos de `Driver` e de `Ride` até `price` seguem o mesmo formato do app do passageiro,
 * para que os dois apps possam consumir o mesmo contrato quando existir o backend.
 * Os campos abaixo de `price` são usados pelo lado do motorista.
 */
export type Driver = {
  id: string;
  name: string;
  rating: number | null; // null = motorista ainda sem avaliações
};

export type RideStatus = 'open' | 'in_progress' | 'finished' | 'cancelled' | 'scheduled' | 'in-progress' | 'completed';

export type Ride = {
  id: string;
  driver: Driver;
  vehicle: string;
  vehicleColor: string;
  departureTime: string;
  destination: string;
  totalCapacity: number;
  confirmedPassengers: number;
  passengerNames: string[];
  price: number | null; // null = gratuita
  origin: string;
  status: RideStatus;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
};

export type CreateRideInput = Pick<Ride, 'destination' | 'departureTime' | 'totalCapacity' | 'price'>;

export const MAX_DESTINATION_LENGTH = 60;
export const MAX_RIDE_PRICE = 100;

export function getRemainingSeats(ride: Ride) {
  return Math.max(ride.totalCapacity - ride.confirmedPassengers, 0);
}

export function isActiveRide(ride: Ride) {
  return ride.status === 'open' || ride.status === 'in_progress';
}

export function isValidDepartureTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidPrice(price: number | null) {
  return price === null || (Number.isFinite(price) && price > 0 && price <= MAX_RIDE_PRICE && hasAtMostTwoDecimals(price));
}

// Valor em centavos inteiros (ex.: 7,50). A tolerância cobre erros de ponto flutuante como 7.1 * 100.
function hasAtMostTwoDecimals(value: number) {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

export function getRideEarnings(ride: Ride) {
  return ride.price === null ? 0 : ride.price * ride.confirmedPassengers;
}
