'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, TrendingUp } from 'lucide-react';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { api } from '@/lib/api';
import { PricePoint } from '@/types';
import toast from 'react-hot-toast';

interface PriceAlertPanelProps {
  simulationId: string;
  initialEnabled: boolean;
  initialThreshold: number;
}

const THRESHOLDS = [5, 10, 15, 20];

export default function PriceAlertPanel({ simulationId, initialEnabled, initialThreshold }: PriceAlertPanelProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { history } = await api.getPriceHistory(simulationId);
        setHistory(history);
      } catch {
        // silent
      }
    })();
  }, [simulationId]);

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      await api.updatePriceAlert(simulationId, { enabled: !enabled, threshold });
      setEnabled(!enabled);
      toast.success(!enabled ? 'Alertes activées' : 'Alertes désactivées');
    } catch {
      toast.error('Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThresholdChange = async (t: number) => {
    setThreshold(t);
    if (!enabled) return;
    try {
      await api.updatePriceAlert(simulationId, { enabled: true, threshold: t });
      toast.success(`Seuil mis à jour : ${t}%`);
    } catch {
      toast.error('Erreur');
    }
  };

  // Chart dimensions
  const width = 500;
  const height = 120;
  const padding = 24;
  const validHistory = history.filter((h) => typeof h.total === 'number');
  const hasChart = validHistory.length >= 2;

  let points = '';
  let minV = 0, maxV = 0;
  if (hasChart) {
    const values = validHistory.map((h) => h.total);
    minV = Math.min(...values);
    maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    points = validHistory
      .map((h, i) => {
        const x = padding + (i / (validHistory.length - 1)) * innerW;
        const y = padding + innerH - ((h.total - minV) / range) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  }

  const lastPoint = validHistory[validHistory.length - 1];
  const firstPoint = validHistory[0];
  const diff = hasChart ? lastPoint.total - firstPoint.total : 0;
  const diffPercent = hasChart && firstPoint.total > 0 ? Math.round((diff / firstPoint.total) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gray-200'} text-white`}>
            {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Alertes de prix</h4>
            <p className="text-xs text-gray-500">Recevez un email quand les prix changent</p>
          </div>
        </div>
        <Button variant={enabled ? 'primary' : 'outline'} size="sm" onClick={handleToggle} disabled={isSaving}>
          {enabled ? 'Activées' : 'Désactiver'}
        </Button>
      </div>

      {enabled && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Me notifier si le prix change de plus de :</p>
          <div className="flex gap-2">
            {THRESHOLDS.map((t) => (
              <button
                key={t}
                onClick={() => handleThresholdChange(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  threshold === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History chart */}
      {hasChart ? (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-semibold text-gray-700">Historique des prix ({validHistory.length} points)</span>
            </div>
            <span className={`text-xs font-bold ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {diff > 0 ? '+' : ''}{Math.round(diff)}€ ({diffPercent > 0 ? '+' : ''}{diffPercent}%)
            </span>
          </div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              points={points}
              strokeLinejoin="round"
            />
            <polygon
              fill="url(#priceGradient)"
              points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            />
            {validHistory.map((h, i) => {
              const x = padding + (i / (validHistory.length - 1)) * (width - padding * 2);
              const range = maxV - minV || 1;
              const y = padding + (height - padding * 2) - ((h.total - minV) / range) * (height - padding * 2);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="3" fill="#4f46e5" />
                  {(i === 0 || i === validHistory.length - 1) && (
                    <text x={x} y={y - 8} fontSize="9" fill="#4f46e5" textAnchor="middle" fontWeight="600">
                      {Math.round(h.total)}€
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{new Date(firstPoint.checkedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            <span>{new Date(lastPoint.checkedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic text-center py-4">
          L&apos;historique des prix apparaîtra après les premiers contrôles automatiques.
        </p>
      )}
    </Card>
  );
}
