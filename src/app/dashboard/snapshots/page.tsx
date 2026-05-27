'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';

interface Quarter { id: string; label: string; snapshotDate: string; notes?: string; totalAssets: number; totalLiabilities: number; netWorth: number; }

export default function SnapshotsPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quarters').then(r => r.json()).then(setQuarters).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Quarterly Snapshots</h1>
          <p className="text-sm">All your saved financial snapshots</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/snapshots/new" id="new-snapshot-btn" className="btn btn-primary no-print">
            + New Quarter
          </Link>
          <button onClick={() => window.print()} className="btn btn-secondary no-print">
            ▤ Print / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : quarters.length === 0 ? (
        <div className={`glass-card ${styles.empty}`}>
          <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '12px' }}>◫</div>
          <h2>No snapshots yet</h2>
          <p>Create your first quarterly snapshot to begin tracking.</p>
          <Link href="/dashboard/snapshots/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
            + Create First Snapshot
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {quarters.map((q) => (
            <Link key={q.id} href={`/dashboard/snapshots/${q.id}`} id={`snapshot-card-${q.label}`} className={`glass-card ${styles.snapshotCard}`}>
              <div className={styles.cardTop}>
                <span className="badge badge-neutral">{q.label}</span>
                <span className={styles.cardDate}>
                  {new Date(q.snapshotDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className={styles.cardMetrics}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span className="text-secondary">Assets</span>
                  <span className="font-mono amount-positive">{formatCurrency(q.totalAssets)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span className="text-secondary">Liabilities</span>
                  <span className="font-mono amount-negative">{formatCurrency(q.totalLiabilities)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--glass-border)' }}>
                  <span className="text-secondary">Net Worth</span>
                  <span className={`font-mono ${q.netWorth >= 0 ? 'amount-positive' : 'amount-negative'}`}>{formatCurrency(q.netWorth)}</span>
                </div>
              </div>
              {q.notes && <p className={styles.cardNotes}>{q.notes}</p>}
              <div className={styles.cardArrow}>View Snapshot →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
