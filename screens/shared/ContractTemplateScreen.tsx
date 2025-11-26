import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { ServiceType } from '@/types';
import { Spacing, BorderRadius } from '@/constants/theme';

type RouteParams = {
  serviceTypeId?: string;
};

function generateTemplateContract(serviceType: ServiceType): string {
  const today = new Date().toLocaleDateString('pt-BR');
  
  return `CONTRATO DE EMPREITADA RURAL
=====================================

MODELO DE CONTRATO PARA: ${serviceType.name.toUpperCase()}

Data: ${today}
Local: Uruara/PA

-------------------------------------
1. DAS PARTES
-------------------------------------

CONTRATANTE (Produtor):
Nome: [Nome do Produtor]
CPF/CNPJ: [Documento]
Propriedade: [Nome da Propriedade]

CONTRATADO (Trabalhador):
Nome: [Nome do Trabalhador]
CPF: [Documento]
Nivel: [Nivel do Trabalhador]

-------------------------------------
2. DO OBJETO
-------------------------------------

O presente contrato tem por objeto a prestacao de servicos de ${serviceType.name} na propriedade do CONTRATANTE.

Tipo de Servico: ${serviceType.name}
Unidade de Medida: ${serviceType.unit}
Preco Base Sugerido: R$ ${serviceType.basePrice.toFixed(2)} por ${serviceType.unit}
Nivel Minimo Requerido: N${serviceType.minLevel}

-------------------------------------
3. DO PRAZO
-------------------------------------

O servico sera executado no periodo acordado entre as partes, com data de inicio e termino definidos no momento da contratacao.

-------------------------------------
4. DO PAGAMENTO
-------------------------------------

O pagamento sera realizado conforme acordo entre as partes, podendo ser:

a) 100% apos conclusao do trabalho
b) 50% antes, 50% depois
c) 30% antes, 70% depois
d) Por unidade (${serviceType.unit})
e) Por hora trabalhada
f) Por diaria
g) Adiantamento personalizado

-------------------------------------
5. DAS OBRIGACOES DO CONTRATANTE
-------------------------------------

5.1. Fornecer acesso a propriedade
5.2. Disponibilizar agua e instalacoes sanitarias
5.3. Garantir condicoes seguras de trabalho
5.4. Efetuar pagamento conforme acordado
5.5. Fornecer informacoes sobre a area de trabalho

-------------------------------------
6. DAS OBRIGACOES DO CONTRATADO
-------------------------------------

6.1. Executar o servico com qualidade
6.2. Cumprir horarios acordados
6.3. Utilizar equipamentos de seguranca
6.4. Comunicar problemas encontrados
6.5. Registrar check-in e check-out via GPS
6.6. Documentar trabalho com fotos

-------------------------------------
7. DA SEGURANCA
-------------------------------------

7.1. O CONTRATADO deve usar EPIs adequados
7.2. Seguir normas de seguranca rural
7.3. Respeitar limites da propriedade
7.4. Nao utilizar produtos sem autorizacao

-------------------------------------
8. DA CONCLUSAO
-------------------------------------

8.1. O servico sera considerado concluido apos:
   - Verificacao pelo CONTRATANTE
   - Registro de check-out com fotos
   - Avaliacao mutua no aplicativo

-------------------------------------
9. DISPOSICOES GERAIS
-------------------------------------

9.1. Este contrato e regido pela Lei brasileira
9.2. Disputas serao resolvidas no foro de Uruara/PA
9.3. Ambas as partes assinam digitalmente via Empleitapp

-------------------------------------
ASSINATURAS DIGITAIS
-------------------------------------

Produtor: ________________________
Data: ___/___/______

Trabalhador: _____________________
Data: ___/___/______

=====================================
Contrato gerado pelo Empleitapp
Empreitadas rurais na palma da mao
=====================================`;
}

export default function ContractTemplateScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme;

  const initialServiceId = route.params?.serviceTypeId || SERVICE_TYPES[0].id;
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);

  const selectedService = SERVICE_TYPES.find(s => s.id === selectedServiceId) || SERVICE_TYPES[0];
  const contractText = generateTemplateContract(selectedService);

  const handleServiceSelect = (serviceId: string) => {
    Haptics.selectionAsync();
    setSelectedServiceId(serviceId);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="file-text" size={32} color={colors.primary} />
            </View>
            <ThemedText type="h3" style={styles.title}>
              Modelo de Contrato
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
              Selecione o tipo de servico para ver o modelo de contrato
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md, color: colors.text }}>
            Tipo de Servico
          </ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.serviceList}
          >
            {SERVICE_TYPES.map((service) => (
              <Pressable
                key={service.id}
                style={[
                  styles.serviceChip,
                  { 
                    backgroundColor: selectedServiceId === service.id 
                      ? colors.primary 
                      : colors.backgroundSecondary,
                    borderColor: selectedServiceId === service.id 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
                onPress={() => handleServiceSelect(service.id)}
              >
                <Feather 
                  name={service.icon as any} 
                  size={16} 
                  color={selectedServiceId === service.id ? '#FFFFFF' : colors.text} 
                />
                <ThemedText 
                  type="small" 
                  style={{ 
                    color: selectedServiceId === service.id ? '#FFFFFF' : colors.text,
                    marginLeft: Spacing.xs,
                    fontWeight: selectedServiceId === service.id ? '600' : '400',
                  }}
                >
                  {service.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.infoCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
            <Feather name="info" size={18} color={colors.accent} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: colors.text, fontWeight: '600' }}>
                {selectedService.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                R$ {selectedService.basePrice.toFixed(2)} por {selectedService.unit} - Nivel minimo N{selectedService.minLevel}
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={[styles.contractCard, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText type="body" style={[styles.contractText, { color: colors.text }]}>
              {contractText}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.noteCard, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
              Este e um modelo. O contrato final sera gerado automaticamente quando voce aceitar uma proposta de trabalho.
            </ThemedText>
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  serviceList: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  contractCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  contractText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
