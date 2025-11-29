import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { Job, ServiceOffer, User } from '@/types';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatDate } from '@/utils/format';

type CardShareType = 'demand' | 'offer';

interface ShareContent {
  title: string;
  message: string;
  url?: string;
}

export const generateJobShareText = (job: Job, producerName?: string): ShareContent => {
  const serviceType = getServiceTypeById(job.serviceTypeId);
  const serviceName = serviceType?.name || 'Servico';
  const unit = serviceType?.unit || 'un';
  
  const lines = [
    `DEMANDA DE TRABALHO`,
    ``,
    `Servico: ${serviceName}`,
    `Valor: ${formatCurrency(job.offer)}`,
    `Local: ${job.locationText}`,
    job.quantity ? `Quantidade: ${job.quantity} ${unit}` : '',
    job.notes ? `Detalhes: ${job.notes}` : '',
    ``,
    producerName ? `Publicado por: ${producerName}` : '',
    ``,
    `Interessado? Baixe o Empleitapp e envie sua proposta!`,
    ``,
    `#Empleitapp #TrabalhoRural #${serviceName.replace(/\s+/g, '')}`,
  ].filter(Boolean);
  
  return {
    title: `Demanda: ${serviceName}`,
    message: lines.join('\n'),
  };
};

export const generateOfferShareText = (offer: ServiceOffer, workerName?: string): ShareContent => {
  const serviceNames = offer.serviceTypeIds
    .map(id => getServiceTypeById(id)?.name)
    .filter(Boolean)
    .join(', ');
    
  const price = offer.pricePerDay 
    ? `${formatCurrency(offer.pricePerDay)}/dia` 
    : offer.pricePerHour 
    ? `${formatCurrency(offer.pricePerHour)}/hora`
    : offer.pricePerUnit
    ? `${formatCurrency(offer.pricePerUnit)}/unidade`
    : 'A combinar';
  
  const extras: string[] = [];
  if (offer.extras?.providesFood) extras.push('Alimentacao');
  if (offer.extras?.providesAccommodation) extras.push('Estadia');
  if (offer.extras?.providesTransport) extras.push('Transporte');
  if (offer.extras?.toolsProvided) extras.push('Ferramentas');
  
  const lines = [
    `TRABALHADOR DISPONIVEL`,
    ``,
    `Servicos: ${serviceNames}`,
    `Valor: ${price}`,
    offer.priceNegotiable ? `(Valor negociavel)` : '',
    `Raio de atendimento: ${offer.availableRadius}km`,
    offer.description ? `Sobre: ${offer.description}` : '',
    extras.length > 0 ? `Oferece: ${extras.join(', ')}` : '',
    ``,
    workerName ? `Trabalhador: ${workerName}` : '',
    ``,
    `Precisa de ajuda? Baixe o Empleitapp e entre em contato!`,
    ``,
    `#Empleitapp #TrabalhoRural #${serviceNames.replace(/\s+/g, '').replace(/,/g, ' #')}`,
  ].filter(Boolean);
  
  return {
    title: `Oferta: ${serviceNames}`,
    message: lines.join('\n'),
  };
};

export const shareViaWhatsApp = async (content: ShareContent): Promise<boolean> => {
  try {
    const encodedMessage = encodeURIComponent(content.message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      const webWhatsapp = `https://wa.me/?text=${encodedMessage}`;
      await Linking.openURL(webWhatsapp);
      return true;
    }
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    return false;
  }
};

export const shareViaSystem = async (content: ShareContent): Promise<boolean> => {
  try {
    const result = await Share.share({
      message: content.message,
      title: content.title,
    });
    
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};

export const shareCard = async (
  type: CardShareType,
  data: Job | ServiceOffer,
  ownerName?: string,
  method: 'whatsapp' | 'system' = 'system'
): Promise<boolean> => {
  const content = type === 'demand' 
    ? generateJobShareText(data as Job, ownerName)
    : generateOfferShareText(data as ServiceOffer, ownerName);
  
  if (method === 'whatsapp') {
    return shareViaWhatsApp(content);
  }
  
  return shareViaSystem(content);
};

export const copyCardLink = async (type: CardShareType, id: string): Promise<boolean> => {
  try {
    const baseUrl = 'https://empleitapp.com.br';
    const path = type === 'demand' ? 'demanda' : 'oferta';
    const url = `${baseUrl}/${path}/${id}`;
    
    await Clipboard.setStringAsync(url);
    return true;
  } catch (error) {
    console.error('Error copying card link:', error);
    return false;
  }
};

export const generateCardLink = (type: CardShareType, id: string): string => {
  const baseUrl = 'https://empleitapp.com.br';
  const path = type === 'demand' ? 'demanda' : 'oferta';
  return `${baseUrl}/${path}/${id}`;
};
