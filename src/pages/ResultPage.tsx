import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, CheckCircle, XCircle, AlertCircle, 
  Clock, Download, Printer, ArrowLeft, Award, Sparkles,
  TrendingUp, BarChart2, BookOpen, Calendar, User, Check, X, Minus
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ExamResult } from '../types';

export const ResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchResult = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/student/results/${resultId}`);
      setResult(response.data);
    } catch (err) {
      showToast('Error retrieving examination results.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast('Preparing printable evaluation card...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const stripQuestionPrefix = (text: string) => {
    if (!text) return '';
    return text.replace(/^(?:q(?:uestion)?\s*\d+[\s.:)\-–—]+|\d+\s*[\.\)]\s+)/i, '').trim();
  };

  const renderFormattedText = (content: string, isQuestionText = false) => {
    if (!content) return null;
    let cleanStr = isQuestionText ? stripQuestionPrefix(content) : content;
    cleanStr = cleanStr
      .replace(/\\r\\n/g, '<br/>')
      .replace(/\r\n/g, '<br/>')
      .replace(/\n/g, '<br/>')
      .replace(/â€"/g, '–')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"');
    
    // Strip redundant outermost quotes if stringified JSON array element
    if (cleanStr.startsWith('"') && cleanStr.endsWith('"') && cleanStr.length > 2) {
      cleanStr = cleanStr.slice(1, -1);
    }

    if (/<[a-z][\s\S]*>/i.test(cleanStr)) {
      return <span dangerouslySetInnerHTML={{ __html: cleanStr }} />;
    }
    return <span>{cleanStr}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '40px', width: '280px', borderRadius: '6px' }}></div>
        <div className="skeleton" style={{ height: '140px', borderRadius: '8px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="skeleton" style={{ height: '160px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ height: '160px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ height: '160px', borderRadius: '8px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '320px', borderRadius: '8px' }}></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px', display: 'inline-block' }} />
        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Assessment Result Not Found</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
          We could not locate an evaluation record matching this identifier. It may have been archived or removed.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/student/dashboard?tab=history')}>
          Back to Assessment History
        </button>
      </div>
    );
  }

  const isPassed = result.status === 'pass';

  // Performance classification styling (Feature 2)
  const category = result.performanceCategory || (result.percentage >= 90 ? 'Exceptional' : result.percentage >= 75 ? 'Good' : result.percentage >= 50 ? 'Average' : 'Needs Improvement');
  const categoryTheme: Record<string, { bg: string; border: string; text: string; badgeBg: string; desc: string }> = {
    'Exceptional': {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: '#10b981',
      text: '#059669',
      badgeBg: '#10b981',
      desc: 'Outstanding subject mastery with exemplary accuracy and problem-solving speed.'
    },
    'Good': {
      bg: 'rgba(59, 130, 246, 0.08)',
      border: '#3b82f6',
      text: '#2563eb',
      badgeBg: '#3b82f6',
      desc: 'Strong competence and understanding with consistent accuracy across sections.'
    },
    'Average': {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: '#f59e0b',
      text: '#d97706',
      badgeBg: '#f59e0b',
      desc: 'Adequate foundational understanding; targeted practice recommended to advance speed.'
    },
    'Needs Improvement': {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: '#ef4444',
      text: '#dc2626',
      badgeBg: '#ef4444',
      desc: 'Significant conceptual review and structured practice required in weaker topic areas.'
    }
  };
  const currentTheme = categoryTheme[category] || categoryTheme['Average'];

  // Total and answered counts
  const totalQuestions = result.detailedQuestions?.length || (result.correctCount + result.wrongCount + result.skippedCount) || 1;
  const attemptedCount = result.correctCount + result.wrongCount;
  const skippedCount = result.skippedCount !== undefined ? result.skippedCount : Math.max(0, totalQuestions - attemptedCount);

  // Correctness Donut Chart Data (Feature 5 & 6 Visual Analytics)
  const accuracyChartData = [
    { name: 'Correct', value: result.correctCount, color: '#10b981' },
    { name: 'Incorrect', value: result.wrongCount, color: '#ef4444' },
    { name: 'Unattempted', value: skippedCount, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // Question-wise timing telemetry (Feature 1 & 6)
  const questionTimingChartData = (result.detailedQuestions || []).map((q, idx) => ({
    name: `Q${idx + 1}`,
    questionNumber: idx + 1,
    timeSeconds: q.timeSpentSeconds || 0,
    isCorrect: q.isCorrect,
    status: q.isCorrect ? 'Correct' : (q.studentOption !== null && q.studentOption !== undefined ? 'Incorrect' : 'Skipped')
  }));

  const activeTimeTotal = result.totalActiveTimeSeconds || result.timeTaken || 0;
  const avgQTime = result.averageQuestionTimeSeconds || (attemptedCount > 0 ? Math.round((activeTimeTotal / attemptedCount) * 10) / 10 : 0);

  const validTimes = (result.detailedQuestions || []).map(q => q.timeSpentSeconds || 0).filter(t => t > 0);
  const longestQTime = result.longestQuestionTime || (validTimes.length > 0 ? Math.max(...validTimes) : 0);
  const shortestQTime = result.shortestQuestionTime || (validTimes.length > 0 ? Math.min(...validTimes) : 0);

  // Helper to test if a student selection matches an option index, text, or letter
  const matchesSelection = (selection: string, oIdx: number, optionText: string, optionsCount: number): boolean => {
    if (!selection && selection !== '0') return false;
    const trimmed = String(selection).trim();
    
    // 1. Direct index match ('0', '1', '2'...)
    if (trimmed === String(oIdx)) return true;

    // 2. Letter match ('A' -> 0, 'B' -> 1, 'C' -> 2, etc.)
    if (trimmed.length === 1) {
      const code = trimmed.toUpperCase().charCodeAt(0);
      if (code >= 65 && code < 65 + Math.max(optionsCount, 26)) {
        if (code - 65 === oIdx) return true;
      }
    }

    // 3. Text match (case-insensitive, trimmed)
    const cleanOption = (optionText || '').trim().toLowerCase();
    const cleanSel = trimmed.toLowerCase();
    if (cleanOption && cleanSel && cleanOption === cleanSel) return true;
    
    // Strip leading "A. ", "1. ", "(a) ", etc.
    const strippedOption = cleanOption.replace(/^(?:[a-z0-9][\.\)\s\-]+|[q\d]+[\.\)\s\-]+)/i, '').trim();
    const strippedSel = cleanSel.replace(/^(?:[a-z0-9][\.\)\s\-]+|[q\d]+[\.\)\s\-]+)/i, '').trim();
    if (strippedOption && strippedSel && strippedOption === strippedSel) return true;

    return false;
  };

  return (
    <div className="report-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* PRINT-SPECIFIC CSS */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            page-break-inside: avoid;
            margin-bottom: 16px !important;
          }
          .report-container {
            width: 100% !important;
            max-width: 100% !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* TOP HEADER CONTROLS (HIDDEN ON PRINT) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate('/student/dashboard?tab=history')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
          >
            <ArrowLeft size={14} /> Back to Attempt History
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Individual Assessment Performance Report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Authoritative evaluation summary, performance classification, and question-wise timing analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Export / Save PDF
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION A: ASSESSMENT INFORMATION                              */}
      {/* ============================================================== */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '24px', margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              SECTION A &bull; ASSESSMENT INFORMATION
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
              {result.examTitle}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {result.subjectName || 'General Aptitude'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge badge-info" style={{ fontSize: '11px' }}>
                Official Examination
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--hover)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-main)' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>
                Submitted: <strong>{new Date(result.submittedAt).toLocaleDateString()}</strong> at {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate & Exam Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--hover)', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Candidate Name</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{result.studentName}</strong>
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--hover)', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Registration / Roll No</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{result.studentRollNo}</strong>
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--hover)', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Questions</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{totalQuestions} Questions</strong>
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--hover)', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Maximum Marks</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{result.totalPoints} Marks</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION B: PERFORMANCE SUMMARY & CLASSIFICATION                */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Card 1: Score & Rank */}
        <div style={{
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow)',
          margin: 0
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.9, textTransform: 'uppercase' }}>
              SECTION B &bull; SCORE SECURED
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '14px 0 6px' }}>
              <span style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1 }}>{result.percentage}%</span>
              <span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.9 }}>({result.score} / {result.totalPoints} pts)</span>
            </div>
            <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
              Calculated based on authoritative server evaluation rules.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Status: <span style={{ backgroundColor: isPassed ? '#10b981' : '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                {result.status?.toUpperCase() || (isPassed ? 'PASS' : 'FAIL')}
              </span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Trophy size={15} /> Candidate Rank: <strong>#{result.rank || 1}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Performance Classification (Feature 2) */}
        <div className="card" style={{
          backgroundColor: currentTheme.bg,
          border: `1.5px solid ${currentTheme.border}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          margin: 0
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: currentTheme.text, textTransform: 'uppercase' }}>
                PERFORMANCE CLASSIFICATION
              </span>
              <span style={{
                backgroundColor: currentTheme.badgeBg,
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {category}
              </span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: currentTheme.text, margin: '0 0 8px' }}>
              {category}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
              {currentTheme.desc}
            </p>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            Institutional benchmark categorized according to configured evaluation criteria.
          </div>
        </div>

        {/* Card 3: Evaluation Breakdown */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              EVALUATION BREAKDOWN
            </span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ textAlign: 'center', padding: '12px 6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid #10b981' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#059669', display: 'block' }}>{result.correctCount}</span>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Correct</span>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626', display: 'block' }}>{result.wrongCount}</span>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>Incorrect</span>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 6px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-muted)', display: 'block' }}>{skippedCount}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Unattempted</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Attempt rate: <strong>{Math.round((attemptedCount / Math.max(1, totalQuestions)) * 100)}%</strong> ({attemptedCount} of {totalQuestions} answered)
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SECTION C: VISUAL ANALYTICS & TIME MANAGEMENT                  */}
      {/* ============================================================== */}
      <div className="card" style={{ padding: '24px', margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
              SECTION C &bull; VISUAL ANALYTICS & TIME MANAGEMENT
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0' }}>
              Accuracy & Question-Wise Active Time Analytics
            </h3>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Active timing telemetry recorded per question during the assessment
          </span>
        </div>

        {/* Feature 1: Timing KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Active Duration</span>
            <strong style={{ fontSize: '20px', color: 'var(--text-main)' }}>
              {Math.floor(activeTimeTotal / 60)}m {activeTimeTotal % 60}s
            </strong>
          </div>
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Average Time / Question</span>
            <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>
              {avgQTime}s <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>({Math.round((avgQTime / 60) * 10) / 10} min)</span>
            </strong>
          </div>
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Longest Solving Time</span>
            <strong style={{ fontSize: '20px', color: '#ea580c' }}>
              {longestQTime}s
            </strong>
          </div>
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Shortest Solving Time</span>
            <strong style={{ fontSize: '20px', color: '#10b981' }}>
              {shortestQTime}s
            </strong>
          </div>
        </div>

        {/* 2-Column Responsive Visual Analytics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
          
          {/* Accuracy Donut Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Accuracy & Response Distribution
            </span>
            <div style={{ width: '100%', height: '200px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accuracyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {accuracyChartData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [`${value} Question(s)`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', display: 'block', lineHeight: 1 }}>
                  {result.percentage}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Accuracy
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                Correct ({result.correctCount})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                Incorrect ({result.wrongCount})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                Unattempted ({skippedCount})
              </span>
            </div>
          </div>

          {/* Question Timing Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', backgroundColor: 'var(--hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Active Time Spent Per Question (Seconds)
            </span>
            <div style={{ width: '100%', height: '200px' }}>
              {questionTimingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionTimingChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} unit="s" />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [`${val}s (${item.payload.status})`, 'Time Spent']}
                      labelFormatter={(lbl: any) => `Question ${lbl}`}
                    />
                    <Bar dataKey="timeSeconds" name="Time (seconds)" radius={[4, 4, 0, 0]}>
                      {questionTimingChartData.map((entry, index) => {
                        const barColor = entry.isCorrect ? '#10b981' : (entry.timeSeconds > 0 ? '#3b82f6' : '#94a3b8');
                        return <Cell key={`bar-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No timing telemetry recorded for this assessment.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10b981' }}></span> Correct
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#3b82f6' }}></span> Attempted
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#94a3b8' }}></span> Unvisited
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION D: QUESTION ANALYSIS & REVIEW                          */}
      {/* ============================================================== */}
      <div className="card" style={{ padding: '24px', margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase' }}>
              SECTION D &bull; QUESTION ANALYSIS
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0' }}>
              Detailed Solutions & Time Spent
            </h3>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Comparing candidate submitted response, authoritative solution, and active solving duration
          </span>
        </div>

        {result.detailedQuestions && result.detailedQuestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.detailedQuestions.map((q, idx) => {
              const studentOptRaw = Array.isArray(q.studentOption)
                ? q.studentOption.map(String)
                : (q.studentOption !== null && q.studentOption !== undefined ? [String(q.studentOption)] : []);
              
              const correctOptRaw = Array.isArray(q.correctAnswer)
                ? q.correctAnswer.map(String)
                : (q.correctAnswer !== null && q.correctAnswer !== undefined ? [String(q.correctAnswer)] : []);

              const isSkipped = studentOptRaw.length === 0;
              const timeSpentSec = q.timeSpentSeconds || 0;
              const optionsCount = q.options?.length || 0;

              const marksAwarded = typeof q.marksAwarded === 'number'
                ? q.marksAwarded
                : (q.isCorrect ? (q.points || 1) : 0);

              const cardBorder = isSkipped 
                ? 'var(--border)' 
                : (q.isCorrect ? '#10b981' : '#ef4444');
              const cardBg = isSkipped 
                ? 'var(--bg-card)' 
                : (q.isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)');

              return (
                <div key={q.id || idx} style={{
                  padding: '20px',
                  borderRadius: 'var(--radius)',
                  border: `1.5px solid ${cardBorder}`,
                  backgroundColor: cardBg,
                  transition: 'var(--transition)'
                }}>
                  {/* Question Header Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                        Question {q.questionNumber || idx + 1}
                      </span>
                      <span className={`badge ${q.type === 'mcq' ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                        {q.type}
                      </span>
                      {timeSpentSec > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--hover)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Clock size={12} /> {timeSpentSec}s active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${isSkipped ? 'badge-secondary' : (q.isCorrect ? 'badge-success' : 'badge-danger')}`} style={{ fontSize: '12px' }}>
                        {isSkipped ? 'Unattempted' : (q.isCorrect ? 'Correct' : 'Incorrect')}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: marksAwarded > 0 ? '#10b981' : (marksAwarded < 0 ? '#ef4444' : 'var(--text-muted)')
                      }}>
                        {marksAwarded > 0 ? `+${marksAwarded}` : marksAwarded} Marks
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.6' }}>
                    {renderFormattedText(q.text, true)}
                  </div>

                  {/* Options List */}
                  {q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((optText, oIdx) => {
                        const cleanOptText = (optText || '').trim();

                        // Exact index, letter, or text matching
                        const isStudentChoice = studentOptRaw.some(s => matchesSelection(s, oIdx, cleanOptText, optionsCount));
                        const isCorrectOpt = correctOptRaw.some(c => matchesSelection(c, oIdx, cleanOptText, optionsCount));

                        let optionBg = 'var(--bg-card)';
                        let optionBorder = 'var(--border)';
                        let badgeText = '';
                        let badgeColor = '';
                        let badgeBg = '';

                        if (isStudentChoice && isCorrectOpt) {
                          optionBg = 'rgba(16, 185, 129, 0.12)';
                          optionBorder = '#10b981';
                          badgeText = 'Candidate Choice (Correct)';
                          badgeColor = '#065f46';
                          badgeBg = '#a7f3d0';
                        } else if (isStudentChoice && !isCorrectOpt) {
                          optionBg = 'rgba(239, 68, 68, 0.12)';
                          optionBorder = '#ef4444';
                          badgeText = 'Candidate Choice (Incorrect)';
                          badgeColor = '#991b1b';
                          badgeBg = '#fecaca';
                        } else if (isCorrectOpt) {
                          optionBg = 'rgba(59, 130, 246, 0.1)';
                          optionBorder = '#3b82f6';
                          badgeText = 'Correct Answer';
                          badgeColor = '#1e40af';
                          badgeBg = '#bfdbfe';
                        }

                        return (
                          <div key={oIdx} style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: `1.5px solid ${optionBorder}`,
                            backgroundColor: optionBg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '11px',
                                flexShrink: 0,
                                marginTop: '1px',
                                backgroundColor: isCorrectOpt ? '#10b981' : (isStudentChoice ? '#ef4444' : 'var(--border)'),
                                color: (isCorrectOpt || isStudentChoice) ? '#ffffff' : 'var(--text-main)'
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span style={{ fontWeight: (isStudentChoice || isCorrectOpt) ? 600 : 400, lineHeight: 1.5 }}>
                                {renderFormattedText(optText)}
                              </span>
                            </div>

                            {badgeText && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: badgeColor,
                                backgroundColor: badgeBg,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: 'var(--hover)', fontSize: '13px' }}>
                      <strong>Submitted Response:</strong> {q.studentOption || 'No response recorded by candidate.'}
                    </div>
                  )}

                  {isSkipped && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Question was skipped / left unattempted during the exam.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No question-level review logs available for this assessment.
          </div>
        )}
      </div>

    </div>
  );
};
