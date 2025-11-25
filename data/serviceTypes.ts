import { ServiceType } from '@/types';

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
    name: 'Roçagem',
    unit: 'ha',
    basePrice: 180.0,
    minLevel: 1,
    icon: 'wind',
  },
  {
    id: 'aplicacao',
    name: 'Aplicação/Manejo',
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
    name: 'Motorista/Logística',
    unit: 'km',
    basePrice: 2.5,
    minLevel: 2,
    icon: 'navigation',
  },
];

export const getServiceTypeById = (id: string): ServiceType | undefined => {
  return SERVICE_TYPES.find((s) => s.id === id);
};

export const getServiceIcon = (serviceTypeId: string): string => {
  const service = getServiceTypeById(serviceTypeId);
  return service?.icon || 'briefcase';
};
