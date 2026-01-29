import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

class BiometricService {
    /**
     * Verifica se o dispositivo possui hardware de biometria e se há biometrias cadastradas
     */
    async isAvailable(): Promise<boolean> {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    }

    /**
     * Obtém os tipos de autenticação suportados (Impressão digital, Face ID, etc.)
     */
    async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    }

    /**
     * Realiza a autenticação biométrica
     */
    async authenticate(reason: string = 'Autentique-se para acessar o LidaCacau'): Promise<boolean> {
        const isAvailable = await this.isAvailable();
        if (!isAvailable) return false;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            fallbackLabel: 'Usar senha',
            disableDeviceFallback: false,
        });

        return result.success;
    }
}

export const biometricService = new BiometricService();
export default biometricService;
