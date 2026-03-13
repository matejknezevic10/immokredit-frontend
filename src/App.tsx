// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { PipelinePage } from './pages/Pipeline/PipelinePage';
import { LoginPage } from './pages/Login/LoginPage';
import { JeffreyChat } from './components/Chat/JeffreyChat';
import DocumentsPage from './pages/Documents/DocumentsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import {
  KundePage,
  KundeDetailPage,
  KundePersonPage,
  KundeHaushaltPage,
  KundeFinanzplanPage,
  KundeObjektPage,
} from './pages/Kunde';
import { ArchivPage } from './pages/Archiv/ArchivPage';
import { StatistikPage } from './pages/Statistik/StatistikPage';
import { SecureDownloadPage } from './pages/SecureDownload/SecureDownloadPage';
import { PublicSignaturePage } from './pages/PublicSignaturePage';
import logoImg from './assets/logo.png';
import './styles/global.css';
import './styles/mobile.css';
import './App.css';

// Inner component that handles auth-gated vs public routes
function AppRoutes() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Public routes — no auth required
  if (location.pathname.startsWith('/secure-download') || location.pathname.startsWith('/sign/')) {
    return (
      <Routes>
        <Route path="/secure-download/:accessToken" element={<SecureDownloadPage />} />
        <Route path="/sign/:token" element={<PublicSignaturePage />} />
      </Routes>
    );
  }

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
          <Route path="/archiv" element={<ArchivPage />} />
          <Route path="/statistik" element={<StatistikPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <JeffreyChat />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
            iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
          },
          error: {
            style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
            iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            duration: 5000,
          },
        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;