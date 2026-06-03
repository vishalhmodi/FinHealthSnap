'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, Cell, ReferenceLine, LineChart, Line, PieChart, Pie, LabelList, Label,
} from 'recharts';
import styles from './page.module.css';
import { formatCurrency, formatCurrencyCompact, getChangePercent } from '@/lib/utils';

interface TrendPoint {
  label: string;
  quarterId: string;
  snapshotDate: string;
  totalAssets: number;
  liquidAssets: number;
  nonLiquidAssets: number;
  totalLiabilities: number;
  netWorth: number;
  categoryBreakdown: Record<string, number>;
  institutionBreakdown: Record<string, number>;
  ownerBreakdown: Record<string, number>;
  nonLiquidBreakdown: Record<string, number>;
  liabilityBreakdown: Record<string, number>;
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

function MetricCard({ title, amount, type, deltaAmount, deltaPercent, deltaLabel, subItems, isDerived }: {
  title: string; amount: number; 
  type: 'asset' | 'liability' | 'networth' | 'change' | 'ytd';
  deltaAmount?: number; deltaPercent?: number; deltaLabel?: string;
  subItems?: React.ReactNode;
  isDerived?: boolean;
}) {
  const colorMap = {
    asset: '#3b82f6', // blue
    liability: '#ef4444', // red
    networth: '#10b981', // green
    change: '#8b5cf6', // purple
    ytd: '#f59e0b', // orange
  };
  const bgMap = {
    asset: 'rgba(59, 130, 246, 0.1)',
    liability: 'rgba(239, 68, 68, 0.1)',
    networth: 'rgba(16, 185, 129, 0.1)',
    change: 'rgba(139, 92, 246, 0.1)',
    ytd: 'rgba(245, 158, 11, 0.1)',
  };

  const isPositive = deltaAmount !== undefined ? deltaAmount >= 0 : deltaPercent !== undefined ? deltaPercent >= 0 : true;
  const deltaColor = type === 'liability' ? (isPositive ? '#ef4444' : '#10b981') : (isPositive ? '#10b981' : '#ef4444');

  return (
    <div className={`glass-card ${styles.metricCard}`} style={{ '--accent': colorMap[type] } as React.CSSProperties}>
      <div className={styles.metricContent}>
        <div className={styles.metricLabel}>{title}</div>
        <div className={styles.metricAmount} style={{ color: colorMap[type] }}>
          {formatCurrency(amount)}
        </div>
        {isDerived && (
          <div className={styles.derivedIcon} style={{ background: bgMap[type], color: colorMap[type] }}>
            {type === 'change' ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
            )}
          </div>
        )}
        {subItems && <div className={styles.metricSub}>{subItems}</div>}
        {deltaLabel && (deltaAmount !== undefined || deltaPercent !== undefined) && (
          <div className={styles.metricDelta}>
            <strong style={{ color: deltaColor }}>
              {isPositive ? '↑' : '↓'} {deltaAmount !== undefined ? `${formatCurrency(Math.abs(deltaAmount))} ` : ''}
              {deltaPercent !== undefined ? `(${Math.abs(deltaPercent).toFixed(2)}%)` : ''}
            </strong>
            <span className={styles.vsText}>{`vs ${deltaLabel}`}</span>
          </div>
        )}
      </div>
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
  
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const renderLabelWithExternal = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, fill }: any) => {
  if (percent < 0.05) return null;

  // Internal Label (Percentage)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // External Label (Value)
  const outerR = outerRadius + 15;
  const outerX = cx + outerR * Math.cos(-midAngle * RADIAN);
  const outerY = cy + outerR * Math.sin(-midAngle * RADIAN);
  const textAnchor = Math.cos(-midAngle * RADIAN) >= 0 ? 'start' : 'end';
  
  return (
    <g>
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <text x={outerX} y={outerY} fill={fill || 'var(--text-muted)'} textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '0.7rem', fontWeight: 500, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
        {formatCurrencyCompact(value)}
      </text>
    </g>
  );
};

