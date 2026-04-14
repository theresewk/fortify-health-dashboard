import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Filter,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  calculateRiskScore,
  getBottleneckDiagnosis,
  MONTHS,
  MOCK_PERFORMANCE,
  MOCK_SUPPORT,
  REGIONS,
  WORKSTREAMS,
  BottleneckKey,
  PerformanceRecord,
  Workstream,
} from '@/src/lib/mock-data';
import fortifyLogo from '@/src/assets/fortify-logo.png';

type RiskLevelFilter = 'All' | 'High' | 'Medium' | 'Low';
type TimeRangeFilter = '3' | '6';
type RegionFilter = 'All' | (typeof REGIONS)[number]['id'];

type RegionSnapshot = {
  id: string;
  name: string;
  totalMills: number;
  activeMills: number;
  riskScore: number;
  previousRiskScore: number;
  production: number;
  quality: number;
  reach: number;
  supportStatus: string;
};

const TIME_RANGE_OPTIONS: TimeRangeFilter[] = ['3', '6'];

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Number(value.toFixed(1));
}

function formatMonth(month: string) {
  return format(parseISO(`${month}-01`), 'MMM yy');
}

function getRiskLevel(score: number) {
  if (score >= 65) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function getRiskBadgeClass(score: number) {
  const level = getRiskLevel(score);
  if (level === 'High') return 'border-[#e03616]/20 bg-[#e03616]/10 text-[#b42318] hover:bg-[#e03616]/10';
  if (level === 'Medium') return 'border-[#8b80f9]/20 bg-[#8b80f9]/10 text-[#6f63db] hover:bg-[#8b80f9]/10';
  return 'border-[#6a8d73]/20 bg-[#6a8d73]/10 text-[#527059] hover:bg-[#6a8d73]/10';
}

function getRiskTextClass(score: number) {
  const level = getRiskLevel(score);
  if (level === 'High') return 'text-[#e03616]';
  if (level === 'Medium') return 'text-[#6f63db]';
  return 'text-[#527059]';
}

function getSupportStatus(snapshot: RegionSnapshot) {
  const level = getRiskLevel(snapshot.riskScore);
  if (level === 'High' && snapshot.riskScore > snapshot.previousRiskScore) return 'Escalated';
  if (level === 'High') return 'Under Review';
  if (level === 'Medium') return 'Monitoring';
  return 'On Track';
}

function getSupportStatusClass(status: string) {
  if (status === 'Escalated') return 'text-[#b42318]';
  if (status === 'Under Review') return 'text-[#6f63db]';
  if (status === 'Monitoring') return 'text-[#9a6700]';
  return 'text-[#527059]';
}

function getSupportStatusBadgeClass(status: string) {
  if (status === 'Escalated') return 'border-[#e03616]/20 bg-[#e03616]/8';
  if (status === 'Under Review') return 'border-[#8b80f9]/20 bg-[#8b80f9]/10';
  if (status === 'Monitoring') return 'border-[#f6b10a]/25 bg-[#f6b10a]/10';
  return 'border-[#6a8d73]/20 bg-[#6a8d73]/10';
}

function buildRegionSnapshot(records: PerformanceRecord[], previousRecords: PerformanceRecord[]) {
  const production = average(records.map((record) => record.production));
  const quality = average(records.map((record) => record.quality));
  const reach = average(records.map((record) => record.reach));
  const activeMills = Math.round(average(records.map((record) => record.activeMills)));

  const previousProduction = average(previousRecords.map((record) => record.production));
  const previousQuality = average(previousRecords.map((record) => record.quality));
  const previousReach = average(previousRecords.map((record) => record.reach));

  return {
    production: round(production),
    quality: round(quality),
    reach: round(reach),
    activeMills,
    riskScore: round(calculateRiskScore(production, quality, reach)),
    previousRiskScore: round(
      calculateRiskScore(previousProduction, previousQuality, previousReach),
    ),
  };
}

function getTrendLabel(change: number) {
  if (change > 0.5) return 'Worsening';
  if (change < -0.5) return 'Improving';
  return 'Stable';
}

function getTrendTextClass(change: number) {
  if (change > 0.5) return 'text-[#b42318]';
  if (change < -0.5) return 'text-[#527059]';
  return 'text-[#5c6862]';
}

function getTrendBadgeClass(change: number) {
  if (change > 0.5) return 'border-[#e03616]/20 bg-[#e03616]/8 text-[#b42318]';
  if (change < -0.5) return 'border-[#6a8d73]/20 bg-[#6a8d73]/10 text-[#527059]';
  return 'border-[#c9d7e8] bg-[#eef4fb] text-[#48627f]';
}

function getPerformanceTrendLabel(change: number) {
  if (change > 0.5) return 'Improving';
  if (change < -0.5) return 'Worsening';
  return 'Stable';
}

function getPerformanceTrendTextClass(change: number) {
  if (change > 0.5) return 'text-[#527059]';
  if (change < -0.5) return 'text-[#b42318]';
  return 'text-[#5c6862]';
}

function getPerformanceTrendBadgeClass(change: number) {
  if (change > 0.5) return 'border-[#6a8d73]/20 bg-[#6a8d73]/10 text-[#527059]';
  if (change < -0.5) return 'border-[#e03616]/20 bg-[#e03616]/8 text-[#b42318]';
  return 'border-[#94a39a]/25 bg-[#eef2ee] text-[#5c6862]';
}

function getPerformanceTrendMeta(change: number | null) {
  if (change === null) {
    return {
      label: 'Baseline month',
      detail: 'No prior month in view',
      className: 'text-[#5c6862]',
    };
  }

  return {
    label: getPerformanceTrendLabel(change),
    detail: `${change > 0 ? '+' : ''}${change}`,
    className: getPerformanceTrendTextClass(change),
  };
}

function getBottleneckLabel(key: BottleneckKey) {
  if (key === 'production') return 'Production bottleneck';
  if (key === 'quality') return 'Quality bottleneck';
  return 'Reach bottleneck';
}

function getDriverAccent(key: BottleneckKey) {
  if (key === 'production') return '#6f63db';
  if (key === 'quality') return '#6a8d73';
  return '#f6b10a';
}

function getDriverValueLabel(
  key: BottleneckKey,
  snapshot: { production: number; quality: number; reach: number },
) {
  if (key === 'production') return `${snapshot.production}%`;
  if (key === 'quality') return `${snapshot.quality}%`;
  return `${snapshot.reach}%`;
}

function formatBottleneckList(keys: BottleneckKey[]) {
  const labels = keys.map((key) => getBottleneckLabel(key).replace(' bottleneck', ''));
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return labels.join(', ');
}

function getTimeRangeLabel(value: TimeRangeFilter) {
  if (value === '3') return 'Last 3 Months';
  return 'Last 6 Months';
}

function getRegionFilterLabel(value: RegionFilter) {
  if (value === 'All') return 'All Regions';
  return REGIONS.find((region) => region.id === value)?.name ?? 'All Regions';
}

function getWorkstreamFilterLabel(value: Workstream | 'All') {
  if (value === 'All') return 'All Workstreams';
  return value;
}

function getRiskLevelFilterLabel(value: RiskLevelFilter) {
  if (value === 'All') return 'All Risk Levels';
  return `${value} Risk Only`;
}

function SelectableDot({
  cx,
  cy,
  stroke,
  payload,
  activeMonth,
  onSelect,
}: {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: { rawMonth?: string };
  activeMonth: string;
  onSelect: (month: string) => void;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload?.rawMonth) {
    return null;
  }

  const isActive = payload.rawMonth === activeMonth;

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onSelect(payload.rawMonth!)}>
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={isActive ? 6 : 4}
        fill="#ffffff"
        stroke={stroke ?? '#17211d'}
        strokeWidth={isActive ? 3 : 2}
      />
    </g>
  );
}

