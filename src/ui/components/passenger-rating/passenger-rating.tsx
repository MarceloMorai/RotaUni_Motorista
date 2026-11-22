import { Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import type { RideRequest } from '@/core/domain/requests/ride-request.types';
import { isPassengerRated, ratePassenger } from '@/core/services/rating/passenger-rating.service';
import { AppButton } from '@/ui/components/app-button/app-button';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { ThemedView } from '@/ui/components/themed-view/themed-view';

export function PassengerRating({ request }: { request: RideRequest }) {
  const [score, setScore] = useState(0);
  const [rated, setRated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (request.historyId) isPassengerRated(request.historyId).then(setRated);
  }, [request.historyId]);
  if (request.status !== 'completed' || !request.historyId) return null;
  async function submit() {
    if (!score) return;
    try { await ratePassenger(request.historyId!, score); setRated(true); }
    catch (cause) {
      if (cause instanceof Error && 'status' in cause && (cause as { status: number }).status === 400) setRated(true);
      else setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a avaliação.');
    }
  }
  return <ThemedView type="backgroundElement" style={{ padding: 16, gap: 8 }}>
    <ThemedText type="smallBold">Avaliar {request.passenger.name}</ThemedText>
    {rated ? <ThemedText>Avaliado</ThemedText> : <>
      <View style={{ flexDirection: 'row', gap: 8 }}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setScore(value)}><ThemedText style={{ fontSize: 28, color: score >= value ? '#B76E00' : '#AAB2C0' }}>★</ThemedText></Pressable>)}</View>
      <AppButton compact label="Enviar avaliação" disabled={!score} onPress={submit} />
    </>}
    {error ? <ThemedText>{error}</ThemedText> : null}
  </ThemedView>;
}
