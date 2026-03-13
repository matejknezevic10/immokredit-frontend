// src/pages/Statistik/StatistikPage.tsx
import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import './StatistikPage.css';

interface StatistikData {
  summary: {
    totalLeads: number;
    totalKunden: number;
    totalGesamt: number;
    konversionsrate: number;
  };
  charts: {
    monatlich: { month: string; leads: number; kunden: number }[];
    sourceVerteilung: { name: string; value: number }[];
    ampelVerteilung: { name: string; value: number; color: string }[];
    temperaturVerteilung: { name: string; value: number; color: string }[];
    zustaendigVerteilung: { name: string; value: number }[];
    stageVerteilung: { name: string; value: number }[];
  };
  excelData: Record<string, any>[];
}

const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed'];
const ZUSTAENDIG_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STAGE_LABELS: Record<string, string> = {
  NEUER_LEAD: 'Neuer Lead',
  QUALIFIZIERT: 'Qualifiziert',
  UNTERLAGEN_SAMMELN: 'Unterlagen sammeln',
  UNTERLAGEN_VOLLSTAENDIG: 'Unterlagen vollst.',
  BANK_ANFRAGE: 'Bank-Anfrage',
  WARTEN_AUF_ZUSAGE: 'Warten auf Zusage',
  ZUSAGE_ERHALTEN: 'Zusage erhalten',
  ABGESCHLOSSEN: 'Abgeschlossen',
  VERLOREN: 'Verloren',
};

export const StatistikPage: React.FC = () => {
  const [data, setData] = useState<StatistikData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/stats/lead-statistik');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load statistik:', err);
      toast.error('Statistik konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    if (!data?.excelData?.length) return;
    const ws = XLSX.utils.json_to_sheet(data.excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lead-Statistik');
    XLSX.writeFile(wb, `Lead-Statistik_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel-Export heruntergeladen');
  };

  if (loading) {
    return (
      <div className="statistik-page">
        <div className="statistik-loading">Lade Statistiken...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="statistik-page">
        <div className="statistik-loading">Keine Daten verfügbar</div>
      </div>
    );
  }

  const { summary, charts } = data;

  return (
    <div className="statistik-page">
      <div className="statistik-header">
        <div>
          <h1 className="statistik-title">Lead-Statistik</h1>
          <p className="statistik-subtitle">Übersicht aller Leads & Eigenkunden</p>
        </div>
        <button className="statistik-export-btn" onClick={handleExcelExport}>
          📥 Excel Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="statistik-summary">
        <div className="stat-card">
          <div className="stat-card-value">{summary.totalGesamt}</div>
          <div className="stat-card-label">Gesamt</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.totalLeads}</div>
          <div className="stat-card-label">Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.totalKunden}</div>
          <div className="stat-card-label">Eigenkunden</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-value">{summary.konversionsrate}%</div>
          <div className="stat-card-label">Konversionsrate</div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="statistik-chart-card full-width">
        <h3 className="chart-title">Leads & Kunden pro Monat</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.monatlich} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="leads" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kunden" name="Eigenkunden" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts Row */}
      <div className="statistik-charts-row">
        {/* Source Distribution */}
        <div className="statistik-chart-card">
          <h3 className="chart-title">Quelle</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.sourceVerteilung}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }: any) => `${name} (${value})`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {charts.sourceVerteilung.map((_, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ampel Distribution */}
        <div className="statistik-chart-card">
          <h3 className="chart-title">Ampel-Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.ampelVerteilung}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }: any) => `${name} (${value})`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {charts.ampelVerteilung.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Temperatur Distribution */}
        <div className="statistik-chart-card">
          <h3 className="chart-title">Temperatur</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.temperaturVerteilung}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }: any) => `${name} (${value})`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {charts.temperaturVerteilung.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zuständiger + Stage Row */}
      <div className="statistik-charts-row">
        {/* Zuständiger */}
        <div className="statistik-chart-card">
          <h3 className="chart-title">Zuständiger</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.zustaendigVerteilung} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
                {charts.zustaendigVerteilung.map((_, i) => (
                  <Cell key={i} fill={ZUSTAENDIG_COLORS[i % ZUSTAENDIG_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deal-Stage */}
        {charts.stageVerteilung.length > 0 && (
          <div className="statistik-chart-card">
            <h3 className="chart-title">Deal-Pipeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={charts.stageVerteilung.map(s => ({ ...s, name: STAGE_LABELS[s.name] || s.name }))}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="value" name="Deals" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
