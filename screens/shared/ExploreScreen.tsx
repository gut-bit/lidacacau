import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ExpandableMapWidget } from '@/components/ExpandableMapWidget';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

function AnimatedMenuItem({ icon, title, subtitle, color, onPress, badge }: MenuItemProps) {
  const { theme: colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.menuItem, { backgroundColor: colors.card }, Shadows.card, animatedStyle]}>
        <View style={[styles.menuIconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.menuContent}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>{title}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>{subtitle}</ThemedText>
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 10 }}>{badge}</ThemedText>
          </View>
        ) : (
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        )}
      </Animated.View>
    </Pressable>
  );
}

interface CategoryCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  count: number;
  color: string;
  onPress: () => void;
}

function CategoryCard({ icon, title, count, color, onPress }: CategoryCardProps) {
  const { theme: colors } = useTheme();
  
  return (
    <Pressable
      style={[styles.categoryCard, { backgroundColor: color + '15' }]}
      onPress={onPress}
    >
      <View style={[styles.categoryIcon, { backgroundColor: color }]}>
        <Feather name={icon} size={22} color="#FFFFFF" />
      </View>
      <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.sm }}>{title}</ThemedText>
      <ThemedText type="small" style={{ color: colors.textSecondary }}>{count} vagas</ThemedText>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, activeRole } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;
  const [searchRadius, setSearchRadius] = useState(50);
  const [showMap, setShowMap] = useState(Platform.OS === 'web');

  const isWorker = activeRole === 'worker';

  const menuItems: MenuItemProps[] = [
    {
      icon: 'map',
      title: 'Rural Connect',
      subtitle: 'Estradas e Infraestrutura Rural',
      color: colors.primary,
      onPress: () => navigation.navigate('CommunityHome' as any),
    },
    {
      icon: 'map-pin',
      title: 'Mapa de Atividades',
      subtitle: 'Veja o que esta acontecendo na regiao',
      color: colors.accent,
      onPress: () => {},
    },
    {
      icon: 'clock',
      title: 'Historico de Servicos',
      subtitle: 'Todos os seus servicos anteriores',
      color: colors.secondary,
      onPress: () => navigation.navigate('ServiceHistory'),
    },
    {
      icon: 'credit-card',
      title: 'Pagamentos PIX',
      subtitle: 'Historico e configuracoes de pagamento',
      color: colors.accent,
      onPress: () => navigation.navigate('PaymentHistory'),
      badge: 'PIX',
    },
    {
      icon: 'file-text',
      title: 'Contratos',
      subtitle: 'Modelos de contrato de empreitada',
      color: '#6366F1',
      onPress: () => navigation.navigate('ContractTemplate', {}),
    },
    {
      icon: 'award',
      title: 'Clube LidaCacau',
      subtitle: 'Descontos exclusivos com parceiros',
      color: '#F59E0B',
      onPress: () => navigation.navigate('BenefitsClub'),
      badge: '6',
    },
    {
      icon: 'users',
      title: 'Indique e Ganhe',
      subtitle: 'Convide amigos e ganhe XP',
      color: '#10B981',
      onPress: () => navigation.navigate('Referral'),
    },
    {
      icon: 'image',
      title: 'Meu Portfolio',
      subtitle: 'Mostre seu trabalho',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Portfolio'),
    },
    {
      icon: 'help-circle',
      title: 'Ajuda e Suporte',
      subtitle: 'Perguntas frequentes e contato',
      color: '#6B7280',
      onPress: () => navigation.navigate('FAQSupport'),
    },
  ];

  const serviceCategories = [
    { icon: 'scissors' as const, title: 'Poda', count: 12, color: colors.primary },
    { icon: 'shopping-bag' as const, title: 'Colheita', count: 23, color: colors.accent },
    { icon: 'wind' as const, title: 'Rocagem', count: 8, color: '#10B981' },
    { icon: 'home' as const, title: 'Pedreiro', count: 15, color: colors.secondary },
    { icon: 'zap' as const, title: 'Eletricista', count: 9, color: '#F59E0B' },
    { icon: 'droplet' as const, title: 'Encanador', count: 6, color: '#3B82F6' },
    { icon: 'tool' as const, title: 'Serralheiro', count: 4, color: '#6366F1' },
    { icon: 'edit-3' as const, title: 'Pintor', count: 11, color: '#EC4899' },
    { icon: 'box' as const, title: 'Carpinteiro', count: 5, color: '#8B5CF6' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing['2xl'] }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <ThemedText type="h2">Explorar</ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: 4 }}>
            Descubra oportunidades e recursos
          </ThemedText>
        </View>

        <View style={styles.mapSection}>
          <ExpandableMapWidget minimized={false} />
        </View>

        {isWorker ? (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Feather name="grid" size={20} color={colors.primary} />
              <ThemedText type="h4" style={{ color: colors.primary }}>
                Categorias de Trabalho
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {serviceCategories.map((category, index) => (
                <CategoryCard
                  key={index}
                  icon={category.icon}
                  title={category.title}
                  count={category.count}
                  color={category.color}
                  onPress={() => {
                    Alert.alert(
                      category.title,
                      `${category.count} vagas disponiveis nesta categoria. Use o mapa ou a tela inicial para ver os trabalhos disponiveis.`,
                      [{ text: 'OK' }]
                    );
                  }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.featuredSection}>
          <View style={[styles.featuredCard, { backgroundColor: colors.primary }]}>
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadge}>
                <Feather name="zap" size={14} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: '700' }}>NOVO</ThemedText>
              </View>
              <ThemedText type="h3" style={{ color: '#FFFFFF', marginTop: Spacing.sm }}>
                Capacitacao Profissional
              </ThemedText>
              <ThemedText type="body" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                Aprenda novas habilidades e suba de nivel
              </ThemedText>
              <Pressable 
                style={styles.featuredButton}
                onPress={() => navigation.navigate('Education')}
              >
                <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
                  Comecar Agora
                </ThemedText>
                <Feather name="arrow-right" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.featuredGraphic}>
              <Feather name="book-open" size={80} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable 
            style={[styles.quickAction, { backgroundColor: colors.success + '15' }]}
            onPress={() => navigation.navigate('IdentityVerification')}
          >
            <Feather name="shield" size={24} color={colors.success} />
            <ThemedText type="small" style={{ color: colors.success, fontWeight: '600', marginTop: 4 }}>
              Verificar
            </ThemedText>
          </Pressable>
          <Pressable 
            style={[styles.quickAction, { backgroundColor: colors.link + '15' }]}
            onPress={() => navigation.navigate('SocialLinks')}
          >
            <Feather name="share-2" size={24} color={colors.link} />
            <ThemedText type="small" style={{ color: colors.link, fontWeight: '600', marginTop: 4 }}>
              Redes
            </ThemedText>
          </Pressable>
          <Pressable 
            style={[styles.quickAction, { backgroundColor: colors.accent + '15' }]}
            onPress={() => navigation.navigate('PixSettings')}
          >
            <Feather name="dollar-sign" size={24} color={colors.accent} />
            <ThemedText type="small" style={{ color: colors.accent, fontWeight: '600', marginTop: 4 }}>
              PIX
            </ThemedText>
          </Pressable>
          <Pressable 
            style={[styles.quickAction, { backgroundColor: colors.secondary + '15' }]}
            onPress={() => navigation.navigate('ContractTemplate', {})}
          >
            <Feather name="file-text" size={24} color={colors.secondary} />
            <ThemedText type="small" style={{ color: colors.secondary, fontWeight: '600', marginTop: 4 }}>
              Contrato
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Feather name="menu" size={20} color={colors.text} />
            <ThemedText type="h4">Menu Completo</ThemedText>
          </View>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <AnimatedMenuItem key={index} {...item} />
            ))}
          </View>
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  mapSection: {
    marginBottom: Spacing.xl,
  },
  experimentalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  mapDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoriesSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  categoryCard: {
    width: 110,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  featuredCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  featuredContent: {
    flex: 1,
    zIndex: 1,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: Spacing.lg,
    alignSelf: 'flex-start',
    gap: 8,
  },
  featuredGraphic: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  menuSection: {
    marginBottom: Spacing.xl,
  },
  menuList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
