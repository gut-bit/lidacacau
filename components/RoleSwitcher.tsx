import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Spacing } from '@/constants/theme';

interface RoleSwitcherProps {
  compact?: boolean;
}

const ROLE_CONFIG = {
  producer: {
    label: 'Produtor',
    shortLabel: 'Prod',
    icon: 'briefcase' as const,
    color: '#2D5016',
    description: 'Publicar demandas e contratar trabalhadores',
  },
  worker: {
    label: 'Trabalhador',
    shortLabel: 'Trab',
    icon: 'tool' as const,
    color: '#8B4513',
    description: 'Encontrar trabalhos e enviar propostas',
  },
  admin: {
    label: 'Admin',
    shortLabel: 'Admin',
    icon: 'settings' as const,
    color: '#6B7280',
    description: 'Gerenciar plataforma',
  },
};

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { theme: colors } = useTheme();
  const { user, activeRole, switchRole, canSwitchToRole, enableRole } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const currentConfig = ROLE_CONFIG[activeRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.worker;
  const availableRoles: UserRole[] = ['producer', 'worker'];

  const handleRoleSwitch = async (role: UserRole) => {
    if (role === activeRole) {
      setShowModal(false);
      return;
    }

    setIsLoading(true);
    try {
      if (canSwitchToRole(role)) {
        await switchRole(role);
      } else {
        await enableRole(role);
      }
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  if (compact) {
    return (
      <Pressable
        style={[styles.compactButton, { backgroundColor: currentConfig.color + '20' }]}
        onPress={() => setShowModal(true)}
      >
        <Feather name={currentConfig.icon} size={16} color={currentConfig.color} />
        <Feather name="chevron-down" size={14} color={currentConfig.color} style={{ marginLeft: 2 }} />
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        style={[styles.switcherButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setShowModal(true)}
      >
        <View style={[styles.roleIcon, { backgroundColor: currentConfig.color + '20' }]}>
          <Feather name={currentConfig.icon} size={18} color={currentConfig.color} />
        </View>
        <View style={styles.roleInfo}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {currentConfig.label}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Trocar perfil
          </ThemedText>
        </View>
        <Feather name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Escolher Perfil</ThemedText>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ThemedText type="body" style={{ color: colors.textSecondary, marginBottom: Spacing.lg }}>
              Voce pode atuar como produtor e trabalhador. Alterne entre os perfis quando quiser.
            </ThemedText>

            {availableRoles.map((role) => {
              const config = ROLE_CONFIG[role];
              const isActive = role === activeRole;
              const hasRole = canSwitchToRole(role);

              return (
                <Pressable
                  key={role}
                  style={[
                    styles.roleOption,
                    { 
                      backgroundColor: isActive ? config.color + '15' : colors.backgroundDefault,
                      borderColor: isActive ? config.color : colors.border,
                    }
                  ]}
                  onPress={() => handleRoleSwitch(role)}
                  disabled={isLoading}
                >
                  <View style={[styles.roleOptionIcon, { backgroundColor: config.color + '20' }]}>
                    <Feather name={config.icon} size={24} color={config.color} />
                  </View>
                  <View style={styles.roleOptionInfo}>
                    <View style={styles.roleOptionHeader}>
                      <ThemedText type="h4">{config.label}</ThemedText>
                      {isActive ? (
                        <View style={[styles.activeBadge, { backgroundColor: config.color }]}>
                          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 10 }}>
                            ATIVO
                          </ThemedText>
                        </View>
                      ) : !hasRole ? (
                        <View style={[styles.newBadge, { backgroundColor: colors.accent }]}>
                          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 10 }}>
                            NOVO
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {config.description}
                    </ThemedText>
                  </View>
                  <Feather 
                    name={isActive ? 'check-circle' : 'circle'} 
                    size={24} 
                    color={isActive ? config.color : colors.border} 
                  />
                </Pressable>
              );
            })}

            <View style={[styles.tipBox, { backgroundColor: colors.backgroundDefault }]}>
              <Feather name="info" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1, marginLeft: 8 }}>
                Suas avaliacoes e nivel sao separados por perfil. Um produtor tambem pode trabalhar!
              </ThemedText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  roleOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
});
