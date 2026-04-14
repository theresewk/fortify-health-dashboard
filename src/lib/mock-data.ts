export type Workstream =
  | 'Open Market Support'
  | 'Government Partnerships'
  | 'Monitoring & Evaluation';

export type SupportType = 'Programme Support' | 'Resource/Budget Support';
export type BottleneckKey = 'production' | 'quality' | 'reach';

export interface Region {
  id: string;
  name: string;
  totalMills: number;
}

export interface PerformanceRecord {
  regionId: string;
  month: string;
  workstream: Workstream;
  production: number;
  quality: number;
  reach: number;
  activeMills: number;
}

export interface SupportAllocation {
  id: string;
  regionId: string;
  month: string;
  type: SupportType;
  description: string;
  observedImpact?: string;
}

export interface RegionMonthSnapshot {
  month: string;
  activeMills: number;
  production: number;
  quality: number;
  reach: number;
}

export interface BottleneckDiagnosis {
  primaryBottleneck: BottleneckKey;
  secondaryBottleneck: BottleneckKey;
  tiedSecondaryBottlenecks?: BottleneckKey[];
  recommendedSupportType: SupportType;
  exampleIntervention: string;
}

export const REGIONS: Region[] = [
  { id: 'mp', name: 'Madhya Pradesh', totalMills: 14 },
  { id: 'raj', name: 'Rajasthan', totalMills: 15 },
  { id: 'up', name: 'Uttar Pradesh', totalMills: 16 },
  { id: 'guj', name: 'Gujarat', totalMills: 20 },
  { id: 'mah', name: 'Maharashtra', totalMills: 23 },
];

export const WORKSTREAMS: Workstream[] = [
  'Open Market Support',
  'Government Partnerships',
  'Monitoring & Evaluation',
];

export const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
];

const REGION_MONTH_BASE: Record<string, RegionMonthSnapshot[]> = {
  mp: [
    { month: '2025-10', activeMills: 10, production: 62, quality: 65, reach: 64 },
    { month: '2025-11', activeMills: 9, production: 59, quality: 62, reach: 61 },
    { month: '2025-12', activeMills: 8, production: 56, quality: 60, reach: 58 },
    { month: '2026-01', activeMills: 8, production: 55, quality: 58, reach: 56 },
    { month: '2026-02', activeMills: 8, production: 54, quality: 57, reach: 55 },
    { month: '2026-03', activeMills: 8, production: 55, quality: 58, reach: 62 },
  ],
  raj: [
    { month: '2025-10', activeMills: 11, production: 67, quality: 70, reach: 74 },
    { month: '2025-11', activeMills: 11, production: 65, quality: 69, reach: 72 },
    { month: '2025-12', activeMills: 12, production: 64, quality: 69, reach: 71 },
    { month: '2026-01', activeMills: 12, production: 62, quality: 68, reach: 70 },
    { month: '2026-02', activeMills: 12, production: 63, quality: 70, reach: 72 },
    { month: '2026-03', activeMills: 12, production: 64, quality: 71, reach: 81 },
  ],
  up: [
    { month: '2025-10', activeMills: 9, production: 68, quality: 72, reach: 76 },
    { month: '2025-11', activeMills: 9, production: 67, quality: 70, reach: 74 },
    { month: '2025-12', activeMills: 10, production: 66, quality: 69, reach: 72 },
    { month: '2026-01', activeMills: 10, production: 65, quality: 68, reach: 71 },
    { month: '2026-02', activeMills: 10, production: 67, quality: 66, reach: 70 },
    { month: '2026-03', activeMills: 10, production: 68, quality: 65, reach: 70 },
  ],
  guj: [
    { month: '2025-10', activeMills: 16, production: 85, quality: 87, reach: 80 },
    { month: '2025-11', activeMills: 17, production: 84, quality: 86, reach: 79 },
    { month: '2025-12', activeMills: 17, production: 83, quality: 86, reach: 79 },
    { month: '2026-01', activeMills: 18, production: 82, quality: 87, reach: 79 },
    { month: '2026-02', activeMills: 18, production: 82, quality: 88, reach: 79 },
    { month: '2026-03', activeMills: 18, production: 82, quality: 88, reach: 79 },
  ],
  mah: [
    { month: '2025-10', activeMills: 20, production: 92, quality: 92, reach: 87 },
    { month: '2025-11', activeMills: 21, production: 92, quality: 91, reach: 87 },
    { month: '2025-12', activeMills: 21, production: 91, quality: 92, reach: 88 },
    { month: '2026-01', activeMills: 22, production: 91, quality: 92, reach: 88 },
    { month: '2026-02', activeMills: 22, production: 91, quality: 92, reach: 88 },
    { month: '2026-03', activeMills: 22, production: 91, quality: 92, reach: 88 },
  ],
};

