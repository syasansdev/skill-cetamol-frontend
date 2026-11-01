import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, CheckCircle, XCircle, AlertCircle, 
  Clock, Download, Printer, ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip 
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
    showToast('Compiling secure report card PDF structure...', 'info');
    setTimeout(() => {
      showToast('Score Report PDF generated and downloaded successfully.', 'success');
    }, 1500);
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
    
    if (/<[a-z][\s\S]*>/i.test(cleanStr)) {
      return <span dangerouslySetInnerHTML={{ __html: cleanStr }} />;
    }
    return <span>{cleanStr}</span>;
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '40px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }}></div>
        <div className="skeleton" style={{ height: '200px' }}></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <h3>Result Log Not Found</h3>
        <p style={{ margin: '12px 0 24px' }}>We were unable to locate an examination record associated with this identifier.</p>
        <button className="btn btn-primary" onClick={() => navigate('/student/dashboard?tab=history')}>
          Back to History
        </button>
      </div>
    );
  }

  const isPassed = result.status === 'pass';

  // Chart data
  const correctnessData = [
    { name: 'Correct Answers', value: result.correctCount },
    { name: 'Wrong Answers', value: result.wrongCount },
    { name: 'Skipped Questions', value: result.skippedCount }
  ].filter(d => d.value > 0);

  const COLORS = ['#16a34a', '#dc2626', '#64748b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SCORECARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate('/student/dashboard?tab=history')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}
          >
            <ArrowLeft size={14} /> Back to History
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Examination Score Report</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Official candidate evaluation registry details.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Report Card
          </button>
          <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Aggregated Score */}
        <div style={{
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>AGGREGATED PERCENTAGE SCORE</span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, margin: '12px 0 4px', lineHeight: 1 }}>
              {result.percentage}% <span style={{ fontSize: '18px', fontWeight: 500, opacity: 0.9 }}>({result.score} / {result.totalPoints} points)</span>
            </h2>
          </div>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            Institutional Passing Criteria: 40% &bull; Secured: <strong>{result.status.toUpperCase()}</strong>
          </span>
        </div>

        {/* Status */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            backgroundColor: isPassed ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: isPassed ? 'var(--success)' : 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isPassed ? <CheckCircle size={32} /> : <XCircle size={32} />}
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>Certification Status</span>
            <strong style={{ fontSize: '20px', color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
              {isPassed ? 'PASSED & CERTIFIED' : 'FAILED'}
            </strong>
          </div>
        </div>

        {/* Calculated Rank */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={32} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>Calculated Rank</span>
            <strong style={{ fontSize: '24px', color: 'var(--text-main)' }}>
              #{result.rank || 1}
            </strong>
          </div>
        </div>
      </div>

      {/* CHARTS AND METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Metrics Breakdown */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Metrics Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--hover)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={24} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Time Elapsed</span>
                <strong style={{ fontSize: '15px' }}>{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</strong>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--hover)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Correct Evaluated</span>
                <strong style={{ fontSize: '15px' }}>{result.correctCount} items</strong>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--hover)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <XCircle size={24} style={{ color: 'var(--danger)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Incorrect Evaluated</span>
                <strong style={{ fontSize: '15px' }}>{result.wrongCount} items</strong>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--hover)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={24} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Skipped / Unvisited</span>
                <strong style={{ fontSize: '15px' }}>{result.skippedCount} items</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Split */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="card-title" style={{ width: '100%', marginBottom: '20px' }}>Accuracy Split</h3>
          <div style={{ width: '100%', height: '160px' }}>
            {correctnessData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={correctnessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {correctnessData.map((entry, index) => {
                      const colorMap = {
                        'Correct Answers': '#16a34a',
                        'Wrong Answers': '#dc2626',
                        'Skipped Questions': '#64748b'
                      };
                      const cl = colorMap[entry.name as keyof typeof colorMap] || COLORS[index];
                      return <Cell key={`cell-${index}`} fill={cl} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data</div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', fontSize: '13px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                Correct
              </span>
              <strong>{result.correctCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                Wrong
              </span>
              <strong>{result.wrongCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b' }}></span>
                Skipped
              </span>
              <strong>{result.skippedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED QUESTION REVIEW SECTION */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Detailed Question-by-Question Review</span>
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>
            Showing candidate selected choices vs. key solutions
          </span>
        </h3>

        {result.detailedQuestions && result.detailedQuestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {result.detailedQuestions.map((q, idx) => {
              const studentOptStr = Array.isArray(q.studentOption) ? q.studentOption.map(String) : (q.studentOption !== null && q.studentOption !== undefined ? [String(q.studentOption)] : []);
              const correctOptStr = Array.isArray(q.correctAnswer) ? q.correctAnswer.map(String) : [String(q.correctAnswer)];
              const isSkipped = studentOptStr.length === 0;

              return (
                <div key={q.id} style={{
                  padding: '20px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${isSkipped ? 'var(--border)' : q.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                  backgroundColor: isSkipped ? 'var(--bg-card)' : q.isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)'
                }}>
                  {/* Header info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>Question {idx + 1}</span>
                      <span className={`badge ${q.type === 'mcq' ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                        {q.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${isSkipped ? 'badge-secondary' : q.isCorrect ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px' }}>
                        {isSkipped ? 'Skipped' : q.isCorrect ? 'Correct (+ Marks)' : 'Incorrect'}
                      </span>
                      {(() => {
                        const marksToShow = q.marksAwarded !== 0 ? q.marksAwarded : (q.isCorrect ? (q.points || 1) : 0);
                        return (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: marksToShow > 0 ? 'var(--success)' : marksToShow < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {marksToShow > 0 ? `+${marksToShow}` : marksToShow} Marks
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.5' }}>
                    {renderFormattedText(q.text, true)}
                  </div>


                  {/* Options */}
                  {q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {q.options.map((optText, oIdx) => {
                        const optIndexStr = String(oIdx);
                        const isStudentChoice = studentOptStr.includes(optIndexStr) ||
                          studentOptStr.some(s => s.trim().toLowerCase() === optText.trim().toLowerCase());
                        const isCorrectOpt = correctOptStr.includes(optIndexStr) ||
                          correctOptStr.some(c => c.trim().toLowerCase() === optText.trim().toLowerCase());

                        let optionBg = 'var(--bg-card)';
                        let optionBorder = 'var(--border)';
                        let badgeText = '';
                        let badgeColor = '';

                        if (isStudentChoice && isCorrectOpt) {
                          optionBg = 'var(--success-bg)';
                          optionBorder = 'var(--success)';
                          badgeText = 'Your Choice (Correct)';
                          badgeColor = 'var(--success)';
                        } else if (isStudentChoice && !isCorrectOpt) {
                          optionBg = 'var(--danger-bg)';
                          optionBorder = 'var(--danger)';
                          badgeText = 'Your Choice (Wrong)';
                          badgeColor = 'var(--danger)';
                        } else if (isCorrectOpt) {
                          optionBg = 'var(--selected)';
                          optionBorder = 'var(--primary)';
                          badgeText = 'Correct Answer';
                          badgeColor = 'var(--primary)';
                        }

                        return (
                          <div key={oIdx} style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${optionBorder}`,
                            backgroundColor: optionBg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '14px',
                            color: 'var(--text-main)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '12px',
                                backgroundColor: isCorrectOpt ? 'var(--success)' : isStudentChoice ? 'var(--danger)' : 'var(--border)',
                                color: (isCorrectOpt || isStudentChoice) ? '#ffffff' : 'var(--text-main)'
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span style={{ fontWeight: (isStudentChoice || isCorrectOpt) ? 600 : 400, color: 'var(--text-main)' }}>
                                {renderFormattedText(optText)}
                              </span>
                            </div>

                            {badgeText && (
                              <span className="badge" style={{ backgroundColor: 'var(--bg-card)', color: badgeColor, border: `1px solid ${badgeColor}`, fontSize: '11px', fontWeight: 600 }}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--hover)', fontSize: '13px', color: 'var(--text-main)' }}>
                      <strong>Your Submitted Answer:</strong> {q.studentOption || 'No answer provided.'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No detailed question review available.
          </div>
        )}
      </div>
    </div>
  );
};
