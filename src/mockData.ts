export const industries = [
  {
    id: 'milk',
    name: 'Milk/Dairy',
    parameters: [
      'PPE - Hair Net',
      'PPE - Gloves',
      'PPE - Apron',
      'Hygiene Compliance',
    ],
  },
  {
    id: 'plastic',
    name: 'Plastic',
    parameters: ['PPE - Helmet', 'PPE - Vest', 'Fire Detection'],
  },
  {
    id: 'metal',
    name: 'Metal',
    parameters: [
      'PPE - Helmet',
      'PPE - Vest',
      'PPE - Gloves',
      'Safety Zone Intrusion',
      'Equipment Malfunction',
    ],
  },
  {
    id: 'chemical',
    name: 'Chemical',
    parameters: [
      'PPE - Helmet',
      'PPE - Vest',
      'PPE - Gloves',
      'PPE - Goggles',
      'PPE - Mask',
      'Safety Zone Intrusion',
      'Spillage',
    ],
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    parameters: [
      'PPE - Hair Net',
      'PPE - Gloves',
      'PPE - Apron',
      'Hygiene Compliance',
      'Spillage',
    ],
  },
  {
    id: 'pharmaceutical',
    name: 'Pharmaceutical',
    parameters: [
      'PPE - Helmet',
      'PPE - Vest',
      'PPE - Gloves',
      'PPE - Goggles',
      'PPE - Mask',
      'Hygiene Compliance',
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    parameters: [
      'PPE - Helmet',
      'PPE - Vest',
      'PPE - Gloves',
      'Safety Zone Intrusion',
      'Equipment Malfunction',
    ],
  },
  {
    id: 'textile',
    name: 'Textile',
    parameters: [
      'PPE - Hair Net',
      'PPE - Gloves',
      'PPE - Vest',
      'Equipment Malfunction',
      'Safety Zone Intrusion',
    ],
  },
];

export const mockViolations = [
  {
    id: 1,
    timestamp: '2024-12-16T10:30:00Z',
    type: 'PPE - Helmet Missing',
    severity: 'Critical',
    location: 'Zone 3',
  },
  {
    id: 2,
    timestamp: '2024-12-16T10:25:00Z',
    type: 'Safety Zone Intrusion',
    severity: 'Critical',
    location: 'Zone 1',
  },
  {
    id: 3,
    timestamp: '2024-12-16T10:20:00Z',
    type: 'PPE - Gloves Missing',
    severity: 'Warning',
    location: 'Zone 4',
  },
  {
    id: 4,
    timestamp: '2024-12-16T10:15:00Z',
    type: 'Hygiene Compliance',
    severity: 'Warning',
    location: 'Zone 2',
  },
  {
    id: 5,
    timestamp: '2024-12-16T10:10:00Z',
    type: 'Fire Detection Alert',
    severity: 'Critical',
    location: 'Zone 5',
  },
  {
    id: 6,
    timestamp: '2024-12-16T10:05:00Z',
    type: 'Equipment Malfunction',
    severity: 'Warning',
    location: 'Zone 3',
  },
  {
    id: 7,
    timestamp: '2024-12-16T10:00:00Z',
    type: 'Spillage Detected',
    severity: 'Warning',
    location: 'Zone 1',
  },
  {
    id: 8,
    timestamp: '2024-12-16T09:55:00Z',
    type: 'PPE - Vest Missing',
    severity: 'Warning',
    location: 'Zone 2',
  },
  {
    id: 9,
    timestamp: '2024-12-16T09:50:00Z',
    type: 'Safety Zone Intrusion',
    severity: 'Warning',
    location: 'Zone 4',
  },
  {
    id: 10,
    timestamp: '2024-12-16T09:45:00Z',
    type: 'PPE - Mask Missing',
    severity: 'Critical',
    location: 'Zone 5',
  },
  {
    id: 11,
    timestamp: '2024-12-16T09:40:00Z',
    type: 'Hygiene Compliance',
    severity: 'Warning',
    location: 'Zone 1',
  },
  {
    id: 12,
    timestamp: '2024-12-16T09:35:00Z',
    type: 'Equipment Malfunction',
    severity: 'Critical',
    location: 'Zone 3',
  },
  {
    id: 13,
    timestamp: '2024-12-16T09:30:00Z',
    type: 'PPE - Hair Net Missing',
    severity: 'Warning',
    location: 'Zone 2',
  },
  {
    id: 14,
    timestamp: '2024-12-16T09:25:00Z',
    type: 'Spillage Detected',
    severity: 'Critical',
    location: 'Zone 4',
  },
  {
    id: 15,
    timestamp: '2024-12-16T09:20:00Z',
    type: 'Fire Detection Alert',
    severity: 'Warning',
    location: 'Zone 1',
  },
];

export const mockStats = {
  totalViolations: 47,
  criticalAlerts: 12,
  warnings: 35,
  complianceRate: 87.5,
};

export const violationsByType = [
  { type: 'PPE Violations', count: 15 },
  { type: 'Safety Zone', count: 8 },
  { type: 'Equipment', count: 7 },
  { type: 'Hygiene', count: 9 },
  { type: 'Fire/Spillage', count: 8 },
];

export const violationsOverTime = [
  { time: '08:00', violations: 2 },
  { time: '09:00', violations: 5 },
  { time: '10:00', violations: 12 },
  { time: '11:00', violations: 8 },
  { time: '12:00', violations: 14 },
  { time: '13:00', violations: 6 },
];
