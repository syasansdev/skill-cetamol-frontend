import React, { useState, useEffect } from 'react';
import { 
  Plus, Building, Calendar, Clock, Globe, Eye, 
  CheckCircle2, AlertCircle, FileText, Check, X, 
  BarChart3, RefreshCw, Send, ShieldCheck, Layers, Users,
  Database, Shuffle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ExamGradingThresholdEditor, DEFAULT_GRADING_TIERS, GradingThresholdItem } from './PerformanceThresholdConfig';

interface CentralAssessment {
  id: string;
  title: string;
  description: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  startDate: string | null;
  endDate: string | null;
  publishedStatus: 'draft' | 'scheduled' | 'published' | 'archived';
  questionsCount: number;
  assignedInstitutions: {
    id: string;
    collegeId: string;
    collegeName: string;
    collegeCode: string;
    status: string;
    publishedAt: string;
  }[];
  createdAt: string;
}

interface MonitoringData {
  assessment: {
    id: string;
    title: string;
    subject: string;
    status: string;
    totalMarks: number;
    duration: number;
  };
  summary: {
    totalInstitutions: number;
    totalRegistered: number;
    totalStarted: number;
    totalCompleted: number;
    overallAverageScore: number;
  };
  institutions: {
    collegeId: string;
    collegeName: string;
    collegeCode: string;
    registered: number;
    started: number;
    completed: number;
    completionRate: number;
    averageScore: number;
    passRate: number;
  }[];
}

