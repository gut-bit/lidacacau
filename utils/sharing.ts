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
  url: string;
}

const getBaseUrl = (): string => {
  if (__DEV__) {
    return process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://lidacacau.replit.app';
  }
  return 'https://lidacacau.com';
};

export const generateShareUrl = (type: CardShareType, id: string, forSocialPreview: boolean = false): string => {
  const baseUrl = getBaseUrl();
  const path = type === 'demand' ? 'demand' : 'offer';
  
  if (forSocialPreview) {
    return `${baseUrl}/share/${path}/${id}`;
  }
  return `${baseUrl}/${path}/${id}`;
};

export const generateJobShareText = (job: Job, producerName?: string): ShareContent => {
  const serviceType = getServiceTypeById(job.serviceTypeId);
  const serviceName = serviceType?.name || 'Servico';
  const unit = serviceType?.unit || 'un';
  const shareUrl = generateShareUrl('demand', job.id, true);
  
  const lines = [
    `OPORTUNIDADE DE TRABALHO`,
    ``,
    `${serviceName}`,
    `${formatCurrency(job.offer)}`,
    `${job.locationText}`,
    job.quantity ? `${job.quantity} ${unit}` : '',
    job.notes ? `${job.notes}` : '',
    ``,
    producerName ? `Por: ${producerName}` : '',
    ``,
    `Acesse agora:`,
    shareUrl,
    ``,
    `#LidaCacau`,
  ].filter(Boolean);
  
  return {
    title: `${serviceName} - ${formatCurrency(job.offer)}`,
    message: lines.join('\n'),
    url: shareUrl,
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
  
  const shareUrl = generateShareUrl('offer', offer.id, true);
  
  const lines = [
    `TRABALHADOR DISPONIVEL`,
    ``,
    `${serviceNames}`,
    `${price}`,
    `Raio: ${offer.availableRadius}km`,
    offer.description ? `${offer.description}` : '',
    ``,
    workerName ? `${workerName}` : '',
    ``,
    `Acesse agora:`,
    shareUrl,
    ``,
    `#LidaCacau`,
  ].filter(Boolean);
  
  return {
    title: `${serviceNames} - ${price}`,
    message: lines.join('\n'),
    url: shareUrl,
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
      url: Platform.OS === 'ios' ? content.url : undefined,
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
    const url = generateShareUrl(type, id, true);
    await Clipboard.setStringAsync(url);
    return true;
  } catch (error) {
    console.error('Error copying card link:', error);
    return false;
  }
};

export const generateCardLink = (type: CardShareType, id: string): string => {
  return generateShareUrl(type, id, true);
};

export const shareUserProfile = async (user: User): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    const shareUrl = `${baseUrl}/user/${user.id}`;
    
    const content = {
      title: `${user.name} - LidaCacau`,
      message: [
        `${user.name}`,
        ``,
        user.location || 'Uruara, PA',
        ``,
        `Veja o perfil:`,
        shareUrl,
        ``,
        `#LidaCacau`,
      ].join('\n'),
      url: shareUrl,
    };
    
    return shareViaSystem(content);
  } catch (error) {
    console.error('Error sharing user profile:', error);
    return false;
  }
};
