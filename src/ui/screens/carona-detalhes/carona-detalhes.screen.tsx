import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getRemainingSeats, getRideEarnings } from '@/core/domain/rides/ride.types';
import { useRide } from '@/core/hooks/use-ride';
import { useRideActions } from '@/core/hooks/use-ride-actions';

import { AppButton } from '@/ui/components/app-button/app-button';
import { ConfirmDialog } from '@/ui/components/confirm-dialog/confirm-dialog';
import { InfoRow } from '@/ui/components/info-row/info-row';
import { RequestCard } from '@/ui/components/request-card/request-card';
import { PassengerRating } from '@/ui/components/passenger-rating/passenger-rating';
import { RideStatusBadge } from '@/ui/components/ride-status-badge/ride-status-badge';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { ThemedView } from '@/ui/components/themed-view/themed-view';
import { formatCurrency, formatDateTime, formatPrice, pluralize } from '@/ui/utils/format';

import { styles } from './carona-detalhes.styles';

type PendingConfirmation = 'cancel' | 'finalize' | null;

export default function RideDetailsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { ride, requests, isLoading, error, reload } = useRide(rideId);
  const actions = useRideActions(rideId);
  const [confirmation, setConfirmation] = useState<PendingConfirmation>(null);

  if (isLoading) {
    return (
      <Screen showBack>
        <View style={styles.feedback}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Carregando carona...</ThemedText>
        </View>
      </Screen>
    );
  }

  if (error || !ride) {
    return (
      <Screen showBack>
        <ThemedText style={styles.error}>{error ?? 'Carona não encontrada.'}</ThemedText>
      </Screen>
    );
  }

  const isScheduled = ride.status === 'scheduled' || ride.status === 'open';
  const remainingSeats = getRemainingSeats(ride);
  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const isInProgress = ride.status === 'in_progress' || ride.status === 'in-progress';
  const visibleRequests = isScheduled
    ? requests
    : requests.filter((request) => ['accepted', 'confirmed', 'completed', 'rejected'].includes(request.status));

  async function runAndReload(action: () => Promise<unknown>) {
    const result = await action();
    if (result) reload();
  }

  async function handleConfirm() {
    const pending = confirmation;
    setConfirmation(null);

    if (pending === 'cancel') {
      await runAndReload(actions.cancelRide);
    }

    if (pending === 'finalize') {
      const finalizedRide = await actions.finalizeRide();
      if (finalizedRide) {
        router.replace({ pathname: '/carona-finalizada', params: { rideId: finalizedRide.id } });
      }
    }
  }

  return (
    <Screen showBack>
      <View style={styles.header}>
        <RideStatusBadge status={ride.status} />
        <ThemedText type="subtitle" style={styles.title}>
          {ride.origin} → {ride.destination}
        </ThemedText>
        <ThemedText style={styles.time}>Saída às {ride.departureTime}</ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <InfoRow label="Veículo" value={`${ride.vehicle} • ${ride.vehicleColor}`} />
        <InfoRow label="Valor por passageiro" value={formatPrice(ride.price)} />
        <InfoRow
          label="Passageiros"
          value={`${ride.confirmedPassengers}/${ride.totalCapacity}${
            isScheduled ? ` • ${pluralize(remainingSeats, 'vaga livre', 'vagas livres')}` : ''
          }`}
        />
        {ride.price !== null && ride.confirmedPassengers > 0 ? (
          <InfoRow
            label={ride.status === 'completed' ? 'Arrecadado' : 'Previsão de arrecadação'}
            value={formatCurrency(getRideEarnings(ride))}
          />
        ) : null}
        {ride.startedAt ? <InfoRow label="Iniciada em" value={formatDateTime(ride.startedAt)} /> : null}
        {ride.completedAt ? <InfoRow label="Finalizada em" value={formatDateTime(ride.completedAt)} /> : null}
        {ride.cancelledAt ? <InfoRow label="Cancelada em" value={formatDateTime(ride.cancelledAt)} /> : null}
      </ThemedView>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          {isScheduled
            ? `Solicitações${pendingRequests.length > 0 ? ` (${pendingRequests.length} aguardando)` : ''}`
            : 'Passageiros'}
        </ThemedText>
        {visibleRequests.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            {isScheduled ? 'Nenhuma solicitação por enquanto.' : 'Nenhum passageiro nesta carona.'}
          </ThemedText>
        ) : (
          visibleRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              canRespond={isScheduled}
              canAccept={remainingSeats > 0}
              isBusy={actions.pendingAction !== null}
              onAccept={() => runAndReload(() => actions.acceptRequest(request.id))}
              onReject={() => runAndReload(() => actions.rejectRequest(request.id))}
              footer={ride.status === 'completed' ? <PassengerRating request={request} /> : null}
            />
          ))
        )}
      </View>

      {actions.error ? <ThemedText style={styles.error}>{actions.error}</ThemedText> : null}

      {isScheduled ? (
        <View style={styles.actions}>
          {pendingRequests.length > 0 ? (
            <ThemedText style={styles.hint}>
              Ao iniciar, as solicitações ainda sem resposta serão recusadas.
            </ThemedText>
          ) : null}
          <AppButton
            variant="success"
            label="Iniciar carona"
            loadingLabel="Iniciando..."
            isLoading={actions.pendingAction === 'start'}
            disabled={actions.pendingAction !== null}
            onPress={() => { console.info('[RotaUni Motorista] Iniciar carona clicado'); void runAndReload(actions.startRide); }}
          />
          <AppButton
            variant="ghost-danger"
            label="Cancelar carona"
            disabled={actions.pendingAction !== null}
            onPress={() => setConfirmation('cancel')}
          />
        </View>
      ) : null}

      {isInProgress ? (
        <AppButton
          label="Finalizar carona"
          loadingLabel="Finalizando..."
          isLoading={actions.pendingAction === 'finalize'}
          onPress={() => setConfirmation('finalize')}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmation === 'cancel'}
        title="Cancelar carona"
        message="Os passageiros aceitos perderão a vaga e a carona não aparecerá no histórico."
        confirmLabel="Cancelar carona"
        destructive
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        visible={confirmation === 'finalize'}
        title="Finalizar carona"
        message="Confirme que todos os passageiros chegaram ao destino."
        confirmLabel="Finalizar"
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </Screen>
  );
}
