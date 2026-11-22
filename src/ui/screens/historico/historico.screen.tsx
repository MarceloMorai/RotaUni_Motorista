import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { getRideEarnings } from '@/core/domain/rides/ride.types';
import { useDriverRides } from '@/core/hooks/use-driver-rides';

import { RideCard } from '@/ui/components/ride-card/ride-card';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { formatCurrency, formatDateTime } from '@/ui/utils/format';

import { styles } from './historico.styles';

export default function HistoryScreen() {
  const { rides, isLoading, error } = useDriverRides();

  // Regra: o histórico mostra apenas caronas finalizadas, da mais recente para a mais antiga.
  const completedRides = rides
    .filter((ride) => {
      const normalizedStatus = String(ride.status).trim().toLowerCase();
      return normalizedStatus === 'completed' || normalizedStatus === 'finished';
    })
    .sort((first, second) => (second.completedAt ?? '').localeCompare(first.completedAt ?? ''));

  return (
    <Screen showBack>
      <ThemedText type="subtitle">Histórico</ThemedText>

      {isLoading ? (
        <View style={styles.feedback}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Carregando histórico...</ThemedText>
        </View>
      ) : error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : completedRides.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>Você ainda não finalizou nenhuma carona.</ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {completedRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              footer={[
                ride.completedAt ? formatDateTime(ride.completedAt) : null,
                ride.price !== null ? `Arrecadado: ${formatCurrency(getRideEarnings(ride))}` : null,
              ]
                .filter(Boolean)
                .join(' • ')}
              onPress={() => router.push({ pathname: '/caronas/[rideId]', params: { rideId: ride.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
