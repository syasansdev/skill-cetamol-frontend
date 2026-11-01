import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, CheckCircle2, AlertTriangle, RefreshCw, 
  Save, AlertCircle, Info, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ThresholdItem {
  id?: string;
  category: 'Exceptional' | 'Good' | 'Average' | 'Needs Improvement';
  minScore: number;
  maxScore: number;
  color?: string;
  description?: string;
}

export const PerformanceThresholdConfig: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState<boolean>(false);

  const [thresholds, setThresholds] = useState<ThresholdItem[]>([
    { category: 'Exceptional', minScore: 90, maxScore: 100, color: '#10b981', description: 'Outstanding mastery of subject matter' },
    { category: 'Good', minScore: 75, maxScore: 89.99, color: '#3b82f6', description: 'Strong understanding with minor areas for review' },
    { category: 'Average', minScore: 50, maxScore: 74.99, color: '#f59e0b', description: 'Basic competence; additional reinforcement recommended' },
    { category: 'Needs Improvement', minScore: 0, maxScore: 49.99, color: '#f43f5e', description: 'Requires targeted academic remediation and practice' }
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/thresholds');
      if (res.data && res.data.length === 4) {
        // Sort order: Exceptional, Good, Average, Needs Improvement
        const order = ['Exceptional', 'Good', 'Average', 'Needs Improvement'];
        const sorted = [...res.data].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
        setThresholds(sorted);
      }
    } catch (err: any) {
      console.error('Failed to load performance thresholds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  // Validate Boundaries in real time
  useEffect(() => {
    validateBoundaries(thresholds);
  }, [thresholds]);

  const validateBoundaries = (list: ThresholdItem[]): boolean => {
    // Sort ascending by minScore
    const sorted = [...list].sort((a, b) => a.minScore - b.minScore);

    // Check lowest and highest bounds
    if (sorted[0].minScore !== 0) {
      setValidationError(`Lowest category must start at 0% (currently starts at ${sorted[0].minScore}%).`);
      return false;
    }

    if (sorted[sorted.length - 1].maxScore !== 100) {
      setValidationError(`Highest category must end at 100% (currently ends at ${sorted[sorted.length - 1].maxScore}%).`);
      return false;
    }

    // Check overlaps and gaps
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.maxScore >= next.minScore) {
        setValidationError(`Boundary overlap detected between "${current.category}" (max ${current.maxScore}%) and "${next.category}" (min ${next.minScore}%).`);
        return false;
      }

      // If gap is greater than 0.02%, alert
      if (Math.abs(next.minScore - current.maxScore) > 0.02) {
        setValidationError(`Boundary gap detected between "${current.category}" (max ${current.maxScore}%) and "${next.category}" (min ${next.minScore}%).`);
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleScoreChange = (index: number, field: 'minScore' | 'maxScore', value: number) => {
    setThresholds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveThresholds = async () => {
    if (!validateBoundaries(thresholds)) {
      showToast(validationError || 'Invalid boundary configuration', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/thresholds', { thresholds });
      showToast('Performance classification thresholds saved successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save thresholds', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateHistorical = async () => {
    setRecalculating(true);
    try {
      const res = await api.post('/admin/thresholds/recalculate');
      showToast(res.data.message || 'All historical results recalculated successfully', 'success');
      setShowRecalculateModal(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to recalculate historical results', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg font-bold" style={{ margin: 0 }}>
              Performance Classification Policy & Threshold Configuration
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure authoritative percentage-based score tiers. Automated evaluation classifies candidates into these 4 tiers immediately upon assessment submission.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecalculateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            Recalculate Past Results
          </button>
          <button
            onClick={handleSaveThresholds}
            disabled={saving || !!validationError}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span><strong>Boundary Validation Error:</strong> {validationError}</span>
        </div>
      )}

      {/* Thresholds Table */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {thresholds.map((t, idx) => (
            <div 
              key={t.category} 
              className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 relative overflow-hidden"
              style={{ borderTop: `4px solid ${t.color || '#3b82f6'}` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{t.category}</span>
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: t.color || '#3b82f6' }} 
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Minimum Score (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={t.minScore}
                    onChange={(e) => handleScoreChange(idx, 'minScore', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-medium rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Maximum Score (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={t.maxScore}
                    onChange={(e) => handleScoreChange(idx, 'maxScore', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-medium rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                {t.description || 'Applies to test scores in this percentage range.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controlled Recalculation Confirmation Modal */}
      {showRecalculateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              Recalculate Historical Results?
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This controlled recalculation policy will iterate through all existing historical student examination submissions and update their assigned performance classification to match the current threshold boundaries.
            </p>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-400">
              <strong>Notice:</strong> This action is safe and will not alter raw marks, question answers, or timing records. Only the derived performance category badge is re-evaluated.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRecalculateModal(false)}
                disabled={recalculating}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecalculateHistorical}
                disabled={recalculating}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {recalculating ? 'Recalculating...' : 'Confirm Recalculation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

