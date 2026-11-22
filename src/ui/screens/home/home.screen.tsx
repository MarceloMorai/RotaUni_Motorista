import { router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getRideEarnings } from '@/core/domain/rides/ride.types';
import { useDriverRides } from '@/core/hooks/use-driver-rides';
import { useAppState } from '@/core/state/app-provider';

import { AppButton } from '@/ui/components/app-button/app-button';
import { RideCard } from '@/ui/components/ride-card/ride-card';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { ThemedView } from '@/ui/components/themed-view/themed-view';
import { formatCurrency, pluralize } from '@/ui/utils/format';

import { styles } from './home.styles';

export default function HomeScreen() {
  const { currentUser, currentVehicle } = useAppState();
  const { rides, isLoading, error } = useDriverRides();

  if (!currentUser) return null;

  const visibleRides = [...rides]
    .filter((ride) => ride.status !== 'cancelled')
    // A carona em andamento aparece primeiro; as finalizadas permanecem no histórico.
    .sort((first, second) => Number(second.status === 'in-progress') - Number(first.status === 'in-progress'));
  const completedRides = rides.filter((ride) => ride.status === 'completed');
  const totalPassengers = completedRides.reduce((total, ride) => total + ride.confirmedPassengers, 0);
  const totalEarnings = completedRides.reduce((total, ride) => total + getRideEarnings(ride), 0);

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Olá, {currentUser.name}!</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Suas caronas saem de:</ThemedText>
        <ThemedText style={styles.campus}>{currentUser.campus}</ThemedText>
        <View style={styles.headerActions}>
          <HeaderLink label="Perfil" onPress={() => router.push('/perfil')} />
          <HeaderLink label="Histórico" onPress={() => router.push('/historico')} />
        </View>
      </View>

      <View style={styles.stats}>
        <StatTile label="Caronas feitas" value={String(completedRides.length)} />
        <StatTile label="Passageiros levados" value={String(totalPassengers)} />
        <StatTile label="Arrecadado" value={formatCurrency(totalEarnings)} />
      </View>

      {currentVehicle ? (
        <AppButton label="+ Oferecer carona" onPress={() => router.push('/nova-carona')} />
      ) : (
        <ThemedView type="backgroundElement" style={styles.warning}>
          <ThemedText style={styles.warningText}>Cadastre um veículo para oferecer caronas.</ThemedText>
          <AppButton compact variant="outline" label="Cadastrar veículo" onPress={() => router.push('/veiculo')} />
        </ThemedView>
      )}

      <ThemedText style={styles.sectionTitle}>
        Minhas caronas
      </ThemedText>

      {isLoading ? (
        <View style={styles.feedback}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Carregando caronas...</ThemedText>
        </View>
      ) : error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : visibleRides.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>
            Você não tem caronas agendadas. Que tal oferecer uma agora?
          </ThemedText>
        </View>
      ) : (
        <View style={styles.ridesList}>
          {visibleRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              footer={
                ride.status === 'in-progress'
                  ? `Em andamento com ${pluralize(ride.confirmedPassengers, 'passageiro', 'passageiros')}`
                  : 'Toque para gerenciar passageiros'
              }
              onPress={() => router.push({ pathname: '/caronas/[rideId]', params: { rideId: ride.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function HeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerLink, pressed && styles.headerLinkPressed]}>
      <ThemedText style={styles.headerLinkText}>{label}</ThemedText>
    </Pressable>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statTile}>
      <ThemedText style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </ThemedView>
  );
}