const truncateLegend = (value: string) => {
  return value.length > 30 ? value.substring(0, 28) + '...' : value;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState<string>('ALL');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string | null>(null);
  const [showAssets, setShowAssets] = useState(true);
  const [showLiabilities, setShowLiabilities] = useState(true);
  const [showNetWorth, setShowNetWorth] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState<Record<string, boolean>>({});
  const [hiddenInstitutions, setHiddenInstitutions] = useState<Record<string, boolean>>({});
  const [hiddenOwners, setHiddenOwners] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setHiddenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleInstitution = (inst: string) => {
    setHiddenInstitutions(prev => ({ ...prev, [inst]: !prev[inst] }));
  };

  const toggleOwner = (owner: string) => {
    setHiddenOwners(prev => ({ ...prev, [owner]: !prev[owner] }));
  };

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

  const filteredTrends = (() => {
    if (horizon === 'ALL') return upToLatestTrends;
    if (horizon === 'YTD' && latest) {
      const currentYearMatch = latest.label.match(/\d{4}/);
      const currentYear = currentYearMatch ? currentYearMatch[0] : '';
      return upToLatestTrends.filter(t => t.label.includes(currentYear));
    }
    return upToLatestTrends.slice(-parseInt(horizon, 10));
  })();
  const liquidAssetDeltaAmount = prev && latest ? latest.liquidAssets - prev.liquidAssets : undefined;
  const nonLiquidAssetDeltaAmount = prev && latest ? latest.nonLiquidAssets - prev.nonLiquidAssets : undefined;
  const totalAssetDeltaAmount = prev && latest ? latest.totalAssets - prev.totalAssets : undefined;
  const totalAssetDeltaPercent = prev && latest ? getChangePercent(latest.totalAssets, prev.totalAssets) : undefined;
  const netWorthDeltaAmount = prev && latest ? latest.netWorth - prev.netWorth : undefined;

  let ytdBaseQuarter = null;
  let ytdDeltaAmount = undefined;
  let ytdDeltaPercent = undefined;
  if (latest && upToLatestTrends.length > 0) {
    const currentYearMatch = latest.label.match(/\d{4}/);
    const currentYear = currentYearMatch ? parseInt(currentYearMatch[0], 10) : new Date().getFullYear();
    const prevYearLabel = (currentYear - 1).toString();
    const ytdBases = upToLatestTrends.filter(t => t.label.includes(prevYearLabel));
    ytdBaseQuarter = ytdBases.length > 0 ? ytdBases[ytdBases.length - 1] : upToLatestTrends[0];
    
    ytdDeltaAmount = latest.netWorth - ytdBaseQuarter.netWorth;
    ytdDeltaPercent = ytdBaseQuarter.netWorth !== 0 ? (ytdDeltaAmount / Math.abs(ytdBaseQuarter.netWorth)) * 100 : 0;
  }
  const netWorthDelta = prev && latest ? getChangePercent(latest.netWorth, prev.netWorth) : undefined;
  const liabilityDelta = prev && latest ? getChangePercent(latest.totalLiabilities, prev.totalLiabilities) : undefined;
  const liabilityDeltaAmount = prev && latest ? latest.totalLiabilities - prev.totalLiabilities : undefined;

  // Donut Chart: Asset categories
  const donutData = latest 
    ? Object.entries(latest.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0);

  // Donut Chart 2: Non-Liquid Assets and Liabilities
  let donut2Data: Array<{ name: string; value: number }> = [];
  if (latest) {
    if (latest.nonLiquidBreakdown) {
      donut2Data = donut2Data.concat(
        Object.entries(latest.nonLiquidBreakdown).map(([name, value]) => ({ name, value }))
      );
    }
    if (latest.liabilityBreakdown) {
      donut2Data = donut2Data.concat(
        Object.entries(latest.liabilityBreakdown).map(([name, value]) => ({ name, value }))
      );
    }
  }
  const donut2Total = donut2Data.reduce((sum, d) => sum + d.value, 0);

  // Calculate Net Non-Liquid Assets
  const nonLiquidAssetsTotal = latest && latest.nonLiquidBreakdown ? Object.values(latest.nonLiquidBreakdown).reduce((sum, v) => sum + v, 0) : 0;
  const liabilitiesTotal = latest && latest.liabilityBreakdown ? Object.values(latest.liabilityBreakdown).reduce((sum, v) => sum + v, 0) : 0;
  const donut2NetTotal = nonLiquidAssetsTotal - liabilitiesTotal;

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
            {latest 
              ? `Reference snapshot: ${latest.label} (${new Date(latest.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })})` 
              : 'No data yet — add your first quarter'}
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
              title="Net Worth"
              amount={latest.netWorth}
              type="networth"
              deltaAmount={netWorthDeltaAmount}
              deltaPercent={netWorthDelta}
              deltaLabel={prev?.label}
            />
            <MetricCard
              title="Total Assets"
              amount={latest.totalAssets}
              type="asset"
              deltaAmount={totalAssetDeltaAmount}
              deltaPercent={totalAssetDeltaPercent}
              deltaLabel={prev?.label}
              subItems={
                <div className={styles.assetBreakdown}>
                  <div className={styles.assetBar}>
                    <div className={styles.liquidBar} style={{ width: `${(latest.liquidAssets / latest.totalAssets) * 100}%` }} />
                    <div className={styles.nonLiquidBar} style={{ width: `${(latest.nonLiquidAssets / latest.totalAssets) * 100}%` }} />
                  </div>
                  <div className={styles.assetLegend}>
                    <div className={styles.assetLegendItem}>
                      <div className={styles.assetLegendLabel}>
                        <span className={styles.liquidDot}></span>
                        <span title="Liquid" style={{ fontSize: '0.85rem' }}>💧</span>
                      </div>
                      <span className={styles.assetValue}>{formatCurrencyCompact(latest.liquidAssets)}</span>
                    </div>
                    <div className={styles.assetLegendItem}>
                      <div className={styles.assetLegendLabel}>
                        <span className={styles.nonLiquidDot}></span>
                        <span title="Non-Liquid" style={{ fontSize: '0.85rem' }}>🧊</span>
                      </div>
                      <span className={styles.assetValue}>{formatCurrencyCompact(latest.nonLiquidAssets)}</span>
                    </div>
                  </div>
                </div>
              }
            />
            <MetricCard
              title="Total Liabilities"
              amount={latest.totalLiabilities}
              type="liability"
              deltaAmount={liabilityDeltaAmount}
              deltaPercent={liabilityDelta}
              deltaLabel={prev?.label}
            />
            <MetricCard
              title="Change This Quarter"
              amount={netWorthDeltaAmount || 0}
              type="change"
              deltaPercent={netWorthDelta}
              deltaLabel={prev?.label}
              isDerived
            />
            <MetricCard
              title="YTD Change"
              amount={ytdDeltaAmount || 0}
              type="ytd"
              deltaPercent={ytdDeltaPercent}
              deltaLabel={ytdBaseQuarter?.label}
              isDerived
            />
          </div>

          {/* Charts Row */}
          {trends.length > 0 && (
            <>
              <div className={styles.chartsGrid}>
              {/* Area Chart: Assets vs Liabilities vs Net Worth */}
              <div className={`glass-card ${styles.chartCard} ${styles.fullWidthChart}`}>
                <div className={styles.chartHeaderRow}>
                  <div className={styles.chartTitleWrapper}>
                    <h2 className={styles.chartTitle}>Assets, Liabilities & Net Worth Over Time</h2>
                    <div className={styles.compactLegend}>
                      <button 
                        onClick={() => setShowAssets(!showAssets)}
                        className={`${styles.legendItem} ${showAssets ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: '#10b981'}}></span> Assets
                      </button>
                      <button 
                        onClick={() => setShowLiabilities(!showLiabilities)}
                        className={`${styles.legendItem} ${showLiabilities ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: '#ef4444'}}></span> Liabilities
                      </button>
                      <button 
                        onClick={() => setShowNetWorth(!showNetWorth)}
                        className={`${styles.legendItem} ${showNetWorth ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: '#3b82f6'}}></span> Net Worth
                      </button>
                    </div>
                  </div>
                  <div className={styles.horizonInline}>
                    <button className={`btn btn-sm ${horizon === 'YTD' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('YTD')}>YTD</button>
                    <button className={`btn btn-sm ${horizon === '2' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('2')}>2Qtrs</button>
                    <button className={`btn btn-sm ${horizon === '4' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('4')}>4Qtrs</button>
                    <button className={`btn btn-sm ${horizon === '8' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('8')}>8Qtrs</button>
                    <button className={`btn btn-sm ${horizon === '12' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('12')}>12Qtrs</button>
                    <button className={`btn btn-sm ${horizon === '20' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('20')}>20Qtrs</button>
                    <button className={`btn btn-sm ${horizon === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHorizon('ALL')}>All</button>
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradLiability" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      {showAssets && <Area type="monotone" dataKey="Total Assets" stroke="#10b981" strokeWidth={2.5} fill="url(#gradAsset)" dot={{ r: 4, fill: 'var(--bg-card)', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />}
                      {showNetWorth && <Area type="monotone" dataKey="Net Worth" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradNetWorth)" dot={{ r: 4, fill: 'var(--bg-card)', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />}
                      {showLiabilities && <Area type="monotone" dataKey="Total Liabilities" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradLiability)" dot={{ r: 4, fill: 'var(--bg-card)', stroke: '#ef4444', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Balances Tiles */}
              <div className={styles.fullWidthChart}>
                <h2 className={styles.chartTitle} style={{ marginBottom: '16px' }}>Investment Type Balances</h2>
                <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {Object.entries(latest.categoryBreakdown || {}).map(([name, amount]) => {
                    const prevAmount = prev?.categoryBreakdown?.[name] || 0;
                    const deltaAmount = prev ? (amount as number) - prevAmount : undefined;
                    const deltaPercent = prev && prevAmount !== 0 ? (deltaAmount! / Math.abs(prevAmount)) * 100 : undefined;
                    
                    return (
                      <MetricCard
                        key={name}
                        title={name}
                        amount={amount as number}
                        type={(amount as number) >= 0 ? 'asset' : 'liability'}
                        deltaAmount={deltaAmount}
                        deltaPercent={deltaPercent}
                        deltaLabel={prev?.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Donut Charts: Asset Allocation & Distribution */}
              <div className={`glass-card ${styles.chartCard} ${styles.fullWidthChart}`}>
                <h2 className={styles.chartTitle}>Asset Allocation</h2>
                <p className={styles.chartSubtitle}>Liquid vs Non-Liquid Asset and Liability breakdown</p>
                <div className={styles.chartWrapper} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  
                  {/* Donut 1: Liquid Assets */}
                  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Liquid Assets</h3>
                    <ResponsiveContainer width="100%" height={340}>
                      <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <Pie
                          data={donutData}
                          isAnimationActive={false}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={130}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          labelLine={false}
                          label={renderLabelWithExternal}
                        >
                          <Label 
                            value={formatCurrencyCompact(donutTotal)} 
                            position="center" 
                            fill="var(--text-primary)" 
                            style={{ fontSize: '1.2rem', fontWeight: 'bold' }} 
                            dy={-5}
                          />
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
                                  <span className="font-mono">{formatCurrency(data.value as number)}</span>
                                </div>
                                <div className={styles.tooltipRow}>
                                  <span style={{ color: data.payload.fill }}>Share</span>
                                  <span className="font-mono">{percent.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          }} 
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" formatter={truncateLegend} wrapperStyle={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Donut 2: Non-Liquid Assets & Liabilities */}
                  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Non-Liquid Assets & Liabilities</h3>
                    <ResponsiveContainer width="100%" height={340}>
                      <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <Pie
                          data={donut2Data}
                          isAnimationActive={false}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={130}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          labelLine={false}
                          label={renderLabelWithExternal}
                        >
                          <Label 
                            value={formatCurrencyCompact(donut2NetTotal)} 
                            position="center" 
                            fill="var(--text-primary)" 
                            style={{ fontSize: '1.2rem', fontWeight: 'bold' }} 
                            dy={-5}
                          />
                          {donut2Data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} stroke="var(--bg-card)" />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0];
                            const percent = donut2Total > 0 ? ((data.value as number) / donut2Total) * 100 : 0;
                            return (
                              <div className={styles.chartTooltip}>
                                <div className={styles.tooltipLabel}>{data.name}</div>
                                <div className={styles.tooltipRow}>
                                  <span style={{ color: data.payload.fill }}>Amount</span>
                                  <span className="font-mono">{formatCurrency(data.value as number)}</span>
                                </div>
                                <div className={styles.tooltipRow}>
                                  <span style={{ color: data.payload.fill }}>Share</span>
                                  <span className="font-mono">{percent.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          }} 
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" formatter={truncateLegend} wrapperStyle={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

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
                      <Bar dataKey="range" radius={[2, 2, 0, 0]} isAnimationActive={false}>
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
                <div className={styles.chartTitleWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                  <div>
                    <h2 className={styles.chartTitle} style={{ marginBottom: '4px' }}>Investment Growth by Type</h2>
                    <p className={styles.chartSubtitle} style={{ margin: 0 }}>Trend of asset categories over time</p>
                  </div>
                  <div className={styles.compactLegend} style={{ flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 0 }}>
                    {allCategories.map((cat, i) => (
                      <button 
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`${styles.legendItem} ${!hiddenCategories[cat] ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}></span> {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={categoryChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      {allCategories.map((cat, i) => (
                        <Line 
                          key={cat} 
                          type="monotone" 
                          dataKey={cat} 
                          stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                          strokeWidth={2.5} 
                          dot={{ r: 3 }} 
                          isAnimationActive={false} 
                          hide={hiddenCategories[cat]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Institution Growth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <div className={styles.chartTitleWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                  <div>
                    <h2 className={styles.chartTitle} style={{ marginBottom: '4px' }}>Growth by Institution</h2>
                    <p className={styles.chartSubtitle} style={{ margin: 0 }}>Trend of assets across different institutions</p>
                  </div>
                  <div className={styles.compactLegend} style={{ flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 0 }}>
                    {allInstitutions.map((inst, i) => (
                      <button 
                        key={inst}
                        onClick={() => toggleInstitution(inst)}
                        className={`${styles.legendItem} ${!hiddenInstitutions[inst] ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}></span> {inst}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={institutionChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      {allInstitutions.map((inst, i) => (
                        <Line 
                          key={inst} 
                          type="monotone" 
                          dataKey={inst} 
                          stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                          strokeWidth={2.5} 
                          dot={{ r: 3 }} 
                          isAnimationActive={false} 
                          hide={hiddenInstitutions[inst]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Owner Growth */}
              <div className={`glass-card ${styles.chartCard}`}>
                <div className={styles.chartTitleWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                  <div>
                    <h2 className={styles.chartTitle} style={{ marginBottom: '4px' }}>Growth by Individual</h2>
                    <p className={styles.chartSubtitle} style={{ margin: 0 }}>Trend of assets per family member/entity</p>
                  </div>
                  <div className={styles.compactLegend} style={{ flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 0 }}>
                    {allOwners.map((own, i) => (
                      <button 
                        key={own}
                        onClick={() => toggleOwner(own)}
                        className={`${styles.legendItem} ${!hiddenOwners[own] ? styles.active : ''}`}
                      >
                        <span className={styles.legendDot} style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}></span> {own}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={ownerChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      {allOwners.map((own, i) => (
                        <Line 
                          key={own} 
                          type="monotone" 
                          dataKey={own} 
                          stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                          strokeWidth={2.5} 
                          dot={{ r: 3 }} 
                          isAnimationActive={false} 
                          hide={hiddenOwners[own]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </>
          )}

              {/* Individual Balances Tiles */}
              <div className={styles.fullWidthChart} style={{ marginBottom: '20px' }}>
                <h2 className={styles.chartTitle} style={{ marginBottom: '16px' }}>Balances by Individual</h2>
                <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {Object.entries(latest.ownerBreakdown || {}).map(([name, amount]) => {
                    const prevAmount = prev?.ownerBreakdown?.[name] || 0;
                    const deltaAmount = prev ? (amount as number) - prevAmount : undefined;
                    const deltaPercent = prev && prevAmount !== 0 ? (deltaAmount! / Math.abs(prevAmount)) * 100 : undefined;
                    
                    return (
                      <MetricCard
                        key={name}
                        title={name}
                        amount={amount as number}
                        type={(amount as number) >= 0 ? 'asset' : 'liability'}
                        deltaAmount={deltaAmount}
                        deltaPercent={deltaPercent}
                        deltaLabel={prev?.label}
                      />
                    );
                  })}
                </div>
              </div>

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
