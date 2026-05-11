import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  BarChart3,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export interface ZoneData {
  zone: string;
  actual: number;
  expected: number;
  variance: number;
  variancePercent: number;
  status: 'normal' | 'minor' | 'major' | 'critical';
}

interface ZoneCountsTableProps {
  zoneData: ZoneData[];
  selectedZone: string | null;
  setSelectedZone: React.Dispatch<React.SetStateAction<string | null>>;
  actualCount: number;
  runningCount: number;
}

export default function ZoneCountsTable({
  zoneData,
  selectedZone,
  setSelectedZone,
  runningCount,
}: ZoneCountsTableProps) {
  const [view, setView] = useState<'overview' | 'detailed'>('overview');

  const totalActual = runningCount;
  const totalExpected = zoneData.reduce((s, z) => s + z.expected, 0);
  const totalVariance = totalActual - totalExpected;
  const totalVariancePercent = totalExpected
    ? (totalVariance / totalExpected) * 100
    : 0;

  const getVarianceIcon = (v: number) =>
    v > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : v < 0 ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  const overallStatus =
    totalVariance === 0
      ? 'normal'
      : Math.abs(totalVariance) >= 5
        ? 'critical'
        : Math.abs(totalVariance) >= 3
          ? 'major'
          : 'minor';

  return (
    <Card className="p-6 min-h-[500px] pt-3">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Count Variance Monitor</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'overview'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setView('detailed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'detailed'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Detailed
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-muted/50 pt-3 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Variance Status</h2>
            <Badge
              variant={overallStatus === 'normal' ? 'default' : 'destructive'}
            >
              {overallStatus === 'normal' ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-1" />
              )}
              {overallStatus}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-6 ">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total Expected
              </div>
              <div className="text-2xl font-bold">
                {totalExpected.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total Actual
              </div>
              <div className="text-2xl font-bold">
                {totalActual.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Variance</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {getVarianceIcon(totalVariance)}
                {Math.abs(totalVariance).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Variance %
              </div>
              <div className="text-2xl font-bold">
                {Math.abs(totalVariancePercent).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6 pt-3">
          <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {zoneData.filter((z) => z.status === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Critical Zones
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {zoneData.filter((z) => z.status === 'minor').length}
              </div>
              <div className="text-sm text-muted-foreground">Minor Zones</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {zoneData.filter((z) => z.status === 'normal').length}
              </div>
              <div className="text-sm text-muted-foreground">Normal Zones</div>
            </div>
          </div>
        </div>

        {view === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            {zoneData.map((z, i) => (
              <div
                key={i}
                onClick={() => setSelectedZone(z.zone)}
                className={`rounded-xl border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedZone === z.zone ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{z.zone}</h3>
                  </div>
                  <Badge
                    variant={
                      z.status === 'normal'
                        ? 'default'
                        : z.status === 'critical'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {z.status}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Expected:
                    </span>
                    <span className="font-semibold">
                      {z.expected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Actual:
                    </span>
                    <span className="font-semibold">
                      {z.actual.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Variance:
                    </span>
                    <div className="flex items-center gap-1 font-semibold">
                      {getVarianceIcon(z.variance)}
                      {Math.abs(z.variance)} (
                      {Math.abs(z.variancePercent).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/50">
              <h3 className="text-lg font-semibold">Detailed Zone Analysis</h3>
            </div>
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  {[
                    'Zone',
                    'Expected',
                    'Actual',
                    'Variance',
                    'Variance %',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-6 text-left text-xs font-semibold text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {zoneData.map((z, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedZone(z.zone)}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedZone === z.zone ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{z.zone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      {z.expected.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      {z.actual.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        {getVarianceIcon(z.variance)}
                        {Math.abs(z.variance)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-sm">
                      {Math.abs(z.variancePercent).toFixed(1)}%
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge
                        variant={
                          z.status === 'normal'
                            ? 'default'
                            : z.status === 'critical'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {z.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
