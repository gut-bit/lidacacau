import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { SocialLinks } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

const SOCIAL_CONFIG = {
  whatsapp: {
    icon: 'message-circle',
    label: 'WhatsApp',
    color: '#25D366',
    placeholder: 'Numero com DDD (ex: 5591999999999)',
    prefix: 'https://wa.me/',
    formatLink: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      return `https://wa.me/${cleaned}`;
    },
  },
  whatsappGroup: {
    icon: 'users',
    label: 'Grupo WhatsApp',
    color: '#25D366',
    placeholder: 'Link do grupo (https://chat.whatsapp.com/...)',
    prefix: '',
    formatLink: (value: string) => value,
  },
  instagram: {
    icon: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    placeholder: '@usuario ou link completo',
    prefix: 'https://instagram.com/',
    formatLink: (value: string) => {
      if (value.startsWith('http')) return value;
      const username = value.replace('@', '');
      return `https://instagram.com/${username}`;
    },
  },
  facebook: {
    icon: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    placeholder: 'Link do perfil ou pagina',
    prefix: 'https://facebook.com/',
    formatLink: (value: string) => {
      if (value.startsWith('http')) return value;
      return `https://facebook.com/${value}`;
    },
  },
  telegram: {
    icon: 'send',
    label: 'Telegram',
    color: '#0088CC',
    placeholder: '@usuario ou link de grupo',
    prefix: 'https://t.me/',
    formatLink: (value: string) => {
      if (value.startsWith('http')) return value;
      const username = value.replace('@', '');
      return `https://t.me/${username}`;
    },
  },
  youtube: {
    icon: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    placeholder: 'Link do canal',
    prefix: 'https://youtube.com/',
    formatLink: (value: string) => {
      if (value.startsWith('http')) return value;
      return `https://youtube.com/${value}`;
    },
  },
  linkedin: {
    icon: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    placeholder: 'Link do perfil',
    prefix: 'https://linkedin.com/in/',
    formatLink: (value: string) => {
      if (value.startsWith('http')) return value;
      return `https://linkedin.com/in/${value}`;
    },
  },
};

type SocialKey = keyof typeof SOCIAL_CONFIG;

interface SocialLinksDisplayProps {
  socialLinks?: SocialLinks;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
  showEmpty?: boolean;
}

