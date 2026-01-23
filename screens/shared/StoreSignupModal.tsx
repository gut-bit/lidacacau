import React, { useState } from 'react';
import { StyleSheet, View, Modal, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { generateId } from '@/utils/storage';

const PRIMARY_COLOR = '#F15A29';

interface StoreSignupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    storeName: string;
    email: string;
    whatsapp: string;
    city: string;
    state: string;
    businessType?: string;
  }) => Promise<void>;
}

export default function StoreSignupModal({ visible, onClose, onSubmit }: StoreSignupModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    email: '',
    whatsapp: '',
    city: '',
    state: '',
    businessType: '',
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.storeName.trim() || !formData.email.trim() || !formData.whatsapp.trim() || !formData.city.trim() || !formData.state.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatorios');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      setFormData({
        name: '',
        storeName: '',
        email: '',
        whatsapp: '',
        city: '',
        state: '',
        businessType: '',
      });
      Alert.alert('Sucesso', 'Sua inscricao foi enviada! Entraremos em contato em breve.');
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel enviar sua inscricao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.backgroundRoot }]}>
        <View style={[styles.header, { backgroundColor: colors.backgroundDefault, borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="h4">Cadastro de Lojista</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          <View style={styles.banner}>
            <Feather name="alert-circle" size={24} color={PRIMARY_COLOR} />
            <ThemedText type="small" style={{ color: PRIMARY_COLOR, marginLeft: Spacing.sm, fontWeight: '600' }}>
              Funcionalidades em desenvolvimento
            </ThemedText>
          </View>

          <View style={[styles.introSection, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Vamos construir a melhor agro loja virtual da regiao!
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, lineHeight: 20 }}>
              Lojista, empresario, varejista e produtores: cadastrem-se com a gente para serem os primeiros a terem acesso a nossa plataforma de vendas virtual!
            </ThemedText>
          </View>

          <View style={styles.formSection}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Informacoes Pessoais</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Nome Completo*</ThemedText>
              <TextInput
                placeholder="Seu nome"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Email*</ThemedText>
              <TextInput
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>WhatsApp*</ThemedText>
              <TextInput
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Informacoes da Loja</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Nome da Loja*</ThemedText>
              <TextInput
                placeholder="Nome da sua loja agropecuaria"
                value={formData.storeName}
                onChangeText={(text) => setFormData({ ...formData, storeName: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Tipo de Negocio</ThemedText>
              <TextInput
                placeholder="Ex: Agropecuaria, Ferragens, Insumos, etc"
                value={formData.businessType}
                onChangeText={(text) => setFormData({ ...formData, businessType: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Cidade*</ThemedText>
                <TextInput
                  placeholder="Uruara"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                  placeholderTextColor={colors.textSecondary}
                  editable={!loading}
                />
              </View>
              <View style={{ width: 80 }}>
                <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Estado*</ThemedText>
                <TextInput
                  placeholder="PA"
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundRoot }]}
                  placeholderTextColor={colors.textSecondary}
                  maxLength={2}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: PRIMARY_COLOR, opacity: pressed || loading ? 0.8 : 1 }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="send" size={18} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                  Enviar Inscricao
                </ThemedText>
              </>
            )}
          </Pressable>

          <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg }}>
            Seus dados serao enviados para nosso email e entraremos em contato!
          </ThemedText>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  introSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
});
