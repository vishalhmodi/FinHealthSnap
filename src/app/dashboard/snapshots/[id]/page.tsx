'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './snapshot.module.css';
import { formatCurrency } from '@/lib/utils';

interface Owner { id: string; name: string; }
interface Category { id: string; name: string; sortOrder: number; }
interface Institution { id: string; name: string; }

interface AccountEntry {
  id: string;
  category: Category;
  institution: Institution;
  owner: Owner;
  isExcluded: boolean;
}

interface Balance {
  accountId: string;
  amount: number;
  account: AccountEntry;
}

interface CustomItem {
  id: string;
  name: string;
  detail: string;
  itemType: string;
  amount: number;
  sortOrder: number;
  linkedAssetId?: string;
  category?: string | null;
}

interface QuarterData {
  id: string;
  label: string;
  snapshotDate: string;
  notes?: string;
  balances: Balance[];
  customItems: CustomItem[];
}

// ─── Helper: build a structured grid for a category ──────────────────
function buildCategoryGrid(
  balances: Balance[],
  categoryName: string,
  editAmounts: Record<string, number>,
  editing: boolean,
  onAmountChange: (accountId: string, val: number) => void,
  onDeleteAccount: (accountId: string) => void,
  onToggleExclude: (accountId: string, currentStatus: boolean) => void
) {
  const catBalances = balances.filter((b) => b.account.category.name === categoryName);
  if (catBalances.length === 0) return null;

  // Get unique owners and institutions for this category
  const owners = [...new Map(catBalances.map((b) => [b.account.owner.id, b.account.owner])).values()];
  const institutions = [...new Map(catBalances.map((b) => [b.account.institution.id, b.account.institution])).values()];

  // Owner totals
  const ownerTotals: Record<string, number> = {};
  for (const o of owners) {
    ownerTotals[o.id] = catBalances
      .filter((b) => b.account.owner.id === o.id && !b.account.isExcluded)
      .reduce((sum, b) => sum + (editAmounts[b.accountId] ?? b.amount), 0);
  }
  // Institution totals
  const institutionTotals: Record<string, number> = {};
  for (const inst of institutions) {
    institutionTotals[inst.id] = catBalances
      .filter((b) => b.account.institution.id === inst.id && !b.account.isExcluded)
      .reduce((sum, b) => sum + (editAmounts[b.accountId] ?? b.amount), 0);
  }

  const categoryTotal = Object.values(ownerTotals).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.categoryGrid}>
      {/* Header row */}
      <div className={styles.catHeader}>
        <div className={styles.catTotal}>{formatCurrency(categoryTotal)}</div>
        {institutions.map((inst) => (
          <div key={inst.id} className={styles.catOwnerTotal}>{formatCurrency(institutionTotals[inst.id])}</div>
        ))}
        <div className={styles.catOwnerTotal}>{formatCurrency(categoryTotal)}</div>
      </div>

      {/* Column headers */}
      <div className={styles.catColRow}>
        <div className={styles.catCategoryLabel}>{categoryName}</div>
        {institutions.map((inst) => (
          <div key={inst.id} className={styles.catColLabel}>{inst.name}</div>
        ))}
        <div className={styles.catColLabel}>Total</div>
      </div>

      {/* Data rows */}
      {owners.map((owner) => {
        const ownerRowTotal = institutions.reduce((sum, inst) => {
          const bal = catBalances.find((b) => b.account.owner.id === owner.id && b.account.institution.id === inst.id);
          if (bal && bal.account.isExcluded) return sum;
          return sum + (bal ? (editAmounts[bal.accountId] ?? bal.amount) : 0);
        }, 0);

        return (
          <div key={owner.id} className={styles.catDataRow}>
            <div className={styles.catOwnerLabel}>{owner.name}</div>
            {institutions.map((inst) => {
              const bal = catBalances.find(
                (b) => b.account.owner.id === owner.id && b.account.institution.id === inst.id
              );
              const val = bal ? (editAmounts[bal.accountId] ?? bal.amount) : 0;
              return (
                <div key={inst.id} className={styles.catCell}>
                  {editing && bal ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: bal.account.isExcluded ? 0.5 : 1 }}>
                      <input
                        type="number"
                        className={`form-input form-input-currency ${styles.balanceInput}`}
                        value={val}
                        min={0}
                        step={0.01}
                        onChange={(e) => onAmountChange(bal.accountId, parseFloat(e.target.value) || 0)}
                        id={`balance-${bal.accountId}`}
                      />
                      <button 
                        type="button"
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '0 4px', color: 'var(--text-muted)' }} 
                        title={bal.account.isExcluded ? "Include Account" : "Exclude Account"} 
                        onClick={() => onToggleExclude(bal.accountId, bal.account.isExcluded)}
                      >{bal.account.isExcluded ? '👁️' : '🚫'}</button>
                      <button 
                        type="button"
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '0 4px', color: 'var(--color-liability-text)' }} 
                        title="Delete Account Globally" 
                        onClick={() => onDeleteAccount(bal.accountId)}
                      >×</button>
                    </div>
                  ) : (
                    <span className="font-mono" style={{ textDecoration: bal?.account.isExcluded ? 'line-through' : 'none', opacity: bal?.account.isExcluded ? 0.5 : 1 }}>{bal ? formatCurrency(val) : '-'}</span>
                  )}
                </div>
              );
            })}
            <div className={styles.catCell} style={{ fontWeight: 'bold' }}>
              <span className="font-mono">{formatCurrency(ownerRowTotal)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function SnapshotPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quarter, setQuarter] = useState<QuarterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAmounts, setEditAmounts] = useState<Record<string, number>>({});
  const [editCustom, setEditCustom] = useState<CustomItem[]>([]);

  // New account form state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({ categoryName: '', ownerName: '', institutionName: '' });
  const [addingAccount, setAddingAccount] = useState(false);
  const [presets, setPresets] = useState<{ 
    categories: Category[], 
    owners: Owner[], 
    institutions: Institution[],
    customCategories: {id: string, name: string, type: string}[]
  }>({ categories: [], owners: [], institutions: [], customCategories: [] });

  const loadData = useCallback(() => {
    Promise.all([
      fetch(`/api/quarters/${id}`).then((r) => r.json()),
      fetch(`/api/accounts`).then((r) => r.json())
    ]).then(([data, accountsData]) => {
      setQuarter(data);
      setPresets({
        categories: accountsData.categories || [],
        owners: accountsData.owners || [],
        institutions: accountsData.institutions || [],
        customCategories: accountsData.customItemCategories || []
      });
      if (accountsData.categories?.length && accountsData.owners?.length && accountsData.institutions?.length) {
        setNewAccountData({
          categoryName: accountsData.categories[0].name,
          ownerName: accountsData.owners[0].name,
          institutionName: accountsData.institutions[0].name
        });
      }
      
      // Init edit state
      const amounts: Record<string, number> = {};
      for (const b of data.balances) amounts[b.accountId] = b.amount;
      setEditAmounts(amounts);
      setEditCustom(data.customItems.map((c: CustomItem) => ({ ...c })));
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleAmountChange(accountId: string, val: number) {
    setEditAmounts((prev) => ({ ...prev, [accountId]: val }));
  }

  function handleCustomChange(idx: number, field: keyof CustomItem, value: any) {
    setEditCustom((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  function addCustomItem() {
    setEditCustom((prev) => {
      const minSortOrder = prev.length > 0 ? Math.min(...prev.map(p => p.sortOrder)) : 0;
      return [
        {
          id: '',
          name: '',
          detail: '',
          itemType: 'ASSET',
          amount: 0,
          sortOrder: minSortOrder - 1,
        },
        ...prev,
      ];
    });
  }

  function removeCustomItem(idx: number) {
    setEditCustom((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleDeleteAccount(accountId: string) {
    if (!confirm('Are you sure you want to delete this account completely? This will remove it from all quarters.')) return;
    setSaving(true);
    await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
    await loadData();
    setSaving(false);
  }

  async function handleToggleExcludeAccount(accountId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isExcluded: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle exclusion');
      
      // Update local state by forcing a reload or updating manually. 
      // Reload is safer since it ensures everything recalculates cleanly.
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update account exclusion status.');
    }
  }

  async function handleDeleteQuarter() {
    if (!confirm('Are you sure you want to delete this entire snapshot?')) return;
    setSaving(true);
    await fetch(`/api/quarters/${id}`, { method: 'DELETE' });
    router.push('/dashboard');
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setAddingAccount(true);
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccountData, quarterId: id }),
      });
      setShowAddAccount(false);
      setNewAccountData({ categoryName: '', ownerName: '', institutionName: '' });
      await loadData();
    } finally {
      setAddingAccount(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const balances = Object.entries(editAmounts).map(([accountId, amount]) => ({ accountId, amount }));
      await fetch(`/api/quarters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balances, customItems: editCustom }),
      });
      await loadData();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() { window.print(); }

  function handleExportJSON() {
    if (!quarter) return;
    const exportData = {
      label: quarter.label,
      snapshotDate: quarter.snapshotDate,
      notes: quarter.notes,
      balances: quarter.balances.map(b => ({
        account: `${b.account.category.name} - ${b.account.owner.name} (${b.account.institution.name})`,
        amount: editing ? (editAmounts[b.accountId] ?? b.amount) : b.amount
      })),
      customItems: editing ? editCustom : quarter.customItems
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${quarter.label}-snapshot.json`);
    dlAnchorElem.click();
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!quarter) return <div className={styles.page}><p>Snapshot not found.</p></div>;

  const categories = [...new Set(quarter.balances.map((b) => b.account.category.name))].sort(
    (a, b) => {
      const orderMap: Record<string, number> = { TFSA: 0, RRSP: 1, RESP: 2, General: 3 };
      return (orderMap[a] ?? 99) - (orderMap[b] ?? 99);
    }
  );

  // Summary computations
  const totalAccountAssets = quarter.balances.reduce(
    (sum, b) => sum + (editing ? (editAmounts[b.accountId] ?? b.amount) : b.amount),
    0
  );
  const items = editing ? editCustom : quarter.customItems;
  const totalCustomAssets = items.filter(c => c.itemType === 'ASSET').reduce((s, c) => s + c.amount, 0);
  const totalLiabilities = items.filter(c => c.itemType === 'LIABILITY').reduce((s, c) => s + c.amount, 0);
  const totalAssets = totalAccountAssets + totalCustomAssets;
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className={styles.page} id="snapshot-page">
      {/* Print Header (visible only in print) */}
      <div className={`${styles.printHeader} print-only`}>
        <h1>FinanceSnap — Quarterly Report</h1>
        <p>{quarter.label} · {new Date(quarter.snapshotDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Page Header */}
      <div className={`${styles.pageHeader} no-print`}>
        <div>
          <div className={styles.breadcrumb}>
            <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
          </div>
          <h1>{quarter.label}</h1>
          <p className="text-sm">
            {new Date(quarter.snapshotDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
            {quarter.notes && ` · ${quarter.notes}`}
          </p>
        </div>
        <div className={styles.headerActions}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); loadData(); }} disabled={saving}>
                Cancel
              </button>
              <button id="save-snapshot-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost" style={{ color: 'var(--color-liability-text)' }} onClick={handleDeleteQuarter} disabled={saving}>
                🗑 Delete Snapshot
              </button>
              <button id="edit-btn" className="btn btn-primary" onClick={() => setEditing(true)}>
                ✏ Edit
              </button>
              <button id="print-btn" className="btn btn-secondary" onClick={handlePrint}>
                ⎙ Print / PDF
              </button>
              <button className="btn btn-secondary" onClick={handleExportJSON}>
                ⬇ Export JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid — Two column layout matching Excel */}
      <div className={styles.mainGrid}>
        {/* Left: Account Grids */}
        <div className={styles.leftPanel}>
          {editing && (
            <div className={`glass-card ${styles.addAccountCard} no-print`} style={{ padding: '16px', marginBottom: '24px' }}>
              {!showAddAccount ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAccount(true)}>
                  + Add Investment Account
                </button>
              ) : (
                <form onSubmit={handleAddAccount} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {presets.categories.length === 0 || presets.owners.length === 0 || presets.institutions.length === 0 ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-liability-text)' }}>
                      Please configure Investment Types, Owners, and Institutions in Settings first.
                    </div>
                  ) : (
                    <>
                      <select required className="form-input" style={{flex: 1, minWidth: '120px'}} value={newAccountData.categoryName} onChange={(e) => setNewAccountData({...newAccountData, categoryName: e.target.value})}>
                        {presets.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <select required className="form-input" style={{flex: 1, minWidth: '120px'}} value={newAccountData.ownerName} onChange={(e) => setNewAccountData({...newAccountData, ownerName: e.target.value})}>
                        {presets.owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </select>
                      <select required className="form-input" style={{flex: 1, minWidth: '120px'}} value={newAccountData.institutionName} onChange={(e) => setNewAccountData({...newAccountData, institutionName: e.target.value})}>
                        {presets.institutions.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                      </select>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={addingAccount}>{addingAccount ? 'Adding...' : 'Add'}</button>
                    </>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddAccount(false)}>Cancel</button>
                </form>
              )}
            </div>
          )}

          {categories.map((cat) => (
            <div key={cat} className={`glass-card ${styles.catCard}`}>
              <div className={styles.catCardHeader}>{cat}</div>
              {buildCategoryGrid(quarter.balances, cat, editAmounts, editing, handleAmountChange, handleDeleteAccount, handleToggleExcludeAccount)}
            </div>
          ))}
        </div>

        {/* Right: Summary Panel */}
        <div className={styles.rightPanel}>
          {/* Net Worth Summary */}
          <div className={`glass-card ${styles.summaryCard}`}>
            <h2 className={styles.summaryTitle}>Summary</h2>

            <div className={styles.summaryRow} style={{ background: netWorth >= 0 ? 'var(--color-asset-light)' : 'var(--color-liability-light)', borderColor: netWorth >= 0 ? 'var(--color-asset-border)' : 'var(--color-liability-border)' }}>
              <span>Net Worth</span>
              <span className={`font-mono ${netWorth >= 0 ? 'amount-positive' : 'amount-negative'}`}>{formatCurrency(netWorth)}</span>
            </div>
            <div className={styles.summaryRow} style={{ background: 'var(--color-asset-light)', borderColor: 'var(--color-asset-border)' }}>
              <span>Total Assets</span>
              <span className="font-mono amount-positive">{formatCurrency(totalAssets)}</span>
            </div>
            <div className={styles.summaryRow} style={{ background: 'var(--color-liability-light)', borderColor: 'var(--color-liability-border)' }}>
              <span>Total Liabilities</span>
              <span className="font-mono amount-negative">{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>

          {/* Custom Assets & Liabilities Panel */}
          <div className={`glass-card ${styles.customCard}`}>
            <div className={styles.customCardHeader}>
              <h2>Assets & Liabilities</h2>
              {editing && (
                <button className="btn btn-ghost btn-sm" onClick={addCustomItem} id="add-custom-item-btn">
                  + Add
                </button>
              )}
            </div>

            <div className={styles.customList}>
              {items.map((item, idx) => (
                <div key={item.id || idx} className={styles.customItem}
                  style={{
                    borderColor: item.itemType === 'ASSET' ? 'var(--color-asset-border)' : 'var(--color-liability-border)',
                    background: item.itemType === 'ASSET' ? 'var(--color-asset-light)' : 'var(--color-liability-light)',
                  }}>
                  {editing ? (
                    <div className={styles.customEditRow}>
                      <input
                        className={`form-input ${styles.customNameInput}`}
                        placeholder="Name"
                        value={item.name}
                        onChange={(e) => handleCustomChange(idx, 'name', e.target.value)}
                        id={`custom-name-${idx}`}
                      />
                      <input
                        className={`form-input ${styles.customNameInput}`}
                        placeholder="Detail"
                        value={item.detail}
                        onChange={(e) => handleCustomChange(idx, 'detail', e.target.value)}
                        id={`custom-detail-${idx}`}
                      />
                      <select
                        className="form-input"
                        value={item.itemType}
                        onChange={(e) => handleCustomChange(idx, 'itemType', e.target.value)}
                        id={`custom-type-${idx}`}
                        style={{ minWidth: 110 }}
                      >
                        <option value="ASSET">Asset</option>
                        <option value="LIABILITY">Liability</option>
                      </select>
                      <select
                        className="form-input"
                        value={item.category || ''}
                        onChange={(e) => handleCustomChange(idx, 'category', e.target.value)}
                        id={`custom-category-${idx}`}
                        style={{ minWidth: 140 }}
                      >
                        <option value="">-- Kind --</option>
                        {item.itemType === 'ASSET' ? (
                          presets.customCategories.filter(c => c.type === 'ASSET').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        ) : (
                          presets.customCategories.filter(c => c.type === 'LIABILITY').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        )}
                      </select>
                      <input
                        type="number"
                        className={`form-input form-input-currency ${styles.customAmtInput}`}
                        value={item.amount}
                        min={0}
                        step={0.01}
                        onChange={(e) => handleCustomChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                        id={`custom-amount-${idx}`}
                      />
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '0 8px', color: 'var(--color-liability-text)' }}
                        onClick={() => removeCustomItem(idx)}
                        title="Remove Item"
                      >×</button>
                      {item.itemType === 'LIABILITY' && (
                        <select
                          className="form-input"
                          value={item.linkedAssetId || ''}
                          onChange={(e) => handleCustomChange(idx, 'linkedAssetId', e.target.value || undefined)}
                          style={{ minWidth: '100%', marginTop: '4px', fontSize: '0.8rem', padding: '4px' }}
                        >
                          <option value="">-- No Linked Asset --</option>
                          {items.filter(i => i.itemType === 'ASSET' && i.id).map(i => (
                            <option key={i.id} value={i.id}>Links to: {i.name} ({i.detail})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className={styles.customViewRow}>
                      <div className={styles.customItemMeta}>
                        <span className={styles.customItemName}>
                          {item.name} 
                          {item.category && <span style={{ fontSize: '0.7em', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', marginLeft: '6px' }}>{item.category}</span>}
                        </span>
                        <span className={styles.customItemDetail}>{item.detail}</span>
                        {item.linkedAssetId && item.itemType === 'LIABILITY' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-liability-text)', display: 'block', marginTop: '2px' }}>
                            ↳ Linked to: {items.find(i => i.id === item.linkedAssetId)?.name || 'Unknown Asset'}
                          </span>
                        )}
                      </div>
                      <span className={`font-mono ${item.itemType === 'ASSET' ? 'amount-positive' : 'amount-negative'}`}>
                        {item.itemType === 'LIABILITY' ? '-' : ''}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
