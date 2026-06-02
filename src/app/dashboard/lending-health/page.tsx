'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import styles from './lending.module.css';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  detail: string;
  assetValue: number;
  linkedDebt: number;
  ltv: number;
}

interface TrendData {
  quarterId: string;
  label: string;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  totalRealEstateValue: number;
  totalRealEstateDebt: number;
  netWorth: number;
  leverageRatio: number;
  liquidityRatio: number;
  totalPropertyLTV: number;
  healthScore: number;
  properties: Property[];
}

interface DashboardData {
  trends: TrendData[];
  latest: TrendData | null;
}

const CustomRechartsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltipBox} style={{ visibility: 'visible', opacity: 1, position: 'relative', transform: 'none', bottom: 'auto', left: 'auto' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{data.name}</div>
        <div className={styles.tooltipRow}>
          <span>Property Value:</span>
          <strong>{formatCurrency(data.assetValue)}</strong>
        </div>
        <div className={styles.tooltipRow}>
          <span>Linked Debt:</span>
          <strong>{formatCurrency(data.linkedDebt)}</strong>
        </div>
        <div className={styles.tooltipDivider} />
        <div className={styles.tooltipRow}>
          <span>LTV:</span>
          <strong>{data.ltv.toFixed(1)}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function LendingHealthPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuarterId, setSelectedQuarterId] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    fetch('/api/lending-health')
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`API Error: ${r.status} - ${text}`);
        }
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        console.error('Failed to load lending health data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const { trends = [], latest } = data ?? {};
  
  const latestIndex = selectedQuarterId 
    ? trends.findIndex((t: TrendData) => t.quarterId === selectedQuarterId) 
    : trends.length - 1;

  const current = latestIndex >= 0 ? trends[latestIndex] : null;

  useEffect(() => {
    if (current?.healthScore) {
      setAnimatedScore(0);
      setTimeout(() => setAnimatedScore(current.healthScore), 100);
    }
  }, [current?.healthScore]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" />
        <p>Analyzing lending health metrics…</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1>Lending Health Dashboard</h1>
            <p>No data yet — add your first quarter</p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', cls: 'Good' };
    if (score >= 60) return { label: 'Good', cls: 'Good' };
    if (score >= 40) return { label: 'Fair', cls: 'Warn' };
    return { label: 'Poor', cls: 'Danger' };
  };

  const getLeverageStatus = (ratio: number) => {
    if (ratio < 0.4) return 'Good';
    if (ratio < 0.6) return 'Warn';
    return 'Danger';
  };

  const getLiquidityStatus = (ratio: number) => {
    if (ratio > 1.0) return 'Good';
    if (ratio > 0.5) return 'Warn';
    return 'Danger';
  };

  const getLTVStatus = (ratio: number) => {
    if (ratio < 0.8) return 'Good';
    if (ratio < 0.9) return 'Warn';
    return 'Danger';
  };

  const scoreData = getScoreStatus(current.healthScore);
  const circleRadius = 80;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (animatedScore / 100) * circleCircumference;

  let recommendation = "You're in a good position for lending opportunities.";
  if (current.healthScore < 60) {
    recommendation = "Your overall profile needs improvement before seeking major lending.";
  } else {
    if (current.totalPropertyLTV > 0.8) recommendation = "Consider lowering your property LTV to avoid mortgage insurance and get better rates.";
    else if (current.liquidityRatio < 0.5) recommendation = "Maintain liquidity and consider lowering debt to strengthen your profile.";
    else if (current.leverageRatio > 0.6) recommendation = "Your Debt-to-Asset ratio is high. Focus on paying down liabilities.";
  }

  const chartData = current.properties.map(p => ({
    name: p.name,
    assetValue: p.assetValue,
    linkedDebt: p.linkedDebt,
    ltv: p.ltv * 100,
    fill: p.ltv < 0.8 ? '#10b981' : p.ltv < 0.9 ? '#f59e0b' : '#3b82f6' // Use blue for HELOC/others in the mock, or red for danger
  }));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Lending Health Dashboard</h1>
          <p>A visual summary of your financial position.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {trends.length > 0 && (
            <select 
              className="form-input no-print" 
              style={{ width: 'auto', minWidth: '150px' }}
              value={selectedQuarterId || latest?.quarterId || ''}
              onChange={(e) => setSelectedQuarterId(e.target.value)}
            >
              {[...trends].reverse().map((t: TrendData) => (
                <option key={t.quarterId} value={t.quarterId}>{t.label}</option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary no-print" onClick={handlePrint}>
            ⎙ Print / PDF
          </button>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        
        {/* LEFT PANEL: OVERALL HEALTH SCORE */}
        <div className={`${styles.scorePanel} ${styles.scorePanelDark}`}>
          <h2>Overall Health Score</h2>
          <div className={styles.circularScore}>
            <svg className={styles.scoreCircleSvg} viewBox="0 0 200 120">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              {/* Semi-circle background path */}
              <path 
                className={styles.scoreBg} 
                d="M 30 100 A 70 70 0 0 1 170 100" 
                stroke="url(#scoreGradient)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className={styles.scoreTextContainer} style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center' }}>
              <div className={styles.scoreValue}>{current.healthScore}</div>
              <div style={{ fontSize: '1rem', color: '#94a3b8' }}>/100</div>
            </div>
          </div>
          <div className={`${styles.scoreLabel} ${styles['status' + scoreData.cls]}`} style={{ marginTop: '16px' }}>
            {scoreData.label}
          </div>
          <p className={styles.scoreSubtext} style={{ marginTop: '24px' }}>
            You're in a {scoreData.label.toLowerCase()} position for<br/>lending opportunities.
          </p>
        </div>

        {/* TOP RIGHT: CORE METRICS ROW */}
        <div className={styles.metricsRow}>
          {/* Debt-to-Asset Ratio */}
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>📊</div>
              <div className={styles.miniCardTitle}>Debt-to-Asset Ratio</div>
            </div>
            
            <div className={styles.tooltipContainer}>
              <div className={styles.miniCardValue}>
                {formatPercent(current.leverageRatio)}
              </div>
              
              <div className={styles.tooltipBox}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Calculation</div>
                <div className={styles.tooltipRow}>
                  <span>Total Liabilities:</span>
                  <strong>{formatCurrency(current.totalLiabilities)}</strong>
                </div>
                <div className={styles.tooltipRow}>
                  <span>Total Assets:</span>
                  <strong>{formatCurrency(current.totalAssets)}</strong>
                </div>
                <div className={styles.tooltipDivider} />
                <div className={styles.tooltipRow}>
                  <span>Formula:</span>
                  <strong>Liabilities ÷ Assets</strong>
                </div>
              </div>
            </div>

            <div className={`${styles.miniCardIdeal} ${styles['status' + getLeverageStatus(current.leverageRatio)]}`}>
              {getLeverageStatus(current.leverageRatio) === 'Good' ? 'Good' : 'Moderate'}
            </div>
          </div>

          {/* Liquidity to Debt Ratio */}
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>💧</div>
              <div className={styles.miniCardTitle}>Liquidity to Debt Ratio</div>
            </div>

            <div className={styles.tooltipContainer}>
              <div className={styles.miniCardValue}>
                {formatPercent(current.liquidityRatio)}
              </div>

              <div className={styles.tooltipBox}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Calculation</div>
                <div className={styles.tooltipRow}>
                  <span>Liquid Assets:</span>
                  <strong>{formatCurrency(current.liquidAssets)}</strong>
                </div>
                <div className={styles.tooltipRow}>
                  <span>Total Liabilities:</span>
                  <strong>{formatCurrency(current.totalLiabilities)}</strong>
                </div>
                <div className={styles.tooltipDivider} />
                <div className={styles.tooltipRow}>
                  <span>Formula:</span>
                  <strong>Liquid ÷ Liabilities</strong>
                </div>
              </div>
            </div>

            <div className={`${styles.miniCardIdeal} ${styles['status' + getLiquidityStatus(current.liquidityRatio)]}`}>
              {getLiquidityStatus(current.liquidityRatio) === 'Good' ? 'Strong' : 'Weak'}
            </div>
          </div>

          {/* Aggregate LTV */}
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconYellow}`}>🏠</div>
              <div className={styles.miniCardTitle}>Aggregate LTV</div>
            </div>

            <div className={styles.tooltipContainer}>
              <div className={styles.miniCardValue}>
                {formatPercent(current.totalPropertyLTV)}
              </div>

              <div className={styles.tooltipBox}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Calculation</div>
                <div className={styles.tooltipRow}>
                  <span>Real Estate Debt:</span>
                  <strong>{formatCurrency(current.totalRealEstateDebt)}</strong>
                </div>
                <div className={styles.tooltipRow}>
                  <span>Real Estate Value:</span>
                  <strong>{formatCurrency(current.totalRealEstateValue)}</strong>
                </div>
                <div className={styles.tooltipDivider} />
                <div className={styles.tooltipRow}>
                  <span>Formula:</span>
                  <strong>Debt ÷ Value</strong>
                </div>
              </div>
            </div>

            <div className={`${styles.miniCardIdeal} ${styles['status' + getLTVStatus(current.totalPropertyLTV)]}`}>
              {getLTVStatus(current.totalPropertyLTV) === 'Good' ? 'Good' : 'High'}
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: LTV BREAKDOWN CHART */}
        <div className={styles.chartPanel}>
          <h2>LTV by Property</h2>
          {current.properties.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
              No linked properties found. Go to Snapshots and link your Mortgage to your Real Estate.
            </p>
          ) : (
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis unit="%" stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomRechartsTooltip />} />
                  <Bar dataKey="ltv" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="ltv" position="top" formatter={(val: number) => val.toFixed(1) + '%'} style={{ fontWeight: 600 }} />
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* BOTTOM FULL WIDTH: RECOMMENDATION */}
        <div className={styles.recommendationBanner}>
          <div className={styles.recommendationIcon}>💡</div>
          <div className={styles.recommendationText}>
            <strong>Key Takeaway</strong> &nbsp;&nbsp; {recommendation}
          </div>
        </div>

      </div>
    </div>
  );
}
