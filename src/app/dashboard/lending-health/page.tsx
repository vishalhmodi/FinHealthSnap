'use client';

import { useEffect, useState } from 'react';
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

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" />
        <p>Analyzing lending health metrics…</p>
      </div>
    );
  }

  const { trends = [], latest } = data ?? {};
  
  const latestIndex = selectedQuarterId 
    ? trends.findIndex((t: TrendData) => t.quarterId === selectedQuarterId) 
    : trends.length - 1;

  const current = latestIndex >= 0 ? trends[latestIndex] : null;

  const handlePrint = () => {
    window.print();
  };

  if (!current) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1>Lending Health</h1>
            <p className="text-sm">No data yet — add your first quarter</p>
          </div>
        </div>
      </div>
    );
  }

  // Helpers for Gauges
  const getLeverageStatus = (ratio: number) => {
    if (ratio < 0.3) return 'Good';
    if (ratio < 0.6) return 'Warn';
    return 'Danger';
  };

  const getLiquidityStatus = (ratio: number) => {
    if (ratio > 0.5) return 'Good';
    if (ratio > 0.1) return 'Warn';
    return 'Danger';
  };

  const getLTVStatus = (ratio: number) => {
    if (ratio < 0.7) return 'Good';
    if (ratio < 0.85) return 'Warn';
    return 'Danger';
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Lending Health Analytics</h1>
          <p className="text-sm">
            Evaluate your balance sheet through the eyes of an underwriter.
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
        
        {/* Leverage Ratio */}
        <div className={`glass-card ${styles.gaugeCard}`}>
          <h2>Debt-to-Asset Ratio (Leverage)</h2>
          <p className={styles.description}>
            Measures how much of your total assets are financed by debt. Lenders use this to assess overall solvency and borrowing risk.
          </p>
          
          <div className={styles.gaugeContainer}>
            <div className={styles.gaugeBar}>
              <div 
                className={`${styles.gaugeFill} ${styles['bg' + getLeverageStatus(current.leverageRatio)]}`} 
                style={{ width: `${Math.min(current.leverageRatio * 100, 100)}%` }} 
              />
            </div>
            <div className={`${styles.gaugeText} ${styles['status' + getLeverageStatus(current.leverageRatio)]}`}>
              {formatPercent(current.leverageRatio)}
            </div>
          </div>
          
          <p className={styles.description} style={{ marginTop: 'auto' }}>
            {current.leverageRatio < 0.3 ? "Excellent. You have very low leverage and strong solvency." : 
             current.leverageRatio < 0.6 ? "Moderate. Your debt is manageable relative to your asset base." : 
             "High Risk. A high percentage of your assets are financed by debt, which may limit borrowing capacity."}
          </p>
        </div>

        {/* Liquidity Ratio */}
        <div className={`glass-card ${styles.gaugeCard}`}>
          <h2>Liquidity to Debt Ratio</h2>
          <p className={styles.description}>
            Measures your ability to cover total outstanding liabilities using only your highly liquid assets (cash, stocks, registered accounts).
          </p>
          
          <div className={styles.gaugeContainer}>
            <div className={styles.gaugeBar}>
              <div 
                className={`${styles.gaugeFill} ${styles['bg' + getLiquidityStatus(current.liquidityRatio)]}`} 
                style={{ width: `${Math.min(current.liquidityRatio * 100, 100)}%` }} 
              />
            </div>
            <div className={`${styles.gaugeText} ${styles['status' + getLiquidityStatus(current.liquidityRatio)]}`}>
              {formatPercent(current.liquidityRatio)}
            </div>
          </div>
          
          <p className={styles.description} style={{ marginTop: 'auto' }}>
            {current.liquidityRatio > 0.5 ? "Strong. You hold significant liquid assets to cover your debts in an emergency." : 
             current.liquidityRatio > 0.1 ? "Adequate. You have some liquidity, but may rely on selling non-liquid assets for major debt clearance." : 
             "Low. You are highly illiquid. Most of your wealth is tied up in physical assets or real estate."}
          </p>
        </div>

        {/* Loan to Value (LTV) */}
        <div className={`glass-card ${styles.gaugeCard}`} style={{ gridColumn: '1 / -1' }}>
          <h2>Real Estate Loan-to-Value (LTV)</h2>
          <p className={styles.description} style={{ marginBottom: '16px' }}>
            Shows the ratio of mortgages and linked debts against specific property values. Lenders typically require LTVs below 80% to avoid mortgage insurance premiums.
          </p>
          
          {current.properties.length === 0 ? (
            <div className={styles.description} style={{ fontStyle: 'italic' }}>
              No linked properties found. To see LTV, go to Snapshots and link your Mortgage (Liability) to your House (Asset).
            </div>
          ) : (
            <div className={styles.ltvList}>
              {current.properties.map(p => (
                <div key={p.id} className={styles.ltvItem}>
                  <div className={styles.ltvDetails}>
                    <span className={styles.ltvName}>{p.name} ({p.detail})</span>
                    <span className={styles.ltvAmounts}>
                      Value: {formatCurrency(p.assetValue)} | Debt: {formatCurrency(p.linkedDebt)}
                    </span>
                  </div>
                  <div className={`${styles.gaugeText} ${styles['status' + getLTVStatus(p.ltv)]}`} style={{ margin: 0, fontSize: '1.5rem' }}>
                    {formatPercent(p.ltv)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
