// src/components/Sidebar/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import logoImg from '@/assets/logo.png';
import './Sidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badgeKey?: string;
  external?: boolean;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Hauptmenü',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
      { id: 'pipeline', label: 'Pipeline', icon: '🎯', path: '/pipeline', badgeKey: 'activeDeals' },
      { id: 'leads', label: 'Leads', icon: '👥', path: '/leads', badgeKey: 'totalLeads' },
      { id: 'documents', label: 'Dokumente', icon: '📄', path: '/documents', badgeKey: undefined },
    ],
  },
  {
    title: 'Kunde',
    items: [
      { id: 'kunde', label: 'Kunde', icon: '🧑‍💼', path: '/kunde' },
      { id: 'archiv', label: 'Archiv', icon: '📦', path: '/archiv' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'whatsapp-web', label: 'WhatsApp Web', icon: '💬', path: 'https://web.whatsapp.com', external: true },
      { id: 'google-drive', label: 'Google Drive', icon: '📁', path: 'https://drive.google.com/drive/folders/1aQ8is6b1cqtlnLwvwQpnzLxCg5Yvlau1', external: true },
    ],
  },
  {
    title: 'Einstellungen',
    items: [
      { id: 'settings', label: 'Einstellungen', icon: '⚙️', path: '/settings' },
    ],
  },
];

const mobileNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: '📊', path: '/' },
  { id: 'pipeline', label: 'Pipeline', icon: '🎯', path: '/pipeline', badgeKey: 'activeDeals' },
  { id: 'leads', label: 'Leads', icon: '👥', path: '/leads', badgeKey: 'totalLeads' },
  { id: 'documents', label: 'Docs', icon: '📄', path: '/documents', badgeKey: undefined },
  { id: 'kunde', label: 'Kunde', icon: '🧑‍💼', path: '/kunde' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const res = await api.get('/stats');
        setBadges({
          activeDeals: res.data.activeDeals || 0,
          totalLeads: res.data.totalLeads || 0,
          totalDocuments: res.data.totalDocuments || 0,
        });
      } catch (err) {
        console.error('[Sidebar] Failed to load badges:', err);
      }
    };
    loadBadges();
    const interval = setInterval(loadBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  const renderNavItem = (item: NavItem) => {
    const badgeValue = item.badgeKey ? badges[item.badgeKey] : undefined;
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <div
          className={`nav-item ${active ? 'active' : ''} ${item.external ? 'nav-item-external' : ''}`}
          onClick={() => handleNavClick(item)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
          {badgeValue !== undefined && badgeValue > 0 && (
            <span className="nav-badge">{badgeValue}</span>
          )}
          {item.external && (
            <span className="nav-external-icon">↗</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar sidebar-desktop">
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logoImg} alt="ImmoKredit" className="logo-img" />
          <div className="logo-text">ImmoKredit</div>
        </div>

        <nav className="nav-menu">
          {navSections.map((section, idx) => (
            <div key={idx} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              {section.items.map(item => renderNavItem(item))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Unbekannt'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Abmelden">
            🚪
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left" onClick={() => navigate('/')}>
          <img src={logoImg} alt="ImmoKredit" className="mobile-logo" />
          <span className="mobile-title">ImmoKredit</span>
        </div>
        <div className="mobile-header-right">
          <div className="mobile-user-avatar" onClick={handleLogout} title="Abmelden">
            {initials}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const badgeValue = item.badgeKey ? badges[item.badgeKey] : undefined;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className="mobile-nav-icon-wrapper">
                <span className="mobile-nav-icon">{item.icon}</span>
                {badgeValue !== undefined && badgeValue > 0 && (
                  <span className="mobile-nav-badge">{badgeValue}</span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};