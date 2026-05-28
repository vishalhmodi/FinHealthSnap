'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, Cell, ReferenceLine, LineChart, Line, PieChart, Pie, LabelList,
} from 'recharts';
import styles from './page.module.css';
import { formatCurrency, formatCurrencyCompact, getChangePercent } from '@/lib/utils';

interface TrendPoint {
  label: string;
  quarterId: string;
  totalAssets: number;
  liquidAssets: number;
  nonLiquidAssets: number;
  totalLiabilities: number;
  netWorth: number;
  categoryBreakdown: Record<string, number>;
  institutionBreakdown: Record<string, number>;
  ownerBreakdown: Record<string, number>;
  items: Array<{ name: string; type: 'ASSET' | 'LIABILITY'; amount: number }>;
}

const CHART_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f43f5e', '#3b82f6', '#84cc16', '#a855f7'
];

interface DashboardData {
  trends: TrendPoint[];
  latest: TrendPoint | null;
}

function MetricCard({ title, amount, subtitle, type, delta }: {
  title: string; amount: number; subtitle?: string;
  type: 'asset' | 'liability' | 'networth'; delta?: number;
}) {
  const colorMap = {
    asset: 'var(--color-asset)',
    liability: 'var(--color-liability)',
    networth: 'var(--color-networth)',
  };
  const bgMap = {
    asset: 'var(--color-asset-light)',
    liability: 'var(--color-liability-light)',
    networth: 'var(--color-networth-light)',
  };

  return (
    <div className={`glass-card ${styles.metricCard}`} style={{ '--accent': colorMap[type] } as React.CSSProperties}>
      <div className={styles.metricLabel}>{title}</div>
      <div className={styles.metricAmount} style={{ color: colorMap[type] }}>
        {formatCurrency(amount)}
      </div>
      {subtitle && <div className={styles.metricSub}>{subtitle}</div>}
      {delta !== undefined && (
        <div className={styles.metricDelta} style={{
          color: delta >= 0 ? 'var(--color-asset)' : 'var(--color-liability)',
          background: delta >= 0 ? 'var(--color-asset-light)' : 'var(--color-liability-light)',
        }}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs prev quarter
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className={styles.tooltipRow}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, fill }: any) => {
  if (percent < 0.05) return null;

  // Internal Label (Percentage)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // External Label (Value)
  const outerR = outerRadius + 20;
  const outerX = cx + outerR * Math.cos(-midAngle * RADIAN);
  const outerY = cy + outerR * Math.sin(-midAngle * RADIAN);
  const textAnchor = Math.cos(-midAngle * RADIAN) >= 0 ? 'start' : 'end';
  
  return (
    <g>
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <text x={outerX} y={outerY} fill={fill || 'var(--text-muted)'} textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '0.75rem', fontWeight: 500, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
        {formatCurrencyCompact(value)}
      </text>
    </g>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState<string>('ALL');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <p>Loading your financial data…</p>
      </div>
    );
  }

  const { trends = [] } = data ?? {};
  
  const latestIndex = selectedQuarterId 
    ? trends.findIndex(t => t.quarterId === selectedQuarterId) 
    : trends.length - 1;

  const latest = latestIndex >= 0 ? trends[latestIndex] : null;
  const prev = latestIndex > 0 ? trends[latestIndex - 1] : null;

  const upToLatestTrends = latestIndex >= 0 ? trends.slice(0, latestIndex + 1) : [];

  const filteredTrends = horizon === 'ALL' 
    ? upToLatestTrends 
    : upToLatestTrends.slice(-parseInt(horizon, 10));

  const netWorthDelta = prev && latest ? getChangePercent(latest.netWorth, prev.netWorth) : undefined;
  const liquidAssetDelta = prev && latest ? getChangePercent(latest.liquidAssets, prev.liquidAssets) : undefined;
  const nonLiquidAssetDelta = prev && latest ? getChangePercent(latest.nonLiquidAssets, prev.nonLiquidAssets) : undefined;
  const liabilityDelta = prev && latest ? getChangePercent(latest.totalLiabilities, prev.totalLiabilities) : undefined;

  // Donut Chart: Asset categories
  const donutData = latest 
    ? Object.entries(latest.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0);

  // Component Waterfall data: Net worth breakdown
  let runningTotal = 0;
  const waterfallData: Array<{ name: string, amount: number, type: string, range: [number, number], fill: string }> = latest ? latest.items.map(item => {
    const isAsset = item.type === 'ASSET';
    const start = runningTotal;
    const end = isAsset ? runningTotal + item.amount : runningTotal - item.amount;
    runningTotal = end;
    
    return {
      name: item.name,
      amount: item.amount,
      type: item.type,
      range: [start, end],
      fill: isAsset ? '#10b981' : '#ef4444'
    };
  }) : [];

  if (latest) {
    waterfallData.push({
      name: 'Net Worth',
      amount: latest.netWorth,
      type: 'TOTAL',
      range: [0, latest.netWorth],
      fill: '#3b82f6'
    });
  }

  const chartData = filteredTrends.map((t) => ({
    label: t.label,
    'Total Assets': t.totalAssets,
    'Total Liabilities': -t.totalLiabilities,
    'Net Worth': t.netWorth,
  }));

  const categoryChartData = filteredTrends.map(t => ({ label: t.label, ...t.categoryBreakdown }));
  const institutionChartData = filteredTrends.map(t => ({ label: t.label, ...t.institutionBreakdown }));
  const ownerChartData = filteredTrends.map(t => ({ label: t.label, ...t.ownerBreakdown }));

  const allCategories = Array.from(new Set(filteredTrends.flatMap(t => Object.keys(t.categoryBreakdown))));
  const allInstitutions = Array.from(new Set(filteredTrends.flatMap(t => Object.keys(t.institutionBreakdown))));
  const allOwners = Array.from(new Set(filteredTrends.flatMap(t => Object.keys(t.ownerBreakdown))));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Financial Dashboard</h1>
          <p className="text-sm">
            {latest ? `Reference snapshot: ${latest.label}` : 'No data yet — add your first quarter'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {trends.length > 0 && (
            <select 
              className="form-input no-print" 
              style={{ width: 'auto', minWidth: '150px' }}
              value={selectedQuarterId || latest?.quarterId || ''}
              onChange={(e) => setSelectedQuarterId(e.target.value)}
            >
              {[...trends].reverse().map(t => (
                <option key={t.quarterId} value={t.quarterId}>{t.label}</option>
              ))}
            </select>
          )}
          <Link href="/dashboard/snapshots/new" id="new-quarter-btn" className="btn btn-primary no-print">
            + New Quarter
          </Link>
          <button onClick={() => window.print()} className="btn btn-secondary no-print">
            ▤ Print / PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {latest ? (
        <>
          <div className={styles.metricsGrid}>
            <MetricCard
              title="Liquid Assets"
              amount={latest.liquidAssets}
              subtitle="Investments & Cash"
              type="asset"
              delta={liquidAssetDelta}
            />
            <MetricCard
              title="Non-Liquid Assets"
              amount={latest.nonLiquidAssets}
              subtitle="Real Estate Equity"
              type="asset"
              delta={nonLiquidAssetDelta}
            />
            <MetricCard
              title="Total Liabilities"
              amount={latest.totalLiabilities}
              subtitle="Mortgages + HELOCs"
              type="liability"
              delta={liabilityDelta !== undefined ? -liabilityDelta : undefined}
            />
            <MetricCard
              title="Net Worth"
              amount={latest.netWorth}
              subtitle="Assets − Liabilities"
              type="networth"
              delta={netWorthDelta}
            />
          </div>

          {/* Charts Row */}
          {trends.length > 0 && (
            <>
              <div className={styles.horizonSelector}>
                <button className={`btn btn-sm ${horizon === '2' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('2')}>Last 2 Qtrs</button>
                <button className={`btn btn-sm ${horizon === '4' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('4')}>Last 4 Qtrs</button>
                <button className={`btn btn-sm ${horizon === '6' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('6')}>Last 6 Qtrs</button>
                <button className={`btn btn-sm ${horizon === '8' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('8')}>Last 8 Qtrs</button>
                <button className={`btn btn-sm ${horizon === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('ALL')}>All Time</button>
              </div>

              <div className={styles.chartsGrid}>
              {/* Area Chart: Assets vs Liabilities vs Net Worth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Net Worth Trend</h2>
                <p className={styles.chartSubtitle}>Assets, liabilities, and net worth over time</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '12px' }} />
                      <Area type="monotone" dataKey="Total Assets" stroke="#10b981" strokeWidth={2} fill="url(#gradAsset)" />
                      <Area type="monotone" dataKey="Net Worth" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradNetWorth)" />
                      <Area type="monotone" dataKey="Total Liabilities" stroke="#ef4444" strokeWidth={2} fill="none" strokeDasharray="5 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart: Asset Allocation */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Asset Allocation</h2>
                <p className={styles.chartSubtitle}>Composition of your investments and assets</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--bg-card)" />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0];
                          const percent = donutTotal > 0 ? ((data.value as number) / donutTotal) * 100 : 0;
                          return (
                            <div className={styles.chartTooltip}>
                              <div className={styles.tooltipLabel}>{data.name}</div>
                              <div className={styles.tooltipRow}>
                                <span style={{ color: data.payload.fill }}>Amount</span>
                                <span className="font-mono">{formatCurrency(data.value)}</span>
                              </div>
                              <div className={styles.tooltipRow}>
                                <span style={{ color: data.payload.fill }}>Share</span>
                                <span className="font-mono">{percent.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component Waterfall Chart */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Net Worth Breakdown (Waterfall)</h2>
                <p className={styles.chartSubtitle}>Composition of your current net worth</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={waterfallData} margin={{ top: 40, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-modal)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                        cursor={{ fill: 'var(--glass-border)' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className={styles.chartTooltip}>
                              <div className={styles.tooltipLabel}>{label}</div>
                              <div className={styles.tooltipRow}>
                                <span style={{ color: data.fill }}>{data.type === 'TOTAL' ? 'Total' : 'Amount'}</span>
                                <span className="font-mono">{formatCurrency(data.amount)}</span>
                              </div>
                            </div>
                          );
                        }} 
                      />
                      <ReferenceLine y={0} stroke="var(--text-muted)" />
                      <Bar dataKey="range" radius={[2, 2, 0, 0]}>
                        <LabelList 
                          dataKey="amount" 
                          content={(props: any) => {
                            const { x, y, width, height, value } = props;
                            if (!value) return null;
                            const isNegative = value < 0;
                            const textX = x + width / 2;
                            const textY = isNegative ? y + height + 6 : y - 6;
                            return (
                              <text 
                                x={textX} 
                                y={textY} 
                                fill="var(--text-muted)" 
                                textAnchor={isNegative ? "end" : "start"} 
                                fontSize={9}
                                fontFamily="var(--font-mono)"
                                pointerEvents="none"
                                transform={`rotate(-90, ${textX}, ${textY})`}
                              >
                                {formatCurrencyCompact(value)}
                              </text>
                            );
                          }}
                        />
                        {waterfallData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Growth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Investment Growth by Type</h2>
                <p className={styles.chartSubtitle}>Trend of asset categories over time</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={categoryChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8', paddingTop: '12px' }} />
                      {allCategories.map((cat, i) => (
                        <Line key={cat} type="monotone" dataKey={cat} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Institution Growth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Growth by Institution</h2>
                <p className={styles.chartSubtitle}>Trend of assets across different institutions</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={institutionChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8', paddingTop: '12px' }} />
                      {allInstitutions.map((inst, i) => (
                        <Line key={inst} type="monotone" dataKey={inst} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Owner Growth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <h2 className={styles.chartTitle}>Growth by Individual</h2>
                <p className={styles.chartSubtitle}>Trend of assets per family member/entity</p>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={ownerChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8', paddingTop: '12px' }} />
                      {allOwners.map((own, i) => (
                        <Line key={own} type="monotone" dataKey={own} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </>
          )}

          {/* Quarters List */}
          <div className={`glass-card ${styles.quartersCard}`}>
            <h2 className={styles.sectionTitle}>All Quarters</h2>
            <div className={styles.quartersList}>
              {[...trends].reverse().map((t) => (
                <Link
                  key={t.quarterId}
                  href={`/dashboard/snapshots/${t.quarterId}`}
                  id={`quarter-link-${t.label}`}
                  className={styles.quarterRow}
                >
                  <div className={styles.quarterLabel}>
                    <span className="badge badge-neutral">{t.label}</span>
                  </div>
                  <div className={styles.quarterMetrics}>
                    <span className="amount-positive font-mono text-sm">{formatCurrency(t.totalAssets)}</span>
                    <span className="amount-negative font-mono text-sm">−{formatCurrency(t.totalLiabilities)}</span>
                    <span className={`font-mono text-sm ${t.netWorth >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                      {formatCurrency(t.netWorth)}
                    </span>
                  </div>
                  <span className={styles.quarterArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={`glass-card ${styles.emptyState}`}>
          <div className={styles.emptyIcon} aria-hidden>◈</div>
          <h2>No data yet</h2>
          <p>Create your first quarterly snapshot to start tracking your financial health.</p>
          <Link href="/dashboard/snapshots/new" className="btn btn-primary">
            + Create First Snapshot
          </Link>
        </div>
      )}
    </div>
  );
}