function HighRiskReferenceLabel(props: { viewBox?: { x?: number; y?: number; width?: number } }) {
  const x = (props.viewBox?.x ?? 0) + (props.viewBox?.width ?? 0) / 2;
  const y = (props.viewBox?.y ?? 0) - 8;

  return (
    <g>
      <title>
        High risk means the regional risk score is 65 or above, indicating performance is weak
        enough to warrant closer leadership review or support reallocation.
      </title>
      <text x={x} y={y} fill="#b42318" fontSize={11} fontWeight={600} textAnchor="middle">
        High Risk
      </text>
    </g>
  );
}

function CustomTrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ color?: string; name?: string; value?: number | string }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_22px_44px_-24px_rgba(23,33,29,0.35)] backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-[#46524c]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? '#6f63db' }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold tabular-nums text-[#17211d]">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDynamicSupportIntervention(
  primary: BottleneckKey,
  secondary: BottleneckKey,
  snapshot: {
    production: number;
    quality: number;
    reach: number;
    productionDelta: number;
    qualityDelta: number;
    reachDelta: number;
  },
) {
  const secondaryLabel = getBottleneckLabel(secondary).replace(' bottleneck', '').toLowerCase();

  if (primary === 'production') {
    const productionVerb = snapshot.productionDelta < 0 ? 'recover' : 'stabilize';
    return {
      supportType: 'Programme Support' as const,
      intervention: `Field coordination and mill follow-up to ${productionVerb} output while tightening ${secondaryLabel} follow-through.`,
      rationale: `Most relevant for the selected snapshot because output is the weakest driver, with ${secondaryLabel} as the next constraint.`,
    };
  }

  if (primary === 'quality') {
    const qualityVerb = snapshot.qualityDelta < 0 ? 'restore' : 'protect';
    return {
      supportType: 'Resource/Budget Support' as const,
      intervention: `Testing kits, calibration support, and equipment maintenance to ${qualityVerb} compliance while preventing further ${secondaryLabel} slippage.`,
      rationale: `Most relevant for the selected snapshot because compliance is the weakest driver, with ${secondaryLabel} as the secondary pressure point.`,
    };
  }

  const reachVerb = snapshot.reachDelta < 0 ? 'recover' : 'expand';
  return {
    supportType: 'Programme Support' as const,
    intervention: `Distributor follow-up and rollout support to ${reachVerb} beneficiary access while addressing ${secondaryLabel} constraints.`,
    rationale: `Most relevant for the selected snapshot because reach is the weakest driver, with ${secondaryLabel} as the next bottleneck.`,
  };
}

