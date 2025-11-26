import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PixCharge, 
  PixPaymentStatus, 
  PaymentSummary, 
  PaymentBreakdown,
  WorkOrderPayment,
  PixChargeType,
  PLATFORM_FEE_PERCENTAGE,
  WorkOrder,
  User
} from '@/types';
import { generateId } from './storage';

const STORAGE_KEYS = {
  PIX_CHARGES: '@empleitapp:pix_charges',
};

const OPENPIX_API_URL = 'https://api.openpix.com.br/api/v1';

export const generateCorrelationID = (): string => {
  return `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getPixCharges = async (): Promise<PixCharge[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PIX_CHARGES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pix charges:', error);
    return [];
  }
};

export const getPixChargeById = async (id: string): Promise<PixCharge | null> => {
  try {
    const charges = await getPixCharges();
    return charges.find((c) => c.id === id) || null;
  } catch (error) {
    console.error('Error getting pix charge by id:', error);
    return null;
  }
};

export const getPixChargeByCorrelationID = async (correlationID: string): Promise<PixCharge | null> => {
  try {
    const charges = await getPixCharges();
    return charges.find((c) => c.correlationID === correlationID) || null;
  } catch (error) {
    console.error('Error getting pix charge by correlationID:', error);
    return null;
  }
};

export const getPixChargesByUser = async (userId: string): Promise<PixCharge[]> => {
  try {
    const charges = await getPixCharges();
    return charges.filter((c) => c.payerId === userId || c.receiverId === userId);
  } catch (error) {
    console.error('Error getting pix charges by user:', error);
    return [];
  }
};

export const getPixChargesByWorkOrder = async (workOrderId: string): Promise<PixCharge[]> => {
  try {
    const charges = await getPixCharges();
    return charges.filter((c) => c.workOrderId === workOrderId);
  } catch (error) {
    console.error('Error getting pix charges by work order:', error);
    return [];
  }
};

export const createPixCharge = async (
  charge: Omit<PixCharge, 'id' | 'correlationID' | 'brCode' | 'status' | 'expiresAt' | 'createdAt'>
): Promise<PixCharge> => {
  try {
    const charges = await getPixCharges();
    const correlationID = generateCorrelationID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const brCode = generatePixBrCode({
      correlationID,
      value: charge.value,
      receiverName: charge.receiverName,
      description: charge.description,
    });

    const newCharge: PixCharge = {
      ...charge,
      id: generateId(),
      correlationID,
      brCode,
      status: 'pending',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.PIX_CHARGES, JSON.stringify([...charges, newCharge]));
    return newCharge;
  } catch (error) {
    console.error('Error creating pix charge:', error);
    throw error;
  }
};

export const updatePixCharge = async (
  chargeId: string,
  updates: Partial<PixCharge>
): Promise<PixCharge | null> => {
  try {
    const charges = await getPixCharges();
    const index = charges.findIndex((c) => c.id === chargeId);
    if (index === -1) return null;
    charges[index] = { ...charges[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PIX_CHARGES, JSON.stringify(charges));
    return charges[index];
  } catch (error) {
    console.error('Error updating pix charge:', error);
    return null;
  }
};

export const markChargePaid = async (chargeId: string): Promise<PixCharge | null> => {
  return updatePixCharge(chargeId, {
    status: 'paid',
    paidAt: new Date().toISOString(),
  });
};

export const cancelCharge = async (chargeId: string): Promise<PixCharge | null> => {
  return updatePixCharge(chargeId, { status: 'cancelled' });
};

export const checkExpiredCharges = async (): Promise<void> => {
  try {
    const charges = await getPixCharges();
    const now = new Date();
    let updated = false;

    for (let i = 0; i < charges.length; i++) {
      if (charges[i].status === 'pending') {
        const expiresAt = new Date(charges[i].expiresAt);
        if (now > expiresAt) {
          charges[i].status = 'expired';
          updated = true;
        }
      }
    }

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.PIX_CHARGES, JSON.stringify(charges));
    }
  } catch (error) {
    console.error('Error checking expired charges:', error);
  }
};

export const getPaymentSummary = async (userId: string): Promise<PaymentSummary> => {
  try {
    const charges = await getPixChargesByUser(userId);
    
    let totalReceived = 0;
    let totalPaid = 0;
    let pendingPayments = 0;
    let completedPayments = 0;

    for (const charge of charges) {
      if (charge.status === 'paid') {
        completedPayments++;
        if (charge.receiverId === userId) {
          totalReceived += charge.value;
        } else if (charge.payerId === userId) {
          totalPaid += charge.value;
        }
      } else if (charge.status === 'pending') {
        pendingPayments++;
      }
    }

    return {
      totalReceived,
      totalPaid,
      pendingPayments,
      completedPayments,
    };
  } catch (error) {
    console.error('Error getting payment summary:', error);
    return {
      totalReceived: 0,
      totalPaid: 0,
      pendingPayments: 0,
      completedPayments: 0,
    };
  }
};

export const generatePixBrCode = (params: {
  correlationID: string;
  value: number;
  receiverName: string;
  description: string;
}): string => {
  const { correlationID, value, receiverName, description } = params;
  const valueFormatted = value.toFixed(2);
  const payload = `00020126580014br.gov.bcb.pix0136${correlationID}52040000530398654${valueFormatted.length.toString().padStart(2, '0')}${valueFormatted}5802BR5925${receiverName.substring(0, 25).padEnd(25, ' ')}6008URUARA6226${description.substring(0, 50)}63041234`;
  return payload;
};

export const formatPixValue = (valueInCents: number): string => {
  return (valueInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const parsePixValue = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
};

export const getStatusLabel = (status: PixPaymentStatus): string => {
  const labels: Record<PixPaymentStatus, string> = {
    pending: 'Aguardando Pagamento',
    paid: 'Pago',
    expired: 'Expirado',
    cancelled: 'Cancelado',
    refunded: 'Estornado',
  };
  return labels[status];
};

export const getStatusColor = (status: PixPaymentStatus): string => {
  const colors: Record<PixPaymentStatus, string> = {
    pending: '#FFC107',
    paid: '#28A745',
    expired: '#6C757D',
    cancelled: '#DC3545',
    refunded: '#007BFF',
  };
  return colors[status];
};

export const simulateOpenPixCharge = async (
  appId: string,
  params: {
    correlationID: string;
    value: number;
    comment: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
      taxID?: string;
    };
  }
): Promise<{ charge: any; error: string | null }> => {
  if (!appId) {
    return { charge: null, error: 'OPENPIX_APP_ID nao configurado' };
  }

  try {
    const response = await fetch(`${OPENPIX_API_URL}/charge`, {
      method: 'POST',
      headers: {
        'Authorization': appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: params.correlationID,
        value: params.value,
        comment: params.comment,
        customer: params.customer,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { charge: null, error: errorData.message || 'Erro ao criar cobranca' };
    }

    const data = await response.json();
    return { charge: data.charge, error: null };
  } catch (error: any) {
    console.error('OpenPix API Error:', error);
    return { charge: null, error: error.message || 'Erro de conexao' };
  }
};

export const getOpenPixChargeStatus = async (
  appId: string,
  correlationID: string
): Promise<{ status: PixPaymentStatus | null; error: string | null }> => {
  if (!appId) {
    return { status: null, error: 'OPENPIX_APP_ID nao configurado' };
  }

  try {
    const response = await fetch(`${OPENPIX_API_URL}/charge/${correlationID}`, {
      method: 'GET',
      headers: {
        'Authorization': appId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { status: null, error: errorData.message || 'Erro ao consultar cobranca' };
    }

    const data = await response.json();
    const statusMap: Record<string, PixPaymentStatus> = {
      'ACTIVE': 'pending',
      'COMPLETED': 'paid',
      'EXPIRED': 'expired',
    };
    
    return { status: statusMap[data.charge.status] || 'pending', error: null };
  } catch (error: any) {
    console.error('OpenPix API Error:', error);
    return { status: null, error: error.message || 'Erro de conexao' };
  }
};

export const calculatePaymentBreakdown = (
  totalValue: number,
  advancePaid: number = 0
): PaymentBreakdown => {
  const platformFee = Math.round(totalValue * PLATFORM_FEE_PERCENTAGE);
  const workerPayout = totalValue - platformFee;
  const remainingToPay = totalValue - advancePaid;

  return {
    totalValue,
    platformFee,
    workerPayout,
    advancePaid: advancePaid > 0 ? advancePaid : undefined,
    remainingToPay: remainingToPay > 0 ? remainingToPay : 0,
  };
};

export const createSplitPaymentCharges = async (params: {
  workOrderId: string;
  payerId: string;
  payerName: string;
  worker: User;
  totalValue: number;
  serviceName: string;
  platformPixKey?: string;
}): Promise<{ 
  workerCharge: PixCharge; 
  platformCharge: PixCharge; 
  breakdown: PaymentBreakdown;
  error: string | null 
}> => {
  const { workOrderId, payerId, payerName, worker, totalValue, serviceName, platformPixKey } = params;
  
  const workerPixKey = worker.workerProfile?.pixKey;
  if (!workerPixKey) {
    throw new Error('Trabalhador nao possui chave PIX cadastrada');
  }

  const breakdown = calculatePaymentBreakdown(totalValue);
  const charges = await getPixCharges();

  const workerCorrelationID = `EMP_W_${workOrderId}_${Date.now()}`;
  const platformCorrelationID = `EMP_P_${workOrderId}_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const workerBrCode = generatePixBrCode({
    correlationID: workerCorrelationID,
    value: breakdown.workerPayout / 100,
    receiverName: worker.name,
    description: `${serviceName} - Pagamento`,
  });

  const workerCharge: PixCharge = {
    id: generateId(),
    correlationID: workerCorrelationID,
    workOrderId,
    payerId,
    payerName,
    receiverId: worker.id,
    receiverName: worker.name,
    receiverPixKey: workerPixKey,
    value: breakdown.workerPayout,
    description: `${serviceName} - Pagamento ao trabalhador (90%)`,
    brCode: workerBrCode,
    status: 'pending',
    chargeType: 'worker_payout',
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  const platformBrCode = generatePixBrCode({
    correlationID: platformCorrelationID,
    value: breakdown.platformFee / 100,
    receiverName: 'Empleitapp',
    description: `${serviceName} - Taxa plataforma`,
  });

  const platformCharge: PixCharge = {
    id: generateId(),
    correlationID: platformCorrelationID,
    workOrderId,
    payerId,
    payerName,
    receiverId: 'platform',
    receiverName: 'Empleitapp',
    receiverPixKey: platformPixKey,
    value: breakdown.platformFee,
    description: `${serviceName} - Taxa da plataforma (10%)`,
    brCode: platformBrCode,
    status: 'pending',
    chargeType: 'platform_fee',
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    STORAGE_KEYS.PIX_CHARGES, 
    JSON.stringify([...charges, workerCharge, platformCharge])
  );

  return { workerCharge, platformCharge, breakdown, error: null };
};

export const initializeWorkOrderPayment = (
  workOrder: WorkOrder,
  advancePaid: number = 0
): WorkOrderPayment => {
  const breakdown = calculatePaymentBreakdown(workOrder.finalPrice, advancePaid);
  
  return {
    status: 'pending',
    breakdown,
  };
};

export const getChargeTypeLabel = (chargeType: PixChargeType): string => {
  const labels: Record<PixChargeType, string> = {
    worker_payout: 'Pagamento ao Trabalhador',
    platform_fee: 'Taxa da Plataforma',
    manual: 'Pagamento Manual',
  };
  return labels[chargeType];
};

export const formatCurrency = (valueInCents: number): string => {
  return (valueInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};