export function SocialLinksDisplay({
  socialLinks,
  showLabels = false,
  size = 'medium',
  showEmpty = false,
}: SocialLinksDisplayProps) {
  const { dark } = useTheme();
  const colors = dark ? Colors.dark : Colors.light;

  const iconSizes = {
    small: 18,
    medium: 24,
    large: 32,
  };

  const containerSizes = {
    small: 32,
    medium: 44,
    large: 56,
  };

  const handlePress = async (key: SocialKey, value: string) => {
    const config = SOCIAL_CONFIG[key];
    const url = config.formatLink(value);
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Nao foi possivel abrir o link');
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel abrir o link');
    }
  };

  const availableLinks = Object.entries(SOCIAL_CONFIG).filter(([key]) => {
    const value = socialLinks?.[key as SocialKey];
    return value && value.trim() !== '';
  });

  if (availableLinks.length === 0 && !showEmpty) {
    return null;
  }

  if (availableLinks.length === 0 && showEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="link" size={20} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhuma rede social configurada
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.displayContainer}>
      {availableLinks.map(([key]) => {
        const config = SOCIAL_CONFIG[key as SocialKey];
        const value = socialLinks?.[key as SocialKey];
        if (!value) return null;

        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.socialButton,
              {
                width: containerSizes[size],
                height: containerSizes[size],
                backgroundColor: pressed ? config.color : `${config.color}15`,
                borderColor: config.color,
              },
            ]}
            onPress={() => handlePress(key as SocialKey, value)}
          >
            {({ pressed }) => (
              <View style={styles.buttonContent}>
                <Feather
                  name={config.icon as any}
                  size={iconSizes[size]}
                  color={pressed ? '#FFFFFF' : config.color}
                />
                {showLabels ? (
                  <Text
                    style={[
                      styles.buttonLabel,
                      {
                        color: pressed ? '#FFFFFF' : config.color,
                        fontSize: size === 'small' ? 10 : 12,
                      },
                    ]}
                  >
                    {config.label}
                  </Text>
                ) : null}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

interface SocialLinksEditorProps {
  socialLinks?: SocialLinks;
  onSave: (links: SocialLinks) => void;
}

export function SocialLinksEditor({ socialLinks, onSave }: SocialLinksEditorProps) {
  const { dark } = useTheme();
  const colors = dark ? Colors.dark : Colors.light;
  const [links, setLinks] = useState<SocialLinks>(socialLinks || {});
  const [editingKey, setEditingKey] = useState<SocialKey | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (key: SocialKey) => {
    setEditingKey(key);
    setEditValue(links[key] || '');
  };

  const handleSaveField = () => {
    if (editingKey) {
      const newLinks = { ...links, [editingKey]: editValue.trim() };
      setLinks(newLinks);
      onSave(newLinks);
      setEditingKey(null);
      setEditValue('');
    }
  };

  const handleRemove = (key: SocialKey) => {
    const newLinks = { ...links };
    delete newLinks[key];
    setLinks(newLinks);
    onSave(newLinks);
  };

  return (
    <View style={styles.editorContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Redes Sociais
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Adicione suas redes sociais para facilitar o contato (opcional)
      </Text>

      {Object.entries(SOCIAL_CONFIG).map(([key, config]) => {
        const value = links[key as SocialKey];
        const hasValue = value && value.trim() !== '';

        return (
          <View
            key={key}
            style={[
              styles.fieldRow,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${config.color}15` },
              ]}
            >
              <Feather name={config.icon as any} size={22} color={config.color} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {config.label}
              </Text>
              {hasValue ? (
                <Text
                  style={[styles.fieldValue, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {value}
                </Text>
              ) : (
                <Text style={[styles.fieldEmpty, { color: colors.textSecondary }]}>
                  Nao configurado
                </Text>
              )}
            </View>
            <View style={styles.fieldActions}>
              {hasValue ? (
                <>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEdit(key as SocialKey)}
                  >
                    <Feather name="edit-2" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleRemove(key as SocialKey)}
                  >
                    <Feather name="trash-2" size={18} color={colors.error} />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[styles.addButton, { borderColor: config.color }]}
                  onPress={() => handleEdit(key as SocialKey)}
                >
                  <Feather name="plus" size={16} color={config.color} />
                  <Text style={[styles.addButtonText, { color: config.color }]}>
                    Adicionar
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      <Modal
        visible={editingKey !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingKey(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.backgroundDefault }]}
          >
            {editingKey ? (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      { backgroundColor: `${SOCIAL_CONFIG[editingKey].color}15` },
                    ]}
                  >
                    <Feather
                      name={SOCIAL_CONFIG[editingKey].icon as any}
                      size={28}
                      color={SOCIAL_CONFIG[editingKey].color}
                    />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {SOCIAL_CONFIG[editingKey].label}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={SOCIAL_CONFIG[editingKey].placeholder}
                  placeholderTextColor={colors.textSecondary}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={editingKey === 'whatsapp' ? 'phone-pad' : 'default'}
                />

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                    onPress={() => setEditingKey(null)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                      Cancelar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      { backgroundColor: SOCIAL_CONFIG[editingKey].color },
                    ]}
                    onPress={handleSaveField}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface CommunityWhatsAppButtonProps {
  groupLink?: string;
  style?: any;
}

export function CommunityWhatsAppButton({ groupLink, style }: CommunityWhatsAppButtonProps) {
  const { dark } = useTheme();
  const colors = dark ? Colors.dark : Colors.light;

  const defaultGroupLink = 'https://chat.whatsapp.com/agrowork_uruara_comunidade';

  const handlePress = async () => {
    const url = groupLink || defaultGroupLink;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Grupo da Comunidade',
          'Entre em contato com o suporte para receber o link do grupo da comunidade LidaCacau.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel abrir o link do grupo');
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.communityButton,
        {
          backgroundColor: pressed ? '#20BD5A' : '#25D366',
        },
        style,
      ]}
      onPress={handlePress}
    >
      <Feather name="users" size={22} color="#FFFFFF" />
      <View style={styles.communityButtonContent}>
        <Text style={styles.communityButtonTitle}>Comunidade LidaCacau</Text>
        <Text style={styles.communityButtonSubtitle}>Entre no grupo do WhatsApp</Text>
      </View>
      <Feather name="chevron-right" size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  displayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  socialButton: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  editorContainer: {
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 13,
    marginTop: 2,
  },
  fieldEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalInput: {
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {},
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  communityButtonContent: {
    flex: 1,
  },
  communityButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  communityButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 2,
  },
});
