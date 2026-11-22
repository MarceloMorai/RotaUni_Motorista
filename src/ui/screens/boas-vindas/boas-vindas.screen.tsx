import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/ui/components/app-button/app-button';
import { Screen } from '@/ui/components/screen/screen';
import { ThemedText } from '@/ui/components/themed-text/themed-text';
import { ThemedView } from '@/ui/components/themed-view/themed-view';
import { useAppState } from '@/core/state/app-provider';

import { styles } from './boas-vindas.styles';

const benefits = [
  { icon: '🚗', title: 'Ofereça caronas', description: 'Publique seu trajeto, horário e quantas vagas tem.' },
  { icon: '🎓', title: 'Só universitários', description: 'Leve colegas que vão para o mesmo caminho.' },
  { icon: '💰', title: 'Divida os custos', description: 'Defina um valor por passageiro ou ofereça de graça.' },
];

export default function BoasVindasScreen() {
  const { dataSource, setDataSource } = useAppState();
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <ThemedText style={styles.brand}>RotaUni Motorista</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            Seu caminho pode levar alguém
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Ofereça caronas para universitários que vão para o mesmo lugar que você.
          </ThemedText>
        </View>

        <View style={styles.benefits}>
          {benefits.map((benefit) => (
            <ThemedView key={benefit.title} type="backgroundElement" style={styles.benefit}>
              <View style={styles.benefitIconCircle}>
                <ThemedText style={styles.benefitIcon}>{benefit.icon}</ThemedText>
              </View>
              <View style={styles.benefitText}>
                <ThemedText style={styles.benefitTitle}>{benefit.title}</ThemedText>
                <ThemedText style={styles.benefitDescription}>{benefit.description}</ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Criar conta de motorista" onPress={() => router.push('/cadastro')} />
        <AppButton variant="outline" label="Já tenho conta" onPress={() => router.push('/login')} />
        <Pressable style={styles.sourceToggle} onPress={() => void setDataSource(dataSource === 'http' ? 'mock' : 'http')}>
          <ThemedText style={styles.sourceLabel}>{dataSource === 'http' ? 'Modo: API (HTTP)' : 'Modo: Offline (Mock)'}</ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}
