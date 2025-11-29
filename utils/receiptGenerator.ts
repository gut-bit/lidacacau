import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WorkOrder, Job, User, ServiceType, PaymentTerms } from '@/types';
import { formatCurrency, formatDate, getLevelLabel } from '@/utils/format';

export interface ReceiptData {
  workOrder: WorkOrder;
  job: Job;
  producer: User;
  worker: User;
  serviceType: ServiceType;
}

function getPaymentDescription(paymentTerms?: PaymentTerms, totalValue?: number): string {
  if (!paymentTerms || !totalValue) return 'Pagamento integral apos conclusao';
  
  const formatted = formatCurrency(totalValue);
  
  switch (paymentTerms.type) {
    case 'full_after':
      return `100% do valor (${formatted}) pago apos conclusao`;
    case 'split_50_50':
      const half = formatCurrency(totalValue / 2);
      return `50% (${half}) antes + 50% (${half}) apos conclusao`;
    case 'split_30_70':
      const adv30 = formatCurrency(totalValue * 0.3);
      const rem70 = formatCurrency(totalValue * 0.7);
      return `30% (${adv30}) adiantamento + 70% (${rem70}) apos conclusao`;
    case 'advance_custom':
      const pct = paymentTerms.advancePercentage || 30;
      const advAmt = formatCurrency(totalValue * (pct / 100));
      const remAmt = formatCurrency(totalValue * ((100 - pct) / 100));
      return `${pct}% (${advAmt}) adiantamento + ${100 - pct}% (${remAmt}) apos conclusao`;
    case 'per_unit':
      const unitPrice = formatCurrency(paymentTerms.unitPrice || 0);
      return `Pagamento por unidade: ${unitPrice}`;
    case 'per_hour':
      const hourly = formatCurrency(paymentTerms.hourlyRate || 0);
      return `Pagamento por hora: ${hourly}`;
    case 'per_day':
      const daily = formatCurrency(paymentTerms.dailyRate || 0);
      return `Pagamento por diaria: ${daily}`;
    default:
      return `Valor total: ${formatted}`;
  }
}

export function generateServiceReceipt(data: ReceiptData): string {
  const { workOrder, job, producer, worker, serviceType } = data;
  const today = new Date().toLocaleDateString('pt-BR');
  const receiptNumber = `REC-${workOrder.id.toUpperCase().slice(0, 8)}`;
  
  const paymentDesc = getPaymentDescription(workOrder.paymentTerms, workOrder.finalPrice);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante de Servico - ${receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .receipt {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2D5016 0%, #3D6B1E 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .tagline {
      font-size: 12px;
      opacity: 0.9;
    }
    .receipt-info {
      background: rgba(255,255,255,0.1);
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .receipt-number {
      font-size: 14px;
      font-weight: 600;
    }
    .receipt-date {
      font-size: 12px;
      opacity: 0.8;
    }
    .content {
      padding: 24px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #2D5016;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #2D5016;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #666;
      font-size: 13px;
    }
    .info-value {
      font-weight: 500;
      font-size: 13px;
      text-align: right;
      max-width: 60%;
    }
    .total-section {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 12px;
      margin-top: 16px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-size: 16px;
      font-weight: 600;
    }
    .total-value {
      font-size: 24px;
      font-weight: 700;
      color: #2D5016;
    }
    .payment-info {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ddd;
    }
    .status-badge {
      display: inline-block;
      background: #22C55E;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      background: #f5f5f5;
      padding: 16px 24px;
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      color: #999;
      line-height: 1.5;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: #eee;
      margin: 12px auto;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">LidaCacau</div>
      <div class="tagline">Confianca de quem e da Lida</div>
      <div class="receipt-info">
        <div class="receipt-number">${receiptNumber}</div>
        <div class="receipt-date">Emitido em ${today}</div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">Servico Realizado</div>
        <div class="info-row">
          <span class="info-label">Tipo</span>
          <span class="info-value">${serviceType.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Quantidade</span>
          <span class="info-value">${job.quantity} ${serviceType.unit}${job.quantity !== 1 ? 's' : ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Local</span>
          <span class="info-value">${job.locationText || 'Nao especificado'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="status-badge">Concluido</span></span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Contratante (Produtor)</div>
        <div class="info-row">
          <span class="info-label">Nome</span>
          <span class="info-value">${producer.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contato</span>
          <span class="info-value">${producer.phone || producer.email}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Prestador (Trabalhador)</div>
        <div class="info-row">
          <span class="info-label">Nome</span>
          <span class="info-value">${worker.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nivel</span>
          <span class="info-value">${getLevelLabel(worker.level || 1)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contato</span>
          <span class="info-value">${worker.phone || worker.email}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Periodo de Execucao</div>
        <div class="info-row">
          <span class="info-label">Inicio</span>
          <span class="info-value">${workOrder.checkInTime ? formatDate(workOrder.checkInTime) : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Conclusao</span>
          <span class="info-value">${workOrder.checkOutTime ? formatDate(workOrder.checkOutTime) : 'N/A'}</span>
        </div>
      </div>

      <div class="total-section">
        <div class="total-row">
          <span class="total-label">Valor Total</span>
          <span class="total-value">${formatCurrency(workOrder.finalPrice)}</span>
        </div>
        <div class="payment-info">
          ${paymentDesc}
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="qr-placeholder">
        QR Code
      </div>
      <div class="footer-text">
        Este comprovante foi gerado pelo aplicativo LidaCacau.<br>
        Documento nao fiscal - Para fins de controle interno.<br>
        Para emissao de Nota Fiscal, acesse o portal da prefeitura.
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export async function shareReceipt(html: string, filename: string): Promise<void> {
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento nao disponivel neste dispositivo');
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartilhar Comprovante',
      UTI: 'com.adobe.pdf',
    });
  } catch (error) {
    console.error('Error sharing receipt:', error);
    throw error;
  }
}

export async function printReceipt(html: string): Promise<void> {
  try {
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw error;
  }
}
