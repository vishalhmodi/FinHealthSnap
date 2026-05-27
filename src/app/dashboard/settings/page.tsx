'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

interface Category { id: string; name: string; }
interface Owner { id: string; name: string; }
interface Institution { id: string; name: string; }

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCat, setNewCat] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newInst, setNewInst] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/accounts')
      .then(r => r.json())
      .then(data => {
        setCategories(data.categories || []);
        setOwners(data.owners || []);
        setInstitutions(data.institutions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdd(type: 'CATEGORY' | 'OWNER' | 'INSTITUTION', name: string, setter: (v: string) => void) {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: name.trim() })
      });
      if (res.ok) {
        setter('');
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to add item');
      }
    } catch (e) {
      alert('Network error');
    }
  }

  async function handleDelete(type: 'CATEGORY' | 'OWNER' | 'INSTITUTION', id: string) {
    if (!confirm('Are you sure you want to delete this item? It might be in use.')) return;
    try {
      const res = await fetch(`/api/settings/${id}?type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete item');
      }
    } catch (e) {
      alert('Network error');
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters');
      return;
    }
    
    setPasswordMsg('Updating...');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setPasswordMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordMsg(''), 3000);
      } else {
        const d = await res.json();
        setPasswordMsg(d.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordMsg('Network error');
    }
  }

  const renderSection = (title: string, items: any[], type: 'CATEGORY'|'OWNER'|'INSTITUTION', val: string, setVal: (v: string) => void, placeholder: string) => (
    <div className={`glass-card ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.itemList}>
        {items.length === 0 ? (
          <div className={styles.emptyText}>No items added yet.</div>
        ) : items.map(item => (
          <div key={item.id} className={styles.itemRow}>
            <span>{item.name}</span>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', color: 'var(--color-liability-text)' }} onClick={() => handleDelete(type, item.id)}>×</button>
          </div>
        ))}
      </div>
      <div className={styles.addForm}>
        <input className="form-input" style={{ flex: 1 }} placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd(type, val, setVal)} />
        <button className="btn btn-secondary btn-sm" onClick={() => handleAdd(type, val, setVal)}>Add</button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} className="btn btn-secondary no-print">
            ▤ Print / PDF
          </button>
        </div>
      </div>

      <div className={styles.presetsGrid}>
        {renderSection('Investment Types', categories, 'CATEGORY', newCat, setNewCat, 'e.g. TFSA, Crypto')}
        {renderSection('Individuals / Owners', owners, 'OWNER', newOwner, setNewOwner, 'e.g. John, Family')}
        {renderSection('Institutions', institutions, 'INSTITUTION', newInst, setNewInst, 'e.g. TD Bank, Questrade')}
      </div>

      <div className={`glass-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Account Details</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}><span className={styles.infoLabel}>Application</span><span className={styles.infoValue}>FinanceSnap</span></div>
          <div className={styles.infoRow}><span className={styles.infoLabel}>Version</span><span className={styles.infoValue}>1.1.0</span></div>
          <div className={styles.infoRow}><span className={styles.infoLabel}>Database</span><span className={styles.infoValue}>SQLite (local)</span></div>
        </div>
      </div>

      <div className={`glass-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Security</h2>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required className="form-input" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          {passwordMsg && <div style={{ fontSize: '0.9rem', color: passwordMsg.includes('success') ? 'var(--color-trend-up)' : 'var(--color-liability-text)' }}>{passwordMsg}</div>}
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Change Password</button>
        </form>
      </div>
    </div>
  );
}
