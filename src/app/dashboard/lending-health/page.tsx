'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
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

  // Animate the score when it changes
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

  // Helpers
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

  // Recommendation Logic
  let recommendation = "You are in a great position for lending opportunities. Keep maintaining healthy ratios.";
  if (current.healthScore < 60) {
    recommendation = "Your overall profile needs improvement before seeking major lending.";
  } else {
    if (current.totalPropertyLTV > 0.8) recommendation = "Consider lowering your property LTV to avoid mortgage insurance and get better rates.";
    else if (current.liquidityRatio < 0.5) recommendation = "Increase your liquid assets to improve your debt coverage capability.";
    else if (current.leverageRatio > 0.6) recommendation = "Your Debt-to-Asset ratio is high. Focus on paying down liabilities to strengthen your profile.";
  }

  // Prepare chart data
  const chartData = current.properties.map(p => ({
    name: p.name,
    ltv: p.ltv * 100, // percentage for chart
    fill: p.ltv < 0.8 ? '#10b981' : p.ltv < 0.9 ? '#f59e0b' : '#ef4444'
  }));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Lending Health Dashboard</h1>
          <p>A visual summary of your financial position for underwriters.</p>
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
        <div className={styles.scorePanel}>
          <h2>Overall Health Score</h2>
          <div className={styles.circularScore}>
            <svg className={styles.scoreCircleSvg} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={circleRadius} className={styles.scoreBg} />
              <circle 
                cx="100" cy="100" r={circleRadius} 
                className={`${styles.scoreFill} ${styles['stroke' + scoreData.cls]}`}
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className={styles.scoreTextContainer}>
              <div className={styles.scoreValue}>{current.healthScore}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</div>
            </div>
          </div>
          <div className={`${styles.scoreLabel} ${styles['status' + scoreData.cls]}`}>
            {scoreData.label}
          </div>
          <p className={styles.scoreSubtext}>
            Based on a weighted average of your Leverage, Liquidity, and Real Estate LTV ratios.
          </p>
        </div>

        {/* TOP RIGHT: CORE METRICS ROW */}
        <div className={styles.metricsRow}>
          <div className={styles.miniCard}>
            <div className={styles.miniCardTitle}>Debt-to-Asset Ratio</div>
            <div className={`${styles.miniCardValue} ${styles['status' + getLeverageStatus(current.leverageRatio)]}`}>
              {formatPercent(current.leverageRatio)}
            </div>
            <div className={styles.miniCardIdeal}>Ideal &lt; 40%</div>
          </div>

          <div className={styles.miniCard}>
            <div className={styles.miniCardTitle}>Liquidity to Debt Ratio</div>
            <div className={`${styles.miniCardValue} ${styles['status' + getLiquidityStatus(current.liquidityRatio)]}`}>
              {formatPercent(current.liquidityRatio)}
            </div>
            <div className={styles.miniCardIdeal}>Ideal &gt; 100%</div>
          </div>

          <div className={styles.miniCard}>
            <div className={styles.miniCardTitle}>Aggregate LTV</div>
            <div className={`${styles.miniCardValue} ${styles['status' + getLTVStatus(current.totalPropertyLTV)]}`}>
              {formatPercent(current.totalPropertyLTV)}
            </div>
            <div className={styles.miniCardIdeal}>Ideal &lt; 80%</div>
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
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis unit="%" stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'LTV']}
                  />
                  <Bar dataKey="ltv" radius={[6, 6, 0, 0]} maxBarSize={60}>
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
            <strong>Key Takeaway:</strong> {recommendation}
          </div>
        </div>

      </div>
    </div>
  );
}
