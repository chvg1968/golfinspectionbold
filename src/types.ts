export interface Property {
  id: string;
  name: string;
  type: string;
  required: boolean;
  cartNumber: string;
  diagramType: string;
}

export interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface DiagramData {
  points: Point[];
  width: number;
  height: number;
  diagramType: string;
}

export interface Inspection {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  inspection_date: string;
  property: string;
  cart_type: string;
  cart_number: string;
  observations: string;
  diagram_data?: DiagramData;
  signature_data?: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

export const PROPERTIES: Property[] = [
  { 
    id: 'rental_6_passenger_150', 
    name: 'Rental #150', 
    type: 'string', 
    required: false, 
    cartNumber: '150', 
    diagramType: 'rental_150.jpg'
  },
  { 
    id: 'rental_6_passenger_144', 
    name: 'Rental #144', 
    type: 'string', 
    required: false, 
    cartNumber: '144', 
    diagramType: 'rental_144.jpg'
  },
  { 
    id: 'villa_flora_10180', 
    name: 'Villa Flora 10180', 
    type: 'string', 
    required: false, 
    cartNumber: '18', 
    diagramType: 'villaflora_10180.jpg'
  },
  { 
    id: 'ocean_haven_208', 
    name: 'Ocean Haven 208', 
    type: 'string', 
    required: false, 
    cartNumber: '71', 
    diagramType: 'oceanhaven_208.jpg'
  },
  { 
    id: 'casa_prestige_g7_4_passenger', 
    name: 'Casa Prestige G7 (4 passenger)', 
    type: 'string', 
    required: false, 
    cartNumber: '22', 
    diagramType: 'casaprestige_4.jpg'
  },
  { 
    id: 'casa_prestige_g7_6_passenger', 
    name: 'Casa Prestige G7 (6 passenger)', 
    type: 'string', 
    required: false, 
    cartNumber: '193', 
    diagramType: 'casaprestige_6.jpg'
  },
  { 
    id: 'villa_tiffany_10389', 
    name: 'Villa Tiffany 10389', 
    type: 'string', 
    required: false, 
    cartNumber: '136', 
    diagramType: 'villatiffany_10389.jpg'
  },
  { 
    id: 'villa_palacio_7256', 
    name: 'Villa Palacio 7256', 
    type: 'string', 
    required: false, 
    cartNumber: '130', 
    diagramType: 'villapalacio_7256.jpg'
  },
  { 
    id: 'villa_clara_3325', 
    name: 'Villa Clara 3325', 
    type: 'string', 
    required: false, 
    cartNumber: '119', 
    diagramType: 'villaclara_3325.jpg'
  },
  { 
    id: 'villa_paloma_5138', 
    name: 'Villa Paloma 5138', 
    type: 'string', 
    required: false, 
    cartNumber: '101', 
    diagramType: 'villapaloma_5138.jpg'
  }
];