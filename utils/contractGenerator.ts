import { SignedContract, PaymentTerms, User, Job, ServiceType } from '@/types';
import { generateId } from './storage';

export interface ContractData {
  producer: User;
  worker: User;
  job: Job;
  serviceType: ServiceType;
  paymentTerms: PaymentTerms;
  totalValue: number;
}

function formatDate(date: string | undefined): string {
  if (!date) return new Date().toLocaleDateString('pt-BR');
  return new Date(date).toLocaleDateString('pt-BR');
}

function getPaymentDescription(paymentTerms: PaymentTerms, totalValue: number): string {
  const formatted = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  switch (paymentTerms.type) {
    case 'full_after':
      return `100% do valor (${formatted}) será pago após a conclusão satisfatória do trabalho`;
    case 'split_50_50':
      const half = (totalValue / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `50% do valor (${half}) será pago antes do início do trabalho e 50% (${half}) após a conclusão`;
    case 'split_30_70':
      const advance30 = (totalValue * 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const after70 = (totalValue * 0.7).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `30% do valor (${advance30}) será pago como adiantamento e 70% (${after70}) após a conclusão`;
    case 'advance_custom':
      const advPct = paymentTerms.advancePercentage || 30;
      const advAmount = (totalValue * (advPct / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const remAmount = (totalValue * ((100 - advPct) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `${advPct}% do valor (${advAmount}) será pago como adiantamento e ${100 - advPct}% (${remAmount}) após a conclusão`;
    case 'per_unit':
      const unitPrice = (paymentTerms.unitPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const units = paymentTerms.estimatedUnits || 0;
      return `Pagamento de ${unitPrice} por unidade, estimado em ${units} unidades, totalizando ${formatted}`;
    case 'per_hour':
      const hourly = (paymentTerms.hourlyRate || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `Pagamento de ${hourly} por hora de trabalho, com total aproximado de ${formatted}`;
    case 'per_day':
      const daily = (paymentTerms.dailyRate || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `Pagamento de ${daily} por dia de trabalho, com total aproximado de ${formatted}`;
    default:
      return `Valor total: ${formatted}`;
  }
}

export function generateContractText(data: ContractData): string {
  const today = new Date().toLocaleDateString('pt-BR');
  const totalFormatted = data.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const paymentDesc = getPaymentDescription(data.paymentTerms, data.totalValue);

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - EMPREITADA

Celebrado em ${today}

ENTRE:

${data.producer.name}, ${data.producer.role === 'producer' ? 'Produtor' : 'Pessoa Física'}, residente em ${data.job.locationText}, doravante designado CONTRATANTE,

E

${data.worker.name}, Pessoa Física, residente em endereço conhecido, doravante designado CONTRATADO,

Celebram entre si o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS, sob o regime de EMPREITADA, conforme segue:

1. DO OBJETO DO CONTRATO

1.1. O CONTRATADO se compromete a executar os seguintes serviços: ${data.serviceType.name}

1.2. Descrição detalhada: ${data.job.notes || 'Serviços conforme especificado na demanda de trabalho'}

1.3. Local de execução: ${data.job.locationText}

1.4. Quantidade: ${data.job.quantity} ${data.serviceType.unit}${data.job.quantity !== 1 ? 's' : ''}

2. DO PERÍODO DE EXECUÇÃO

2.1. Data de início: ${data.job.startDate ? formatDate(data.job.startDate) : 'A definir conforme agendamento'}

2.2. Data prevista de conclusão: ${data.job.endDate ? formatDate(data.job.endDate) : 'A definir conforme progresso do trabalho'}

2.3. O CONTRATADO deverá cumprir os prazos estabelecidos, podendo haver prorrogação mediante justificativa aceita pelo CONTRATANTE.

3. DO VALOR E FORMA DE PAGAMENTO

3.1. Valor total dos serviços: ${totalFormatted}

3.2. Forma de pagamento: ${paymentDesc}

3.3. Os pagamentos serão realizados através de transferência bancária ou acordo entre as partes.

3.4. Não haverá qualquer vínculo empregatício entre o CONTRATANTE e o CONTRATADO, sendo este responsável pelo recolhimento de seus tributos e contribuições.

4. OBRIGAÇÕES DO CONTRATADO

4.1. Executar os serviços com qualidade, capricho e dedicação, conforme padrões técnicos e de segurança vigentes.

4.2. Cumprir rigorosamente os prazos estabelecidos.

4.3. Utilizar materiais e ferramentas apropriados e de boa qualidade.

4.4. Seguir todas as orientações de segurança do trabalho.

4.5. Comunicar imediatamente qualquer situação que comprometa a execução do trabalho.

4.6. Manter o local de trabalho limpo e organizado.

5. OBRIGAÇÕES DO CONTRATANTE

5.1. Fornecer informações precisas sobre o trabalho a ser realizado.

5.2. Permitir acesso ao local de execução dos serviços.

5.3. Efetuar os pagamentos conforme acordado.

5.4. Fornecer apoio técnico se necessário.

6. RESPONSABILIDADES E SEGURANÇA

6.1. O CONTRATADO é responsável por sua própria segurança e saúde durante a execução dos serviços.

6.2. O CONTRATADO deve usar equipamentos de proteção individual quando necessário.

6.3. O CONTRATANTE não se responsabiliza por acidentes ou danos causados por negligência do CONTRATADO.

6.4. O CONTRATADO assume total responsabilidade pelas ferramentas e equipamentos que utilizar.

7. VERIFICAÇÃO E CONCLUSÃO DOS SERVIÇOS

7.1. A conclusão dos serviços será verificada pelo CONTRATANTE através de inspeção visual e funcional.

7.2. Caso o trabalho não atenda aos padrões acordados, o CONTRATANTE poderá solicitar ajustes ou correções.

7.3. A aceitação dos serviços se dará mediante confirmação da qualidade do trabalho realizado.

8. DISPOSIÇÕES GERAIS

8.1. Este contrato é regido pelas leis brasileiras, especialmente pelas normas sobre prestação de serviços.

8.2. Qualquer alteração deve ser acordada por escrito entre as partes.

8.3. Em caso de disputas, as partes se submeterão à jurisdição da Comarca de Uruará, Estado do Pará.

8.4. O presente contrato não constitui vínculo empregatício, sendo a relação estabelecida estritamente de prestação de serviço autônomo.

9. RESCISÃO

9.1. Este contrato pode ser rescindido por qualquer das partes mediante comunicação formal com antecedência mínima de 48 horas, salvo casos de força maior.

9.2. A rescisão não afeta o direito de recebimento pelos serviços já executados.

10. CONFIDENCIALIDADE

10.1. As partes se comprometem a manter sigilo sobre informações sensíveis obtidas durante a execução deste contrato.

11. ASSINATURA

Pelo presente instrumento, ambas as partes declaram estar de acordo com os termos e condições acima expostas.

CONTRATANTE: ______________________________
${data.producer.name}
CPF: ______________________________
Data: ____/____/______


CONTRATADO: ______________________________
${data.worker.name}
CPF: ______________________________
Data: ____/____/______


TESTEMUNHAS (Opcional):

1º) ______________________________
    Nome: ______________________________
    CPF: ______________________________

2º) ______________________________
    Nome: ______________________________
    CPF: ______________________________
`;
}

export function createSignedContract(data: ContractData): SignedContract {
  return {
    id: generateId(),
    text: generateContractText(data),
    producerName: data.producer.name,
    producerEmail: data.producer.email,
    workerName: data.worker.name,
    workerEmail: data.worker.email,
    serviceType: data.serviceType.name,
    startDate: data.job.startDate,
    endDate: data.job.endDate,
    totalValue: data.totalValue,
    paymentTermsType: data.paymentTerms.type,
    createdAt: new Date().toISOString(),
  };
}
