import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';

import { getRideEarnings } from '@/core/domain/rides/ride.types';
import { useRide } from '@/core/hooks/use-ride';
import { rideRequestsRepository } from '@/core/services/factories/repository-factory';
import type { RideRequest } from '@/core/domain/requests/ride-request.types';

import { AppButton } from '@/ui/components/app-button/app-button';
import { InfoRow } from '@/ui/components/info-row/info-row';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { ThemedView } from '@/ui/components/themed-view/themed-view';
import { PassengerRating } from '@/ui/components/passenger-rating/passenger-rating';
import { formatCurrency, pluralize } from '@/ui/utils/format';

import { styles } from './carona-finalizada.styles';

export default function FinishedRideScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { ride, isLoading } = useRide(rideId);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (rideId) rideRequestsRepository.listByRide(rideId).then(setRequests).catch(() => setError('Não foi possível carregar os passageiros.')); }, [rideId]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.content}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  // Só mostra a comemoração para uma carona do motorista que foi mesmo finalizada.
  if (!ride || !(ride.status === 'completed' || ride.status === 'finished')) {
    return (
      <Screen>
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.title}>
            Carona não finalizada
          </ThemedText>
          <ThemedText style={styles.centered}>
            {ride ? 'Esta carona ainda não foi finalizada.' : 'Carona não encontrada.'}
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <AppButton label="Voltar ao início" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <ThemedText style={styles.check}>✓</ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          Carona finalizada!
        </ThemedText>
        <ThemedText style={styles.centered}>
          Obrigado por levar outros universitários pelo seu caminho.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <InfoRow label="Trajeto" value={`${ride.origin} → ${ride.destination}`} />
          <InfoRow
            label="Passageiros levados"
            value={pluralize(ride.confirmedPassengers, 'passageiro', 'passageiros')}
          />
          <InfoRow
            label="Arrecadado"
            value={ride.price === null ? 'Carona gratuita' : formatCurrency(getRideEarnings(ride))}
          />
        </ThemedView>
        {requests.filter((request) => request.status === 'completed' && request.historyId).map((request) => {
          return <PassengerRating key={request.id} request={request} />;
          /*
          const done = rated[request.id];
          return <ThemedView key={request.id} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Avaliar {request.passenger.name}</ThemedText>
            {done ? <ThemedText style={styles.centered}>Avaliado</ThemedText> : <>
              <View style={{ flexDirection: 'row', gap: 8 }}>{[1,2,3,4,5].map((score) => <Pressable key={score} onPress={() => setScores((current) => ({...current, [request.id]: score}))}><ThemedText style={{fontSize:28,color: (scores[request.id] ?? 0) >= score ? '#B76E00' : '#AAB2C0'}}>★</ThemedText></Pressable>)}</View>
              <AppButton compact label="Enviar avaliação" disabled={!scores[request.id]} onPress={async () => { try { await ratePassenger(request.historyId!, scores[request.id]); setRated((current) => ({...current, [request.id]: true})); } catch (e) { if (e instanceof Error && 'status' in e && (e as {status:number}).status === 400) setRated((current) => ({...current, [request.id]: true})); else setError('Não foi possível enviar a avaliação.'); } }} />
            </>}
          </ThemedView>;
          */
        })}
        {error ? <ThemedText style={styles.centered}>{error}</ThemedText> : null}
      </View>

      <View style={styles.actions}>
        <AppButton label="Voltar ao início" onPress={() => router.replace('/')} />
        <AppButton variant="outline" label="Ver histórico" onPress={() => router.replace('/historico')} />
      </View>
    </Screen>
  );
}