const WORKSTREAM_ADJUSTMENTS: Record<
  Workstream,
  { production: number; quality: number; reach: number }
> = {
  'Open Market Support': { production: 0, quality: -2, reach: 0 },
  'Government Partnerships': { production: -1, quality: 0, reach: 2 },
  'Monitoring & Evaluation': { production: -2, quality: 2, reach: -1 },
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function adjustActiveMills(activeMills: number, workstream: Workstream) {
  if (workstream === 'Open Market Support') {
    return activeMills;
  }

  if (workstream === 'Government Partnerships') {
    return Math.max(0, activeMills - 1);
  }

  return Math.max(0, activeMills - 2);
}

export function calculateRiskScore(production: number, quality: number, reach: number) {
  return 100 - (production + quality + reach) / 3;
}

const BOTTLENECK_SUPPORT_MAP: Record<
  BottleneckKey,
  Pick<BottleneckDiagnosis, 'recommendedSupportType' | 'exampleIntervention'>
> = {
  production: {
    recommendedSupportType: 'Programme Support',
    exampleIntervention:
      'Field coordination and mill follow-up to recover output against target.',
  },
  quality: {
    recommendedSupportType: 'Resource/Budget Support',
    exampleIntervention:
      'Additional quality-testing kits, calibration support, or equipment maintenance.',
  },
  reach: {
    recommendedSupportType: 'Programme Support',
    exampleIntervention:
      'Distributor follow-up and rollout support to expand beneficiary access.',
  },
};

export function getBottleneckDiagnosis(
  production: number,
  quality: number,
  reach: number,
): BottleneckDiagnosis {
  const rankedDrivers = [
    { key: 'production' as const, value: production },
    { key: 'quality' as const, value: quality },
    { key: 'reach' as const, value: reach },
  ].sort((left, right) => left.value - right.value);

  const primaryBottleneck = rankedDrivers[0].key;
  const secondaryBottleneck = rankedDrivers[1].key;
  const tiedSecondaryBottlenecks =
    rankedDrivers[1].value === rankedDrivers[2].value
      ? [rankedDrivers[1].key, rankedDrivers[2].key]
      : undefined;

  return {
    primaryBottleneck,
    secondaryBottleneck,
    tiedSecondaryBottlenecks,
    ...BOTTLENECK_SUPPORT_MAP[primaryBottleneck],
  };
}

export const MOCK_PERFORMANCE: PerformanceRecord[] = REGIONS.flatMap((region) =>
  REGION_MONTH_BASE[region.id].flatMap((snapshot) =>
    WORKSTREAMS.map((workstream) => {
      const adjustment = WORKSTREAM_ADJUSTMENTS[workstream];

      return {
        regionId: region.id,
        month: snapshot.month,
        workstream,
        production: clamp(snapshot.production + adjustment.production),
        quality: clamp(snapshot.quality + adjustment.quality),
        reach: clamp(snapshot.reach + adjustment.reach),
        activeMills: adjustActiveMills(snapshot.activeMills, workstream),
      };
    }),
  ),
);

export const MOCK_SUPPORT: SupportAllocation[] = [
  {
    id: 'mp-programme-1',
    regionId: 'mp',
    month: '2025-12',
    type: 'Programme Support',
    description: 'Additional programme manager deployed to recover underperforming partner mills.',
    observedImpact: 'Production decline slowed within one review cycle.',
  },
  {
    id: 'mp-budget-1',
    regionId: 'mp',
    month: '2026-02',
    type: 'Resource/Budget Support',
    description: 'Emergency maintenance budget released for dosifier repairs and premix handling.',
    observedImpact: 'Beneficiary reach improved in the following month while risk stopped rising.',
  },
  {
    id: 'raj-programme-1',
    regionId: 'raj',
    month: '2026-01',
    type: 'Programme Support',
    description: 'Field coordination support added to improve launch readiness and reporting cadence.',
    observedImpact: 'Quality and reach recovered by the next monthly review.',
  },
  {
    id: 'up-budget-1',
    regionId: 'up',
    month: '2026-02',
    type: 'Resource/Budget Support',
    description: 'Budget approved for additional quality testing kits and distributor follow-up.',
    observedImpact: 'Risk stabilized, but beneficiary reach remains below target.',
  },
  {
    id: 'guj-programme-1',
    regionId: 'guj',
    month: '2025-11',
    type: 'Programme Support',
    description: 'Review cadence tightened after an early warning on regional output consistency.',
    observedImpact: 'Region returned to low-risk status and remained stable.',
  },
  {
    id: 'mah-budget-1',
    regionId: 'mah',
    month: '2025-12',
    type: 'Resource/Budget Support',
    description: 'Scale-up budget allocated for additional partner onboarding and monitoring coverage.',
    observedImpact: 'Low-risk trajectory sustained while active mills increased.',
  },
];
