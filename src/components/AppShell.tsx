'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AppShell.module.css';
import type { JWTPayload } from '@/lib/auth';

interface Props {
  user: JWTPayload;
  children: React.ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/snapshots', label: 'Snapshots', icon: '◫' },
  { href: '/dashboard/settings', label: 'Settings', icon: '◎' },
];

export default function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('indigo');
  const [bgMode, setBgMode] = useState('dark');

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Load theme and background from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-color') || 'indigo';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedBg = localStorage.getItem('bg-mode') || 'dark';
    setBgMode(savedBg);
    document.documentElement.setAttribute('data-bg', savedBg);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme-color', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeBgMode = (newBg: string) => {
    setBgMode(newBg);
    localStorage.setItem('bg-mode', newBg);
    document.documentElement.setAttribute('data-bg', newBg);
  };

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} no-print`} id="main-sidebar">
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo} id="logo-link">
            <div className={styles.logoIcon} aria-hidden>
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" strokeWidth="1"/>
                <path d="M14 34L20 22L26 28L32 16" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="32" cy="16" r="3" fill="#6366f1"/>
              </svg>
            </div>
            <span className={styles.logoText}>FinanceSnap</span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`${styles.navItem} ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon} aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.themeSelector}>
          <button className={`${styles.themeCircle} ${theme === 'indigo' ? styles.activeTheme : ''}`} style={{background: '#6366f1'}} onClick={() => changeTheme('indigo')} title="Indigo"></button>
          <button className={`${styles.themeCircle} ${theme === 'emerald' ? styles.activeTheme : ''}`} style={{background: '#10b981'}} onClick={() => changeTheme('emerald')} title="Emerald"></button>
          <button className={`${styles.themeCircle} ${theme === 'rose' ? styles.activeTheme : ''}`} style={{background: '#f43f5e'}} onClick={() => changeTheme('rose')} title="Rose"></button>
          <button className={`${styles.themeCircle} ${theme === 'amber' ? styles.activeTheme : ''}`} style={{background: '#f59e0b'}} onClick={() => changeTheme('amber')} title="Amber"></button>
        </div>

        <div className={styles.bgSelector}>
          <button className={`${styles.bgBtn} ${bgMode === 'dark' ? styles.activeBg : ''}`} onClick={() => changeBgMode('dark')}>Dark</button>
          <button className={`${styles.bgBtn} ${bgMode === 'grey' ? styles.activeBg : ''}`} onClick={() => changeBgMode('grey')}>Grey</button>
          <button className={`${styles.bgBtn} ${bgMode === 'light' ? styles.activeBg : ''}`} onClick={() => changeBgMode('light')}>Light</button>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfoRow}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar} aria-hidden>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
            <button
              id="logout-btn"
              className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
              onClick={handleLogout}
              title="Sign out"
            >
              ⊗
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Mobile topbar */}
        <header className={`${styles.mobileHeader} no-print`} id="mobile-header">
          <button
            id="sidebar-toggle"
            className={`btn btn-ghost ${styles.menuBtn}`}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <span className={styles.mobileTitle}>FinanceSnap</span>
          <div />
        </header>

        <main className={styles.main} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
