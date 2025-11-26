import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import LoginScreen from '@/screens/auth/LoginScreen';
import ProducerTabNavigator from '@/navigation/ProducerTabNavigator';
import WorkerTabNavigator from '@/navigation/WorkerTabNavigator';
import AdminStackNavigator from '@/navigation/AdminStackNavigator';
import JobDetailScreen from '@/screens/shared/JobDetailScreen';
import CreateJobScreen from '@/screens/producer/CreateJobScreen';
import ProducerPropertiesScreen from '@/screens/producer/ProducerPropertiesScreen';
import ActiveWorkOrderScreen from '@/screens/worker/ActiveWorkOrderScreen';
import ReviewScreen from '@/screens/shared/ReviewScreen';
import TutorialScreen from '@/screens/shared/TutorialScreen';
import NFSeScreen from '@/screens/producer/NFSeScreen';
import NegotiationMatchScreen from '@/screens/shared/NegotiationMatchScreen';
import NegotiationTermsScreen from '@/screens/shared/NegotiationTermsScreen';
import ContractSigningScreen from '@/screens/shared/ContractSigningScreen';
import ContractTemplateScreen from '@/screens/shared/ContractTemplateScreen';
import ServiceHistoryScreen from '@/screens/shared/ServiceHistoryScreen';
import SocialLinksScreen from '@/screens/shared/SocialLinksScreen';
import IdentityVerificationScreen from '@/screens/shared/IdentityVerificationScreen';
import ReferralScreen from '@/screens/shared/ReferralScreen';
import BenefitsClubScreen from '@/screens/shared/BenefitsClubScreen';
import FAQSupportScreen from '@/screens/shared/FAQSupportScreen';
import PortfolioScreen from '@/screens/shared/PortfolioScreen';
import PaymentScreen from '@/screens/shared/PaymentScreen';
import PaymentHistoryScreen from '@/screens/shared/PaymentHistoryScreen';
import EducationScreen from '@/screens/education/EducationScreen';
import SkillDetailScreen from '@/screens/education/SkillDetailScreen';
import CourseDetailScreen from '@/screens/education/CourseDetailScreen';
import QuizScreen from '@/screens/education/QuizScreen';
import { getCommonScreenOptions } from '@/navigation/screenOptions';
import { User } from '@/types';

