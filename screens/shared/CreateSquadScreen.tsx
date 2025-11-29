import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { User, LidaSquad, SquadMember, SquadProposal } from '@/types';
import { getUsers, createSquad, createSquadProposal, getUserById, getFriends } from '@/utils/storage';
import { trackEvent } from '@/utils/analytics';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useSimpleScreenInsets } from '@/hooks/useScreenInsets';
import { SERVICE_TYPES } from '@/data/serviceTypes';

type CreateMode = 'create' | 'propose';

export default function CreateSquadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { paddingTop, paddingBottom } = useSimpleScreenInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [mode, setMode] = useState<CreateMode>('create');
  const [squadName, setSquadName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<User | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserPicker, setShowUserPicker] = useState<'leader' | 'members' | null>(null);

  const MAX_MEMBERS = 4;

  useEffect(() => {
    loadAvailableUsers();
  }, [user]);

  const loadAvailableUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    try {
      const friends = await getFriends(user.id);
      const acceptedFriends = friends.filter((f) => f.status === 'accepted');
      const friendIds = acceptedFriends.map((f) => 
        f.requesterId === user.id ? f.receiverId : f.requesterId
      );
      
      const users: User[] = [];
      for (const id of friendIds) {
        const friendUser = await getUserById(id);
        if (friendUser) users.push(friendUser);
      }
      
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!user) return;

    if (!squadName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o esquadrao');
      return;
    }

    if (mode === 'create') {
      setLoading(true);
      try {
        const leaderMember: SquadMember = {
          userId: user.id,
          role: 'leader',
          status: 'accepted',
          invitedAt: new Date().toISOString(),
          invitedBy: user.id,
          joinedAt: new Date().toISOString(),
        };

        const invitedMembers: SquadMember[] = selectedMembers.map((m) => ({
          userId: m.id,
          role: 'member' as const,
          status: 'invited' as const,
          invitedAt: new Date().toISOString(),
          invitedBy: user.id,
        }));

        await createSquad({
          name: squadName.trim(),
          description: description.trim() || undefined,
          leaderId: user.id,
          members: [leaderMember, ...invitedMembers],
          maxMembers: MAX_MEMBERS,
          serviceTypeIds: selectedServices.length > 0 ? selectedServices : undefined,
          status: invitedMembers.length > 0 ? 'recruiting' : 'active',
        });

        trackEvent('squad_created', { 
          membersInvited: selectedMembers.length,
          services: selectedServices.length,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          'Esquadrao criado!',
          selectedMembers.length > 0 
            ? `Convites enviados para ${selectedMembers.length} companheiro(s) de lida!`
            : 'Seu esquadrao foi criado. Convide companheiros para formar a equipe!',
          [{ text: 'Bora!', onPress: () => navigation.goBack() }]
        );
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Erro ao criar esquadrao');
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedLeader) {
        Alert.alert('Erro', 'Escolha um lider para o esquadrao');
        return;
      }

      setLoading(true);
      try {
        await createSquadProposal({
          proposerId: user.id,
          proposedLeaderId: selectedLeader.id,
          squadName: squadName.trim(),
          description: description.trim() || undefined,
          invitedUserIds: selectedMembers.map((m) => m.id),
          serviceTypeIds: selectedServices.length > 0 ? selectedServices : undefined,
          message: `${user.name} quer formar um esquadrao com voce como lider!`,
        });

        trackEvent('squad_proposed', { 
          leaderId: selectedLeader.id,
          membersInvited: selectedMembers.length,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          'Proposta enviada!',
          `${selectedLeader.name} recebera sua proposta para liderar o esquadrao.`,
          [{ text: 'Beleza!', onPress: () => navigation.goBack() }]
        );
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Erro ao enviar proposta');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMember = (member: User) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (selectedMembers.find((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else if (selectedMembers.length < MAX_MEMBERS - 1) {
      setSelectedMembers([...selectedMembers, member]);
    } else {
      Alert.alert('Limite atingido', `O esquadrao pode ter no maximo ${MAX_MEMBERS} membros (incluindo o lider).`);
    }
  };

  const toggleService = (serviceId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const filteredUsersForPicker = useCallback(() => {
    if (showUserPicker === 'leader') {
      return availableUsers.filter((u) => !selectedMembers.find((m) => m.id === u.id));
    } else {
      return availableUsers.filter((u) => 
        u.id !== selectedLeader?.id && 
        !selectedMembers.find((m) => m.id === u.id)
      );
    }
  }, [availableUsers, selectedLeader, selectedMembers, showUserPicker]);

  const renderUserPicker = () => {
    const users = filteredUsersForPicker();
    
    return (
      <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
          <View style={styles.pickerHeader}>
            <ThemedText type="h3">
              {showUserPicker === 'leader' ? 'Escolher Lider' : 'Convidar Membro'}
            </ThemedText>
            <Pressable onPress={() => setShowUserPicker(null)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          {users.length === 0 ? (
            <View style={styles.emptyPicker}>
              <Feather name="users" size={48} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
                {availableUsers.length === 0 
                  ? 'Adicione amigos primeiro para convidar para o esquadrao!'
                  : 'Todos os amigos ja foram selecionados.'}
              </ThemedText>
            </View>
          ) : (
            <ScrollView style={styles.pickerList}>
              {users.map((u) => (
                <Pressable
                  key={u.id}
                  style={[styles.userPickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    if (showUserPicker === 'leader') {
                      setSelectedLeader(u);
                    } else {
                      toggleMember(u);
                    }
                    setShowUserPicker(null);
                  }}
                >
                  {u.avatar ? (
                    <Image source={{ uri: u.avatar }} style={styles.pickerAvatar} />
                  ) : (
                    <View style={[styles.pickerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <ThemedText type="body" style={{ color: '#FFF' }}>{u.name?.charAt(0)}</ThemedText>
                    </View>
                  )}
                  <View style={styles.pickerUserInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>{u.name}</ThemedText>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {u.role === 'worker' ? 'Trabalhador' : 'Produtor'}
                      {u.level ? ` - N${u.level}` : ''}
                    </ThemedText>
                  </View>
                  <Feather name="plus" size={20} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: paddingTop + Spacing.md, paddingBottom: paddingBottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="h2" style={styles.title}>Esquadrao da Lida</ThemedText>
        </View>

        <ThemedText type="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
          Forme uma equipe de ate {MAX_MEMBERS} companheiros para pegar lida juntos!
        </ThemedText>

        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              {
                backgroundColor: mode === 'create' ? colors.primary : colors.backgroundDefault,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setMode('create')}
          >
            <Feather name="plus-circle" size={20} color={mode === 'create' ? '#FFF' : colors.text} />
            <ThemedText type="body" style={{ color: mode === 'create' ? '#FFF' : colors.text, marginLeft: Spacing.xs }}>
              Criar e Liderar
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              {
                backgroundColor: mode === 'propose' ? colors.primary : colors.backgroundDefault,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setMode('propose')}
          >
            <Feather name="send" size={20} color={mode === 'propose' ? '#FFF' : colors.text} />
            <ThemedText type="body" style={{ color: mode === 'propose' ? '#FFF' : colors.text, marginLeft: Spacing.xs }}>
              Propor Lider
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="body" style={styles.label}>Nome do Esquadrao</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <Feather name="users" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: Esquadrao do Cacau"
              placeholderTextColor={colors.textSecondary}
              value={squadName}
              onChangeText={setSquadName}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="body" style={styles.label}>Descricao (opcional)</ThemedText>
          <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Fale sobre as especialidades do grupo..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {mode === 'propose' && (
          <View style={styles.inputContainer}>
            <ThemedText type="body" style={styles.label}>Lider do Esquadrao</ThemedText>
            <Pressable
              style={[styles.selectButton, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}
              onPress={() => setShowUserPicker('leader')}
            >
              {selectedLeader ? (
                <View style={styles.selectedUser}>
                  {selectedLeader.avatar ? (
                    <Image source={{ uri: selectedLeader.avatar }} style={styles.selectedAvatar} />
                  ) : (
                    <View style={[styles.selectedAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <ThemedText type="small" style={{ color: '#FFF' }}>{selectedLeader.name?.charAt(0)}</ThemedText>
                    </View>
                  )}
                  <ThemedText type="body" style={{ flex: 1 }}>{selectedLeader.name}</ThemedText>
                  <Pressable onPress={() => setSelectedLeader(null)}>
                    <Feather name="x" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <Feather name="user-check" size={20} color={colors.textSecondary} />
                  <ThemedText type="body" style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>
                    Escolher lider...
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <ThemedText type="body" style={styles.label}>
              Membros ({selectedMembers.length}/{MAX_MEMBERS - 1})
            </ThemedText>
            <Pressable
              style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => setShowUserPicker('members')}
            >
              <Feather name="user-plus" size={16} color={colors.primary} />
              <ThemedText type="small" style={{ color: colors.primary, marginLeft: 4 }}>Convidar</ThemedText>
            </Pressable>
          </View>

          {selectedMembers.length > 0 ? (
            <View style={styles.membersList}>
              {selectedMembers.map((member) => (
                <View key={member.id} style={[styles.memberChip, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                  {member.avatar ? (
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={[styles.memberAvatarPlaceholder, { backgroundColor: colors.secondary }]}>
                      <ThemedText type="small" style={{ color: '#FFF', fontSize: 10 }}>{member.name?.charAt(0)}</ThemedText>
                    </View>
                  )}
                  <ThemedText type="small" style={{ flex: 1 }}>{member.name?.split(' ')[0]}</ThemedText>
                  <Pressable onPress={() => toggleMember(member)} hitSlop={8}>
                    <Feather name="x" size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyMembers, { borderColor: colors.border }]}>
              <Feather name="users" size={24} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                Convide amigos para o esquadrao
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="body" style={styles.label}>Tipos de Servico (opcional)</ThemedText>
          <View style={styles.servicesList}>
            {SERVICE_TYPES.slice(0, 8).map((service) => (
              <Pressable
                key={service.id}
                style={[
                  styles.serviceChip,
                  {
                    backgroundColor: selectedServices.includes(service.id) ? colors.primary : colors.backgroundDefault,
                    borderColor: selectedServices.includes(service.id) ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleService(service.id)}
              >
                <ThemedText
                  type="small"
                  style={{ color: selectedServices.includes(service.id) ? '#FFF' : colors.text }}
                >
                  {service.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={18} color={colors.accent} />
          <ThemedText type="small" style={[styles.infoText, { color: colors.textSecondary }]}>
            {mode === 'create' 
              ? 'Voce sera o lider do esquadrao. Convites serao enviados aos membros selecionados.'
              : 'O lider escolhido recebera sua proposta e podera aceitar ou recusar.'}
          </ThemedText>
        </View>

        <Button
          onPress={handleCreateSquad}
          disabled={loading || !squadName.trim() || (mode === 'propose' && !selectedLeader)}
          style={styles.submitButton}
        >
          {loading ? 'Criando...' : mode === 'create' ? 'Criar Esquadrao' : 'Enviar Proposta'}
        </Button>
      </ScrollView>

      {showUserPicker && renderUserPicker()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  textAreaWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  selectedAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  memberAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMembers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  serviceChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,113,188,0.1)',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
    paddingBottom: Spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerList: {
    paddingHorizontal: Spacing.md,
  },
  userPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  pickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  pickerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pickerUserInfo: {
    flex: 1,
  },
  emptyPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
});
