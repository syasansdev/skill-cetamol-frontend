import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, AlertTriangle, RotateCcw, Info } from 'lucide-react';

export interface GradingThresholdItem {
  category: 'Outstanding' | 'Proficient' | 'Competent' | 'Developing' | 'Needs Improvement';
  minScore: number;
  maxScore: number;
  color: string;
  emoji: string;
  description: string;
}

export const DEFAULT_GRADING_TIERS: GradingThresholdItem[] = [
  {
    category: 'Outstanding',
    minScore: 90,
    maxScore: 100,
    color: '#10b981',
    emoji: '🌟',
    description: 'Outstanding mastery of the subject matter with exemplary accuracy.'
  },
  {
    category: 'Proficient',
    minScore: 75,
    maxScore: 89.99,
    color: '#3b82f6',
    emoji: '🎯',
    description: 'Strong competence and understanding with consistent accuracy.'
  },
  {
    category: 'Competent',
    minScore: 60,
    maxScore: 74.99,
    color: '#06b6d4',
    emoji: '✅',
    description: 'Sound grasp of foundational concepts, demonstrating practical competence.'
  },
  {
    category: 'Developing',
    minScore: 40,
    maxScore: 59.99,
    color: '#f59e0b',
    emoji: '📈',
    description: 'Developing foundational skills; additional practice recommended.'
  },
  {
    category: 'Needs Improvement',
    minScore: 0,
    maxScore: 39.99,
    color: '#ef4444',
    emoji: '⚠️',
    description: 'Requires targeted academic remediation and practice.'
  }
];

export const GRADE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; border: string; desc: string }> = {
  'Outstanding': {
    label: 'Outstanding',
    emoji: '🌟',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: '#10b981',
    desc: 'Outstanding subject mastery with exemplary accuracy and problem-solving speed.'
  },
  'Proficient': {
    label: 'Proficient',
    emoji: '🎯',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: '#3b82f6',
    desc: 'Strong competence and understanding with consistent accuracy across sections.'
  },
  'Competent': {
    label: 'Competent',
    emoji: '✅',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: '#06b6d4',
    desc: 'Sound grasp of foundational concepts, demonstrating practical competence.'
  },
  'Developing': {
    label: 'Developing',
    emoji: '📈',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    desc: 'Developing proficiency; targeted practice recommended to reinforce weak spots.'
  },
  'Needs Improvement': {
    label: 'Needs Improvement',
    emoji: '⚠️',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    desc: 'Significant conceptual review and structured academic remediation required.'
  },
  // Backward compatibility:
  'Exceptional': {
    label: 'Outstanding',
    emoji: '🌟',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: '#10b981',
    desc: 'Outstanding subject mastery with exemplary accuracy and problem-solving speed.'
  },
  'Good': {
    label: 'Proficient',
    emoji: '🎯',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: '#3b82f6',
    desc: 'Strong competence and understanding with consistent accuracy across sections.'
  },
  'Average': {
    label: 'Competent',
    emoji: '✅',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: '#06b6d4',
    desc: 'Sound grasp of foundational concepts, demonstrating practical competence.'
  }
};

interface Props {
  value: GradingThresholdItem[];
  onChange: (tiers: GradingThresholdItem[]) => void;
  title?: string;
  description?: string;
}

export const ExamGradingThresholdEditor: React.FC<Props> = ({
  value,
  onChange,
  title = "Performance Grading Policy & Score Thresholds",
  description = "Configure score percentage thresholds for candidate evaluation. Students will receive these grades upon submission."
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleUpdate = (index: number, field: 'minScore' | 'maxScore', val: number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleResetToDefaults = () => {
    onChange(DEFAULT_GRADING_TIERS);
  };

  return (
    <div className="card" style={{ padding: '18px 20px', margin: '0 0 16px 0', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '14px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              {title}
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {description}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetToDefaults}
            style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Reset to official benchmark defaults"
          >
            <RotateCcw size={12} /> Reset Defaults
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            {isExpanded ? 'Collapse ▲' : 'Customize Tiers ▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {value.map((tier, idx) => (
            <div
              key={tier.category}
              style={{
                backgroundColor: 'var(--bg-app)',
                border: `1.5px solid ${tier.color}30`,
                borderTop: `3px solid ${tier.color}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{tier.emoji}</span> {tier.category}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tier.color }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Min %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="form-control"
                    style={{ fontSize: '12px', padding: '4px 6px', height: '30px', textAlign: 'center', fontWeight: 600 }}
                    value={tier.minScore}
                    onChange={(e) => handleUpdate(idx, 'minScore', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Max %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="form-control"
                    style={{ fontSize: '12px', padding: '4px 6px', height: '30px', textAlign: 'center', fontWeight: 600 }}
                    value={tier.maxScore}
                    onChange={(e) => handleUpdate(idx, 'maxScore', Number(e.target.value))}
                  />
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PerformanceThresholdConfig = ExamGradingThresholdEditor;
export default ExamGradingThresholdEditor;
