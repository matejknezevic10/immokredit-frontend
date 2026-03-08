// src/pages/Settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import './SettingsPage.css';

type TabKey = 'profile' | 'notifications' | 'team';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AVATAR_COLORS = ['#1a4d8f', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profil', icon: '👤' },
    { key: 'notifications', label: 'Benachrichtigungen', icon: '🔔' },
    { key: 'team', label: 'Team', icon: '👥' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Einstellungen</h1>
        <p className="settings-subtitle">Verwalte dein Profil, Benachrichtigungen und Team</p>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="settings-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'team' && <TeamTab />}
    </div>
  );
};

// ──────────────────────────────────────────────
// Profile Tab
// ──────────────────────────────────────────────
function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/profile', { name: name.trim() });
      toast.success('Profil gespeichert');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Neues Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Passwort geändert');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Ändern des Passworts');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <>
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">Persönliche Daten</h3>
            <p className="settings-section-desc">Dein Name und deine E-Mail-Adresse</p>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-field">
            <label className="settings-label">Name</label>
            <input
              className="settings-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dein Name"
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">E-Mail</label>
            <input
              className="settings-input"
              type="email"
              value={email}
              disabled
            />
            <p className="settings-input-hint">E-Mail kann nicht geändert werden</p>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-field">
            <label className="settings-label">Rolle</label>
            <input
              className="settings-input"
              type="text"
              value={user?.role === 'admin' ? 'Administrator' : 'Benutzer'}
              disabled
            />
          </div>
          <div className="settings-field" />
        </div>
        <button
          className="settings-btn settings-btn-primary"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? '⏳ Speichern...' : '💾 Profil speichern'}
        </button>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">Passwort ändern</h3>
            <p className="settings-section-desc">Aktualisiere dein Passwort für mehr Sicherheit</p>
          </div>
        </div>
        <div className="settings-password-section">
          <div className="settings-row">
            <div className="settings-field">
              <label className="settings-label">Aktuelles Passwort</label>
              <input
                className="settings-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="settings-field" />
          </div>
          <div className="settings-row">
            <div className="settings-field">
              <label className="settings-label">Neues Passwort</label>
              <input
                className="settings-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Passwort bestätigen</label>
              <input
                className="settings-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
              />
            </div>
          </div>
        </div>
        <button
          className="settings-btn settings-btn-secondary"
          onClick={handleChangePassword}
          disabled={changingPw}
        >
          {changingPw ? '⏳ Ändern...' : '🔒 Passwort ändern'}
        </button>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Notifications Tab
// ──────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailNewLead: true,
    emailDocUploaded: true,
    emailDealStageChange: true,
    emailWeeklyReport: false,
    pushNewLead: false,
    pushDocProcessed: true,
    pushDealMoved: true,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/notification-prefs', prefs);
      toast.success('Benachrichtigungen gespeichert');
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="settings-toggle-slider" />
    </label>
  );

  return (
    <>
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">E-Mail Benachrichtigungen</h3>
            <p className="settings-section-desc">Welche E-Mails möchtest du erhalten?</p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Neuer Lead</div>
            <div className="settings-toggle-desc">Benachrichtigung wenn ein neuer Lead eingeht</div>
          </div>
          <Toggle checked={prefs.emailNewLead} onChange={() => toggle('emailNewLead')} />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Dokument hochgeladen</div>
            <div className="settings-toggle-desc">Wenn ein neues Dokument per Email eingeht</div>
          </div>
          <Toggle checked={prefs.emailDocUploaded} onChange={() => toggle('emailDocUploaded')} />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Deal-Status Änderung</div>
            <div className="settings-toggle-desc">Wenn ein Deal in eine neue Phase verschoben wird</div>
          </div>
          <Toggle checked={prefs.emailDealStageChange} onChange={() => toggle('emailDealStageChange')} />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Wöchentlicher Report</div>
            <div className="settings-toggle-desc">Zusammenfassung der Woche jeden Montag</div>
          </div>
          <Toggle checked={prefs.emailWeeklyReport} onChange={() => toggle('emailWeeklyReport')} />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">Push-Benachrichtigungen</h3>
            <p className="settings-section-desc">Echtzeit-Benachrichtigungen im Browser</p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Neuer Lead</div>
            <div className="settings-toggle-desc">Push-Nachricht bei neuem Lead</div>
          </div>
          <Toggle checked={prefs.pushNewLead} onChange={() => toggle('pushNewLead')} />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Dokument verarbeitet</div>
            <div className="settings-toggle-desc">Wenn OCR-Verarbeitung abgeschlossen ist</div>
          </div>
          <Toggle checked={prefs.pushDocProcessed} onChange={() => toggle('pushDocProcessed')} />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <div className="settings-toggle-label">Deal verschoben</div>
            <div className="settings-toggle-desc">Wenn ein Deal in der Pipeline verschoben wird</div>
          </div>
          <Toggle checked={prefs.pushDealMoved} onChange={() => toggle('pushDealMoved')} />
        </div>
      </div>

      <button
        className="settings-btn settings-btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '⏳ Speichern...' : '💾 Einstellungen speichern'}
      </button>
    </>
  );
}

// ──────────────────────────────────────────────
// Team Tab
// ──────────────────────────────────────────────
function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const res = await api.get('/auth/team');
      setMembers(res.data.members || res.data || []);
    } catch {
      // If endpoint doesn't exist yet, show placeholder
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">Team-Mitglieder</h3>
            <p className="settings-section-desc">
              {members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'} im Team
            </p>
          </div>
        </div>

        <div className="settings-info-box">
          <span className="settings-info-icon">ℹ️</span>
          <span>Team-Mitglieder werden vom Administrator verwaltet. Kontaktiere deinen Admin, um neue Mitglieder hinzuzufügen.</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            Lade Team...
          </div>
        ) : members.length > 0 ? (
          members.map((member, i) => (
            <div key={member.id} className="team-member-card">
              <div
                className="team-avatar"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {getInitials(member.name)}
              </div>
              <div className="team-member-info">
                <div className="team-member-name">{member.name}</div>
                <div className="team-member-email">{member.email}</div>
              </div>
              <span className={`team-member-role ${member.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                {member.role === 'admin' ? 'Admin' : 'Benutzer'}
              </span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <p>Noch keine Team-Daten verfügbar</p>
            <p style={{ fontSize: 12 }}>Das Team-Endpoint wird noch konfiguriert</p>
          </div>
        )}
      </div>
    </>
  );
}
