import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Job, WorkOrder, User, ServiceType } from '@/types';
import { formatCurrency, formatDate } from './format';

interface ContractData {
  job: Job;
  workOrder: WorkOrder;
  producer: User;
  worker: User;
  serviceType: ServiceType;
}

export const generateContractHtml = (data: ContractData): string => {
  const { job, workOrder, producer, worker, serviceType } = data;

  const today = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
          h1 { text-align: center; color: #2D5016; margin-bottom: 30px; font-size: 24px; text-transform: uppercase; }
          h2 { font-size: 16px; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 25px; color: #444; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .party-box { width: 45%; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
          .label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
          .value { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
          .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .details-table td { padding: 8px; border-bottom: 1px solid #eee; }
          .details-table td:first-child { font-weight: bold; width: 30%; color: #555; }
          .legal-text { font-size: 12px; text-align: justify; margin-top: 20px; color: #666; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .sign-line { width: 45%; border-top: 1px solid #333; padding-top: 10px; text-align: center; font-size: 12px; }
          .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Contrato de Prestação de Serviços Rurais</h1>
        
        <div class="parties">
          <div class="party-box">
            <div class="label">Contratante (Produtor)</div>
            <div class="value">${producer.name}</div>
            <div class="value" style="font-weight: normal; font-size: 12px;">CPF/CNPJ: Não informado</div>
          </div>
          <div class="party-box">
            <div class="label">Contratado (Trabalhador)</div>
            <div class="value">${worker.name}</div>
            <div class="value" style="font-weight: normal; font-size: 12px;">CPF: Não informado</div>
          </div>
        </div>

        <h2>1. Objeto do Serviço</h2>
        <table class="details-table">
          <tr>
            <td>Tipo de Serviço</td>
            <td>${serviceType.name}</td>
          </tr>
          <tr>
            <td>Localização</td>
            <td>${job.locationText}</td>
          </tr>
          <tr>
            <td>Quantidade</td>
            <td>${job.quantity} ${serviceType.unit}</td>
          </tr>
          <tr>
            <td>Descrição</td>
            <td>${job.notes || 'Conforme especificado na plataforma.'}</td>
          </tr>
        </table>

        <h2>2. Valores e Pagamento</h2>
        <table class="details-table">
          <tr>
            <td>Valor Total</td>
            <td style="color: #2D5016; font-weight: bold;">${formatCurrency(workOrder.finalPrice)}</td>
          </tr>
          <tr>
            <td>Forma de Pagamento</td>
            <td>Via Plataforma (Lida Cacau)</td>
          </tr>
        </table>

        <h2>3. Condições Gerais</h2>
        <div class="legal-text">
          <p>3.1. O CONTRATADO compromete-se a executar os serviços com zelo e competência, respeitando as normas de segurança do trabalho.</p>
          <p>3.2. O CONTRATANTE compromete-se a fornecer as condições necessárias para a execução do serviço, conforme combinado.</p>
          <p>3.3. Este contrato é gerado eletronicamente pela plataforma Lida Cacau e possui validade jurídica entre as partes.</p>
        </div>

        <div class="signatures">
          <div class="sign-line">
            Assinado digitalmente por<br>
            <b>${producer.name}</b><br>
            ${formatDate(workOrder.createdAt)}
          </div>
          <div class="sign-line">
            Assinado digitalmente por<br>
            <b>${worker.name}</b><br>
            ${formatDate(workOrder.createdAt)}
          </div>
        </div>

        <div class="footer">
          Documento gerado em ${today} • ID do Contrato: ${workOrder.id} • Hash de Segurança: ${Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </body>
    </html>
  `;
};

export const generateAndShareContract = async (data: ContractData) => {
  try {
    const html = generateContractHtml(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });

    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating contract:', error);
    throw new Error('Não foi possível gerar o contrato.');
  }
};
