export interface RoadSegment {
  id: string;
  name: string;
  classification: 'principal' | 'ramal';
  coordinates: [number, number][];
  color?: string;
}

export const roadsKm140: RoadSegment[] = [
  {
    id: 'transamazonica-main',
    name: 'BR-230 Transamazonica',
    classification: 'principal',
    coordinates: [
      [-3.5800, -53.5500],
      [-3.5850, -53.5200],
      [-3.5900, -53.4900],
      [-3.5950, -53.4600],
      [-3.6000, -53.4300],
      [-3.6100, -53.4100],
      [-3.6200, -53.3950],
      [-3.6268, -53.3936],
      [-3.6350, -53.3800],
      [-3.6450, -53.3600],
      [-3.6550, -53.3400],
      [-3.6650, -53.3200],
      [-3.6750, -53.3000],
      [-3.6850, -53.2800],
      [-3.6950, -53.2600],
    ],
    color: '#dc2626',
  },
  {
    id: 'km140-norte-principal',
    name: 'Vicinal km 140 Norte',
    classification: 'ramal',
    coordinates: [
      [-3.6268, -53.3936],
      [-3.6100, -53.3900],
      [-3.5900, -53.3850],
      [-3.5700, -53.3800],
      [-3.5500, -53.3750],
      [-3.5300, -53.3700],
      [-3.5100, -53.3680],
      [-3.4900, -53.3650],
    ],
    color: '#2563eb',
  },
  {
    id: 'km140-ramal-1',
    name: 'Ramal 1 - km 140 Norte',
    classification: 'ramal',
    coordinates: [
      [-3.5900, -53.3850],
      [-3.5850, -53.4000],
      [-3.5800, -53.4150],
      [-3.5750, -53.4300],
    ],
    color: '#16a34a',
  },
  {
    id: 'km140-ramal-2',
    name: 'Ramal 2 - km 140 Norte',
    classification: 'ramal',
    coordinates: [
      [-3.5700, -53.3800],
      [-3.5650, -53.3650],
      [-3.5600, -53.3500],
      [-3.5550, -53.3350],
    ],
    color: '#16a34a',
  },
  {
    id: 'km140-ramal-3',
    name: 'Ramal 3 - km 140 Norte',
    classification: 'ramal',
    coordinates: [
      [-3.5500, -53.3750],
      [-3.5450, -53.3900],
      [-3.5400, -53.4050],
      [-3.5350, -53.4200],
    ],
    color: '#16a34a',
  },
  {
    id: 'km140-ramal-4',
    name: 'Ramal 4 - km 140 Norte',
    classification: 'ramal',
    coordinates: [
      [-3.5300, -53.3700],
      [-3.5250, -53.3550],
      [-3.5200, -53.3400],
    ],
    color: '#16a34a',
  },
  {
    id: 'km140-sul',
    name: 'Vicinal km 140 Sul',
    classification: 'ramal',
    coordinates: [
      [-3.6268, -53.3936],
      [-3.6400, -53.3980],
      [-3.6550, -53.4020],
      [-3.6700, -53.4060],
      [-3.6850, -53.4100],
    ],
    color: '#7c3aed',
  },
  {
    id: 'km138-vicinal',
    name: 'Vicinal km 138',
    classification: 'ramal',
    coordinates: [
      [-3.6100, -53.4100],
      [-3.5950, -53.4150],
      [-3.5800, -53.4200],
      [-3.5650, -53.4250],
    ],
    color: '#0891b2',
  },
  {
    id: 'km142-vicinal',
    name: 'Vicinal km 142',
    classification: 'ramal',
    coordinates: [
      [-3.6450, -53.3600],
      [-3.6300, -53.3550],
      [-3.6150, -53.3500],
      [-3.6000, -53.3450],
    ],
    color: '#0891b2',
  },
];

export const km140Center: { latitude: number; longitude: number } = {
  latitude: -3.6268,
  longitude: -53.3936,
};

export const km140Zoom = 12;

export const occurrenceTypes = [
  { id: 'electrical', label: 'Rede Eletrica', icon: 'zap', color: '#eab308' },
  { id: 'road', label: 'Estrada', icon: 'map', color: '#f97316' },
  { id: 'bridge', label: 'Ponte', icon: 'box', color: '#ef4444' },
  { id: 'social', label: 'Social', icon: 'users', color: '#8b5cf6' },
  { id: 'theft', label: 'Furto/Roubo', icon: 'alert-triangle', color: '#dc2626' },
  { id: 'other', label: 'Outro', icon: 'help-circle', color: '#6b7280' },
] as const;

export const trafegabilidadeOptions = [
  { id: 'boa', label: 'Boa', color: '#16a34a' },
  { id: 'regular', label: 'Regular', color: '#eab308' },
  { id: 'ruim', label: 'Ruim', color: '#f97316' },
  { id: 'intransitavel', label: 'Intransitavel', color: '#dc2626' },
] as const;