export const CentralizedAssessmentStudio: React.FC = () => {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'create' | 'monitoring'>('list');
  const [assessments, setAssessments] = useState<CentralAssessment[]>([]);
  const [colleges, setColleges] = useState<{ id: string; name: string; code: string }[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitoring State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState<boolean>(false);

  // Form State for Centralized Assessment Creation
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formTotalMarks, setFormTotalMarks] = useState<number>(100);
  const [formPassingMarks, setFormPassingMarks] = useState<number>(40);
  const [formInstructions, setFormInstructions] = useState<string>(
    '1. Answer all questions within the allocated time.\n2. Do not refresh or close the tab.\n3. Question active time is monitored continuously.'
  );
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'draft' | 'scheduled' | 'published'>('published');
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [autoPickCount, setAutoPickCount] = useState<number>(20);
  const [formGradingThresholds, setFormGradingThresholds] = useState<GradingThresholdItem[]>(DEFAULT_GRADING_TIERS);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch central assessments and colleges
  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, collegesRes, qRes, subjectsRes] = await Promise.all([
        api.get('/admin/central-exams'),
        api.get('/admin/colleges'),
        api.get('/admin/questions').catch(() => ({ data: [] })),
        api.get('/admin/subjects').catch(() => ({ data: [] }))
      ]);
      setAssessments(examsRes.data || []);
      setColleges(collegesRes.data || []);
      setAvailableQuestions(qRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching central assessments:', err);
      showToast(err.response?.data?.message || 'Failed to load central assessment studio data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Monitoring Console
  const openMonitoring = async (examId: string) => {
    setSelectedExamId(examId);
    setActiveView('monitoring');
    setMonitoringLoading(true);
    try {
      const res = await api.get(`/admin/central-exams/${examId}/monitoring`);
      setMonitoringData(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load cross-institution monitoring', 'error');
    } finally {
      setMonitoringLoading(false);
    }
  };

  // Toggle College Selection
  const toggleCollege = (collegeId: string) => {
    setSelectedCollegeIds(prev => 
      prev.includes(collegeId) ? prev.filter(id => id !== collegeId) : [...prev, collegeId]
    );
  };

  const handleSelectAllColleges = () => {
    if (selectedCollegeIds.length === colleges.length) {
      setSelectedCollegeIds([]);
    } else {
      setSelectedCollegeIds(colleges.map(c => c.id));
    }
  };

  // Toggle Question Selection
  const toggleQuestion = (qId: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  // Filter questions by selected subject and search input
  const filteredStudioQuestions = availableQuestions.filter(q => {
    let matchSub = true;
    if (formSubjectId) {
      matchSub = q.subjectId === formSubjectId;
    } else if (formSubject && formSubject.trim()) {
      const matched = subjects.find(s => s.name.toLowerCase() === formSubject.toLowerCase());
      if (matched) {
        matchSub = q.subjectId === matched.id;
      }
    }
    const qContent = (q.text || q.question || '').toLowerCase();
    const matchSearch = questionSearch ? qContent.includes(questionSearch.toLowerCase()) : true;
    return matchSub && matchSearch;
  });

  // Auto-Pick Questions Handler
  const handleAutoPickQuestions = () => {
    let pool = availableQuestions;
    if (formSubjectId) {
      pool = pool.filter(q => q.subjectId === formSubjectId);
    } else if (formSubject && formSubject.trim()) {
      const matched = subjects.find(s => s.name.toLowerCase() === formSubject.toLowerCase());
      if (matched) {
        pool = pool.filter(q => q.subjectId === matched.id);
      }
    }

    if (pool.length === 0) {
      if (!formSubjectId && !formSubject) {
        showToast('Please select a Subject Curriculum first before auto-picking questions.', 'warning');
      } else {
        showToast(`No questions found in repository for "${formSubject || 'selected subject'}". Try selecting another subject or adding questions.`, 'warning');
      }
      return;
    }

    const countToPick = Math.min(autoPickCount || 20, pool.length);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, countToPick).map(q => q.id);
    setSelectedQuestionIds(picked);

    const calcMarks = picked.reduce((sum, qId) => {
      const foundQ = availableQuestions.find(q => q.id === qId);
      return sum + (foundQ?.points || foundQ?.marks || 1);
    }, 0);
    if (calcMarks > 0) {
      setFormTotalMarks(calcMarks);
    }

    showToast(`🎲 Successfully auto-picked ${picked.length} random questions from "${formSubject || 'subject pool'}" (${pool.length} available)!`, 'success');
  };

  const handleSelectAllQuestions = () => {
    let pool = availableQuestions;
    if (formSubjectId) {
      pool = pool.filter(q => q.subjectId === formSubjectId);
    } else if (formSubject && formSubject.trim()) {
      const matched = subjects.find(s => s.name.toLowerCase() === formSubject.toLowerCase());
      if (matched) {
        pool = pool.filter(q => q.subjectId === matched.id);
      }
    }
    if (pool.length === 0) {
      showToast('No questions available in pool to select.', 'warning');
      return;
    }
    setSelectedQuestionIds(pool.map(q => q.id));
    const calcMarks = pool.reduce((sum, q) => sum + (q.points || q.marks || 1), 0);
    if (calcMarks > 0) setFormTotalMarks(calcMarks);
    showToast(`Selected all ${pool.length} questions from this curriculum.`, 'info');
  };

  const handleClearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
    showToast('Cleared question selection.', 'info');
  };

  // Submit Centralized Assessment Creation
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Assessment title is required', 'error');
      return;
    }
    if (selectedCollegeIds.length === 0) {
      showToast('Please select at least one target institution', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/central-exams', {
        title: formTitle,
        description: formDescription,
        subjectId: formSubjectId || undefined,
        subject: formSubject || 'General',
        duration: formDuration,
        durationMinutes: formDuration,
        totalMarks: formTotalMarks,
        questionCount: selectedQuestionIds.length > 0 ? selectedQuestionIds.length : autoPickCount,
        passingMarks: formPassingMarks,
        instructions: formInstructions,
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        publishedStatus: formStatus,
        gradingThresholds: formGradingThresholds,
        collegeIds: selectedCollegeIds,
        questionIds: selectedQuestionIds
      });

      showToast('Centralized assessment created and assigned to institutions successfully!', 'success');
      setActiveView('list');
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Publishing Status for an Existing Central Assessment
  const handleTogglePublish = async (assessment: CentralAssessment, newStatus: 'published' | 'archived') => {
    try {
      await api.put(`/admin/central-exams/${assessment.id}/publish`, {
        publishedStatus: newStatus,
        collegeIds: assessment.assignedInstitutions.map(a => a.collegeId)
      });
      showToast(`Assessment status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update publishing status', 'error');
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSubject('');
    setFormSubjectId('');
    setIsCustomSubject(false);
    setFormDuration(60);
    setFormTotalMarks(100);
    setFormPassingMarks(40);
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('published');
    setSelectedCollegeIds([]);
    setSelectedQuestionIds([]);
    setAutoPickCount(20);
    setQuestionSearch('');
    setFormGradingThresholds(DEFAULT_GRADING_TIERS);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return 'badge-success';
      case 'scheduled': return 'badge-warning';
      case 'archived': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="card space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="card-title text-xl font-bold" style={{ margin: 0 }}>
              Super Admin Centralized Assessment Studio
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Author authoritative assessments, configure scheduling, assign to multiple institutions, and monitor live candidate metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView !== 'list' && (
            <button
              onClick={() => { setActiveView('list'); setSelectedExamId(null); }}
              className="btn btn-secondary btn-sm"
            >
              Back to Assessments
            </button>
          )}

          {activeView === 'list' && (
            <button
              onClick={() => { resetForm(); setActiveView('create'); }}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" />
              Create Central Assessment
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Assessment List */}
      {activeView === 'list' && (
        <div className="space-y-4">
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Subject</th>
                  <th>Duration</th>
                  <th>Total Marks</th>
                  <th>Assigned Colleges</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">{item.description}</div>
                    </td>
                    <td>{item.subject}</td>
                    <td>{item.durationMinutes} mins</td>
                    <td>{item.totalMarks}</td>
                    <td>
                      <span className="badge badge-primary">
                        {item.assignedInstitutions?.length || 0} Institutions
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.publishedStatus)} uppercase`}>
                        {item.publishedStatus}
                      </span>
                    </td>
                    <td>{item.questionsCount || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openMonitoring(item.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          title="Monitor Cross-Institution Activity"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Monitor
                        </button>
                        {item.publishedStatus !== 'published' ? (
                          <button
                            onClick={() => handleTogglePublish(item, 'published')}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#16a34a' }}
                            title="Publish Assessment"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(item, 'archived')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                            title="Archive Assessment"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      {loading ? 'Loading assessments...' : 'No central assessments created yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Assessment Creation Wizard */}
      {activeView === 'create' && (
        <form onSubmit={handleCreateAssessment} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Assessment Metadata */}
            <div className="card" style={{ padding: '24px', margin: 0 }}>
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2" style={{ marginBottom: '16px' }}>
                <FileText className="w-4 h-4 text-primary" />
                Assessment Configuration
              </h4>

              <div className="form-group">
                <label className="form-label">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Statewide Engineering Diagnostic Assessment 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive diagnostic test covering fundamentals..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label" style={{ margin: 0 }}>Subject Curriculum *</label>
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline"
                      onClick={() => {
                        setIsCustomSubject(!isCustomSubject);
                        if (!isCustomSubject) {
                          setFormSubjectId('');
                        }
                      }}
                    >
                      {isCustomSubject ? '← Select' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomSubject ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g., Mathematics"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="form-control"
                    />
                  ) : (
                    <select
                      className="form-control"
                      required
                      value={formSubjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomSubject(true);
                          setFormSubjectId('');
                        } else {
                          setFormSubjectId(val);
                          const matched = subjects.find(s => s.id === val);
                          if (matched) setFormSubject(matched.name);
                        }
                      }}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Subject...</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 60)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(parseInt(e.target.value) || 100)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Start Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assessment Instructions</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="form-control font-mono text-xs"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Publishing State</label>
                <div className="flex items-center gap-4" style={{ marginTop: '4px' }}>
                  {(['published', 'scheduled', 'draft'] as const).map(st => (
                    <label key={st} className="flex items-center gap-2 text-xs text-foreground cursor-pointer" style={{ userSelect: 'none' }}>
                      <input
                        type="radio"
                        name="publishedStatus"
                        value={st}
                        checked={formStatus === st}
                        onChange={() => setFormStatus(st)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span className="capitalize" style={{ fontWeight: 500 }}>{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B: Institution Assignment */}
            <div className="card" style={{ padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Target Institutions Assignment ({selectedCollegeIds.length} Selected)
                  </h4>
                  <button
                    type="button"
                    onClick={handleSelectAllColleges}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                  >
                    {selectedCollegeIds.length === colleges.length && colleges.length > 0 ? 'Deselect All' : `Select All ${colleges.length} Colleges`}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Select which colleges are authorized to administer this assessment. Candidates outside assigned colleges will be restricted.
                </p>

                <div 
                  className="overflow-y-auto space-y-1 p-2"
                  style={{ 
                    maxHeight: '340px', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--bg-app)' 
                  }}
                >
                  {colleges.map((c: any) => {
                    const isSelected = selectedCollegeIds.includes(c.id);
                    const collegeTitle = c.collegeName || c.name || 'College';
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCollege(c.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          backgroundColor: isSelected ? 'var(--selected)' : 'transparent',
                          border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-main)' }}>
                            {collegeTitle}
                          </span>
                        </div>
                        {c.code && (
                          <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                            {c.code}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {colleges.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No colleges registered yet. Add colleges from the Academics tab.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Authoritative Question Repository & Auto-Pick */}
          <div className="card" style={{ padding: '24px', margin: 0 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-border">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2" style={{ margin: 0 }}>
                  <Database className="w-4 h-4 text-primary" />
                  Question Bank Selection ({selectedQuestionIds.length} Questions Selected)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ margin: 0 }}>
                  Select questions from the curriculum question bank, or click Auto-Pick to automatically pick random questions.
                </p>
              </div>

              {/* Auto-Pick Controls Bar */}
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)' }}>
                  <span className="text-xs text-muted-foreground">Pick:</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, availableQuestions.length)}
                    value={autoPickCount}
                    onChange={(e) => setAutoPickCount(Math.max(1, parseInt(e.target.value) || 10))}
                    className="form-control"
                    style={{ width: '60px', padding: '2px 6px', height: '26px', fontSize: '12px' }}
                  />
                  <span className="text-xs text-muted-foreground">questions</span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoPickQuestions}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Auto-Pick Questions
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllQuestions}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  Select All
                </button>

                {selectedQuestionIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelectedQuestions}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--text-muted)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Question Filter & Search */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Subject Pool:</span>
                <span className="badge badge-info" style={{ textTransform: 'none' }}>
                  {formSubject || 'All Subjects'}
                </span>
                <span>({filteredStudioQuestions.length} questions available)</span>
              </div>
              <div className="relative" style={{ minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search question text..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="form-control"
                  style={{ height: '30px', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Questions Scrollable List */}
            <div
              className="overflow-y-auto space-y-1.5 p-2"
              style={{
                maxHeight: '300px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-app)'
              }}
            >
              {filteredStudioQuestions.map((q: any) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const qText = q.text || q.question || 'Untitled Question';
                const qPoints = q.points || q.marks || 1;
                const qDiff = q.difficulty || 'medium';
                const qType = q.type || 'mcq';

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      backgroundColor: isSelected ? 'var(--selected)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, marginRight: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span className="truncate text-xs font-medium text-foreground">
                        {qText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span className={`badge ${qDiff === 'easy' ? 'badge-success' : qDiff === 'medium' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {qDiff}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '10px', textTransform: 'uppercase', padding: '1px 6px' }}>
                        {qType}
                      </span>
                      <span className="text-xs font-bold text-primary font-mono">
                        {qPoints} pt
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredStudioQuestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '26px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No questions found in this curriculum. Select another subject or add questions via the Question Bank.
                </div>
              )}
            </div>
          </div>

          {/* Performance Grading Policy Section (Setting while scheduling the exam) */}
          <ExamGradingThresholdEditor
            value={formGradingThresholds}
            onChange={setFormGradingThresholds}
          />

          {/* Bottom Action Bar */}
          <div className="card flex items-center justify-between p-4" style={{ margin: 0 }}>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedCollegeIds.length}</span> institutions assigned &bull; <span className="font-semibold text-foreground">{selectedQuestionIds.length > 0 ? selectedQuestionIds.length : `${autoPickCount} (Auto-Pick)`}</span> questions &bull; <span className="font-semibold text-foreground">{formTotalMarks}</span> total marks
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Creating Assessment...' : 'Create & Assign Assessment'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW 3: Cross-Institution Monitoring Console */}
      {activeView === 'monitoring' && (
        <div className="space-y-6">
          {monitoringLoading || !monitoringData ? (
            <div className="py-16 text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <p>Gathering cross-institution candidate analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Monitoring Header */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{monitoringData.assessment.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subject: {monitoringData.assessment.subject} • Duration: {monitoringData.assessment.duration}m • Total Marks: {monitoringData.assessment.totalMarks}
                    </p>
                  </div>
                  <button
                    onClick={() => openMonitoring(monitoringData.assessment.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Stats
                  </button>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Institutions</span>
                  <p className="text-2xl font-bold text-foreground mt-1">{monitoringData.summary.totalInstitutions}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Registered</span>
                  <p className="text-2xl font-bold text-foreground mt-1">{monitoringData.summary.totalRegistered}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Started</span>
                  <p className="text-2xl font-bold text-blue-500 mt-1">{monitoringData.summary.totalStarted}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Completed</span>
                  <p className="text-2xl font-bold text-emerald-500 mt-1">{monitoringData.summary.totalCompleted}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Overall Avg Score</span>
                  <p className="text-2xl font-bold text-purple-500 mt-1">{monitoringData.summary.overallAverageScore}%</p>
                </div>
              </div>

              {/* Comparative Chart */}
              {monitoringData.institutions.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Institution Performance Comparison (Average Score %)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monitoringData.institutions} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="collegeName" 
                          tick={{ fontSize: 10 }} 
                          angle={-25} 
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val: any) => [`${val}%`, 'Average Score']}
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Table of Assigned Institutions */}
              <div className="table-responsive">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Code</th>
                      <th style={{ textAlign: 'center' }}>Registered</th>
                      <th style={{ textAlign: 'center' }}>Started</th>
                      <th style={{ textAlign: 'center' }}>Completed</th>
                      <th style={{ textAlign: 'center' }}>Completion Rate</th>
                      <th style={{ textAlign: 'center' }}>Average Score</th>
                      <th style={{ textAlign: 'center' }}>Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoringData.institutions.map((inst) => (
                      <tr key={inst.collegeId}>
                        <td className="font-semibold text-foreground">{inst.collegeName}</td>
                        <td><code>{inst.collegeCode || 'N/A'}</code></td>
                        <td style={{ textAlign: 'center' }}>{inst.registered}</td>
                        <td style={{ textAlign: 'center' }} className="font-medium text-blue-500">{inst.started}</td>
                        <td style={{ textAlign: 'center' }} className="font-bold text-emerald-500">{inst.completed}</td>
                        <td style={{ textAlign: 'center' }}>{inst.completionRate}%</td>
                        <td style={{ textAlign: 'center' }} className="font-bold text-foreground">{inst.averageScore}%</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-success">{inst.passRate}%</span>
                        </td>
                      </tr>
                    ))}
                    {monitoringData.institutions.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                          No assigned institutions recorded for this assessment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