export default function App() {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionFilter>('All');
  const [detailRegionId, setDetailRegionId] = useState<RegionFilter>('All');
  const [overviewRegionFilter, setOverviewRegionFilter] = useState<RegionFilter>('All');
  const [workstreamFilter, setWorkstreamFilter] = useState<Workstream | 'All'>('All');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('6');
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevelFilter>('All');
  const [activeDetailMonth, setActiveDetailMonth] = useState<string | null>(null);

  const visibleMonths = useMemo(
    () => MONTHS.slice(-Number.parseInt(timeRange, 10)),
    [timeRange],
  );

  const latestMonth = visibleMonths[visibleMonths.length - 1];
  const previousMonth = visibleMonths[Math.max(0, visibleMonths.length - 2)];

  const filteredPerformance = useMemo(() => {
    return MOCK_PERFORMANCE.filter((record) => {
      if (!visibleMonths.includes(record.month)) return false;
      if (workstreamFilter !== 'All' && record.workstream !== workstreamFilter) return false;
      if (selectedRegionId !== 'All' && record.regionId !== selectedRegionId) return false;
      return true;
    });
  }, [selectedRegionId, visibleMonths, workstreamFilter]);

  const regionSnapshots = useMemo(() => {
    return REGIONS.map((region) => {
      const currentRecords = filteredPerformance.filter(
        (record) => record.regionId === region.id && record.month === latestMonth,
      );
      const previousRecords = filteredPerformance.filter(
        (record) => record.regionId === region.id && record.month === previousMonth,
      );

      if (!currentRecords.length) return null;

      const snapshot = buildRegionSnapshot(currentRecords, previousRecords);
      return {
        ...region,
        ...snapshot,
        supportStatus: getSupportStatus({ ...region, ...snapshot, supportStatus: '' }),
      } as RegionSnapshot;
    })
      .filter((snapshot): snapshot is RegionSnapshot => snapshot !== null)
      .filter((snapshot) => {
        if (riskLevelFilter === 'All') return true;
        return getRiskLevel(snapshot.riskScore) === riskLevelFilter;
      })
      .sort((left, right) => right.riskScore - left.riskScore);
  }, [filteredPerformance, latestMonth, previousMonth, riskLevelFilter]);

  const selectedRegion = useMemo(() => {
    if (detailRegionId === 'All') return null;
    return REGIONS.find((region) => region.id === detailRegionId) ?? null;
  }, [detailRegionId]);

  const detailTrend = useMemo(() => {
    if (!selectedRegion) return [];

    return visibleMonths.map((month) => {
      const monthRecords = MOCK_PERFORMANCE.filter((record) => {
        if (record.regionId !== selectedRegion.id || record.month !== month) return false;
        return workstreamFilter === 'All' ? true : record.workstream === workstreamFilter;
      });

      const production = average(monthRecords.map((record) => record.production));
      const quality = average(monthRecords.map((record) => record.quality));
      const reach = average(monthRecords.map((record) => record.reach));

      const previousIndex = visibleMonths.indexOf(month) - 1;
      const previousMonthKey = previousIndex >= 0 ? visibleMonths[previousIndex] : null;
      const previousMonthRecords = previousMonthKey
        ? MOCK_PERFORMANCE.filter((record) => {
            if (record.regionId !== selectedRegion.id || record.month !== previousMonthKey) {
              return false;
            }
            return workstreamFilter === 'All' ? true : record.workstream === workstreamFilter;
          })
        : [];

      return {
        month,
        production: round(production),
        quality: round(quality),
        reach: round(reach),
        riskScore: round(calculateRiskScore(production, quality, reach)),
        productionDelta: previousMonthKey
          ? round(production - average(previousMonthRecords.map((record) => record.production)))
          : null,
        qualityDelta: previousMonthKey
          ? round(quality - average(previousMonthRecords.map((record) => record.quality)))
          : null,
        reachDelta: previousMonthKey
          ? round(reach - average(previousMonthRecords.map((record) => record.reach)))
          : null,
      };
    });
  }, [selectedRegion, visibleMonths, workstreamFilter]);

  useEffect(() => {
    setActiveDetailMonth(latestMonth);
  }, [detailRegionId, latestMonth, workstreamFilter, timeRange]);

  const activeSnapshot = useMemo(() => {
    if (!detailTrend.length) return null;
    const selectedPoint = detailTrend.find((point) => point.month === activeDetailMonth);
    return selectedPoint ?? detailTrend[detailTrend.length - 1];
  }, [activeDetailMonth, detailTrend]);

  const selectedSupport = useMemo(() => {
    if (!selectedRegion) return [];
    return MOCK_SUPPORT.filter(
      (record) =>
        record.regionId === selectedRegion.id &&
        visibleMonths.includes(record.month) &&
        record.month === activeSnapshot?.month,
    ).sort((left, right) => left.month.localeCompare(right.month));
  }, [activeSnapshot?.month, selectedRegion, visibleMonths]);

  const diagnosis = activeSnapshot
    ? getBottleneckDiagnosis(
        activeSnapshot.production,
        activeSnapshot.quality,
        activeSnapshot.reach,
      )
    : null;
  const supportRecommendation =
    diagnosis && activeSnapshot
      ? getDynamicSupportIntervention(
          diagnosis.primaryBottleneck,
          diagnosis.secondaryBottleneck,
          activeSnapshot,
        )
      : null;
  const overviewAverageRisk = regionSnapshots.length
    ? round(average(regionSnapshots.map((snapshot) => snapshot.riskScore)))
    : 0;
  const improvingRegions = regionSnapshots.filter(
    (snapshot) => snapshot.riskScore < snapshot.previousRiskScore - 0.5,
  ).length;
  const worseningRegions = regionSnapshots.filter(
    (snapshot) => snapshot.riskScore > snapshot.previousRiskScore + 0.5,
  ).length;
  const highRiskRegions = regionSnapshots.filter(
    (snapshot) => getRiskLevel(snapshot.riskScore) === 'High',
  ).length;

  const inDetailState = detailRegionId !== 'All' && selectedRegion && activeSnapshot;

  return (
    <div className="min-h-screen text-[#17211d]">
      <header className="relative overflow-hidden border-b border-white/60 bg-white/70 px-4 py-5 backdrop-blur md:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6f63db]/40 to-transparent" />
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_16px_34px_-22px_rgba(23,33,29,0.35)]">
              <img
                src={fortifyLogo}
                alt="Fortify Health logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="dashboard-label">Fortify Health Decision Support</div>
              <div>
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] md:text-[30px]">
                  Regional Programme Execution Risk Dashboard
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6862]">
                  Tracks regional programme execution risk, key performance drivers, and support
                  reallocation signals for monthly review.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-end">
            <div className="pt-2 text-right text-xs text-[#66736d]">
              Last updated: {format(parseISO(`${latestMonth}-01`), 'd MMM yyyy')}
            </div>
          </div>
        </div>
      </header>

      {!inDetailState ? (
        <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
          <section className="dashboard-card rounded-[28px] border px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <div className="dashboard-label">Overview Controls</div>
                  <div>
                    <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#17211d]">
                      Scan regional risk at a glance
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5b6862]">
                      Filter the dashboard by region, workstream, or review window.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="dashboard-chip">
                    <Filter size={14} className="mr-2 text-[#6a8d73]" />
                    {regionSnapshots.length} visible regions
                  </span>
                  <span className="dashboard-chip">
                    Review month {format(parseISO(`${latestMonth}-01`), 'MMM yyyy')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-[#dfe8df] bg-[#f6faf6] p-3">
                <CompactSelect
                  value={selectedRegionId}
                  displayValue={getRegionFilterLabel(selectedRegionId)}
                  onValueChange={(value) => setSelectedRegionId(value as RegionFilter)}
                >
                  <SelectItem value="All">All Regions</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </CompactSelect>

                <CompactSelect
                  value={timeRange}
                  displayValue={getTimeRangeLabel(timeRange)}
                  onValueChange={(value) => setTimeRange(value as TimeRangeFilter)}
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      Last {option} Months
                    </SelectItem>
                  ))}
                </CompactSelect>

                <CompactSelect
                  value={workstreamFilter}
                  displayValue={getWorkstreamFilterLabel(workstreamFilter)}
                  onValueChange={(value) => setWorkstreamFilter(value as Workstream | 'All')}
                >
                  <SelectItem value="All">All Workstreams</SelectItem>
                  {WORKSTREAMS.map((workstream) => (
                    <SelectItem key={workstream} value={workstream}>
                      {workstream}
                    </SelectItem>
                  ))}
                </CompactSelect>

                <CompactSelect
                  value={riskLevelFilter}
                  displayValue={getRiskLevelFilterLabel(riskLevelFilter)}
                  onValueChange={(value) => setRiskLevelFilter(value as RiskLevelFilter)}
                >
                  <SelectItem value="All">All Risk Levels</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </CompactSelect>

                <button
                  className="ml-auto inline-flex h-11 items-center rounded-full border border-transparent px-4 text-sm font-medium text-[#6f63db] transition hover:border-[#d7d3fb] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f63db]/35"
                  onClick={() => {
                    setSelectedRegionId('All');
                    setTimeRange('6');
                    setWorkstreamFilter('All');
                    setRiskLevelFilter('All');
                  }}
                >
                  Reset filters
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewKpiCard
              value={overviewAverageRisk}
              label="Avg. Risk Score"
              sublabel="across visible regions"
              accent={overviewAverageRisk >= 60 ? '#e03616' : '#6a8d73'}
            />
            <OverviewKpiCard
              value={highRiskRegions}
              label="High/Critical Regions"
              sublabel={`of ${regionSnapshots.length} regions`}
              accent="#e03616"
            />
            <OverviewKpiCard
              value={improvingRegions}
              label="Improving"
              sublabel="risk decreasing"
              accent="#6a8d73"
            />
            <OverviewKpiCard
              value={worseningRegions}
              label="Worsening"
              sublabel="risk increasing"
              accent="#e03616"
            />
          </section>

          <Card className="dashboard-card overflow-hidden rounded-[28px] border">
            <CardHeader className="border-b border-[#dfe8df] px-5 py-5 md:px-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="dashboard-label">Regional Prioritization</div>
                  <CardTitle className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
                    Regional Risk Overview
                  </CardTitle>
                </div>
                <div className="dashboard-chip">Sorted by highest risk score</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5b6862]">
                Click a region to view detailed risk analysis. Sorted by risk score highest first.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f6faf6] hover:bg-[#f6faf6]">
                      <TableHead className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Region
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Risk Score
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Risk Level
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Trend
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Production
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Quality
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Reach
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Active Mills
                      </TableHead>
                      <TableHead className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                        Support Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionSnapshots.map((snapshot) => {
                      const trendChange = round(snapshot.riskScore - snapshot.previousRiskScore);
                      return (
                        <TableRow
                          key={snapshot.id}
                          className="cursor-pointer border-t border-[#eef3ee] transition-colors hover:bg-[#f7faf7]"
                          onClick={() => {
                            setOverviewRegionFilter(selectedRegionId);
                            setSelectedRegionId(snapshot.id);
                            setDetailRegionId(snapshot.id);
                          }}
                        >
                          <TableCell className="px-5 py-4 text-sm font-semibold text-[#17211d]">
                            {snapshot.name}
                          </TableCell>
                          <TableCell
                            className={`px-5 py-4 text-center text-sm font-semibold tabular-nums ${getRiskTextClass(snapshot.riskScore)}`}
                          >
                            {snapshot.riskScore}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center">
                            <Badge
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(snapshot.riskScore)}`}
                            >
                              {getRiskLevel(snapshot.riskScore)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getTrendBadgeClass(trendChange)}`}
                            >
                              {getTrendLabel(trendChange)}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-sm tabular-nums text-[#39453f]">
                            {snapshot.production}%
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-sm tabular-nums text-[#39453f]">
                            {snapshot.quality}%
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-sm tabular-nums text-[#39453f]">
                            {snapshot.reach}%
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-sm tabular-nums text-[#39453f]">
                            {snapshot.activeMills}/{snapshot.totalMills}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSupportStatusBadgeClass(snapshot.supportStatus)} ${getSupportStatusClass(snapshot.supportStatus)}`}
                            >
                              {snapshot.supportStatus}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      ) : (
        <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
          <section className="dashboard-card rounded-[28px] border px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="h-10 rounded-full border border-[#dfe8df] bg-white px-4 text-sm text-[#17211d] shadow-[0_14px_28px_-24px_rgba(23,33,29,0.35)] hover:bg-[#f7faf7]"
                  onClick={() => {
                    setDetailRegionId('All');
                    setSelectedRegionId(overviewRegionFilter);
                  }}
                >
                  <ChevronLeft size={16} />
                  Back to Overview
                </Button>
                <div>
                  <div className="dashboard-label">Regional Deep Dive</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.03em] md:text-[38px]">
                      {selectedRegion.name}
                    </h2>
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(activeSnapshot.riskScore)}`}
                    >
                      {getRiskLevel(activeSnapshot.riskScore)} risk
                    </Badge>
                    <Badge className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-semibold text-[#46524c]">
                      {workstreamFilter === 'All' ? 'All Workstreams' : workstreamFilter}
                    </Badge>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5b6862]">
                    Detailed regional risk drivers and intervention history for the selected
                    snapshot, with monthly trend context preserved from the overview.
                  </p>
                </div>
              </div>
              <div className="dashboard-soft-card rounded-2xl border px-4 py-4 lg:max-w-sm">
                <div className="dashboard-label">Active Snapshot</div>
                <p className="mt-2 text-xl font-semibold text-[#17211d]">
                  {format(parseISO(`${activeSnapshot.month}-01`), 'MMMM yyyy')}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#5b6862]">
                  KPI cards, diagnosis, chart focus, and support tracker are aligned to this month.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DetailKpiCard
              icon={<Package size={18} className="text-[#6f63db]" />}
              label="Production"
              value={activeSnapshot.production}
              delta={activeSnapshot.productionDelta}
              description="% of current target achieved"
            />
            <DetailKpiCard
              icon={<ShieldCheck size={18} className="text-[#6a8d73]" />}
              label="Quality Compliance"
              value={activeSnapshot.quality}
              delta={activeSnapshot.qualityDelta}
              description="Average audit score across active mills"
            />
            <DetailKpiCard
              icon={<Users size={18} className="text-[#f6b10a]" />}
              label="Beneficiary Reach"
              value={activeSnapshot.reach}
              delta={activeSnapshot.reachDelta}
              description="Estimated reach index for selected period"
            />
          </section>

          {diagnosis ? (
            <Card className="dashboard-card rounded-[28px] border">
              <CardContent className="grid grid-cols-1 gap-4 px-5 py-5 md:px-6 md:py-6 lg:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                  <p className="dashboard-label">Current Diagnosis</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: `${getDriverAccent(diagnosis.primaryBottleneck)}18`,
                        color: getDriverAccent(diagnosis.primaryBottleneck),
                        borderColor: `${getDriverAccent(diagnosis.primaryBottleneck)}30`,
                      }}
                    >
                      {getBottleneckLabel(diagnosis.primaryBottleneck)}
                    </Badge>
                    {diagnosis.tiedSecondaryBottlenecks ? (
                      <Badge className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-semibold text-[#46524c]">
                        Secondary drivers:{' '}
                        {formatBottleneckList(diagnosis.tiedSecondaryBottlenecks)} tied
                      </Badge>
                    ) : (
                      <Badge className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-semibold text-[#46524c]">
                        Secondary: {getBottleneckLabel(diagnosis.secondaryBottleneck)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#5b6862]">
                    For {format(parseISO(`${activeSnapshot.month}-01`), 'MMMM yyyy')}, the primary
                    bottleneck is {getBottleneckLabel(diagnosis.primaryBottleneck).toLowerCase()} at{' '}
                    {getDriverValueLabel(diagnosis.primaryBottleneck, activeSnapshot)}
                    {diagnosis.tiedSecondaryBottlenecks ? (
                      <>
                        , followed by tied secondary drivers:{' '}
                        {diagnosis.tiedSecondaryBottlenecks
                          .map(
                            (key) =>
                              `${getBottleneckLabel(key).toLowerCase()} at ${getDriverValueLabel(
                                key,
                                activeSnapshot,
                              )}`,
                          )
                          .join(' and ')}
                        .
                      </>
                    ) : (
                      <>
                        , followed by{' '}
                        {getBottleneckLabel(diagnosis.secondaryBottleneck).toLowerCase()} at{' '}
                        {getDriverValueLabel(diagnosis.secondaryBottleneck, activeSnapshot)}.
                      </>
                    )}
                  </p>
                </div>
                <div className="dashboard-soft-card rounded-2xl border px-4 py-4">
                  <p className="dashboard-label">Recommended Support Type</p>
                  <p className="mt-3 text-base font-semibold text-[#17211d]">
                    {supportRecommendation?.supportType ?? diagnosis.recommendedSupportType}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5b6862]">
                    {supportRecommendation?.rationale ??
                      `This is the most relevant reallocation lever for leadership review for the ${format(
                        parseISO(`${activeSnapshot.month}-01`),
                        'MMM yyyy',
                      )} snapshot.`}
                  </p>
                </div>
                <div className="dashboard-soft-card rounded-2xl border px-4 py-4">
                  <p className="dashboard-label">Example Intervention</p>
                  <p className="mt-3 text-sm leading-6 text-[#17211d]">
                    {supportRecommendation?.intervention ?? diagnosis.exampleIntervention}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="dashboard-card rounded-[28px] border">
            <CardHeader className="px-5 py-5 md:px-6">
              <div className="dashboard-label">Trend Review</div>
              <CardTitle className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
                Risk & Performance Trends - {selectedRegion.name}
              </CardTitle>
              <p className="mt-3 text-sm leading-6 text-[#5b6862]">
                Click any chart point to inspect that month. The KPI cards, diagnosis, and support
                tracker follow the selected snapshot.
              </p>
            </CardHeader>
            <CardContent className="h-[360px] px-4 pb-5 pt-0 md:px-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={detailTrend.map((point) => ({
                    rawMonth: point.month,
                    month: formatMonth(point.month),
                    'Risk Score': point.riskScore,
                    Production: point.production,
                    Quality: point.quality,
                    'Beneficiary Reach': point.reach,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(111, 99, 219, 0.16)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#61706a' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#61706a' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<CustomTrendTooltip />}
                    cursor={{ stroke: '#cfd8cf', strokeDasharray: '4 6' }}
                  />
                  <ReferenceLine
                    y={65}
                    stroke="#e03616"
                    strokeDasharray="4 4"
                    label={<HighRiskReferenceLabel />}
                  />
                  <ReferenceLine
                    x={formatMonth(activeSnapshot.month)}
                    stroke="#17211d"
                    strokeDasharray="2 4"
                  />
                  {selectedSupport.map((allocation) => (
                    <ReferenceLine
                      key={allocation.id}
                      x={formatMonth(allocation.month)}
                      stroke={
                        allocation.type === 'Programme Support' ? '#6f63db' : '#6a8d73'
                      }
                      strokeDasharray="3 5"
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="Risk Score"
                    stroke="#e03616"
                    strokeWidth={3.25}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#e03616' }}
                    dot={(props) => (
                      <SelectableDot
                        {...props}
                        activeMonth={activeSnapshot.month}
                        onSelect={setActiveDetailMonth}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="Production"
                    stroke="#6f63db"
                    strokeWidth={2.4}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#6f63db' }}
                    dot={(props) => (
                      <SelectableDot
                        {...props}
                        activeMonth={activeSnapshot.month}
                        onSelect={setActiveDetailMonth}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="Quality"
                    stroke="#6a8d73"
                    strokeWidth={2.4}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#6a8d73' }}
                    dot={(props) => (
                      <SelectableDot
                        {...props}
                        activeMonth={activeSnapshot.month}
                        onSelect={setActiveDetailMonth}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="Beneficiary Reach"
                    stroke="#17211d"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#17211d' }}
                    dot={(props) => (
                      <SelectableDot
                        {...props}
                        activeMonth={activeSnapshot.month}
                        onSelect={setActiveDetailMonth}
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="dashboard-card rounded-[28px] border px-5 py-5 md:px-6">
            <div className="dashboard-label">Snapshot Month</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {detailTrend.map((point) => {
                const isActive = point.month === activeSnapshot.month;
                return (
                  <button
                    key={point.month}
                    type="button"
                    onClick={() => setActiveDetailMonth(point.month)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f63db]/35 ${
                      isActive
                        ? 'border-[#6f63db]/25 bg-[#6f63db]/10 text-[#5d52c4] shadow-[0_18px_32px_-24px_rgba(111,99,219,0.7)]'
                        : 'border-[#dfe8df] bg-white text-[#5b6862] hover:border-[#cfdccd] hover:bg-[#f8fbf8]'
                    }`}
                  >
                    {formatMonth(point.month)}
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="dashboard-card overflow-hidden rounded-[28px] border">
            <CardHeader className="px-5 py-5 md:px-6">
              <div className="dashboard-label">Support Reallocation</div>
              <CardTitle className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
                Support Reallocation Tracker -{' '}
                {format(parseISO(`${activeSnapshot.month}-01`), 'MMM yyyy')}
              </CardTitle>
              <p className="mt-3 text-sm leading-6 text-[#5b6862]">
                Support events recorded for the currently selected snapshot month.
              </p>
            </CardHeader>
            {selectedSupport.length ? (
              <div className="divide-y divide-[#eef3ee] border-t border-[#e4ece4]">
                {selectedSupport.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex flex-col gap-3 px-5 py-4 md:px-6 lg:flex-row lg:items-center"
                  >
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          allocation.type === 'Programme Support' ? '#6f63db' : '#6a8d73',
                      }}
                    />
                    <div className="min-w-[5.5rem] text-xs font-semibold uppercase tracking-[0.12em] text-[#6f7b74]">
                      {format(parseISO(`${allocation.month}-01`), 'MMM yyyy')}
                    </div>
                    <div className="flex-1 text-sm leading-6 text-[#17211d]">
                      <span>{allocation.description}</span>
                      <span className="ml-2 inline-flex rounded-full border border-[#dfe8df] bg-[#f7faf7] px-2 py-0.5 text-[11px] font-semibold text-[#5b6862]">
                        {allocation.type}
                      </span>
                    </div>
                    <div className="max-w-[320px] text-sm leading-6 text-[#5b6862]">
                      {allocation.observedImpact ?? 'Impact evaluation in progress'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-t border-[#e4ece4] px-5 py-6 text-sm italic text-[#5b6862] md:px-6">
                No support allocations recorded for{' '}
                {format(parseISO(`${activeSnapshot.month}-01`), 'MMMM yyyy')}.
              </div>
            )}
          </Card>
        </main>
      )}

      <footer className="border-t border-white/60 px-4 py-4 text-center text-xs text-[#66736d] md:px-6">
        Fortify Health - Internal Decision Support Dashboard (Prototype) - Data is fictional and
        for demonstration purposes only
      </footer>
    </div>
  );
}

function CompactSelect({
  value,
  displayValue,
  onValueChange,
  children,
}: {
  value: string;
  displayValue: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-11 min-w-[180px] rounded-full border border-[#d6e0d6] bg-white px-4 text-sm font-medium text-[#17211d] shadow-[0_12px_24px_-22px_rgba(23,33,29,0.4)] transition focus:ring-[#6f63db]/30 data-[placeholder]:text-[#6a7771]">
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function OverviewKpiCard({
  value,
  label,
  sublabel,
  accent,
}: {
  value: number;
  label: string;
  sublabel: string;
  accent: string;
}) {
  return (
    <Card className="dashboard-card rounded-[24px] border">
      <CardContent className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="dashboard-label">{label}</div>
            <div
              className="mt-3 text-4xl font-semibold tracking-[-0.03em] tabular-nums"
              style={{ color: accent }}
            >
              {value}
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ backgroundColor: `${accent}14` }}>
            <div className="h-5 w-5 rounded-md" style={{ backgroundColor: accent }} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-[#5b6862]">{sublabel}</div>
          <div className="h-px flex-1 bg-[#e7eee7]" />
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#7b8782]">
          Current review window
        </p>
      </CardContent>
    </Card>
  );
}

function DetailKpiCard({
  icon,
  label,
  value,
  delta,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  delta: number | null;
  description: string;
}) {
  const trendMeta = getPerformanceTrendMeta(delta);

  return (
    <Card className="dashboard-card rounded-[24px] border">
      <CardContent className="px-5 py-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6f63db]/10">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="dashboard-label">{label}</p>
            <p className="mt-1 text-sm leading-6 text-[#5b6862]">{description}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="text-4xl font-semibold tracking-[-0.03em] tabular-nums text-[#17211d]">
            {value}%
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${
              delta === null
                ? 'border-[#dfe8df] bg-[#f6faf6]'
                : getPerformanceTrendBadgeClass(delta)
            } ${trendMeta.className}`}
          >
            {trendMeta.label}
            <span className="ml-1">{trendMeta.detail}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
