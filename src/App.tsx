// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { PipelinePage } from './pages/Pipeline/PipelinePage';
import { LoginPage } from './pages/Login/LoginPage';
import { JeffreyChat } from './components/Chat/JeffreyChat';
import DocumentsPage from './pages/Documents/DocumentsPage';
import {
  KundePage,
  KundeDetailPage,
  KundePersonPage,
  KundeHaushaltPage,
  KundeFinanzplanPage,
  KundeObjektPage,
} from './pages/Kunde';
import logoImg from './assets/logo.png';
import './styles/global.css';
import './styles/mobile.css';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#94a3b8',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logoImg} alt="ImmoKredit" style={{ width: 80, marginBottom: 16 }} />
          <div>Lade ImmoKredit...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/kunde" element={<KundePage />} />
            <Route path="/kunde/:leadId" element={<KundeDetailPage />} />
            <Route path="/kunde/:leadId/person" element={<KundePersonPage />} />
            <Route path="/kunde/:leadId/haushalt" element={<KundeHaushaltPage />} />
            <Route path="/kunde/:leadId/finanzplan" element={<KundeFinanzplanPage />} />
            <Route path="/kunde/:leadId/objekt" element={<KundeObjektPage />} />
            <Route path="/settings" element={<ComingSoon title="Einstellungen" />} />
            <Route path="/mails" element={<ComingSoon title="Mails" />} />
          </Routes>
        </main>
        <JeffreyChat />
      </div>
    </Router>
  );
}

const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="coming-soon">
      <div className="coming-soon-icon">🚧</div>
      <h1 className="coming-soon-title">{title}</h1>
      <p className="coming-soon-text">Diese Seite wird gerade entwickelt...</p>
    </div>
  );
};

export default App;