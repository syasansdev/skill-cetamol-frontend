import React, { useState, useEffect } from 'react';
import { 
  Plus, Building, Calendar, Clock, Globe, Eye, 
  CheckCircle2, AlertCircle, FileText, Check, X, 
  BarChart3, RefreshCw, Send, ShieldCheck, Layers, Users
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

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
  const [loading, setLoading] = useState<boolean>(true);

  // Monitoring State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState<boolean>(false);

  // Form State for Centralized Assessment Creation
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
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
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch central assessments and colleges
  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, collegesRes, qRes] = await Promise.all([
        api.get('/admin/central-exams'),
        api.get('/admin/colleges'),
        api.get('/admin/questions').catch(() => ({ data: [] }))
      ]);
      setAssessments(examsRes.data || []);
      setColleges(collegesRes.data || []);
      setAvailableQuestions(qRes.data || []);
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
        subject: formSubject || 'General',
        durationMinutes: formDuration,
        totalMarks: formTotalMarks,
        passingMarks: formPassingMarks,
        instructions: formInstructions,
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        publishedStatus: formStatus,
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
    setFormDuration(60);
    setFormTotalMarks(100);
    setFormPassingMarks(40);
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('published');
    setSelectedCollegeIds([]);
    setSelectedQuestionIds([]);
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
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            >
              Back to Assessments
            </button>
          )}

          {activeView === 'list' && (
            <button
              onClick={() => { resetForm(); setActiveView('create'); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
                          className="btn btn-sm btn-outline-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                          title="Monitor Cross-Institution Activity"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Monitor
                        </button>
                        {item.publishedStatus !== 'published' ? (
                          <button
                            onClick={() => handleTogglePublish(item, 'published')}
                            className="btn btn-sm btn-success text-xs px-2.5 py-1"
                            title="Publish Assessment"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(item, 'archived')}
                            className="btn btn-sm btn-danger text-xs px-2.5 py-1"
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
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Assessment Configuration
              </h4>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Statewide Engineering Diagnostic Assessment 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive diagnostic test covering fundamentals..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 60)}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(parseInt(e.target.value) || 100)}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Start Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">End Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Assessment Instructions</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Publishing State</label>
                <div className="flex items-center gap-3">
                  {(['published', 'scheduled', 'draft'] as const).map(st => (
                    <label key={st} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="publishedStatus"
                        value={st}
                        checked={formStatus === st}
                        onChange={() => setFormStatus(st)}
                      />
                      <span className="capitalize">{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B: Institution Assignment */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Target Institutions Assignment ({selectedCollegeIds.length} Selected)
                  </h4>
                  <button
                    type="button"
                    onClick={handleSelectAllColleges}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    {selectedCollegeIds.length === colleges.length ? 'Deselect All' : 'Select All 49 Colleges'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Select which colleges are authorized to administer this assessment. Candidates outside assigned colleges will be restricted.
                </p>

                <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg border border-border p-2 bg-background">
                  {colleges.map((c) => {
                    const isSelected = selectedCollegeIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCollege(c.id)}
                        className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/30 text-primary font-medium' : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-primary focus:ring-primary/40"
                          />
                          <span>{c.name}</span>
                        </div>
                        {c.code && <code className="text-[10px] text-muted-foreground">{c.code}</code>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating Assessment...' : 'Create & Assign Assessment'}
                </button>
              </div>
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

