import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getRelativeTime } from '@/utils/format';

interface Notification {
  id: string;
  type: 'bid' | 'contract' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    jobId?: string;
    workOrderId?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'bid',
    title: 'Nova proposta recebida',
    message: 'Voce recebeu uma nova proposta para o servico de Poda de Limpeza.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    data: { jobId: '1' },
  },
  {
    id: '2',
    type: 'contract',
    title: 'Contrato assinado',
    message: 'O contrato de empreitada foi assinado por ambas as partes.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    data: { workOrderId: '1' },
  },
  {
    id: '3',
    type: 'review',
    title: 'Nova avaliacao',
    message: 'Voce recebeu uma avaliacao de 5 estrelas!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    type: 'payment',
    title: 'Pagamento confirmado',
    message: 'O pagamento PIX de R$ 500,00 foi confirmado.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: '5',
    type: 'system',
    title: 'Bem-vindo ao LidaCacau!',
    message: 'Complete seu perfil para comecar a usar todas as funcionalidades.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

function getNotificationIcon(type: Notification['type']): keyof typeof Feather.glyphMap {
  switch (type) {
    case 'bid': return 'file-text';
    case 'contract': return 'edit-3';
    case 'review': return 'star';
    case 'payment': return 'credit-card';
    case 'system': return 'info';
    default: return 'bell';
  }
}

function getNotificationColor(type: Notification['type'], colors: typeof Colors.dark): string {
  switch (type) {
    case 'bid': return colors.primary;
    case 'contract': return colors.success;
    case 'review': return colors.accent;
    case 'payment': return colors.success;
    case 'system': return colors.link;
    default: return colors.textSecondary;
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme: colors, isDark } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );

    if (notification.data?.jobId) {
      navigation.navigate('JobDetail', { jobId: notification.data.jobId });
    } else if (notification.data?.workOrderId) {
      navigation.navigate('ContractSigning', {
        workOrderId: notification.data.workOrderId,
        isProducer: user?.role === 'producer',
      });
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {unreadCount > 0 ? (
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleMarkAllRead}
            >
              <Feather name="check-circle" size={16} color={colors.primary} />
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                Marcar todas como lidas
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.textSecondary + '20' }]}>
              <Feather name="bell-off" size={48} color={colors.textSecondary} />
            </View>
            <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
              Nenhuma notificacao
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
              Voce nao tem notificacoes no momento.{'\n'}Volte mais tarde!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const iconColor = getNotificationColor(notification.type, colors);
              
              return (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    { backgroundColor: colors.card },
                    !notification.read && styles.unreadCard,
                    !notification.read && { borderLeftColor: iconColor },
                    Shadows.card,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: iconColor + '20' }]}>
                    <Feather name={getNotificationIcon(notification.type)} size={20} color={iconColor} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
                        {notification.title}
                      </ThemedText>
                      {!notification.read ? (
                        <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />
                      ) : null}
                    </View>
                    <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
                      {notification.message}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm, fontSize: 11 }}>
                      {getRelativeTime(notification.createdAt)}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        )}

        {notifications.length > 0 ? (
          <Pressable
            style={[styles.clearButton, { borderColor: colors.error }]}
            onPress={handleClearAll}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
            <ThemedText type="body" style={{ color: colors.error, marginLeft: Spacing.sm }}>
              Limpar todas
            </ThemedText>
          </Pressable>
        ) : null}
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsList: {
    gap: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
});