export type RootStackParamList = {
  Login: undefined;
  Tutorial: undefined;
  ProducerTabs: undefined;
  WorkerTabs: undefined;
  AdminStack: undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
  ProducerProperties: undefined;
  NFSe: undefined;
  ActiveWorkOrder: { workOrderId: string };
  Review: { workOrderId: string; revieweeId: string; revieweeName: string };
  NegotiationMatch: {
    workOrderId: string;
    worker: User;
    producer: User;
    serviceName: string;
    price: number;
    isProducer: boolean;
  };
  NegotiationTerms: {
    workOrderId: string;
    worker: User;
    producer: User;
    serviceName: string;
    price: number;
    isProducer: boolean;
  };
  ContractSigning: {
    workOrderId: string;
    isProducer: boolean;
  };
  ContractTemplate: { serviceTypeId?: string };
  ServiceHistory: undefined;
  SocialLinks: undefined;
  IdentityVerification: undefined;
  Referral: undefined;
  BenefitsClub: undefined;
  FAQSupport: undefined;
  Portfolio: undefined;
  Payment: { workOrder?: any };
  PaymentHistory: undefined;
  Education: undefined;
  SkillDetail: { skillId: string };
  CourseDetail: { courseId: string };
  Quiz: { quizId: string; skillId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : !user?.tutorialCompleted && user?.role !== 'admin' ? (
        <Stack.Screen
          name="Tutorial"
          component={TutorialScreen}
          options={{ headerShown: false }}
        />
      ) : user?.role === 'admin' ? (
        <Stack.Screen
          name="AdminStack"
          component={AdminStackNavigator}
          options={{ headerShown: false }}
        />
      ) : user?.role === 'producer' ? (
        <>
          <Stack.Screen
            name="ProducerTabs"
            component={ProducerTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{ title: 'Detalhes da Demanda' }}
          />
          <Stack.Screen
            name="CreateJob"
            component={CreateJobScreen}
            options={{ title: 'Nova Demanda', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ProducerProperties"
            component={ProducerPropertiesScreen}
            options={{ title: 'Minhas Propriedades' }}
          />
          <Stack.Screen
            name="NFSe"
            component={NFSeScreen}
            options={{ title: 'Nota Fiscal' }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ title: 'Avaliar Serviço', presentation: 'modal' }}
          />
          <Stack.Screen
            name="NegotiationMatch"
            component={NegotiationMatchScreen}
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="NegotiationTerms"
            component={NegotiationTermsScreen}
            options={{ title: 'Negociar Pagamento' }}
          />
          <Stack.Screen
            name="ContractSigning"
            component={ContractSigningScreen}
            options={{ title: 'Assinar Contrato de Empreitada' }}
          />
          <Stack.Screen
            name="ContractTemplate"
            component={ContractTemplateScreen}
            options={{ title: 'Modelo de Contrato' }}
          />
          <Stack.Screen
            name="ServiceHistory"
            component={ServiceHistoryScreen}
            options={{ title: 'Historico de Servicos' }}
          />
          <Stack.Screen
            name="SocialLinks"
            component={SocialLinksScreen}
            options={{ title: 'Redes Sociais' }}
          />
          <Stack.Screen
            name="IdentityVerification"
            component={IdentityVerificationScreen}
            options={{ title: 'Verificar Identidade' }}
          />
          <Stack.Screen
            name="Referral"
            component={ReferralScreen}
            options={{ title: 'Indique e Ganhe' }}
          />
          <Stack.Screen
            name="BenefitsClub"
            component={BenefitsClubScreen}
            options={{ title: 'Clube Empleitapp' }}
          />
          <Stack.Screen
            name="FAQSupport"
            component={FAQSupportScreen}
            options={{ title: 'Ajuda e Suporte' }}
          />
          <Stack.Screen
            name="Portfolio"
            component={PortfolioScreen}
            options={{ title: 'Meu Portfolio' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ title: 'Pagamento PIX' }}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
            options={{ title: 'Historico de Pagamentos' }}
          />
          <Stack.Screen
            name="Education"
            component={EducationScreen}
            options={{ title: 'Capacitacao' }}
          />
          <Stack.Screen
            name="SkillDetail"
            component={SkillDetailScreen}
            options={{ title: 'Detalhes da Habilidade' }}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={{ title: 'Curso' }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ title: 'Quiz' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="WorkerTabs"
            component={WorkerTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{ title: 'Detalhes do Trabalho' }}
          />
          <Stack.Screen
            name="ActiveWorkOrder"
            component={ActiveWorkOrderScreen}
            options={{ title: 'Serviço em Andamento' }}
          />
          <Stack.Screen
            name="ContractSigning"
            component={ContractSigningScreen}
            options={{ title: 'Assinar Contrato de Empreitada' }}
          />
          <Stack.Screen
            name="ContractTemplate"
            component={ContractTemplateScreen}
            options={{ title: 'Modelo de Contrato' }}
          />
          <Stack.Screen
            name="ServiceHistory"
            component={ServiceHistoryScreen}
            options={{ title: 'Historico de Servicos' }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ title: 'Avaliar Serviço', presentation: 'modal' }}
          />
          <Stack.Screen
            name="NegotiationMatch"
            component={NegotiationMatchScreen}
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="NegotiationTerms"
            component={NegotiationTermsScreen}
            options={{ title: 'Negociar Pagamento' }}
          />
          <Stack.Screen
            name="SocialLinks"
            component={SocialLinksScreen}
            options={{ title: 'Redes Sociais' }}
          />
          <Stack.Screen
            name="IdentityVerification"
            component={IdentityVerificationScreen}
            options={{ title: 'Verificar Identidade' }}
          />
          <Stack.Screen
            name="Referral"
            component={ReferralScreen}
            options={{ title: 'Indique e Ganhe' }}
          />
          <Stack.Screen
            name="BenefitsClub"
            component={BenefitsClubScreen}
            options={{ title: 'Clube Empleitapp' }}
          />
          <Stack.Screen
            name="FAQSupport"
            component={FAQSupportScreen}
            options={{ title: 'Ajuda e Suporte' }}
          />
          <Stack.Screen
            name="Portfolio"
            component={PortfolioScreen}
            options={{ title: 'Meu Portfolio' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ title: 'Pagamento PIX' }}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
            options={{ title: 'Historico de Pagamentos' }}
          />
          <Stack.Screen
            name="Education"
            component={EducationScreen}
            options={{ title: 'Capacitacao' }}
          />
          <Stack.Screen
            name="SkillDetail"
            component={SkillDetailScreen}
            options={{ title: 'Detalhes da Habilidade' }}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={{ title: 'Curso' }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ title: 'Quiz' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
