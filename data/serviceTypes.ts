import { ServiceType } from '@/types';

export const SERVICE_CATEGORIES = {
  rural: 'Servicos Rurais',
  construction: 'Construcao',
  maintenance: 'Manutencao',
  transport: 'Transporte',
};

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'poda',
    name: 'Poda',
    unit: 'planta',
    basePrice: 2.0,
    minLevel: 1,
    icon: 'scissors',
  },
  {
    id: 'enxertia',
    name: 'Enxertia',
    unit: 'enxerto',
    basePrice: 4.0,
    minLevel: 2,
    icon: 'activity',
  },
  {
    id: 'colheita',
    name: 'Colheita',
    unit: 'kg',
    basePrice: 0.6,
    minLevel: 1,
    icon: 'shopping-bag',
  },
  {
    id: 'rocagem',
    name: 'Rocagem',
    unit: 'ha',
    basePrice: 180.0,
    minLevel: 1,
    icon: 'wind',
  },
  {
    id: 'aplicacao',
    name: 'Aplicacao/Manejo',
    unit: 'ha',
    basePrice: 220.0,
    minLevel: 2,
    icon: 'droplet',
  },
  {
    id: 'trator',
    name: 'Operador de Trator',
    unit: 'hora',
    basePrice: 45.0,
    minLevel: 2,
    icon: 'truck',
  },
  {
    id: 'motorista',
    name: 'Motorista/Logistica',
    unit: 'km',
    basePrice: 2.5,
    minLevel: 2,
    icon: 'navigation',
  },
  {
    id: 'pedreiro',
    name: 'Pedreiro',
    unit: 'diaria',
    basePrice: 180.0,
    minLevel: 1,
    icon: 'home',
  },
  {
    id: 'eletricista',
    name: 'Eletricista',
    unit: 'servico',
    basePrice: 200.0,
    minLevel: 2,
    icon: 'zap',
  },
  {
    id: 'encanador',
    name: 'Encanador',
    unit: 'servico',
    basePrice: 180.0,
    minLevel: 2,
    icon: 'droplet',
  },
  {
    id: 'serralheiro',
    name: 'Serralheiro',
    unit: 'servico',
    basePrice: 220.0,
    minLevel: 2,
    icon: 'tool',
  },
  {
    id: 'pintor',
    name: 'Pintor',
    unit: 'm2',
    basePrice: 25.0,
    minLevel: 1,
    icon: 'edit-3',
  },
  {
    id: 'carpinteiro',
    name: 'Carpinteiro',
    unit: 'diaria',
    basePrice: 200.0,
    minLevel: 2,
    icon: 'box',
  },
  {
    id: 'jardineiro',
    name: 'Jardineiro',
    unit: 'diaria',
    basePrice: 120.0,
    minLevel: 1,
    icon: 'sun',
  },
  {
    id: 'limpeza',
    name: 'Limpeza de Terreno',
    unit: 'ha',
    basePrice: 250.0,
    minLevel: 1,
    icon: 'trash-2',
  },
  {
    id: 'cercas',
    name: 'Instalacao de Cercas',
    unit: 'metro',
    basePrice: 35.0,
    minLevel: 2,
    icon: 'grid',
  },
  {
    id: 'soldador',
    name: 'Soldador',
    unit: 'servico',
    basePrice: 250.0,
    minLevel: 3,
    icon: 'zap-off',
  },
];

export const getServiceTypeById = (id: string): ServiceType | undefined => {
  return SERVICE_TYPES.find((s) => s.id === id);
};

export const getServiceIcon = (serviceTypeId: string): string => {
  const service = getServiceTypeById(serviceTypeId);
  return service?.icon || 'briefcase';
};
