export type RideRequestStatus = 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export type RequestPassenger = {
  id: string;
  name: string;
  university: string;
  course: string;
  campus?: string;
  rating: number | null;
  historyId?: string | null;
};

export type RideRequest = {
  id: string;
  rideId: string;
  passenger: RequestPassenger;
  status: RideRequestStatus;
  createdAt: string;
  respondedAt?: string;
  historyId?: string | null;
};
