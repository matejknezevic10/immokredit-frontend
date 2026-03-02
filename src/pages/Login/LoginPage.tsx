// src/pages/Login/LoginPage.tsx
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import logoImg from '@/assets/logo.png';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logoImg} alt="ImmoKredit" className="login-logo-img" />
          <h1 className="login-title">ImmoKredit</h1>
          <p className="login-subtitle">Finanzierungs-Management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@immo-kredit.net"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '⏳ Anmelden...' : '🔐 Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
};