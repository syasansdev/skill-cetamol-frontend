import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Play, Award, Trophy, BarChart3, 
  ArrowUpRight, ShieldAlert, AlertCircle, Calendar, ChevronRight, Upload
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar 
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { Exam, ExamResult, Portion, Note, Subject } from '../types';

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

  // Portions, Notes and Subjects State
  const [portions, setPortions] = useState<Portion[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Note Form State
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSubjectId, setNoteSubjectId] = useState<string>('');
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [creatingNote, setCreatingNote] = useState<boolean>(false);

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

  // Fetch data
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

      // Sort by average descending
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

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const uploadRes = await api.post('/auth/upload-profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = uploadRes.data.url;
      await api.put('/auth/profile-photo', { photoUrl: url });
      setProfilePhotoPreview(url);
      if (user) {
        updateCurrentUser({ ...user, photoUrl: url });
      }
      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload photo.', 'error');
    } finally {
      setProfilePhotoUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: studentName
      });
      updateCurrentUser(res.data.user);
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile details.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteSubjectId) {
      showToast('Title and Subject are required.', 'warning');
      return;
    }
    setCreatingNote(true);
    try {
      const formData = new FormData();
      formData.append('title', noteTitle);
      formData.append('content', noteContent);
      formData.append('subjectId', noteSubjectId);
      if (noteFile) {
        formData.append('file', noteFile);
      }

      const res = await api.post('/student/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNotes(prev => [res.data, ...prev]);
      showToast('Study note created successfully!', 'success');
      
      // Reset Note Form
      setNoteTitle('');
      setNoteContent('');
      setNoteSubjectId('');
      setNoteFile(null);
      const fileInput = document.getElementById('note-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload note.', 'error');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study note?')) return;
    try {
      await api.delete(`/student/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast('Study note deleted successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete note.', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const handleStartExamFlow = (exam: Exam) => {
    if ((exam as any).attemptStatus === 'LOCKED') {
      showToast('This examination has been locked. Administrator approval is required before you can continue.', 'error');
      return;
    }
    if ((!exam.questions || exam.questions.length === 0) && (exam as any).questionCount === 0) {
      showToast('This examination has no questions assigned yet. Please contact your instructor.', 'warning');
      return;
    }
    setSelectedExamRules(exam);
  };

  const handleConfirmStart = () => {
    if (selectedExamRules) {
      if ((selectedExamRules as any).attemptStatus === 'LOCKED') {
        showToast('This examination has been locked. Administrator approval is required before you can continue.', 'error');
        setSelectedExamRules(null);
        return;
      }
      const examObj = selectedExamRules;
      setSelectedExamRules(null);
      startExam(examObj);
      navigate(`/exam/${examObj.id}`);
    }
  };

  // Calculations
  const activeExams = exams.filter(e => e.status === 'active' && !e.hasAttempted);
  const upcomingExams = exams.filter(e => e.status === 'scheduled');
  const attemptedExams = exams.filter(e => e.hasAttempted);

  const avgScore = results.length 
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length) 
    : 0;

  // Rank calculation based on average leaderboard score
  const studentRank = leaderboard.findIndex(l => l.id === user?.id) + 1 || '--';

  // Graph Data
  const trendData = results.map(r => ({
    name: r.examTitle.substring(0, 10) + '..',
    Score: r.percentage
  })).reverse(); // chronological order

  return (
    <div>
      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Student Workspace</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back! View exam notices, launch assessments, and check scorecard analyses.</p>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1.5px dashed var(--primary)',
          borderRadius: '8px',
          padding: '10px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Register Number</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', marginTop: '2px' }}>
            {(user as any)?.studentId || 'N/A'}
          </span>
        </div>
      </div>

      {/* ==========================================
          OVERVIEW SUB-VIEW
          ========================================== */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--selected)' }}>
                <Trophy size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Class Rank Position</span>
                <span className="stat-value">#{studentRank}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
                <Award size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Average Score Secured</span>
                <span className="stat-value">{avgScore}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#ea580c', backgroundColor: '#ffedd5' }}>
                <FileText size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Active Exams Available</span>
                <span className="stat-value">{activeExams.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#9333ea', backgroundColor: '#f3e8ff' }}>
                <Calendar size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Upcoming Scheduled Exams</span>
                <span className="stat-value">{upcomingExams.length}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Active Available exams */}
            <div className="card">
              <h3 className="card-title">Exams Available to Take Now</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{e.title}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {e.duration} Mins &bull; {e.questionCount || e.questions?.length || 0} Questions &bull; Total {e.totalMarks || ((e.questionCount || e.questions?.length || 0) * (e.marksPerQuestion || 1))} Marks
                      </span>
                    </div>
                    {e.attemptStatus === 'LOCKED' ? (
                      <button className="btn btn-danger" onClick={() => showToast('This examination has been locked. Administrator approval is required before you can continue.', 'error')} style={{ backgroundColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={14} /> Locked
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => handleStartExamFlow(e)}>
                        <Play size={14} fill="#ffffff" /> Start Exam
                      </button>
                    )}
                  </div>
                ))}
                {activeExams.length === 0 && (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--hover)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px'
                  }}>
                    No active examinations available for execution at this hour.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming schedules */}
            <div className="card">
              <h3 className="card-title">Upcoming Exams Schedule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingExams.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{e.title}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(e.startTime).toLocaleDateString()} at {new Date(e.startTime).toLocaleTimeString()}</span>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>Scheduled</span>
                  </div>
                ))}
                {upcomingExams.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                    No future exams scheduled at present.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Performance Area graph */}
          <div className="card">
            <h3 className="card-title">Score Performance Trend</h3>
            <div style={{ height: '280px' }}>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Score" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Take exams to populate performance graphs.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==========================================
          AVAILABLE EXAMS SUB-VIEW
          ========================================== */}
      {activeTab === 'exams' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Active & Scheduled Examinations</h3>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Faculty / Evaluator</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.title}</td>
                    <td>{(e as any).facultyName || (e as any).faculty?.user?.name || 'Faculty Evaluator'}</td>
                    <td>{e.duration} mins</td>
                    <td>{e.questionCount || e.questions?.length || 0} Questions</td>
                    <td>
                      {e.hasAttempted ? (
                        <span className="badge badge-success">Attempted</span>
                      ) : e.status === 'active' ? (
                        <span className="badge badge-info">Active</span>
                      ) : (
                        <span className="badge badge-warning">Scheduled</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {e.hasAttempted ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/results/${e.resultId}`)}>
                          View Results <ArrowUpRight size={13} />
                        </button>
                      ) : e.status === 'active' ? (
                        e.attemptStatus === 'LOCKED' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => showToast('This examination has been locked. Administrator approval is required before you can continue.', 'error')} style={{ backgroundColor: 'var(--danger)' }}>
                            Locked
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStartExamFlow(e)}>
                            <Play size={12} fill="#ffffff" /> Start
                          </button>
                        )
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled>
                          Locked
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

      {/* ==========================================
          HISTORY SUB-VIEW
          ========================================== */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="card-title">Attempt History & Results</h3>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject Code</th>
                  <th>Raw Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Attempt Duration</th>
                  <th>Submission Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.examTitle}</td>
                    <td>{r.subjectName}</td>
                    <td>{r.score} / {r.totalPoints}</td>
                    <td><strong>{r.percentage}%</strong></td>
                    <td>
                      <span className={`badge ${r.status === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                    <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/results/${r.id}`)}>
                        Score Report
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      You have not completed any examinations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          PERFORMANCE ANALYTICS SUB-VIEW
          ========================================== */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 className="card-title">Performance Analytics</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Chronological summary chart demonstrating percentage yields across submitted exam sessions.
            </p>
            <div style={{ height: '300px' }}>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Score" stroke="var(--primary)" fill="var(--selected)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Take exams to unlock trend analytics.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Subject-Wise Averages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {exams.filter(e => e.hasAttempted).map((e, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{e.title}</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{e.percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--hover)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${e.percentage}%`,
                      height: '100%',
                      backgroundColor: e.resultStatus === 'pass' ? 'var(--success)' : 'var(--danger)',
                      borderRadius: '99px'
                    }}></div>
                  </div>
                </div>
              ))}
              {exams.filter(e => e.hasAttempted).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No subject logs recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          LEADERBOARD SUB-VIEW
          ========================================== */}
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

      {/* ==========================================
          PORTIONS SUB-VIEW
          ========================================== */}
      {activeTab === 'portions' && (
        <div className="card">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
            <FileText style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Syllabus & Course Portions</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            View the syllabus outline and portions scheduled for your current subjects.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {portions.map(p => (
              <div key={p.id} style={{
                padding: '20px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', display: 'inline-block' }}>
                      {p.subjectName}
                    </span>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{p.title}</h4>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Posted on {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-main)', 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {p.description}
                </div>
              </div>
            ))}
            {portions.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--hover)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}>
                No syllabus portions uploaded for your subjects yet.
              </div>
            )}
          </div>
        </div>
      )}



      {/* ==========================================
          PROFILE SUB-VIEW
          ========================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>My Profile</h3>

            {/* Photo preview + upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {profilePhotoPreview || user?.photoUrl ? (
                  <img
                    src={profilePhotoPreview || user?.photoUrl}
                    alt="Profile"
                    style={{
                      width: '90px', height: '90px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    backgroundColor: 'var(--hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 700, color: 'var(--primary)',
                    border: '3px solid var(--border)'
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{user?.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{user?.email}</p>
              </div>
            </div>

            {/* Read-only student details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Student Register ID</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{(user as any)?.studentId || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email Address</span>
                <code style={{ fontSize: '13px' }}>{user?.email}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Role</span>
                <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Account Status</span>
                <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{user?.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Department</span>
                <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{(user as any)?.department || 'Computer Science & Engineering'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Course Program</span>
                <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{(user as any)?.course || 'Bachelor of Technology'}</span>
              </div>
            </div>

            {/* Profile editing fields */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
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

      {/* ==========================================================
          EXAM PROCTORING RULES MODAL
          ========================================================== */}
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
                <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{selectedExamRules.title}</h4>
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
                    <strong>Auto Save:</strong> Answers are saved locally in the browser background every 10 seconds.
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
