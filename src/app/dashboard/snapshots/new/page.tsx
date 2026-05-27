'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './new.module.css';
import { getQuarterLabel } from '@/lib/utils';

export default function NewSnapshotPage() {
  const router = useRouter();
  const [label, setLabel] = useState(getQuarterLabel());
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [carryFrom, setCarryFrom] = useState('');
  const [quarters, setQuarters] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/quarters').then(r => r.json()).then(setQuarters);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/quarters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, snapshotDate, notes, carryFromQuarterId: carryFrom || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create snapshot');
        return;
      }
      const q = await res.json();
      router.push(`/dashboard/snapshots/${q.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>New Quarter</h1>
        <p>Create a new quarterly financial snapshot</p>
      </div>

      <div className={`glass-card ${styles.formCard}`}>
        <form onSubmit={handleCreate} className={styles.form} id="new-quarter-form">
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="quarter-label">Quarter Label</label>
              <input
                id="quarter-label"
                type="text"
                className="form-input"
                placeholder="e.g. 2026-Q1"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                pattern="\d{4}-Q[1-4]"
                title="Format: YYYY-Q1, YYYY-Q2, YYYY-Q3, or YYYY-Q4"
              />
              <span className={styles.hint}>Format: YYYY-Q1 through YYYY-Q4</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="snapshot-date">Snapshot Date</label>
              <input
                id="snapshot-date"
                type="date"
                className="form-input"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="carry-from">Carry Balances From</label>
            <select
              id="carry-from"
              className="form-input"
              value={carryFrom}
              onChange={(e) => setCarryFrom(e.target.value)}
            >
              <option value="">— Start with blank balances —</option>
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>{q.label}</option>
              ))}
            </select>
            <span className={styles.hint}>Optionally pre-fill this quarter&apos;s balances from a previous quarter</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              className="form-input"
              placeholder="Any notes for this quarter…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div className={styles.error} role="alert">{error}</div>}

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
            <button id="create-quarter-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
