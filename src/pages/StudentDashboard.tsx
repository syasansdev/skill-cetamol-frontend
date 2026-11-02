import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Play, Award, Trophy, BarChart3, 
  ArrowUpRight, ShieldAlert, AlertCircle, Calendar, ChevronRight, Upload,
  Filter, RotateCcw, TrendingUp, CheckCircle, XCircle, Sparkles, BookOpen, User
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { Exam, ExamResult, Portion, Note, Subject, StudentMasterAnalytics } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const { startExam } = useExam();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'overview';

  // State
  const [exams, setExams] = useState<(Exam & { hasAttempted: boolean; resultId: string | null; score: number | null; percentage: number | null; resultStatus: 'pass' | 'fail' | null; attemptStatus: string | null; warningCount?: number })[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Master Analytics State (Feature 4 & 5)
  const [analytics, setAnalytics] = useState<StudentMasterAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Portions, Notes and Subjects State
  const [portions, setPortions] = useState<Portion[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Profile states
  const [studentName, setStudentName] = useState<string>(user?.name || '');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState<boolean>(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>(user?.photoUrl || '');

  useEffect(() => {
    if (user) {
      setStudentName(user.name);
    }
  }, [user]);

  // Modals
  const [selectedExamRules, setSelectedExamRules] = useState<any | null>(null);

  // Fetch Master Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const params: any = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterSubjectId && filterSubjectId !== 'all') params.subjectId = filterSubjectId;

      const res = await api.get('/student/analytics/master-summary', { params });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load master analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch core data
  const fetchData = async () => {
    try {
      const examsRes = await api.get('/student/exams');
      setExams(examsRes.data);

      const resultsRes = await api.get('/student/results');
      setResults(resultsRes.data);

      const allResults: ExamResult[] = resultsRes.data;

      // Group by student and calculate average
      const studentMap: Record<string, { name: string; roll: string; totalPct: number; count: number }> = {};
      allResults.forEach(r => {
        if (!studentMap[r.studentId]) {
          studentMap[r.studentId] = { name: r.studentName, roll: r.studentRollNo, totalPct: 0, count: 0 };
        }
        studentMap[r.studentId].totalPct += r.percentage;
        studentMap[r.studentId].count += 1;
      });

      const leaderData = Object.keys(studentMap).map(id => ({
        id,
        name: studentMap[id].name,
        roll: studentMap[id].roll,
        average: Math.round(studentMap[id].totalPct / studentMap[id].count),
        taken: studentMap[id].count
      }));

      leaderData.sort((a, b) => b.average - a.average);
      setLeaderboard(leaderData);

      // Fetch student-specific subjects
      try {
        const subRes = await api.get('/student/subjects');
        setSubjects(subRes.data);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }

      // Fetch portions
      try {
        const portionsRes = await api.get('/student/portions');
        setPortions(portionsRes.data);
      } catch (err) {
        console.error('Failed to fetch portions:', err);
      }

      // Fetch student notes
      try {
        const notesRes = await api.get('/student/notes');
        setNotes(notesRes.data);
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, filterStartDate, filterEndDate, filterSubjectId]);

  const handleStartExamFlow = (exam: any) => {
    setSelectedExamRules(exam);
  };

  const handleConfirmStart = () => {
    if (selectedExamRules) {
      if (selectedExamRules.attemptStatus === 'LOCKED') {
        showToast('This examination has been locked. Administrator approval is required before you can continue.', 'error');
        return;
      }
      const examObj = selectedExamRules;
      setSelectedExamRules(null);
      startExam(examObj);
      navigate(`/exam/${examObj.id}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/update-profile', { name: studentName });
      updateCurrentUser(res.data.user);
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile details.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const activeExams = exams.filter(e => e.status === 'active' && !e.hasAttempted);
  const upcomingExams = exams.filter(e => e.status === 'scheduled');

  const avgScore = results.length 
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length) 
    : 0;

  const studentRank = leaderboard.findIndex(l => l.id === user?.id) + 1 || '--';

  const resetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSubjectId('all');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Student Assessment Portal</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '14px' }}>
            Access scheduled exams, track detailed performance analytics, and review question-level timing.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 18px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>Candidate Register No</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', marginTop: '2px' }}>
            {(user as any)?.studentId || 'REG-ACTIVE'}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. OVERVIEW TAB                                                */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Summary Cards */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--selected)' }}>
                <Trophy size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Institutional Rank</span>
                <span className="stat-value">#{studentRank}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)' }}>
                <Award size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">{analytics?.kpiCards?.averageScore ?? avgScore}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--selected)' }}>
                <CheckCircle size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Performance Classification</span>
                <span className="stat-value" style={{ fontSize: '18px', color: analytics?.kpiCards?.categoryColor || 'var(--primary)' }}>
                  {analytics?.kpiCards?.overallPerformanceCategory || (avgScore >= 90 ? 'Exceptional' : avgScore >= 75 ? 'Good' : avgScore >= 50 ? 'Average' : 'Needs Improvement')}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-bg)' }}>
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Avg Time / Question</span>
                <span className="stat-value">
                  {analytics?.kpiCards?.averageTimePerQuestion || 45}s
                </span>
              </div>
            </div>
          </div>

          {/* Quick Active & Upcoming Grid */}
          <div className="grid-two-col">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Available Exams (Ready to Take)</h3>
                <span className="badge badge-info">{activeExams.length} Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeExams.map(e => (
                  <div key={e.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--hover)'
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{e.title}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {e.duration} Mins &bull; {e.questionCount || e.questions?.length || 0} Questions &bull; Total {e.totalMarks || 100} Marks
                      </span>
                    </div>
                    {e.attemptStatus === 'LOCKED' ? (
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('This assessment is locked. Please contact proctor.', 'error')}>
                        <ShieldAlert size={14} /> Locked
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStartExamFlow(e)}>
                        <Play size={13} fill="#ffffff" /> Start Assessment
                      </button>
                    )}
                  </div>
                ))}
                {activeExams.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No active examinations open at this hour.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Upcoming Schedules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingExams.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>{e.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(e.startTime).toLocaleDateString()} at {new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>Scheduled</span>
                  </div>
                ))}
                {upcomingExams.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                    No upcoming examinations currently scheduled.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Trend Preview */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Score Performance Trajectory</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/dashboard?tab=analytics')}>
                View Master Analytics <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ height: '260px' }}>
              {(analytics?.performanceTrend && analytics.performanceTrend.length > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.performanceTrend}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Score" stroke="var(--primary)" strokeWidth={2.5} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Complete assessment sessions to view historical score trajectories.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. AVAILABLE EXAMS TAB                                         */}
      {/* ============================================================== */}
      {activeTab === 'exams' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Active & Scheduled Examinations</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing tests published to your institution</span>
          </div>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Total Marks</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.title}</td>
                    <td>{e.subjectName || 'General Aptitude'}</td>
                    <td>{e.duration} mins</td>
                    <td>{e.questionCount || e.questions?.length || 0}</td>
                    <td>{e.totalMarks || 100} pts</td>
                    <td>
                      {e.hasAttempted ? (
                        <span className="badge badge-success">Completed</span>
                      ) : e.status === 'active' ? (
                        <span className="badge badge-info">Active</span>
                      ) : (
                        <span className="badge badge-warning">Scheduled</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {e.hasAttempted ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/results/${e.resultId || e.id}`)}>
                          View Report <ArrowUpRight size={13} />
                        </button>
                      ) : e.status === 'active' ? (
                        e.attemptStatus === 'LOCKED' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => showToast('This assessment is locked. Contact proctor.', 'error')}>
                            Locked
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStartExamFlow(e)}>
                            <Play size={12} fill="#ffffff" /> Start
                          </button>
                        )
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled>
                          Not Started
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ATTEMPT HISTORY TAB                                         */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Candidate Assessment History</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>All completed tests with performance classifications and question timing telemetry.</p>
            </div>
            <span className="badge badge-secondary">{results.length} Tests Completed</span>
          </div>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Score Secured</th>
                  <th>Percentage</th>
                  <th>Classification</th>
                  <th>Active Duration</th>
                  <th>Submission Date</th>
                  <th style={{ textAlign: 'right' }}>Report Card</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  let cat = r.grade || r.performanceCategory;
                  if (!cat) {
                    if (r.percentage >= 90) cat = 'Outstanding';
                    else if (r.percentage >= 75) cat = 'Proficient';
                    else if (r.percentage >= 60) cat = 'Competent';
                    else if (r.percentage >= 40) cat = 'Developing';
                    else cat = 'Needs Improvement';
                  } else {
                    const l = cat.toLowerCase();
                    if (l === 'exceptional' || l === 'outstanding') cat = 'Outstanding';
                    else if (l === 'good' || l === 'proficient') cat = 'Proficient';
                    else if (l === 'competent') cat = 'Competent';
                    else if (l === 'average' || l === 'developing') cat = 'Developing';
                    else if (l.includes('need') || l.includes('improv')) cat = 'Needs Improvement';
                  }
                  const tierConfig: Record<string, { color: string; emoji: string }> = {
                    'Outstanding': { color: '#10b981', emoji: '🌟' },
                    'Proficient': { color: '#3b82f6', emoji: '🎯' },
                    'Competent': { color: '#06b6d4', emoji: '✅' },
                    'Developing': { color: '#f59e0b', emoji: '📈' },
                    'Needs Improvement': { color: '#ef4444', emoji: '⚠️' }
                  };
                  const currentConf = tierConfig[cat] || { color: '#94a3b8', emoji: '📊' };

                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.examTitle}</td>
                      <td>{r.subjectName}</td>
                      <td>{r.score} / {r.totalPoints}</td>
                      <td><strong style={{ fontSize: '14px' }}>{r.percentage}%</strong></td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: `${currentConf.color}15`,
                          color: currentConf.color,
                          border: `1px solid ${currentConf.color}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{currentConf.emoji}</span>
                          <span>{cat}</span>
                        </span>
                      </td>
                      <td>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                      <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/results/${r.id}`)}>
                          View Report <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No examination sessions completed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. FEATURE 4 & 5: MASTER ANALYTICS & PERFORMANCE TRACKER       */}
      {/* ============================================================== */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* FILTER TOOLBAR */}
          <div className="card" style={{ padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Analytics Date & Subject Filters</h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subject:</span>
                  <select
                    className="form-control form-control-sm"
                    value={filterSubjectId}
                    onChange={(e) => setFilterSubjectId(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px', minWidth: '150px' }}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                    ))}
                  </select>
                </div>

                {(filterStartDate || filterEndDate || filterSubjectId !== 'all') && (
                  <button className="btn btn-secondary btn-sm" onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FEATURE 4: 6 TOP KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Tests Completed</span>
                <span className="stat-value">{analytics?.kpiCards?.totalTestsCompleted ?? results.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">{analytics?.kpiCards?.averageScore ?? 0}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Highest Score</span>
                <span className="stat-value" style={{ color: '#10b981' }}>{analytics?.kpiCards?.highestScore ?? 0}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Overall Category</span>
                <span className="stat-value" style={{ fontSize: '18px', color: analytics?.kpiCards?.categoryColor || '#3b82f6' }}>
                  {analytics?.kpiCards?.overallPerformanceCategory || 'Average'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Avg Time / Question</span>
                <span className="stat-value">{analytics?.kpiCards?.averageTimePerQuestion || 45}s</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Performance Improvement</span>
                <span className="stat-value" style={{ color: (analytics?.kpiCards?.performanceImprovement || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {(analytics?.kpiCards?.performanceImprovement || 0) >= 0 ? '+' : ''}{analytics?.kpiCards?.performanceImprovement || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* FEATURE 5: 5 REQUIRED RECHARTS VISUALIZATIONS */}
          <div className="grid-two-col">
            
            {/* Chart 1: Performance Trend Line Chart */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>1. Performance Trend Over Time</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Chronological score trajectory across completed assessments.
              </p>
              <div style={{ height: '260px' }}>
                {analytics?.performanceTrend && analytics.performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.performanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Score']} />
                      <Legend />
                      <Line type="monotone" dataKey="Score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No assessment history matches the selected filters.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: Performance Classification Donut Chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 className="card-title" style={{ width: '100%', marginBottom: '6px' }}>2. Classification Distribution</h3>
              <p style={{ width: '100%', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Breakdown across Outstanding, Proficient, Competent, Developing, and Needs Improvement.
              </p>
              <div style={{ width: '100%', height: '200px' }}>
                {analytics?.categoryDistribution && analytics.categoryDistribution.some(c => c.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                      >
                        {analytics.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No assessments completed.
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%', fontSize: '12px', marginTop: '10px' }}>
                {analytics?.categoryDistribution?.map((cat) => (
                  <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'var(--hover)', borderRadius: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }}></span>
                      {cat.name}
                    </span>
                    <strong>{cat.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-two-col-equal">
            
            {/* Chart 2: Assessment Comparison Bar Chart */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>3. Assessment Comparison</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Comparison of scores across completed assessments.
              </p>
              <div style={{ height: '260px' }}>
                {analytics?.assessmentComparison && analytics.assessmentComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.assessmentComparison} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="examTitle" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Score']} labelFormatter={(l: any, p: any) => p[0]?.payload?.fullTitle || l} />
                      <Bar dataKey="score" name="Percentage" radius={[4, 4, 0, 0]}>
                        {analytics.assessmentComparison.map((entry, idx) => (
                          <Cell key={`bar-${idx}`} fill={entry.color || 'var(--primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No assessments to compare.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Subject-wise Performance */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>4. Subject-Wise Performance</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Average percentage score secured across subjects and disciplines.
              </p>
              <div style={{ height: '260px' }}>
                {analytics?.subjectPerformance && analytics.subjectPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subjectPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="subjectName" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Average Score']} />
                      <Bar dataKey="averageScore" name="Subject Average" radius={[4, 4, 0, 0]}>
                        {analytics.subjectPerformance.map((entry, idx) => (
                          <Cell key={`sub-bar-${idx}`} fill={entry.color || '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No subject records available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart 5: Time Management Across Assessments */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '6px' }}>5. Time Management Across Assessments</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Average active seconds taken per question across assessments.
            </p>
            <div style={{ height: '240px' }}>
              {analytics?.timeManagementTrend && analytics.timeManagementTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.timeManagementTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="examTitle" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} unit="s" />
                    <Tooltip formatter={(val: any) => [`${val}s / question`, 'Average Time']} labelFormatter={(l: any, p: any) => p[0]?.payload?.fullTitle || l} />
                    <Bar dataKey="avgSecondsPerQuestion" name="Avg Sec / Q" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No time management telemetry recorded.
                </div>
              )}
            </div>
          </div>

          {/* Strengths, Weaknesses, and Practice Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Strongest Subjects */}
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={20} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Strongest Subject Disciplines</h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Subjects where performance is consistently rated Good or Exceptional.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics?.strongestSubjects && analytics.strongestSubjects.length > 0 ? (
                  analytics.strongestSubjects.map(s => (
                    <div key={s.subjectName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#ecfdf5', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#065f46' }}>{s.subjectName}</span>
                      <strong style={{ color: '#065f46', fontSize: '14px' }}>{s.averageScore}% avg</strong>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Score &ge; 75% on upcoming subject assessments to populate strongest domains.
                  </span>
                )}
              </div>
            </div>

            {/* Weakest Subjects / Areas for Practice */}
            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Areas Requiring Additional Practice</h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Specific subject disciplines that fall below the 75% benchmark threshold.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics?.areasForPractice && analytics.areasForPractice.length > 0 ? (
                  analytics.areasForPractice.map(a => (
                    <div key={a.subjectName} style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>{a.subjectName}</span>
                        <strong style={{ color: 'var(--danger)', fontSize: '13px' }}>{a.currentScore}% current</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.recommendation}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                    Excellent! All attempted subjects are currently performing above the practice threshold.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Table with direct Report Card links */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Recent Assessment History & Individual Reports</h3>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Subject</th>
                    <th>Score Percentage</th>
                    <th>Category</th>
                    <th>Date Attempted</th>
                    <th style={{ textAlign: 'right' }}>Individual Report</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    analytics.recentActivity.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700 }}>{item.examTitle}</td>
                        <td>{item.subjectName}</td>
                        <td><strong>{item.percentage}%</strong></td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                            border: `1px solid ${item.color}`
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/results/${item.id}`)}>
                            View Score Report <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No assessment logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 5. LEADERBOARD TAB                                             */}
      {/* ============================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="card">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
            <Trophy style={{ color: 'var(--warning)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Institution Academic Leaderboard</h3>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Rank Position</th>
                  <th>Student Name</th>
                  <th>Student Roll No</th>
                  <th>Exams Answered</th>
                  <th>Average Percentage Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr key={item.id} style={{ backgroundColor: item.id === user?.id ? 'var(--selected)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {index === 0 && <Trophy size={16} style={{ color: '#d97706' }} />}
                        {index === 1 && <Trophy size={16} style={{ color: '#94a3b8' }} />}
                        {index === 2 && <Trophy size={16} style={{ color: '#b45309' }} />}
                        <strong>#{index + 1}</strong>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name} {item.id === user?.id && '(You)'}</td>
                    <td><code>{item.roll}</code></td>
                    <td>{item.taken} sessions</td>
                    <td><strong>{item.average}%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PROFILE TAB                                                 */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>Candidate Academic Profile</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: 'var(--selected)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 800, color: 'var(--primary)',
                border: '2px solid var(--primary)'
              }}>
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>{user?.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                <span className="badge badge-success" style={{ fontSize: '11px', marginTop: '6px' }}>Active Student</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registration ID</span>
                <strong style={{ fontSize: '13px' }}>{(user as any)?.studentId || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email Address</span>
                <code style={{ fontSize: '13px' }}>{user?.email}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Department</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{(user as any)?.department || 'Engineering'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROCTORING RULES MODAL */}
      {selectedExamRules && (
        <div className="modal-overlay" onClick={() => setSelectedExamRules(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
                Secure Exam Verification
              </h3>
              <button className="modal-close" onClick={() => setSelectedExamRules(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>{selectedExamRules.title}</h4>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedExamRules.subjectName}</span>
              </div>

              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--text-muted)', paddingTop: '2px' }}><Clock size={16} /></div>
                  <div>
                    <strong>Duration:</strong> {selectedExamRules.duration} minutes countdown. The portal will automatically submit your answers upon expiration.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--danger)', paddingTop: '2px' }}><ShieldAlert size={16} /></div>
                  <div>
                    <strong>Proctor locks:</strong> System will enforce **strict full screen**. Minimizing or navigating away from the page will trigger an alert check.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--success)', paddingTop: '2px' }}><AlertCircle size={16} /></div>
                  <div>
                    <strong>Active Question Timing:</strong> Time spent on each question is automatically tracked for speed and efficiency analytics.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--danger-bg)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: '12px', fontWeight: 500 }}>
                Please close all external applications, browsers, or documents before starting the examination session.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedExamRules(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmStart} style={{ backgroundColor: 'var(--danger)' }}>
                Confirm & Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
